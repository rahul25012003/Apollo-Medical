import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendEmail, sendSms, sendWhatsApp } from "@/lib/notifications";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";

// POST /api/notification-channels/test - Send a test notification
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session) return Errors.unauthorized();

  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return Errors.forbidden();
  }

  const body = await parseBody(request);
  if (!body) return Errors.badRequest("Invalid request body");

  const { channelId } = body as { channelId: string };
  if (!channelId) return Errors.badRequest("channelId is required");

  const channel = await prisma.notificationChannel.findUnique({
    where: { id: channelId },
  });
  if (!channel) return Errors.notFound("Notification channel");

  const testTo = session.user.email;
  let success = false;

  try {
    if (channel.channel === "EMAIL") {
      // Use nodemailer directly so we get the real SMTP error, not a silent false
      const config = channel.config as Record<string, string>;
      if (channel.provider === "gmail_smtp" || channel.provider === "custom_smtp") {
        const nodemailer = (await import("nodemailer")).default;
        const transporter = nodemailer.createTransport({
          host: config.smtpHost,
          port: Number(config.smtpPort),
          secure: Number(config.smtpPort) === 465,
          auth: { user: config.email, pass: config.password },
        });
        await transporter.verify(); // throws with real error if credentials wrong
        await transporter.sendMail({
          from: config.fromName ? `"${config.fromName}" <${config.email}>` : config.email,
          to: testTo,
          subject: "ICMS Test Email",
          html: `<div style="font-family:Arial;padding:20px;"><h2 style="color:#0d9488;">Test Email ✓</h2><p>SMTP is working correctly.</p><p style="color:#666;">Channel: ${channel.name} · Provider: ${channel.provider}</p></div>`,
        });
        success = true;
      } else {
        success = await sendEmail({
          to: testTo,
          subject: "ICMS Test Email",
          html: `<div style="font-family: Arial; padding: 20px;"><h2 style="color: #0d9488;">Test Email</h2><p>This is a test email from ICMS notification system.</p></div>`,
          tenantId: channel.tenantId,
        });
      }
    } else if (channel.channel === "SMS") {
      // SMS test — use the user's phone if available, else skip
      success = await sendSms({
        to: testTo, // Will use the configured channel
        message: `ICMS Test SMS from channel "${channel.name}". If you receive this, your SMS configuration is working.`,
        tenantId: channel.tenantId,
      });
    } else if (channel.channel === "WHATSAPP") {
      success = await sendWhatsApp({
        to: testTo,
        message: `ICMS Test WhatsApp from channel "${channel.name}". If you receive this, your WhatsApp configuration is working.`,
        tenantId: channel.tenantId,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Errors.badRequest(`Test failed: ${message}`);
  }

  if (!success) {
    return Errors.badRequest("Test notification failed. Check your configuration.");
  }

  return successResponse({ sent: true }, "Test notification sent successfully");
});
