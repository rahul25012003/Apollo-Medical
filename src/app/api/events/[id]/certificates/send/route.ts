import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Errors } from "@/lib/api-utils";
import { generateCertificatePDF, type CertificateTemplateConfig } from "@/lib/certificate-pdf";
import { sendEmail } from "@/lib/notifications";
import { randomUUID } from "crypto";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/events/[id]/certificates/send
// Body: { categories?: string[] }  — omit = all categories with templates
export async function POST(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session) return Errors.unauthorized();

  const { id: eventId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const { categories: filterCategories } = body as { categories?: string[] };

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, title: true, tenantId: true, certificateConfig: true },
  });
  if (!event) return Errors.notFound("Event");

  const config = (event.certificateConfig as Record<string, unknown> | null) ?? {};
  const templates =
    (config.templates as Record<string, CertificateTemplateConfig> | undefined) ?? {};

  const registrations = await prisma.registration.findMany({
    where: {
      eventId,
      status: { in: ["CONFIRMED", "ATTENDED"] },
      ...(filterCategories?.length ? { category: { in: filterCategories } } : {}),
    },
    select: { id: true, name: true, email: true, category: true },
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const failures: { name: string; email: string; reason: string }[] = [];

  for (const reg of registrations) {
    const category = reg.category ?? "default";
    const tpl = templates[category] ?? templates["default"];

    if (!tpl?.templateImage) {
      skipped++;
      continue;
    }

    try {
      const pdfBuffer = await generateCertificatePDF({ config: tpl, name: reg.name });

      const emailSent = await sendEmail({
        to: reg.email,
        subject: `Your Certificate — ${event.title}`,
        html: certificateEmailHtml({ name: reg.name, eventTitle: event.title }),
        tenantId: event.tenantId,
        attachments: [
          {
            filename: `Certificate-${reg.name.replace(/[^a-zA-Z0-9 ]/g, "")}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });

      if (emailSent) {
        // Track issuance
        const existing = await prisma.certificate.findFirst({
          where: { registrationId: reg.id, certificateType: "ATTENDANCE", sessionId: null },
        });
        if (!existing) {
          await prisma.certificate.create({
            data: {
              certificateCode: randomUUID().replace(/-/g, "").toUpperCase().slice(0, 16),
              registrationId: reg.id,
              eventId,
              certificateType: "ATTENDANCE",
              recipientName: reg.name,
              recipientEmail: reg.email,
              status: "ISSUED",
              issuedAt: new Date(),
            },
          });
        } else {
          await prisma.certificate.update({
            where: { id: existing.id },
            data: { status: "ISSUED", issuedAt: new Date() },
          });
        }
        sent++;
      } else {
        failed++;
        failures.push({ name: reg.name, email: reg.email, reason: "Email delivery failed" });
      }
    } catch (err) {
      failed++;
      failures.push({
        name: reg.name,
        email: reg.email,
        reason: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ success: true, sent, failed, skipped, total: registrations.length, failures });
}

function certificateEmailHtml({ name, eventTitle }: { name: string; eventTitle: string }): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #0d9488; margin-bottom: 4px;">Your Certificate</h2>
      <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 16px 0; border: 1px solid #bbf7d0;">
        <p style="margin: 0 0 8px;"><strong>Dear ${name},</strong></p>
        <p style="margin: 0 0 16px;">Please find attached your certificate of participation for <strong>${eventTitle}</strong>.</p>
        <p style="margin: 0; color: #555; font-size: 14px;">Download and save the attached PDF certificate.</p>
      </div>
      <p style="color: #999; font-size: 12px; margin-top: 24px;">This is an automated email. Please do not reply.</p>
    </div>
  `;
}
