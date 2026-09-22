import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { isTenantOwner } from "@/lib/tenant-scope";
import { successResponse, Errors, withErrorHandler, parseBody } from "@/lib/api-utils";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";
import { isIfpcEvent } from "@/lib/ifpc-tenant";
import { EOI_CATEGORIES, eoiCategoryOf } from "@/lib/ifpc-eoi";

type RouteContext = { params: Promise<{ id: string }> };

const rateLimiter = createRateLimiter("session-interest", { maxRequests: 10, windowSeconds: 60 });

const interestSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
});

// GET /api/sessions/[id]/interest — public seat counter; ?list=1 (auth) returns the roster
export const GET = withErrorHandler(async (request: NextRequest, context?: RouteContext) => {
  // IFPC (apollo-medical) only — this route doesn't exist for other tenants.
  const ifpcSession = await prisma.eventSession.findUnique({ where: { id: (await context!.params).id }, select: { eventId: true } });
  if (!(await isIfpcEvent(ifpcSession?.eventId))) return Errors.notFound("Page");
  const { id: sessionId } = await context!.params;

  const eventSession = await prisma.eventSession.findUnique({
    where: { id: sessionId },
    select: { id: true, capacity: true, event: { select: { tenantId: true } } },
  });
  if (!eventSession) return Errors.notFound("Session");

  const count = await prisma.sessionInterest.count({ where: { sessionId } });

  const { searchParams } = new URL(request.url);
  if (searchParams.get("list") === "1") {
    const session = await auth();
    if (!session || !canAccess(session.user.role, "events")) return Errors.forbidden("You don't have permission to view this list");
    if (!isTenantOwner(session, eventSession.event.tenantId)) return Errors.forbidden("You don't have access to this session");
    const interests = await prisma.sessionInterest.findMany({ where: { sessionId }, orderBy: { createdAt: "asc" } });
    return successResponse({ capacity: eventSession.capacity, count, interests });
  }

  // ?mine=1 — the logged-in delegate checking their own status for this
  // session (not the admin roster, so no "events" permission required).
  if (searchParams.get("mine") === "1") {
    const session = await auth();
    if (!session) return Errors.unauthorized();
    const mine = await prisma.sessionInterest.findUnique({
      where: { sessionId_email: { sessionId, email: session.user.email.toLowerCase() } },
      select: { id: true },
    });
    return successResponse({ capacity: eventSession.capacity, count, isInterested: !!mine });
  }

  return successResponse({ capacity: eventSession.capacity, count });
});

// POST /api/sessions/[id]/interest — delegate expresses interest ("I would like to attend")
export const POST = withErrorHandler(async (request: NextRequest, context?: RouteContext) => {
  // IFPC (apollo-medical) only — this route doesn't exist for other tenants.
  const ifpcSession = await prisma.eventSession.findUnique({ where: { id: (await context!.params).id }, select: { eventId: true } });
  if (!(await isIfpcEvent(ifpcSession?.eventId))) return Errors.notFound("Page");
  const rl = rateLimiter.check(getClientIp(request));
  if (!rl.allowed) return Errors.badRequest(rl.message);

  const { id: sessionId } = await context!.params;
  const eventSession = await prisma.eventSession.findUnique({
    where: { id: sessionId },
    select: { id: true, capacity: true, eventId: true, title: true, sessionType: true, startTime: true },
  });
  if (!eventSession) return Errors.notFound("Session");

  // Pick-one categories (campus tour day, morning workshop, afternoon workshop):
  // the other sessions in the same category, which this choice would replace.
  const category = eoiCategoryOf(eventSession);
  const siblings = category && EOI_CATEGORIES[category].single
    ? (await prisma.eventSession.findMany({
        where: { eventId: eventSession.eventId, id: { not: sessionId } },
        select: { id: true, title: true, sessionType: true, startTime: true },
      })).filter((x) => eoiCategoryOf(x) === category)
    : [];

  const body = await parseBody(request);
  if (!body) return Errors.badRequest("Invalid request body");

  const parsed = interestSchema.safeParse(body);
  if (!parsed.success) return Errors.validationError(parsed.error);

  const email = parsed.data.email.toLowerCase();
  // Only the signed-in owner of this email may swap a pick-one choice; an
  // anonymous submission can never remove anyone's existing selection.
  const authSession = siblings.length ? await auth() : null;
  const canReplace = !!authSession && authSession.user.email.toLowerCase() === email;

  // Serializable transaction: the duplicate check, capacity check, and
  // insert must be atomic, or concurrent submissions near the last seat can
  // all pass the count check before any of them commits, overselling
  // capacity. Postgres aborts one side of a genuine conflict with a
  // serialization failure, which we treat below as "someone else took it."
  let outcome: "ok" | "duplicate" | "full" | "conflict";
  let replaced: string[] = [];
  try {
    outcome = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.sessionInterest.findUnique({
          where: { sessionId_email: { sessionId, email } },
        });
        if (existing) return "duplicate" as const;

        const previous = siblings.length
          ? await tx.sessionInterest.findMany({ where: { email, sessionId: { in: siblings.map((x) => x.id) } }, select: { sessionId: true } })
          : [];
        if (previous.length && !canReplace) {
          return "conflict" as const;
        }

        // Capacity before removing the old choice, so a full session never costs the delegate their current one.
        if (eventSession.capacity != null) {
          const count = await tx.sessionInterest.count({ where: { sessionId } });
          if (count >= eventSession.capacity) return "full" as const;
        }

        if (previous.length) {
          await tx.sessionInterest.deleteMany({ where: { email, sessionId: { in: previous.map((p) => p.sessionId) } } });
          replaced = previous.map((p) => siblings.find((x) => x.id === p.sessionId)?.title ?? "");
        }

        await tx.sessionInterest.create({
          data: { sessionId, name: parsed.data.name, email, phone: parsed.data.phone },
        });
        return "ok" as const;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      outcome = "duplicate";
    } else if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034") {
      // Serialization conflict — the seat was taken by a concurrent request.
      outcome = "full";
    } else {
      throw e;
    }
  }

  if (outcome === "duplicate") {
    const count = await prisma.sessionInterest.count({ where: { sessionId } });
    return successResponse({ capacity: eventSession.capacity, count, alreadyRegistered: true }, "You're already on the list for this session");
  }
  if (outcome === "full") {
    return Errors.conflict("This session is full");
  }
  if (outcome === "conflict") {
    const label = EOI_CATEGORIES[category!].label;
    return Errors.conflict(`A ${label} choice is already recorded for this email (only one allowed). Sign in to change it.`);
  }

  const count = await prisma.sessionInterest.count({ where: { sessionId } });
  return successResponse(
    { capacity: eventSession.capacity, count, replaced, category },
    replaced.length ? `Switched your ${EOI_CATEGORIES[category!].label} choice` : "Interest registered",
    201
  );
});
