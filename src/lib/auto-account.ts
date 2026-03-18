import { prisma } from "./prisma";
import { sendEmail, getActiveChannel } from "./notifications";

interface CreateAccountParams {
  email: string;
  name?: string | null;
  phone?: string | null;
  tenantId?: string | null;
}

interface AccountResult {
  userId: string;
  isNew: boolean;
  email: string;
}

/**
 * Find or create a user account for delegates/speakers/organizers.
 * These accounts have no password — they log in via OTP only.
 * Also links any existing unlinked registrations to the user.
 */
export async function findOrCreateUserAccount(
  params: CreateAccountParams
): Promise<AccountResult> {
  const email = params.email.toLowerCase().trim();

  // Use upsert to avoid race condition when two requests hit simultaneously
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: params.name || null,
      phone: params.phone || null,
      password: null,
      role: "ATTENDEE",
      isActive: true,
      tenantId: params.tenantId || null,
    },
    update: {
      // Only update name/phone if they were null
      ...(params.name ? { name: params.name } : {}),
      ...(params.phone ? { phone: params.phone } : {}),
    },
  });

  const isNew = user.createdAt.getTime() > Date.now() - 5000; // Created within last 5 seconds = new

  // Link any unlinked registrations to this user
  await linkRegistrationsToUser(user.id, email);

  return { userId: user.id, isNew, email };
}

/**
 * Link all registrations with this email to the user ID.
 */
async function linkRegistrationsToUser(userId: string, email: string) {
  await prisma.registration.updateMany({
    where: {
      email: { equals: email, mode: "insensitive" },
      userId: null,
    },
    data: { userId },
  });
}

/**
 * Send welcome email to newly created account.
 */
export async function sendAccountCreatedEmail(params: {
  email: string;
  name: string;
  eventTitle?: string;
  role?: string;
  loginUrl: string;
  tenantId?: string | null;
}): Promise<void> {
  const { email, name, eventTitle, role, loginUrl, tenantId } = params;

  const roleText = role || "delegate";
  const eventLine = eventTitle
    ? `<p style="margin: 0 0 16px;">You have been added as a <strong>${roleText}</strong>${eventTitle ? ` for <strong>${eventTitle}</strong>` : ""}.</p>`
    : "";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #0d9488; margin-bottom: 4px;">CareNS</h2>
      <p style="color: #666; margin-top: 0;">Your Account is Ready</p>
      <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 16px 0;">
        <p style="margin: 0 0 8px;"><strong>Hello ${name || "there"},</strong></p>
        ${eventLine}
        <p style="margin: 0 0 16px;">An account has been created for you. You can log in using your email address — a one-time verification code (OTP) will be sent to you each time.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: #0d9488; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Log In Now
          </a>
        </div>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #666;">Email</td><td style="padding: 6px 0; text-align: right;">${email}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Login Method</td><td style="padding: 6px 0; text-align: right;">OTP (sent to your email)</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Role</td><td style="padding: 6px 0; text-align: right; text-transform: capitalize;">${roleText}</td></tr>
        </table>
      </div>
      <p style="color: #666; font-size: 14px;">Simply enter your email on the login page and click "Send Login Code". A 6-digit code will be sent to your inbox.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">This is an automated email from CareNS Conference Management System.</p>
    </div>
  `;

  // Check if an email channel is configured before attempting to send.
  // The account creation itself is the critical path — email delivery is best-effort.
  // If no email channel exists, we log a warning but don't fail the operation.
  const emailChannel = await getActiveChannel("EMAIL", tenantId);
  if (!emailChannel) {
    console.warn(
      `[auto-account] No email channel configured (tenantId: ${tenantId || "platform"}). ` +
      `Welcome email NOT sent to ${email}. Account was created successfully.`
    );
    return;
  }

  // Fire and forget — don't block the main flow
  sendEmail({
    to: email,
    subject: eventTitle
      ? `Your account for ${eventTitle} is ready`
      : "Your CareNS account is ready",
    html,
    tenantId,
  }).catch((err) => console.error("Failed to send account created email:", err));
}
