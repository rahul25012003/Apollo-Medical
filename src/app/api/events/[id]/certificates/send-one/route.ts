import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Errors } from "@/lib/api-utils";
import { generateCertificatePDF, type CertificateTemplateConfig } from "@/lib/certificate-pdf";
import { sendEmail, certificateIssuedHtml } from "@/lib/notifications";
import { randomUUID } from "crypto";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/events/[id]/certificates/send-one
// Body: { registrationId, nameOverride?, templateCategory }
export async function POST(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session) return Errors.unauthorized();

  const { id: eventId } = await context.params;
  const body = await req.json();
  const { registrationId, nameOverride, templateCategory } = body as {
    registrationId: string;
    nameOverride?: string;
    templateCategory: string;
  };

  if (!registrationId || !templateCategory) {
    return NextResponse.json({ success: false, error: "registrationId and templateCategory are required" }, { status: 400 });
  }

  const [event, registration] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, tenantId: true, certificateConfig: true },
    }),
    prisma.registration.findUnique({
      where: { id: registrationId },
      select: { id: true, name: true, email: true },
    }),
  ]);

  if (!event) return Errors.notFound("Event");
  if (!registration) return Errors.notFound("Registration");

  const config = (event.certificateConfig as Record<string, unknown> | null) ?? {};
  const templates = (config.templates as Record<string, CertificateTemplateConfig> | undefined) ?? {};
  const tpl = templates[templateCategory];

  if (!tpl?.templateImage) {
    return NextResponse.json({ success: false, error: `No template uploaded for category "${templateCategory}". Upload a template first.` }, { status: 400 });
  }

  const nameToUse = (nameOverride?.trim()) || registration.name;

  try {
    const pdfBuffer = await generateCertificatePDF({ config: tpl, name: nameToUse });
    const safeName = nameToUse.replace(/[^a-zA-Z0-9 ]/g, "").trim() || registration.id.slice(-8);

    const emailSent = await sendEmail({
      to: registration.email,
      subject: `Your Certificate — ${event.title}`,
      html: certificateIssuedHtml({ name: nameToUse, eventTitle: event.title }),
      tenantId: event.tenantId,
      attachments: [{ filename: `Certificate-${safeName}.pdf`, content: pdfBuffer, contentType: "application/pdf" }],
    });

    if (!emailSent) {
      return NextResponse.json({ success: false, error: "Email delivery failed. Check SMTP settings in Notifications." }, { status: 500 });
    }

    // Track issuance
    const existing = await prisma.certificate.findFirst({
      where: { registrationId, certificateType: "ATTENDANCE", sessionId: null },
    });
    if (!existing) {
      await prisma.certificate.create({
        data: {
          certificateCode: randomUUID().replace(/-/g, "").toUpperCase().slice(0, 16),
          registrationId,
          eventId,
          certificateType: "ATTENDANCE",
          recipientName: nameToUse,
          recipientEmail: registration.email,
          status: "ISSUED",
          issuedAt: new Date(),
        },
      });
    } else {
      await prisma.certificate.update({
        where: { id: existing.id },
        data: { status: "ISSUED", issuedAt: new Date(), recipientName: nameToUse },
      });
    }

    return NextResponse.json({ success: true, sent: true, name: nameToUse, email: registration.email });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[CERT-ONE]", msg);
    return NextResponse.json({ success: false, error: `PDF generation failed: ${msg}` }, { status: 500 });
  }
}
