import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyOTPSchema } from "@/lib/validations/auth";
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

  const parsed = verifyOTPSchema.safeParse(body);

  if (!parsed.success) {
    return Errors.validationError(parsed.error);
  }

  const { email, code, purpose } = parsed.data;

  // Rate limit: count recent failed OTP attempts (used OTPs that were NOT verified via code match)
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const recentAttempts = await prisma.oTP.count({
    where: {
      email: email.toLowerCase(),
      purpose,
      createdAt: { gt: fifteenMinutesAgo },
    },
  });

  // If more than 10 OTPs were created/attempted in 15 minutes, block
  if (recentAttempts > 10) {
    return Errors.badRequest(
      "Too many attempts. Please wait 15 minutes before trying again."
    );
  }

  // Find the OTP
  const otp = await prisma.oTP.findFirst({
    where: {
      email: email.toLowerCase(),
      code,
      purpose,
      used: false,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!otp) {
    return Errors.badRequest("Invalid or expired OTP");
  }

  // Mark OTP as used
  await prisma.oTP.update({
    where: { id: otp.id },
    data: { used: true },
  });

  // For email verification, mark user as verified
  if (purpose === "EMAIL_VERIFICATION" && otp.userId) {
    await prisma.user.update({
      where: { id: otp.userId },
      data: { emailVerified: new Date() },
    });
  }

  // For password reset, generate a reset token
  if (purpose === "PASSWORD_RESET") {
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Hash the token before storing — only the hash is persisted
    const tokenHash = createHash("sha256").update(token).digest("hex");

    await prisma.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token: tokenHash,
        expires,
      },
    });

    // Return the plaintext token to the client (never stored)
    return successResponse(
      { token, message: "OTP verified. Use this token to reset your password." },
      "OTP verified successfully"
    );
  }

  return successResponse(
    { verified: true },
    "OTP verified successfully"
  );
});
