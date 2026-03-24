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
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

const rateLimiter = createRateLimiter("otp-send", { maxRequests: 10, windowSeconds: 900 });

export const POST = withErrorHandler(async (request: NextRequest) => {
  const rl = rateLimiter.check(getClientIp(request));
  if (!rl.allowed) {
    return Errors.badRequest(rl.message);
  }

  const body = await parseBody(request);

  if (!body) {
    return Errors.badRequest("Invalid request body");
  }

  const parsed = sendOTPSchema.safeParse(body);

  if (!parsed.success) {
    return Errors.validationError(parsed.error);
  }

  const { email, purpose } = parsed.data;
  const tenantSlug = (body as Record<string, unknown>).tenantSlug as string | undefined;

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

  // Check user existence without revealing it to the caller
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, role: true, tenantId: true },
  });

  // Block OTP login for admin/staff accounts — they must use password-based login
  if (
    purpose === "LOGIN" &&
    existingUser &&
    existingUser.role !== "ATTENDEE"
  ) {
    return Errors.badRequest(
      "This email uses password-based login. Please use the admin sign-in."
    );
  }

  // Tenant isolation: if a tenantSlug is provided, verify the user belongs to this tenant
  if (purpose === "LOGIN" && tenantSlug) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });

    if (tenant) {
      // Check 1: Does the user belong to this tenant?
      if (existingUser && existingUser.tenantId && existingUser.tenantId !== tenant.id) {
        return Errors.badRequest(
          "No account found for this email on this platform. Please check that you are logging into the correct conference portal."
        );
      }

      // Check 2: If no user yet, does a registration exist for this tenant's events?
      if (!existingUser) {
        const tenantReg = await prisma.registration.findFirst({
          where: {
            email: { equals: email.toLowerCase(), mode: "insensitive" },
            event: { tenantId: tenant.id },
          },
          select: { id: true },
        });
        if (!tenantReg) {
          return Errors.badRequest(
            "No registration found for this email. Please register for an event first before logging in."
          );
        }
      }
    }
  }

  // For registration: if user already exists, return generic success (no leak)
  if (purpose === "REGISTRATION" && existingUser) {
    return successResponse(
      { message: "If an account with this email exists, an OTP has been sent" },
      "If an account with this email exists, an OTP has been sent"
    );
  }

  // For password reset: if user doesn't exist, return generic success (no leak)
  // For LOGIN: always proceed — user account will be auto-created at OTP verification
  if (purpose === "PASSWORD_RESET" && !existingUser) {
    return successResponse(
      { message: "If an account with this email exists, an OTP has been sent" },
      "If an account with this email exists, an OTP has been sent"
    );
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

  // Save OTP (use existingUser found earlier for linking)
  await prisma.oTP.create({
    data: {
      code,
      email: email.toLowerCase(),
      purpose,
      expiresAt,
      userId: existingUser?.id,
    },
  });

  // Determine tenantId for email channel lookup
  let tenantId = existingUser?.tenantId || null;
  if (!tenantId) {
    // Try to find tenantId from existing registration
    const reg = await prisma.registration.findFirst({
      where: { email: { equals: email.toLowerCase(), mode: "insensitive" } },
      select: { event: { select: { tenantId: true } } },
      orderBy: { createdAt: "desc" },
    });
    tenantId = reg?.event?.tenantId || null;
  }

  // Send OTP via email — await to detect delivery failures
  let emailSent = false;
  try {
    emailSent = await sendEmail({
      to: email,
      subject: `Your OTP Code — ${code}`,
      html: otpEmailHtml(code, purpose),
      tenantId,
    });
  } catch (err) {
    console.error("OTP email send error:", err);
    emailSent = false;
  }

  // Also try SMS if user has a phone (best-effort)
  if (existingUser?.id) {
    const userRecord = await prisma.user.findUnique({ where: { id: existingUser.id }, select: { phone: true } });
    if (userRecord?.phone) {
      sendSms({ to: userRecord.phone, message: otpSmsText(code, purpose) })
        .catch((err) => console.error("OTP SMS send error:", err));
    }
  }

  if (!emailSent) {
    return successResponse(
      { message: "OTP created but email delivery failed. Please check your email configuration or try again.", emailSent: false },
      "OTP created but email may not have been delivered"
    );
  }

  return successResponse(
    { message: "If an account with this email exists, an OTP has been sent", emailSent: true },
    "If an account with this email exists, an OTP has been sent"
  );
});
