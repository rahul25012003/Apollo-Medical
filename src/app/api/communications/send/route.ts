import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { getEffectiveTenantId, tenantWhereClause } from "@/lib/tenant-scope";
import { sendEmail } from "@/lib/notifications";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";

// POST /api/communications/send — Bulk send emails to registrants
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  if (!canAccess(session.user.role, "events")) {
    return Errors.forbidden("You don't have permission to send communications");
  }

  const body = await parseBody<{
    eventId: string;
    subject: string;
    body: string;
    recipientFilter?: {
      status?: string;
      role?: string;
      category?: string;
    };
  }>(request);

  if (!body || !body.eventId || !body.subject || !body.body) {
    return Errors.badRequest("eventId, subject, and body are required");
  }

  const tenantId = getEffectiveTenantId(session, request.nextUrl.searchParams);

  // Verify event exists and belongs to tenant
  const event = await prisma.event.findUnique({
    where: { id: body.eventId },
    select: { id: true, title: true, tenantId: true },
  });

  if (!event) {
    return Errors.notFound("Event");
  }

  // Build registration filter
  const registrationWhere: Record<string, unknown> = {
    eventId: body.eventId,
  };

  if (body.recipientFilter?.status) {
    registrationWhere.status = body.recipientFilter.status;
  }
  if (body.recipientFilter?.role) {
    registrationWhere.participantRole = body.recipientFilter.role;
  }
  if (body.recipientFilter?.category) {
    registrationWhere.category = body.recipientFilter.category;
  }

  const registrations = await prisma.registration.findMany({
    where: registrationWhere,
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (registrations.length === 0) {
    return Errors.badRequest("No registrants match the selected filters");
  }

  let sent = 0;
  let failed = 0;
  const logs: {
    tenantId: string | null;
    eventId: string;
    recipientEmail: string;
    recipientName: string | null;
    subject: string;
    channel: string;
    status: string;
    errorMessage: string | null;
  }[] = [];

  // Send emails to each recipient
  for (const reg of registrations) {
    try {
      // Replace placeholders in body
      const personalizedBody = body.body
        .replace(/\{\{name\}\}/g, reg.name || "Participant")
        .replace(/\{\{email\}\}/g, reg.email)
        .replace(/\{\{eventTitle\}\}/g, event.title);

      const personalizedSubject = body.subject
        .replace(/\{\{eventTitle\}\}/g, event.title);

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #0d9488; margin-bottom: 16px;">${personalizedSubject}</h2>
          <div style="line-height: 1.6; color: #333;">${personalizedBody.replace(/\n/g, "<br/>")}</div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px;">This email was sent via CareNS Conference Management System.</p>
        </div>
      `;

      const success = await sendEmail({
        to: reg.email,
        subject: personalizedSubject,
        html,
        tenantId: tenantId || event.tenantId,
      });

      if (success) {
        sent++;
        logs.push({
          tenantId: tenantId || event.tenantId,
          eventId: body.eventId,
          recipientEmail: reg.email,
          recipientName: reg.name,
          subject: personalizedSubject,
          channel: "EMAIL",
          status: "SENT",
          errorMessage: null,
        });
      } else {
        failed++;
        logs.push({
          tenantId: tenantId || event.tenantId,
          eventId: body.eventId,
          recipientEmail: reg.email,
          recipientName: reg.name,
          subject: personalizedSubject,
          channel: "EMAIL",
          status: "FAILED",
          errorMessage: "Email delivery failed",
        });
      }
    } catch (error) {
      failed++;
      logs.push({
        tenantId: tenantId || event.tenantId,
        eventId: body.eventId,
        recipientEmail: reg.email,
        recipientName: reg.name,
        subject: body.subject,
        channel: "EMAIL",
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Batch create message logs
  if (logs.length > 0) {
    await prisma.messageLog.createMany({ data: logs });
  }

  return successResponse(
    { sent, failed, total: registrations.length },
    `Successfully sent ${sent} of ${registrations.length} emails`
  );
});
