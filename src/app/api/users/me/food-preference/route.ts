import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { successResponse, Errors, withErrorHandler, parseBody } from "@/lib/api-utils";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import { z } from "zod";
import { isIfpcTenantId } from "@/lib/ifpc-tenant";
import { choicesWindow, closedMessage } from "@/lib/ifpc-deadline";
import { logActivity } from "@/lib/activity-log";

async function findMyRegistration(email: string) {
  return prisma.registration.findFirst({
    where: {
      email: email.toLowerCase(),
      status: { in: ["CONFIRMED", "ATTENDED"] },
      event: { tenant: { slug: IFPC_TENANT_SLUG } },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, foodPreference: true, event: { select: { id: true, registrationDeadline: true, tenantId: true } } },
  });
}

// GET /api/users/me/food-preference - the delegate's current food preference
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  // IFPC (apollo-medical) only — this route doesn't exist for other tenants.
  if (!(await isIfpcTenantId(session.user.tenantId))) return Errors.notFound("Page");

  const registration = await findMyRegistration(session.user.email);
  if (!registration) return successResponse({ preference: null });

  // Food stays changeable until registration closes, like every other choice.
  return successResponse({
    preference: registration.foodPreference,
    choices: choicesWindow(registration.event.registrationDeadline),
  });
});

const selectSchema = z.object({ preference: z.enum(["VEG", "NON_VEG"]) });

// POST /api/users/me/food-preference - the delegate sets/changes their food preference
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  // IFPC (apollo-medical) only — this route doesn't exist for other tenants.
  if (!(await isIfpcTenantId(session.user.tenantId))) return Errors.notFound("Page");

  const body = await parseBody(request);
  if (!body) return Errors.badRequest("Invalid request body");

  const parsed = selectSchema.safeParse(body);
  if (!parsed.success) return Errors.validationError(parsed.error);

  const registration = await findMyRegistration(session.user.email);
  if (!registration) {
    return Errors.notFound("A confirmed registration for this conference");
  }

  const choices = choicesWindow(registration.event.registrationDeadline);
  if (!choices.open) return Errors.forbidden(closedMessage(choices.closesAt));

  const before = registration.foodPreference;
  const updated = await prisma.registration.update({
    where: { id: registration.id },
    data: { foodPreference: parsed.data.preference },
    select: { foodPreference: true },
  });

  const label = (v: string | null) => (v === "NON_VEG" ? "Non-Vegetarian" : v === "VEG" ? "Vegetarian" : "not set");
  await logActivity(session, {
    action: before ? "interest.change" : "interest.add",
    summary: before
      ? `${registration.name} changed food preference from ${label(before)} to ${label(updated.foodPreference)}`
      : `${registration.name} chose ${label(updated.foodPreference)}`,
    entityType: "Registration",
    entityId: registration.id,
    tenantId: registration.event.tenantId,
    metadata: {
      kind: "food",
      eventId: registration.event.id,
      from: before,
      to: updated.foodPreference,
      status: label(updated.foodPreference),
      delegateName: registration.name,
    },
    request,
  });

  return successResponse({ preference: updated.foodPreference }, "Food preference saved");
});
