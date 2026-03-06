import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validations/user";
import { changePasswordSchema } from "@/lib/validations/auth";
import { hashPassword, verifyPassword } from "@/lib/auth-utils";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";

// GET /api/users/me - Get current user profile
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      role: true,
      isActive: true,
      emailVerified: true,
      notifyEmail: true,
      notifyRegistrations: true,
      notifyPayments: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { registrations: true },
      },
    },
  });

  if (!user) {
    return Errors.notFound("User");
  }

  return successResponse(user);
});

// PUT /api/users/me - Update current user profile
export const PUT = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  const body = await parseBody(request);

  if (!body) {
    return Errors.badRequest("Invalid request body");
  }

  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return Errors.validationError(parsed.error);
  }

  // Also update the name field based on firstName/lastName if provided
  let updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.firstName !== undefined || parsed.data.lastName !== undefined) {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true },
    });
    const firstName = parsed.data.firstName ?? currentUser?.firstName ?? "";
    const lastName = parsed.data.lastName ?? currentUser?.lastName ?? "";
    if (firstName || lastName) {
      updateData.name = `${firstName} ${lastName}`.trim();
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData as Parameters<typeof prisma.user.update>[0]["data"],
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      role: true,
      isActive: true,
      emailVerified: true,
      notifyEmail: true,
      notifyRegistrations: true,
      notifyPayments: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { registrations: true },
      },
    },
  });

  return successResponse(user, "Profile updated successfully");
});

// PATCH /api/users/me - Change password
export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  const body = await parseBody(request);

  if (!body) {
    return Errors.badRequest("Invalid request body");
  }

  // Import the schema we need
  const changePasswordSchema = await import("@/lib/validations/auth").then(m => m.changePasswordSchema);

  const parsed = changePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return Errors.validationError(parsed.error);
  }

  const { currentPassword, newPassword } = parsed.data;

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, password: true },
  });

  if (!user || !user.password) {
    return Errors.badRequest("Password change not available for this account");
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, user.password);

  if (!isValid) {
    return Errors.badRequest("Current password is incorrect");
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword },
  });

  return successResponse(
    { message: "Password changed successfully" },
    "Your password has been updated"
  );
});
