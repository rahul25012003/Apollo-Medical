import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { successResponse, Errors, withErrorHandler } from "@/lib/api-utils";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import { isIfpcTenantId } from "@/lib/ifpc-tenant";

// GET /api/users/me/interests — everything the signed-in delegate has marked
// as interested (sessions/workshops/campus tour, speakers) plus their food and
// accommodation choices. Always keyed to the session's own email, so one
// account never sees another's selections.
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  // IFPC (apollo-medical) only — this route doesn't exist for other tenants.
  if (!(await isIfpcTenantId(session.user.tenantId))) return Errors.notFound("Page");

  const email = session.user.email.toLowerCase();
  const ifpcEvent = { tenant: { slug: IFPC_TENANT_SLUG } };

  const [sessionRows, speakerRows, registration] = await Promise.all([
    prisma.sessionInterest.findMany({
      where: { email, session: { event: ifpcEvent } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        session: {
          select: {
            id: true, title: true, sessionType: true, sessionDate: true, startTime: true, endTime: true,
            hall: { select: { name: true } },
          },
        },
      },
    }),
    prisma.speakerInterest.findMany({
      where: { email, event: ifpcEvent },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, speaker: { select: { id: true, name: true, designation: true } } },
    }),
    prisma.registration.findFirst({
      where: { email, status: { in: ["CONFIRMED", "ATTENDED"] }, event: ifpcEvent },
      orderBy: { createdAt: "desc" },
      select: { foodPreference: true, accommodationChoice: true, accommodationRequired: true, accommodationSharing: true, accommodationCheckIn: true, accommodationCheckOut: true },
    }),
  ]);

  return successResponse({
    sessions: sessionRows.map((r) => ({
      id: r.id,
      sessionId: r.session.id,
      title: r.session.title,
      sessionType: r.session.sessionType,
      sessionDate: r.session.sessionDate,
      startTime: r.session.startTime,
      endTime: r.session.endTime,
      hall: r.session.hall?.name ?? null,
      createdAt: r.createdAt,
    })),
    speakers: speakerRows.map((r) => ({
      id: r.id,
      speakerId: r.speaker.id,
      name: r.speaker.name,
      designation: r.speaker.designation,
      createdAt: r.createdAt,
    })),
    foodPreference: registration?.foodPreference ?? null,
    accommodationChoice: registration?.accommodationChoice ?? null,
    accommodationRequired: registration?.accommodationRequired ?? null,
    accommodationSharing: registration?.accommodationSharing ?? null,
    accommodationCheckIn: registration?.accommodationCheckIn?.toISOString().slice(0, 10) ?? null,
    accommodationCheckOut: registration?.accommodationCheckOut?.toISOString().slice(0, 10) ?? null,
  });
});
