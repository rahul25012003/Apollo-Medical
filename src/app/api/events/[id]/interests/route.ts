import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { isTenantOwner } from "@/lib/tenant-scope";
import { successResponse, Errors, withErrorHandler } from "@/lib/api-utils";
import { isIfpcEvent } from "@/lib/ifpc-tenant";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/events/[id]/interests — every session-interest submission for this
// event in one place, each linked to the matching delegate registration (by
// email) so the admin doesn't have to open registrations one by one.
export const GET = withErrorHandler(async (request: NextRequest, context?: RouteContext) => {
  // IFPC (apollo-medical) only — this route doesn't exist for other tenants.
  if (!(await isIfpcEvent((await context!.params).id))) return Errors.notFound("Page");
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (!canAccess(session.user.role, "events") && !canAccess(session.user.role, "registrations")) {
    return Errors.forbidden("You don't have permission to view interests");
  }

  const { id: eventId } = await context!.params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, tenantId: true },
  });
  if (!event) return Errors.notFound("Event");
  if (!isTenantOwner(session, event.tenantId)) {
    return Errors.forbidden("You don't have access to this event");
  }

  const [interests, registrations] = await Promise.all([
    prisma.sessionInterest.findMany({
      where: { session: { eventId } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        session: {
          select: { id: true, title: true, sessionType: true, sessionDate: true, startTime: true },
        },
      },
    }),
    prisma.registration.findMany({
      where: { eventId },
      select: { id: true, email: true, name: true, participantRole: true, category: true, organization: true },
    }),
  ]);

  const byEmail = new Map(registrations.map((r) => [r.email.toLowerCase(), r]));

  const data = interests.map((i) => {
    const reg = byEmail.get(i.email.toLowerCase());
    return {
      ...i,
      registration: reg
        ? { id: reg.id, name: reg.name, participantRole: reg.participantRole, category: reg.category, organization: reg.organization }
        : null,
    };
  });

  return successResponse(data);
});
