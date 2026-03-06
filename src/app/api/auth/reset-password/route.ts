import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-utils";
import { resetPasswordSchema } from "@/lib/validations/auth";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await parseBody(request);

  if (!body) {
    return Errors.badRequest("Invalid request body");
  }

  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return Errors.validationError(parsed.error);
  }

  const { token, password } = parsed.data;

  // Find the verification token
  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      token,
      expires: {
        gt: new Date(),
      },
    },
  });

  if (!verificationToken) {
    return Errors.badRequest("Invalid or expired reset token");
  }

  // Find user by email (identifier)
  const user = await prisma.user.findUnique({
    where: { email: verificationToken.identifier },
  });

  if (!user) {
    return Errors.notFound("User");
  }

  // Hash new password
  const hashedPassword = await hashPassword(password);

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  // Delete the used verification token
  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: verificationToken.identifier,
        token: verificationToken.token,
      },
    },
  });

  return successResponse(
    { message: "Password reset successfully" },
    "Your password has been updated"
  );
});
