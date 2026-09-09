/**
 * Automation hooked into existing, shared flows (registration confirmation,
 * abstract review). Kept in one file so the two very different scoping rules
 * are easy to see at a glance:
 *
 *  - issueAttendeeBadgeAndCertificate() changes behavior of an EXISTING,
 *    already-live flow (registration confirmation) that every tenant uses
 *    today — so it is hard-gated to IFPC_TENANT_SLUG. No other tenant's
 *    registrations are affected.
 *
 *  - issuePresentationCertificate() is part of a brand-new feature (Abstract
 *    submissions) that no tenant had before, so it is NOT tenant-gated —
 *    turning it on for every tenant doesn't change anything that already
 *    worked for carens or anyone else; it only activates when someone uses
 *    the new Abstract flow.
 */
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import { generateCertificatePDF, type CertificateTemplateConfig } from "@/lib/certificate-pdf";
import { sendEmail, certificateIssuedHtml, badgeReadyHtml } from "@/lib/notifications";

function randomCode(len: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/** Generates a unique, human-readable registration ID like "IFPC26-7K2QX9". */
async function generateRegistrationCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = `IFPC26-${randomCode(6)}`;
    const existing = await prisma.registration.findUnique({ where: { registrationCode: code } });
    if (!existing) return code;
  }
  // Astronomically unlikely fallback
  return `IFPC26-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function pickCertificateTemplate(
  templates: Record<string, CertificateTemplateConfig> | undefined,
  category: string | null
): CertificateTemplateConfig | null {
  if (!templates) return null;
  if (category && templates[category]?.templateImage) return templates[category];
  if (templates["Delegate"]?.templateImage) return templates["Delegate"];
  const first = Object.values(templates).find((t) => t?.templateImage);
  return first || null;
}

/**
 * Runs when a registration becomes CONFIRMED. Generates the human-readable
 * registration ID, sets the QR/badge fields (same convention the admin
 * "Badges" tab already uses), and — if the organiser has uploaded a
 * certificate template — issues + emails the attendee e-certificate
 * immediately. Everything here is best-effort/non-blocking: a missing
 * template or failed email never fails the registration itself.
 */
export async function issueAttendeeBadgeAndCertificate(registrationId: string): Promise<void> {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: { include: { tenant: true } } },
    });
    if (!registration) return;
    if (registration.event.tenant?.slug !== IFPC_TENANT_SLUG) return;

    const updateData: { registrationCode?: string; qrCode: string; badgeGenerated: boolean } = {
      qrCode: registration.qrCode || `ICMS:${registration.id}`,
      badgeGenerated: true,
    };
    const isNewBadge = !registration.badgeGenerated;
    if (!registration.registrationCode) {
      updateData.registrationCode = await generateRegistrationCode();
    }
    await prisma.registration.update({ where: { id: registrationId }, data: updateData });

    // Badge/registration-ID ready — email the printable badge link (independent
    // of certificate template availability, so this always goes out on confirm).
    if (isNewBadge) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const badgeUrl = `${baseUrl}/t/${IFPC_TENANT_SLUG}/registration/badge/${registrationId}`;
      sendEmail({
        to: registration.email,
        subject: `Your Registration ID & Badge — ${registration.event.title}`,
        html: badgeReadyHtml({
          name: registration.name,
          eventTitle: registration.event.title,
          registrationCode: updateData.registrationCode || registration.registrationCode || registrationId.slice(-8).toUpperCase(),
          badgeUrl,
        }),
        tenantId: registration.event.tenantId,
      }).catch((err) => console.error("[ifpc-automation] badge email failed:", err));
    }

    // Attendee e-certificate — only if a template has been configured for this event.
    const config = (registration.event.certificateConfig as Record<string, unknown> | null) ?? {};
    const templates = (config.templates as Record<string, CertificateTemplateConfig> | undefined) ?? {};
    const template = pickCertificateTemplate(templates, registration.category);
    if (!template) return; // organiser hasn't uploaded a certificate template yet — badge/ID still issued above

    const existingCert = await prisma.certificate.findFirst({
      where: { registrationId, certificateType: "ATTENDANCE", sessionId: null },
    });
    if (existingCert) return;

    const pdfBuffer = await generateCertificatePDF({ config: template, name: registration.name });

    await prisma.certificate.create({
      data: {
        certificateCode: randomUUID().replace(/-/g, "").toUpperCase().slice(0, 16),
        registrationId,
        eventId: registration.eventId,
        certificateType: "ATTENDANCE",
        recipientName: registration.name,
        recipientEmail: registration.email,
        title: "Certificate of Attendance",
        status: "ISSUED",
        issuedAt: new Date(),
      },
    });

    await sendEmail({
      to: registration.email,
      subject: `Your e-Certificate — ${registration.event.title}`,
      html: certificateIssuedHtml({ name: registration.name, eventTitle: registration.event.title }),
      tenantId: registration.event.tenantId,
      attachments: [{ filename: `Certificate-${registration.id.slice(-8)}.pdf`, content: pdfBuffer, contentType: "application/pdf" }],
    });

    // If this delegate's abstract was already accepted before they registered,
    // the presentation certificate couldn't be issued then — link it now.
    const pendingAccepted = await prisma.abstract.findMany({
      where: {
        eventId: registration.eventId,
        presentingAuthorEmail: registration.email,
        registrationId: null,
        status: { in: ["ACCEPTED_ORAL", "ACCEPTED_POSTER"] },
      },
      select: { id: true },
    });
    for (const a of pendingAccepted) {
      await issuePresentationCertificate(a.id);
    }
  } catch (err) {
    console.error("[ifpc-automation] issueAttendeeBadgeAndCertificate failed:", err);
  }
}

/**
 * Runs when an admin accepts an abstract (oral or poster). Issues a
 * SPEAKER_SESSION certificate to the presenting author's registration, if
 * one exists (matched by email at submission time or since). Not tenant-
 * gated — this is new functionality tied to the new Abstract feature.
 */
export async function issuePresentationCertificate(abstractId: string): Promise<void> {
  try {
    const abstract = await prisma.abstract.findUnique({
      where: { id: abstractId },
      include: { event: true },
    });
    if (!abstract) return;

    let registrationId = abstract.registrationId;
    if (!registrationId) {
      const match = await prisma.registration.findUnique({
        where: { email_eventId: { email: abstract.presentingAuthorEmail, eventId: abstract.eventId } },
        select: { id: true },
      });
      if (match) {
        registrationId = match.id;
        await prisma.abstract.update({ where: { id: abstractId }, data: { registrationId } });
      }
    }
    if (!registrationId) return; // presenter hasn't registered yet — issued once they do, via a re-check on registration confirm

    const existing = await prisma.certificate.findFirst({
      where: { registrationId, certificateType: "SPEAKER_SESSION", sessionId: null },
    });
    if (existing) return;

    const config = (abstract.event.certificateConfig as Record<string, unknown> | null) ?? {};
    const templates = (config.templates as Record<string, CertificateTemplateConfig> | undefined) ?? {};
    const template = pickCertificateTemplate(templates, "Speaker");
    if (!template) return; // no speaker template configured yet

    const pdfBuffer = await generateCertificatePDF({ config: template, name: abstract.presentingAuthorName });

    await prisma.certificate.create({
      data: {
        certificateCode: randomUUID().replace(/-/g, "").toUpperCase().slice(0, 16),
        registrationId,
        eventId: abstract.eventId,
        certificateType: "SPEAKER_SESSION",
        recipientName: abstract.presentingAuthorName,
        recipientEmail: abstract.presentingAuthorEmail,
        title: "Presentation Certificate",
        description: `for presenting "${abstract.title}" at ${abstract.event.title}`,
        status: "ISSUED",
        issuedAt: new Date(),
      },
    });

    await sendEmail({
      to: abstract.presentingAuthorEmail,
      subject: `Your Presentation Certificate — ${abstract.event.title}`,
      html: certificateIssuedHtml({ name: abstract.presentingAuthorName, eventTitle: abstract.event.title }),
      tenantId: abstract.event.tenantId,
      attachments: [{ filename: `Presentation-Certificate-${abstract.id.slice(-8)}.pdf`, content: pdfBuffer, contentType: "application/pdf" }],
    });
  } catch (err) {
    console.error("[ifpc-automation] issuePresentationCertificate failed:", err);
  }
}
