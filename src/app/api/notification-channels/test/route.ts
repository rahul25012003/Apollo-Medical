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
      success = await sendEmail({
        to: testTo,
        subject: "CareNS Test Email",
        html: `<div style="font-family: Arial; padding: 20px;"><h2 style="color: #0d9488;">Test Email</h2><p>This is a test email from CareNS notification system.</p><p style="color: #666;">Channel: ${channel.name}<br/>Provider: ${channel.provider}</p></div>`,
        tenantId: channel.tenantId,
      });
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
