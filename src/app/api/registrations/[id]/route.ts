import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { isTenantOwner } from "@/lib/tenant-scope";
import { updateRegistrationSchema } from "@/lib/validations/registration";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/registrations/[id] - Get single registration
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    const { id } = await context!.params;

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        event: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        registeredBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        certificate: true,
      },
    });

    if (!registration) {
      return Errors.notFound("Registration");
    }

    // Check access - own registration or manager role
    const isOwner =
      registration.userId === session.user.id ||
      registration.email === session.user.email;

    if (!isOwner && !canAccess(session.user.role, "registrations")) {
      return Errors.forbidden("You don't have permission to view this registration");
    }

    // Tenant isolation: non-SUPER_ADMIN can only see registrations for their tenant's events
    if (
      !isOwner &&
      session.user.role !== "SUPER_ADMIN" &&
      session.user.tenantId &&
      registration.event.tenantId !== session.user.tenantId
    ) {
      return Errors.forbidden("You don't have permission to view this registration");
    }

    return successResponse(registration);
  }
);

// PUT /api/registrations/[id] - Update registration
export const PUT = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "registrations")) {
      return Errors.forbidden("You don't have permission to update registrations");
    }

    const { id } = await context!.params;

    // Check if registration exists
    const existingRegistration = await prisma.registration.findUnique({
      where: { id },
      include: { event: { select: { tenantId: true } } },
    });

    if (!existingRegistration) {
      return Errors.notFound("Registration");
    }

    if (!isTenantOwner(session, existingRegistration.event.tenantId)) {
      return Errors.forbidden("You don't have access to this registration");
    }

    const body = await parseBody(request);

    if (!body) {
      return Errors.badRequest("Invalid request body");
    }

    const parsed = updateRegistrationSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = { ...data };

    // Convert date strings to Date objects
    if (data.paidAt) {
      updateData.paidAt = new Date(data.paidAt);
    }
    if (data.checkedInAt) {
      updateData.checkedInAt = new Date(data.checkedInAt);
    }

    const registration = await prisma.registration.update({
      where: { id },
      data: updateData,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
          },
        },
        certificate: {
          select: {
            id: true,
            certificateCode: true,
            status: true,
          },
        },
      },
    });

    return successResponse(registration, "Registration updated successfully");
  }
);

// DELETE /api/registrations/[id] - Delete/Cancel registration
export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "registrations")) {
      return Errors.forbidden("You don't have permission to delete registrations");
    }

    const { id } = await context!.params;

    // Check if registration exists
    const existingRegistration = await prisma.registration.findUnique({
      where: { id },
      include: {
        certificate: true,
        event: { select: { tenantId: true } },
      },
    });

    if (!existingRegistration) {
      return Errors.notFound("Registration");
    }

    if (!isTenantOwner(session, existingRegistration.event.tenantId)) {
      return Errors.forbidden("You don't have access to this registration");
    }

    // If certificate exists, don't allow deletion
    if (existingRegistration.certificate) {
      return Errors.badRequest(
        "Cannot delete registration with issued certificate. Revoke certificate first."
      );
    }

    await prisma.registration.delete({
      where: { id },
    });

    return successResponse({ id }, "Registration deleted successfully");
  }
);
