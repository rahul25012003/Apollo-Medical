import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { successResponse, Errors, withErrorHandler, parseBody } from "@/lib/api-utils";
import { IFPC_TENANT_SLUG, ACCOMMODATION_SHARING } from "@/lib/ifpc-constants";
import { VENUE_TRAVEL } from "@/content/ifpc-2026";
import { z } from "zod";
import { isIfpcTenantId } from "@/lib/ifpc-tenant";
import { choicesWindow, closedMessage } from "@/lib/ifpc-deadline";
import { logActivity } from "@/lib/activity-log";

const HOTEL_NAMES = new Set(VENUE_TRAVEL.accommodation.hotels.map((h) => h.name));
const SHARING_OPTIONS = ACCOMMODATION_SHARING.map((s) => s.value) as unknown as ["SINGLE", "TWO_SHARING", "THREE_SHARING"];

const SELECT = {
  id: true,
  accommodationChoice: true,
  accommodationSelectedAt: true,
  accommodationRequired: true,
  accommodationSharing: true,
  accommodationCheckIn: true,
  accommodationCheckOut: true,
  accommodationRemarks: true,
  name: true,
  event: { select: { id: true, startDate: true, endDate: true, registrationDeadline: true, tenantId: true } },
} as const;

async function findMyRegistration(email: string) {
  return prisma.registration.findFirst({
    where: {
      email: email.toLowerCase(),
      status: { in: ["CONFIRMED", "ATTENDED"] },
      event: { tenant: { slug: IFPC_TENANT_SLUG } },
    },
    orderBy: { createdAt: "desc" },
    select: SELECT,
  });
}

const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

function shape(r: NonNullable<Awaited<ReturnType<typeof findMyRegistration>>>) {
  return {
    // `choice`/`selectedAt` kept for existing callers (event-page hotel picker)
    choice: r.accommodationChoice,
    selectedAt: r.accommodationSelectedAt,
    required: r.accommodationRequired,
    sharing: r.accommodationSharing,
    checkIn: day(r.accommodationCheckIn),
    checkOut: day(r.accommodationCheckOut),
    remarks: r.accommodationRemarks,
    eventStart: day(r.event.startDate),
    eventEnd: day(r.event.endDate),
    // Choices stay editable until registration closes, not until the event.
    choices: choicesWindow(r.event.registrationDeadline),
  };
}

// GET /api/users/me/accommodation - the delegate's accommodation expression of interest
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  // IFPC (apollo-medical) only — this route doesn't exist for other tenants.
  if (!(await isIfpcTenantId(session.user.tenantId))) return Errors.notFound("Page");

  const registration = await findMyRegistration(session.user.email);
  if (!registration) return successResponse({ registered: false, choice: null, selectedAt: null });
  return successResponse({ registered: true, ...shape(registration) });
});

const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const bodySchema = z.object({
  // null clears the hotel pick; null `required` resets the whole request.
  hotelName: z.string().min(1).max(200).nullable().optional(),
  required: z.boolean().nullable().optional(),
  sharing: z.enum(SHARING_OPTIONS).nullable().optional(),
  checkIn: DATE.nullable().optional(),
  checkOut: DATE.nullable().optional(),
  remarks: z.string().max(1000).nullable().optional(),
});

/** One readable line describing where the delegate now stands. */
function accommodationStatus(r: { accommodationRequired: boolean | null; accommodationSharing: string | null; accommodationChoice: string | null }) {
  if (r.accommodationRequired == null) return "not booked";
  if (r.accommodationRequired === false) return "not interested";
  return ["room requested", r.accommodationSharing, r.accommodationChoice].filter(Boolean).join(" · ");
}

// POST /api/users/me/accommodation - save any part of the delegate's accommodation
// preference: whether they need a room, sharing, dates, remarks, preferred hotel.
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  // IFPC (apollo-medical) only — this route doesn't exist for other tenants.
  if (!(await isIfpcTenantId(session.user.tenantId))) return Errors.notFound("Page");

  const body = await parseBody(request);
  if (!body) return Errors.badRequest("Invalid request body");
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return Errors.validationError(parsed.error);
  const input = parsed.data;

  if (input.hotelName != null && !HOTEL_NAMES.has(input.hotelName)) {
    return Errors.badRequest("Not a recognized accommodation option");
  }

  const registration = await findMyRegistration(session.user.email);
  if (!registration) return Errors.notFound("A confirmed registration for this conference");

  // The client disables the controls, but the window is only real if the
  // server holds it: a stale tab would otherwise still be able to write.
  const choices = choicesWindow(registration.event.registrationDeadline);
  if (!choices.open) return Errors.forbidden(closedMessage(choices.closesAt));

  // Cancelling the request puts it back to never-answered, so the delegate
  // can start again rather than being stuck on an explicit "no".
  if (input.required === null) {
    const cleared = await prisma.registration.update({
      where: { id: registration.id },
      data: {
        accommodationRequired: null,
        accommodationChoice: null,
        accommodationSharing: null,
        accommodationCheckIn: null,
        accommodationCheckOut: null,
        accommodationSelectedAt: new Date(),
      },
      select: SELECT,
    });
    await logActivity(session, {
      action: "interest.remove",
      summary: `${registration.name} cancelled their accommodation request`,
      entityType: "Registration",
      entityId: registration.id,
      tenantId: registration.event.tenantId,
      metadata: { kind: "accommodation", eventId: registration.event.id, status: "not booked", delegateName: registration.name },
      request,
    });
    return successResponse({ registered: true, ...shape(cleared) }, "Accommodation request cancelled");
  }

  // Choosing a hotel implies a room is needed, unless they said otherwise.
  const required = input.required ?? (input.hotelName != null ? true : registration.accommodationRequired);
  const checkIn = input.checkIn !== undefined ? input.checkIn : day(registration.accommodationCheckIn);
  const checkOut = input.checkOut !== undefined ? input.checkOut : day(registration.accommodationCheckOut);
  if (required && checkIn && checkOut && checkOut <= checkIn) {
    return Errors.badRequest("Check-out must be after check-in");
  }

  const data =
    required === false
      ? {
          // No room needed: clear the room details, keep any remarks.
          accommodationRequired: false,
          accommodationChoice: null,
          accommodationSharing: null,
          accommodationCheckIn: null,
          accommodationCheckOut: null,
          ...(input.remarks !== undefined ? { accommodationRemarks: input.remarks || null } : {}),
        }
      : {
          accommodationRequired: required ?? null,
          ...(input.hotelName !== undefined ? { accommodationChoice: input.hotelName } : {}),
          ...(input.sharing !== undefined ? { accommodationSharing: input.sharing } : {}),
          ...(input.checkIn !== undefined ? { accommodationCheckIn: input.checkIn ? new Date(`${input.checkIn}T00:00:00Z`) : null } : {}),
          ...(input.checkOut !== undefined ? { accommodationCheckOut: input.checkOut ? new Date(`${input.checkOut}T00:00:00Z`) : null } : {}),
          ...(input.remarks !== undefined ? { accommodationRemarks: input.remarks || null } : {}),
        };

  const updated = await prisma.registration.update({
    where: { id: registration.id },
    data: { ...data, accommodationSelectedAt: new Date() },
    select: SELECT,
  });

  const was = accommodationStatus(registration);
  const now = accommodationStatus(updated);
  await logActivity(session, {
    action: registration.accommodationRequired == null ? "interest.add" : "interest.change",
    summary: `${registration.name} set accommodation to ${now}`,
    entityType: "Registration",
    entityId: registration.id,
    tenantId: registration.event.tenantId,
    metadata: { kind: "accommodation", eventId: registration.event.id, from: was, to: now, status: now, delegateName: registration.name },
    request,
  });

  return successResponse({ registered: true, ...shape(updated) }, "Accommodation preference saved");
});
