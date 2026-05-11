import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Errors } from "@/lib/api-utils";
import { generateCertificatePDF, type CertificateTemplateConfig } from "@/lib/certificate-pdf";
import { sendEmail, certificateIssuedHtml } from "@/lib/notifications";
import { randomUUID } from "crypto";

type RouteContext = { params: Promise<{ id: string }> };

const BATCH_SIZE = 5; // process 5 in parallel — keeps memory low and avoids SMTP rate limits

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
  const skippedDetails: { name: string; email: string; category: string }[] = [];

  const processOne = async (reg: typeof registrations[number]) => {
    const category = reg.category ?? "";
    const tpl = templates[category]; // no silent "default" fallback — skip if no template

    if (!tpl?.templateImage) {
      skipped++;
      skippedDetails.push({ name: reg.name, email: reg.email, category: reg.category ?? "" });
      return;
    }

    try {
      const pdfBuffer = await generateCertificatePDF({ config: tpl, name: reg.name });

      // Safe filename: strip special chars, fall back to registration ID slice
      const safeName = reg.name.replace(/[^a-zA-Z0-9 ]/g, "").trim() || reg.id.slice(-8);
      const filename = `Certificate-${safeName}.pdf`;

      const emailSent = await sendEmail({
        to: reg.email,
        subject: `Your Certificate — ${event.title}`,
        html: certificateIssuedHtml({ name: reg.name, eventTitle: event.title }),
        tenantId: event.tenantId,
        attachments: [{ filename, content: pdfBuffer, contentType: "application/pdf" }],
      });

      if (emailSent) {
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
      const reason = err instanceof Error ? err.message : "Unknown error";
      console.error(`[CERT] Failed to send certificate to ${reg.email}:`, reason);
      failed++;
      failures.push({ name: reg.name, email: reg.email, reason });
    }
  };

  // Process in batches of BATCH_SIZE to balance speed vs. SMTP rate limits
  for (let i = 0; i < registrations.length; i += BATCH_SIZE) {
    await Promise.all(registrations.slice(i, i + BATCH_SIZE).map(processOne));
  }

  return NextResponse.json({ success: true, sent, failed, skipped, total: registrations.length, failures, skippedDetails });
}
