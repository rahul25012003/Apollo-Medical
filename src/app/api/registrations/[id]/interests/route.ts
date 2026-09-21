import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { isTenantOwner } from "@/lib/tenant-scope";
import { successResponse, Errors, withErrorHandler } from "@/lib/api-utils";
import { isIfpcRegistration } from "@/lib/ifpc-tenant";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/registrations/[id]/interests - Sessions this delegate has
// expressed interest in, for the same event as this registration.
export const GET = withErrorHandler(async (request: NextRequest, context?: RouteContext) => {
  // IFPC (apollo-medical) only — this route doesn't exist for other tenants.
  if (!(await isIfpcRegistration((await context!.params).id))) return Errors.notFound("Page");
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (!canAccess(session.user.role, "registrations")) {
    return Errors.forbidden("You don't have permission to view this");
  }

  const { id } = await context!.params;

  const registration = await prisma.registration.findUnique({
    where: { id },
    select: { email: true, eventId: true, event: { select: { tenantId: true } } },
  });
  if (!registration) return Errors.notFound("Registration");
  if (!isTenantOwner(session, registration.event.tenantId)) {
    return Errors.forbidden("You don't have access to this registration");
  }

  const interests = await prisma.sessionInterest.findMany({
    where: {
      email: registration.email.toLowerCase(),
      session: { eventId: registration.eventId },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      session: {
        select: {
          id: true,
          title: true,
          sessionType: true,
          sessionDate: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  });

  return successResponse(interests);
});
