import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { isTenantOwner } from "@/lib/tenant-scope";
import { Errors } from "@/lib/api-utils";
import { generateCertificatePDF, type CertificateTemplateConfig } from "@/lib/certificate-pdf";
import { sendEmail, certificateIssuedHtml } from "@/lib/notifications";
import { randomUUID } from "crypto";
import { isIfpcEvent } from "@/lib/ifpc-tenant";
import { logActivity } from "@/lib/activity-log";
import * as legacy from "./legacy";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/events/[id]/certificates/send-one
// Body: { registrationId, nameOverride?, templateCategory }
async function ifpcPOST(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (!canAccess(session.user.role, "certificates")) return Errors.forbidden("You don't have permission to manage certificates");

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
  if (!isTenantOwner(session, event.tenantId)) return Errors.forbidden("You don't have access to this event");
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

    await logActivity(session, {
      action: "certificate.send",
      summary: `Sent a certificate to ${nameToUse} (${registration.email})`,
      entityType: "Registration",
      entityId: registration.id,
      tenantId: event.tenantId,
      request: req,
    });

    return NextResponse.json({ success: true, sent: true, name: nameToUse, email: registration.email });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[CERT-ONE]", msg);
    return NextResponse.json({ success: false, error: `PDF generation failed: ${msg}` }, { status: 500 });
  }
}

// IFPC (apollo-medical) uses the handlers above. Every other tenant keeps the
// original pre-IFPC handlers, unchanged, in ./legacy.ts.
export async function POST(request: NextRequest, context: RouteContext) {
  const isIfpc = await isIfpcEvent((await context.params).id);
  return isIfpc ? ifpcPOST(request, context) : legacy.POST(request, context);
}
