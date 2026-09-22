import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { isTenantOwner } from "@/lib/tenant-scope";
import { successResponse, Errors, withErrorHandler } from "@/lib/api-utils";
import { isIfpcEvent } from "@/lib/ifpc-tenant";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/events/[id]/preferences — every registrant's food preference and
// accommodation choice for this event in one place (admin-only). These are
// per-registration fields, not session-scoped interests, so they're kept
// separate from /interests (workshop/session sign-ups).
export const GET = withErrorHandler(async (request: NextRequest, context?: RouteContext) => {
  // IFPC (apollo-medical) only — this route doesn't exist for other tenants.
  if (!(await isIfpcEvent((await context!.params).id))) return Errors.notFound("Page");
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (!canAccess(session.user.role, "events") && !canAccess(session.user.role, "registrations")) {
    return Errors.forbidden("You don't have permission to view this");
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

  const registrations = await prisma.registration.findMany({
    where: {
      eventId,
      OR: [{ foodPreference: { not: null } }, { accommodationChoice: { not: null } }, { accommodationRequired: { not: null } }],
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      participantRole: true,
      category: true,
      foodPreference: true,
      accommodationChoice: true,
      accommodationSelectedAt: true,
      accommodationRequired: true,
      accommodationSharing: true,
      accommodationCheckIn: true,
      accommodationCheckOut: true,
      accommodationRemarks: true,
    },
  });

  const food = registrations
    .filter((r) => r.foodPreference)
    .map((r) => ({ id: r.id, name: r.name, email: r.email, category: r.category, participantRole: r.participantRole, preference: r.foodPreference }));

  const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
  const accommodation = registrations
    .filter((r) => r.accommodationChoice || r.accommodationRequired != null)
    .map((r) => ({
      id: r.id, name: r.name, email: r.email, category: r.category, participantRole: r.participantRole,
      hotel: r.accommodationChoice, selectedAt: r.accommodationSelectedAt,
      required: r.accommodationRequired, sharing: r.accommodationSharing,
      checkIn: day(r.accommodationCheckIn), checkOut: day(r.accommodationCheckOut), remarks: r.accommodationRemarks,
    }));

  return successResponse({ food, accommodation });
});
