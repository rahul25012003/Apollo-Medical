import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { isTenantOwner } from "@/lib/tenant-scope";
import { successResponse, Errors, withErrorHandler, parseBody } from "@/lib/api-utils";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";
import { isIfpcEvent } from "@/lib/ifpc-tenant";
import { eoiCategoryOf, eoiRule, sessionsOverlap } from "@/lib/ifpc-eoi";
import { choicesWindow, closedMessage } from "@/lib/ifpc-deadline";
import { logActivity } from "@/lib/activity-log";

type RouteContext = { params: Promise<{ id: string }> };

type SlotSession = { id: string; title: string; sessionType: string | null; sessionDate: Date | null; startTime: string | null; endTime: string | null };

/**
 * The delegate's existing pick that would put them in two places at once —
 * e.g. the morning campus tour against a morning workshop on the same day.
 * A pick in the target's own pick-one group is not a clash: choosing the
 * target replaces it.
 */
async function findClash(eventId: string, email: string, target: SlotSession): Promise<SlotSession | null> {
  const picks = await prisma.sessionInterest.findMany({
    // Retired (unpublished) picks can't be seen any more, so they never block.
    where: { email, sessionId: { not: target.id }, session: { eventId, isPublished: true } },
    select: { session: { select: { id: true, title: true, sessionType: true, sessionDate: true, startTime: true, endTime: true } } },
  });
  const group = eoiCategoryOf(target);
  const replaces = (x: SlotSession) => group !== null && eoiRule(group).single && eoiCategoryOf(x) === group;
  return picks.map((p) => p.session).find((x) => !replaces(x) && sessionsOverlap(x, target)) ?? null;
}

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
    select: { id: true, capacity: true, title: true, sessionType: true, sessionDate: true, startTime: true, endTime: true, event: { select: { id: true, tenantId: true } } },
  });
  if (!eventSession) return Errors.notFound("Session");

  const count = await prisma.sessionInterest.count({ where: { sessionId } });
  const category = eoiCategoryOf(eventSession);
  const rule = category ? { category, ...eoiRule(category) } : null;

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
    const window = await prisma.event.findUnique({
      where: { id: eventSession.event.id },
      select: { registrationDeadline: true },
    });
    return successResponse({
      capacity: eventSession.capacity,
      count,
      isInterested: !!mine,
      rule,
      clash: mine ? null : (await findClash(eventSession.event.id, session.user.email.toLowerCase(), eventSession))?.title ?? null,
      choices: choicesWindow(window?.registrationDeadline),
    });
  }

  return successResponse({ capacity: eventSession.capacity, count, rule });
});

// DELETE /api/sessions/[id]/interest — the signed-in delegate withdraws their own interest.
export const DELETE = withErrorHandler(async (_request: NextRequest, context?: RouteContext) => {
  const { id: sessionId } = await context!.params;
  const eventSession = await prisma.eventSession.findUnique({ where: { id: sessionId }, select: { eventId: true, capacity: true } });
  // IFPC (apollo-medical) only — this route doesn't exist for other tenants.
  if (!eventSession || !(await isIfpcEvent(eventSession.eventId))) return Errors.notFound("Page");

  const session = await auth();
  if (!session) return Errors.unauthorized();

  // Removing a choice is a change like any other; the same window governs it.
  const delWindow = await prisma.event.findUnique({
    where: { id: eventSession.eventId },
    select: { registrationDeadline: true },
  });
  const delChoices = choicesWindow(delWindow?.registrationDeadline);
  if (!delChoices.open) return Errors.forbidden(closedMessage(delChoices.closesAt));

  const { count: removed } = await prisma.sessionInterest.deleteMany({
    where: { sessionId, email: session.user.email.toLowerCase() },
  });
  const count = await prisma.sessionInterest.count({ where: { sessionId } });

  if (removed) {
    const removedSession = await prisma.eventSession.findUnique({
      where: { id: sessionId },
      select: { title: true, sessionType: true, event: { select: { id: true, tenantId: true } } },
    });
    await logActivity(session, {
      action: "interest.remove",
      summary: `${session.user.name || session.user.email} removed interest in "${removedSession?.title ?? "a session"}"`,
      entityType: "EventSession",
      entityId: sessionId,
      tenantId: removedSession?.event.tenantId ?? null,
      metadata: {
        kind: "session",
        sessionTitle: removedSession?.title ?? null,
        sessionType: removedSession?.sessionType ?? null,
        status: "not interested",
        eventId: removedSession?.event.id ?? null,
        delegateName: session.user.name ?? null,
      },
    });
  }
  return successResponse({ capacity: eventSession.capacity, count, removed: removed > 0 }, removed ? "Removed from your choices" : "It wasn't in your choices");
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
    select: {
      id: true, capacity: true, eventId: true, title: true, sessionType: true, sessionDate: true, startTime: true, endTime: true,
      event: { select: { registrationDeadline: true, tenantId: true } },
    },
  });
  if (!eventSession) return Errors.notFound("Session");

  const choices = choicesWindow(eventSession.event.registrationDeadline);
  if (!choices.open) return Errors.forbidden(closedMessage(choices.closesAt));

  // Pick-one groups (a workshop slot, the campus tour): the other sessions in
  // the same group, which this choice would replace.
  const category = eoiCategoryOf(eventSession);
  const siblings = category && eoiRule(category).single
    ? (await prisma.eventSession.findMany({
        where: { eventId: eventSession.eventId, id: { not: sessionId } },
        select: { id: true, title: true, sessionType: true, sessionDate: true, startTime: true },
      })).filter((x) => eoiCategoryOf(x) === category)
    : [];

  const body = await parseBody(request);
  if (!body) return Errors.badRequest("Invalid request body");

  const parsed = interestSchema.safeParse(body);
  if (!parsed.success) return Errors.validationError(parsed.error);

  const email = parsed.data.email.toLowerCase();

  const clash = await findClash(eventSession.eventId, email, eventSession);
  if (clash) {
    return Errors.conflict(`That's at the same time as "${clash.title}", which you've already chosen. Remove that one first.`);
  }

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
    const label = eoiRule(category!).label;
    return Errors.conflict(`A ${label} choice is already recorded for this email (only one allowed). Sign in to change it.`);
  }

  const count = await prisma.sessionInterest.count({ where: { sessionId } });

  // Every change is recorded against the account that made it, so the admin
  // log shows the delegate — not whoever happens to be reading it.
  await logActivity(authSession, {
    action: replaced.length ? "interest.change" : "interest.add",
    summary: replaced.length
      ? `${parsed.data.name} switched ${eoiRule(category!).label} to "${eventSession.title}"`
      : `${parsed.data.name} is interested in "${eventSession.title}"`,
    entityType: "EventSession",
    entityId: sessionId,
    tenantId: eventSession.event.tenantId,
    actor: { email, role: authSession?.user?.role ?? "DELEGATE" },
    metadata: {
      kind: "session",
      sessionTitle: eventSession.title,
      sessionType: eventSession.sessionType,
      category,
      status: "interested",
      replaced: replaced.filter(Boolean),
      eventId: eventSession.eventId,
      delegateName: parsed.data.name,
    },
    request,
  });

  return successResponse(
    { capacity: eventSession.capacity, count, replaced, category },
    replaced.length ? `Switched your ${eoiRule(category!).label} choice` : "Interest registered",
    201
  );
});
