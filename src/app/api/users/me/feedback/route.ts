import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { successResponse, Errors, withErrorHandler, parseBody } from "@/lib/api-utils";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import { isIfpcTenantId } from "@/lib/ifpc-tenant";
import { isFoodKey, isScientificKey, type SubmittedFeedback } from "@/lib/ifpc-feedback";
import { z } from "zod";

const star = z.number().int().min(1).max(5);
const bodySchema = z.object({
  kind: z.enum(["food", "workshop", "scientific"]),
  key: z.string().min(1).max(100),
  vegRating: star.nullable().optional(),
  nonVegRating: star.nullable().optional(),
  rating: star.nullable().optional(),
  comment: z.string().trim().max(2000).nullable().optional(),
});

async function myRegistration(email: string) {
  return prisma.registration.findFirst({
    where: { email: email.toLowerCase(), status: { in: ["CONFIRMED", "ATTENDED"] }, event: { tenant: { slug: IFPC_TENANT_SLUG } } },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, eventId: true },
  });
}

// GET /api/users/me/feedback — what this delegate has already rated, and the
// workshops they picked (the ones they can give workshop feedback on).
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (!(await isIfpcTenantId(session.user.tenantId))) return Errors.notFound("Page");

  const email = session.user.email.toLowerCase();
  const registration = await myRegistration(email);
  if (!registration) return successResponse({ registered: false, submitted: {}, workshops: [] });

  const [rows, picks] = await Promise.all([
    prisma.delegateFeedback.findMany({ where: { eventId: registration.eventId, email } }),
    prisma.sessionInterest.findMany({
      where: { email, session: { eventId: registration.eventId, sessionType: "WORKSHOP", isPublished: true } },
      select: { session: { select: { id: true, title: true, sessionDate: true, startTime: true, endTime: true, hall: { select: { name: true } } } } },
    }),
  ]);

  const submitted: Record<string, SubmittedFeedback> = {};
  for (const r of rows) {
    submitted[`${r.kind}|${r.key}`] = { vegRating: r.vegRating, nonVegRating: r.nonVegRating, rating: r.rating, comment: r.comment };
  }
  const workshops = picks
    .map((p) => ({
      sessionId: p.session.id,
      title: p.session.title,
      hall: p.session.hall?.name ?? null,
      sessionDate: p.session.sessionDate?.toISOString().slice(0, 10) ?? null,
      startTime: p.session.startTime,
      endTime: p.session.endTime,
    }))
    .sort((a, b) => `${a.sessionDate}${a.startTime}`.localeCompare(`${b.sessionDate}${b.startTime}`));

  return successResponse({ registered: true, submitted, workshops });
});

// POST /api/users/me/feedback — submit one rated item. Once only.
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (!(await isIfpcTenantId(session.user.tenantId))) return Errors.notFound("Page");

  const body = await parseBody(request);
  if (!body) return Errors.badRequest("Invalid request body");
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return Errors.validationError(parsed.error);
  const { kind, key } = parsed.data;

  const email = session.user.email.toLowerCase();
  const registration = await myRegistration(email);
  if (!registration) return Errors.forbidden("Feedback is for registered delegates with a confirmed registration");

  let data: { vegRating?: number | null; nonVegRating?: number | null; rating?: number | null; comment?: string | null };
  if (kind === "food") {
    if (!isFoodKey(key)) return Errors.badRequest("Unknown meal");
    const { vegRating = null, nonVegRating = null } = parsed.data;
    // Both offered, neither forced: a vegetarian shouldn't have to rate non-veg.
    if (vegRating == null && nonVegRating == null) return Errors.badRequest("Rate the veg or the non-veg food (or both)");
    data = { vegRating, nonVegRating };
  } else {
    if (parsed.data.rating == null) return Errors.badRequest("Please choose a rating from 1 to 5");
    if (kind === "scientific" && !isScientificKey(key)) return Errors.badRequest("Unknown session");
    if (kind === "workshop") {
      const ws = await prisma.eventSession.findFirst({ where: { id: key, eventId: registration.eventId, sessionType: "WORKSHOP" }, select: { id: true } });
      if (!ws) return Errors.badRequest("Unknown workshop");
    }
    data = { rating: parsed.data.rating, comment: parsed.data.comment || null };
  }

  try {
    await prisma.delegateFeedback.create({
      data: { eventId: registration.eventId, email, name: registration.name, kind, key, ...data },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return Errors.conflict("You've already sent feedback for this");
    }
    throw e;
  }
  return successResponse({ kind, key, ...data }, "Thank you for your feedback", 201);
});
