import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { isTenantOwner } from "@/lib/tenant-scope";
import { successResponse, Errors, withErrorHandler } from "@/lib/api-utils";
import { isIfpcEvent } from "@/lib/ifpc-tenant";
import { FEEDBACK_DAYS, MEALS, SCIENTIFIC_ITEMS, foodKey } from "@/lib/ifpc-feedback";

type RouteContext = { params: Promise<{ id: string }> };

const summary = (values: (number | null)[]) => {
  const v = values.filter((x): x is number => x != null);
  return { count: v.length, average: v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null };
};

// GET /api/events/[id]/delegate-feedback — averages, counts and comments for
// food, workshop and scientific-session feedback. Admin only.
export const GET = withErrorHandler(async (_request: NextRequest, context?: RouteContext) => {
  const { id: eventId } = await context!.params;
  if (!(await isIfpcEvent(eventId))) return Errors.notFound("Page");

  const session = await auth();
  if (!session || !canAccess(session.user.role, "events")) return Errors.forbidden("You don't have permission to view feedback");
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { tenantId: true } });
  if (!event || !isTenantOwner(session, event.tenantId)) return Errors.forbidden("You don't have access to this event");

  const [rows, workshopSessions] = await Promise.all([
    prisma.delegateFeedback.findMany({ where: { eventId }, orderBy: { createdAt: "desc" } }),
    prisma.eventSession.findMany({
      where: { eventId, sessionType: "WORKSHOP", isPublished: true },
      select: { id: true, title: true, sessionDate: true, startTime: true, hall: { select: { name: true } } },
      orderBy: [{ sessionDate: "asc" }, { startTime: "asc" }, { title: "asc" }],
    }),
  ]);
  const of = (kind: string, key: string) => rows.filter((r) => r.kind === kind && r.key === key);
  const comments = (rs: typeof rows) => rs.filter((r) => r.comment).map((r) => ({ text: r.comment!, rating: r.rating, at: r.createdAt }));

  const food = FEEDBACK_DAYS.map((date) => ({
    date,
    meals: MEALS.map((meal) => {
      const rs = of("food", foodKey(date, meal));
      return { meal, veg: summary(rs.map((r) => r.vegRating)), nonVeg: summary(rs.map((r) => r.nonVegRating)) };
    }),
  }));

  const workshops = workshopSessions.map((s) => {
    const rs = of("workshop", s.id);
    return {
      sessionId: s.id,
      title: s.title,
      hall: s.hall?.name ?? null,
      sessionDate: s.sessionDate?.toISOString().slice(0, 10) ?? null,
      startTime: s.startTime,
      ...summary(rs.map((r) => r.rating)),
      comments: comments(rs),
    };
  });

  const scientific = SCIENTIFIC_ITEMS.map((item) => {
    const rs = of("scientific", item.key);
    return { key: item.key, label: item.label, ...summary(rs.map((r) => r.rating)), comments: comments(rs) };
  });

  return successResponse({
    respondents: new Set(rows.map((r) => r.email)).size,
    responses: rows.length,
    food,
    workshops,
    scientific,
  });
});
