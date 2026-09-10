import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { successResponse, Errors, withErrorHandler, parseBody } from "@/lib/api-utils";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const rateLimiter = createRateLimiter("session-interest", { maxRequests: 10, windowSeconds: 60 });

const interestSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
});

// GET /api/sessions/[id]/interest — public seat counter; ?list=1 (auth) returns the roster
export const GET = withErrorHandler(async (request: NextRequest, context?: RouteContext) => {
  const { id: sessionId } = await context!.params;

  const eventSession = await prisma.eventSession.findUnique({
    where: { id: sessionId },
    select: { id: true, capacity: true },
  });
  if (!eventSession) return Errors.notFound("Session");

  const count = await prisma.sessionInterest.count({ where: { sessionId } });

  const { searchParams } = new URL(request.url);
  if (searchParams.get("list") === "1") {
    const session = await auth();
    if (!session || !canAccess(session.user.role, "events")) return Errors.forbidden("You don't have permission to view this list");
    const interests = await prisma.sessionInterest.findMany({ where: { sessionId }, orderBy: { createdAt: "asc" } });
    return successResponse({ capacity: eventSession.capacity, count, interests });
  }

  return successResponse({ capacity: eventSession.capacity, count });
});

// POST /api/sessions/[id]/interest — delegate expresses interest ("I would like to attend")
export const POST = withErrorHandler(async (request: NextRequest, context?: RouteContext) => {
  const rl = rateLimiter.check(getClientIp(request));
  if (!rl.allowed) return Errors.badRequest(rl.message);

  const { id: sessionId } = await context!.params;
  const eventSession = await prisma.eventSession.findUnique({
    where: { id: sessionId },
    select: { id: true, capacity: true },
  });
  if (!eventSession) return Errors.notFound("Session");

  const body = await parseBody(request);
  if (!body) return Errors.badRequest("Invalid request body");

  const parsed = interestSchema.safeParse(body);
  if (!parsed.success) return Errors.validationError(parsed.error);

  const email = parsed.data.email.toLowerCase();

  // Serializable transaction: the duplicate check, capacity check, and
  // insert must be atomic, or concurrent submissions near the last seat can
  // all pass the count check before any of them commits, overselling
  // capacity. Postgres aborts one side of a genuine conflict with a
  // serialization failure, which we treat below as "someone else took it."
  let outcome: "ok" | "duplicate" | "full";
  try {
    outcome = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.sessionInterest.findUnique({
          where: { sessionId_email: { sessionId, email } },
        });
        if (existing) return "duplicate" as const;

        if (eventSession.capacity != null) {
          const count = await tx.sessionInterest.count({ where: { sessionId } });
          if (count >= eventSession.capacity) return "full" as const;
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

  const count = await prisma.sessionInterest.count({ where: { sessionId } });
  return successResponse({ capacity: eventSession.capacity, count }, "Interest registered", 201);
});
