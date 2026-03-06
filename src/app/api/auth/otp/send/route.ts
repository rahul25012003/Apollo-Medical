import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP, getOTPExpiry } from "@/lib/auth-utils";
import { sendOTPSchema } from "@/lib/validations/auth";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";
import { sendEmail, sendSms, otpEmailHtml, otpSmsText } from "@/lib/notifications";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await parseBody(request);

  if (!body) {
    return Errors.badRequest("Invalid request body");
  }

  const parsed = sendOTPSchema.safeParse(body);

  if (!parsed.success) {
    return Errors.validationError(parsed.error);
  }

  const { email, purpose } = parsed.data;

  // Rate limit: max 5 OTP sends per email per 15 minutes
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const recentOTPs = await prisma.oTP.count({
    where: {
      email: email.toLowerCase(),
      purpose,
      createdAt: { gt: fifteenMinutesAgo },
    },
  });

  if (recentOTPs >= 5) {
    return Errors.badRequest(
      "Too many OTP requests. Please wait 15 minutes before trying again."
    );
  }

  // For registration, check if user doesn't exist
  if (purpose === "REGISTRATION") {
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return Errors.conflict("An account with this email already exists");
    }
  }

  // For login/password reset, check if user exists
  if (purpose === "LOGIN" || purpose === "PASSWORD_RESET") {
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!existingUser) {
      return Errors.notFound("User");
    }
  }

  // Invalidate any existing OTPs for this email and purpose
  await prisma.oTP.updateMany({
    where: {
      email: email.toLowerCase(),
      purpose,
      used: false,
    },
    data: {
      used: true,
    },
  });

  // Generate new OTP
  const code = generateOTP();
  const expiresAt = getOTPExpiry(10); // 10 minutes

  // Find user if exists (for linking)
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });

  // Save OTP
  await prisma.oTP.create({
    data: {
      code,
      email: email.toLowerCase(),
      purpose,
      expiresAt,
      userId: user?.id,
    },
  });

  // Send OTP via email (non-blocking — don't fail registration if email fails)
  sendEmail({
    to: email,
    subject: `Your OTP Code — ${code}`,
    html: otpEmailHtml(code, purpose),
  }).catch((err) => console.error("OTP email send error:", err));

  // Also try SMS if user has a phone (best-effort)
  if (user?.id) {
    const userRecord = await prisma.user.findUnique({ where: { id: user.id }, select: { phone: true } });
    if (userRecord?.phone) {
      sendSms({ to: userRecord.phone, message: otpSmsText(code, purpose) })
        .catch((err) => console.error("OTP SMS send error:", err));
    }
  }

  // In development, also log the OTP
  if (process.env.NODE_ENV === "development") {
    console.log(`OTP for ${email}: ${code}`);
  }

  return successResponse(
    { message: "OTP sent successfully" },
    "OTP sent to your email"
  );
});
