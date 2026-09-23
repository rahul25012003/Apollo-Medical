import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { isTenantOwner } from "@/lib/tenant-scope";
import { successResponse, Errors, withErrorHandler, parseBody } from "@/lib/api-utils";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";
import { isIfpcEvent } from "@/lib/ifpc-tenant";
import { logActivity } from "@/lib/activity-log";

type RouteContext = { params: Promise<{ id: string }> };

const rateLimiter = createRateLimiter("speaker-interest", { maxRequests: 20, windowSeconds: 60 });

async function countsFor(eventId: string) {
  const grouped = await prisma.speakerInterest.groupBy({ by: ["speakerId"], where: { eventId }, _count: { _all: true } });
  return Object.fromEntries(grouped.map((g) => [g.speakerId, g._count._all]));
}

// GET /api/events/[id]/speaker-interest
//   (anyone)        -> { counts: { speakerId: n } }
//   (signed in)     -> also { mine: speakerId[] }
//   ?list=1 (staff) -> { interests: [...] } each linked to the delegate's registration
export const GET = withErrorHandler(async (request: NextRequest, context?: RouteContext) => {
  // IFPC (apollo-medical) only — this route doesn't exist for other tenants.
  if (!(await isIfpcEvent((await context!.params).id))) return Errors.notFound("Page");
  const { id: eventId } = await context!.params;
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, tenantId: true } });
  if (!event) return Errors.notFound("Event");

  const session = await auth().catch(() => null);
  const { searchParams } = new URL(request.url);

  if (searchParams.get("list") === "1") {
    if (!session) return Errors.unauthorized();
    if (!canAccess(session.user.role, "events") && !canAccess(session.user.role, "registrations")) {
      return Errors.forbidden("You don't have permission to view interests");
    }
    if (!isTenantOwner(session, event.tenantId)) return Errors.forbidden("You don't have access to this event");

    const [rows, registrations] = await Promise.all([
      prisma.speakerInterest.findMany({
        where: { eventId },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, createdAt: true, speaker: { select: { id: true, name: true, designation: true } } },
      }),
      prisma.registration.findMany({
        where: { eventId },
        select: { id: true, email: true, name: true, participantRole: true, category: true },
      }),
    ]);
    const byEmail = new Map(registrations.map((r) => [r.email.toLowerCase(), r]));
    const interests = rows.map((r) => {
      const reg = byEmail.get(r.email.toLowerCase());
      return { ...r, registration: reg ? { id: reg.id, name: reg.name, participantRole: reg.participantRole, category: reg.category } : null };
    });
    return successResponse({ interests });
  }

  const counts = await countsFor(eventId);
  if (!session) return successResponse({ counts });

  const mine = await prisma.speakerInterest.findMany({
    where: { eventId, email: session.user.email.toLowerCase() },
    select: { speakerId: true },
  });
  return successResponse({ counts, mine: mine.map((m) => m.speakerId) });
});

const bodySchema = z.object({ speakerId: z.string().min(1) });

// DELETE /api/events/[id]/speaker-interest?speakerId=xxx — the signed-in
// delegate withdraws their own interest in a speaker.
export const DELETE = withErrorHandler(async (request: NextRequest, context?: RouteContext) => {
  // IFPC (apollo-medical) only — this route doesn't exist for other tenants.
  if (!(await isIfpcEvent((await context!.params).id))) return Errors.notFound("Page");

  const session = await auth();
  if (!session) return Errors.unauthorized();

  const { id: eventId } = await context!.params;
  const speakerId = new URL(request.url).searchParams.get("speakerId");
  if (!speakerId) return Errors.badRequest("speakerId is required");

  const { count: removed } = await prisma.speakerInterest.deleteMany({
    where: { speakerId, eventId, email: session.user.email.toLowerCase() },
  });

  if (removed) {
    const [speaker, event] = await Promise.all([
      prisma.speaker.findUnique({ where: { id: speakerId }, select: { name: true } }),
      prisma.event.findUnique({ where: { id: eventId }, select: { tenantId: true } }),
    ]);
    await logActivity(session, {
      action: "interest.remove",
      summary: `${session.user.name || session.user.email} removed interest in speaker ${speaker?.name ?? ""}`.trim(),
      entityType: "Speaker",
      entityId: speakerId,
      tenantId: event?.tenantId ?? null,
      metadata: { kind: "speaker", speakerName: speaker?.name ?? null, status: "not interested", eventId, delegateName: session.user.name ?? null },
      request,
    });
  }

  const counts = await countsFor(eventId);
  return successResponse(
    { speakerId, count: counts[speakerId] ?? 0, removed: removed > 0 },
    removed ? "Removed from your interests" : "It wasn't in your interests"
  );
});

// POST /api/events/[id]/speaker-interest — signed-in delegate marks "Interested"
// in one of this event's speakers. Idempotent per person/speaker/event.
export const POST = withErrorHandler(async (request: NextRequest, context?: RouteContext) => {
  // IFPC (apollo-medical) only — this route doesn't exist for other tenants.
  if (!(await isIfpcEvent((await context!.params).id))) return Errors.notFound("Page");
  const rl = rateLimiter.check(getClientIp(request));
  if (!rl.allowed) return Errors.badRequest(rl.message);

  const session = await auth();
  if (!session) return Errors.unauthorized();

  const { id: eventId } = await context!.params;
  const body = await parseBody(request);
  if (!body) return Errors.badRequest("Invalid request body");
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return Errors.validationError(parsed.error);

  const { speakerId } = parsed.data;
  // A speaker belongs to the event via its speaker list or any of its sessions.
  const onEvent = await prisma.speaker.findFirst({
    where: {
      id: speakerId,
      OR: [
        { eventSpeakers: { some: { eventId } } },
        { sessionSpeakers: { some: { session: { eventId } } } },
        { eventSessions: { some: { eventId } } },
      ],
    },
    select: { id: true },
  });
  if (!onEvent) return Errors.notFound("Speaker for this event");

  const email = session.user.email.toLowerCase();
  let alreadyInterested = false;
  try {
    await prisma.speakerInterest.create({
      data: { speakerId, eventId, email, name: session.user.name || email },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") alreadyInterested = true;
    else throw e;
  }

  if (!alreadyInterested) {
    const [speaker, event] = await Promise.all([
      prisma.speaker.findUnique({ where: { id: speakerId }, select: { name: true } }),
      prisma.event.findUnique({ where: { id: eventId }, select: { tenantId: true } }),
    ]);
    await logActivity(session, {
      action: "interest.add",
      summary: `${session.user.name || email} is interested in speaker ${speaker?.name ?? ""}`.trim(),
      entityType: "Speaker",
      entityId: speakerId,
      tenantId: event?.tenantId ?? null,
      metadata: { kind: "speaker", speakerName: speaker?.name ?? null, status: "interested", eventId, delegateName: session.user.name ?? null },
      request,
    });
  }

  const counts = await countsFor(eventId);
  return successResponse(
    { speakerId, count: counts[speakerId] ?? 0, alreadyInterested },
    alreadyInterested ? "You're already interested in this speaker" : "Interest registered",
    alreadyInterested ? 200 : 201
  );
});
