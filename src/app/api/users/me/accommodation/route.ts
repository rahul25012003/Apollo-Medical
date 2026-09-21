import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { successResponse, Errors, withErrorHandler, parseBody } from "@/lib/api-utils";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import { VENUE_TRAVEL } from "@/content/ifpc-2026";
import { z } from "zod";
import { isIfpcTenantId } from "@/lib/ifpc-tenant";

const HOTEL_NAMES = new Set(VENUE_TRAVEL.accommodation.hotels.map((h) => h.name));

async function findMyRegistration(email: string) {
  return prisma.registration.findFirst({
    where: {
      email: email.toLowerCase(),
      status: { in: ["CONFIRMED", "ATTENDED"] },
      event: { tenant: { slug: IFPC_TENANT_SLUG } },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, accommodationChoice: true, accommodationSelectedAt: true },
  });
}

// GET /api/users/me/accommodation - the delegate's current accommodation selection
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  // IFPC (apollo-medical) only — this route doesn't exist for other tenants.
  if (!(await isIfpcTenantId(session.user.tenantId))) return Errors.notFound("Page");

  const registration = await findMyRegistration(session.user.email);
  if (!registration) return successResponse({ choice: null, selectedAt: null });

  return successResponse({
    choice: registration.accommodationChoice,
    selectedAt: registration.accommodationSelectedAt,
  });
});

const selectSchema = z.object({ hotelName: z.string().min(1).max(200) });

// POST /api/users/me/accommodation - the delegate selects a hotel from the published list
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  // IFPC (apollo-medical) only — this route doesn't exist for other tenants.
  if (!(await isIfpcTenantId(session.user.tenantId))) return Errors.notFound("Page");

  const body = await parseBody(request);
  if (!body) return Errors.badRequest("Invalid request body");

  const parsed = selectSchema.safeParse(body);
  if (!parsed.success) return Errors.validationError(parsed.error);

  if (!HOTEL_NAMES.has(parsed.data.hotelName)) {
    return Errors.badRequest("Not a recognized accommodation option");
  }

  const registration = await findMyRegistration(session.user.email);
  if (!registration) {
    return Errors.notFound("A confirmed registration for this conference");
  }

  const updated = await prisma.registration.update({
    where: { id: registration.id },
    data: { accommodationChoice: parsed.data.hotelName, accommodationSelectedAt: new Date() },
    select: { accommodationChoice: true, accommodationSelectedAt: true },
  });

  return successResponse({ choice: updated.accommodationChoice, selectedAt: updated.accommodationSelectedAt }, "Accommodation choice saved");
});
