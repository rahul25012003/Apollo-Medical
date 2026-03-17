import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validations/auth";
import { hashPassword, verifyPassword } from "@/lib/auth-utils";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";

// PUT /api/users/me/password - Change current user's password
export const PUT = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  const body = await parseBody(request);

  if (!body) {
    return Errors.badRequest("Invalid request body");
  }

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
    return Errors.badRequest(
      "Password change is not available for this account. You may be using OTP-only login."
    );
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, user.password);

  if (!isValid) {
    return Errors.badRequest("Current password is incorrect");
  }

  // Hash new password and update
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
