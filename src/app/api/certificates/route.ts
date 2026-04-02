import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { createCertificateSchema, bulkCertificateSchema, roleBasedCertificateSchema } from "@/lib/validations/certificate";
import { generateCertificateCode } from "@/lib/auth-utils";
import {
  successResponse,
  paginatedResponse,
  Errors,
  withErrorHandler,
  parseBody,
  getPaginationParams,
  getSortParams,
} from "@/lib/api-utils";
import { Prisma } from "@prisma/client";
import { getEffectiveTenantId } from "@/lib/tenant-scope";
import { getCertConfigForRole } from "@/lib/config/event-defaults";

// Map participant role to certificate title and type
function getCertificateForRole(role: string | null | undefined, eventTitle: string): { title: string; certificateType: string } {
  switch (role) {
    case "SPEAKER":
      return { title: `Speaker Certificate - ${eventTitle}`, certificateType: "SPEAKER_SESSION" };
    case "ORGANIZER":
      return { title: `Certificate of Organization - ${eventTitle}`, certificateType: "ORGANIZATION" };
    case "VOLUNTEER":
      return { title: `Volunteer Certificate - ${eventTitle}`, certificateType: "VOLUNTEER" };
    case "CHAIRPERSON":
      return { title: `Chairperson Certificate - ${eventTitle}`, certificateType: "CHAIRPERSON" };
    case "JUDGE":
      return { title: `Certificate of Adjudication - ${eventTitle}`, certificateType: "JUDGE" };
    case "DELEGATE":
    default:
      return { title: `Certificate of Attendance - ${eventTitle}`, certificateType: "ATTENDANCE" };
  }
}

// Backward compat wrapper
function getCertificateTitleForRole(role: string | null | undefined, eventTitle: string): string {
  return getCertificateForRole(role, eventTitle).title;
}

// GET /api/certificates - List all certificates
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  if (!canAccess(session.user.role, "certificates")) {
    return Errors.forbidden("You don't have permission to view certificates");
  }

  const { searchParams } = new URL(request.url);

  // Role-based stats for certificate generation UI
  if (searchParams.get("stats") === "true" && searchParams.get("eventId")) {
    const eventId = searchParams.get("eventId")!;
    const [roleStats, certStats, quizzes] = await Promise.all([
      // Count attended registrations per role
      prisma.registration.groupBy({
        by: ["participantRole"],
        where: { eventId, status: "ATTENDED" },
        _count: true,
      }),
      // Count issued certificates per type
      prisma.certificate.groupBy({
        by: ["certificateType"],
        where: { eventId },
        _count: true,
      }),
      // Get quizzes with participant counts
      prisma.quiz.findMany({
        where: { eventId },
        select: {
          id: true, title: true, status: true,
          _count: { select: { participants: true, certificates: true } },
        },
      }),
    ]);

    // Fetch event to get dynamic role config
    const eventForStats = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, participantRoles: true },
    });

    const roles = roleStats.map(r => ({
      role: r.participantRole || "DELEGATE",
      attended: r._count,
      certsIssued: certStats.find(c => {
        const type = getCertConfigForRole(eventForStats, r.participantRole, "").certificateType;
        return c.certificateType === type;
      })?._count || 0,
    }));

    return successResponse({ roles, certStats, quizzes });
  }

  const { page, limit, skip } = getPaginationParams(searchParams);
  const { field: sortBy, order: sortOrder } = getSortParams(
    searchParams,
    ["createdAt", "issuedAt", "recipientName"],
    "createdAt"
  );

  // Build filters
  const where: Prisma.CertificateWhereInput = {};

  // Tenant scoping (via event's tenantId)
  const effectiveTenantId = getEffectiveTenantId(session, searchParams);
  if (effectiveTenantId) {
    where.event = { ...where.event as object, tenantId: effectiveTenantId };
  }

  const eventId = searchParams.get("eventId");
  if (eventId) {
    where.eventId = eventId;
  }

  const status = searchParams.get("status");
  if (status) {
    where.status = status as Prisma.EnumCertificateStatusFilter;
  }

  const search = searchParams.get("search");
  if (search && search.length > 200) {
    return Errors.badRequest("Search query too long");
  }
  if (search) {
    where.OR = [
      { recipientName: { contains: search, mode: "insensitive" } },
      { recipientEmail: { contains: search, mode: "insensitive" } },
      { certificateCode: { contains: search, mode: "insensitive" } },
    ];
  }

  const [certificates, total] = await Promise.all([
    prisma.certificate.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            type: true,
            startDate: true,
            endDate: true,
            location: true,
            city: true,
            organizer: true,
            cmeCredits: true,
            signatory1Name: true,
            signatory1Title: true,
            signatory2Name: true,
            signatory2Title: true,
          },
        },
        registration: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.certificate.count({ where }),
  ]);

  return paginatedResponse(certificates, { page, limit, total });
});

// POST /api/certificates - Create certificate(s)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  if (!canAccess(session.user.role, "certificates")) {
    return Errors.forbidden("You don't have permission to create certificates");
  }

  const body = await parseBody(request);

  if (!body) {
    return Errors.badRequest("Invalid request body");
  }

  // ── Role-based certificate generation (admin selects role + limit) ──
  if (body.participantRole && !body.registrationIds) {
    const parsed = roleBasedCertificateSchema.safeParse(body);
    if (!parsed.success) return Errors.validationError(parsed.error);

    const { eventId, participantRole, limit, title, description, cmeCredits } = parsed.data;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, cmeCredits: true, participantRoles: true },
    });
    if (!event) return Errors.notFound("Event");

    // Get ATTENDED registrations for this role, with existing certs
    const registrations = await prisma.registration.findMany({
      where: {
        eventId,
        status: "ATTENDED",
        participantRole: { equals: participantRole, mode: "insensitive" },
      },
      select: {
        id: true, name: true, email: true, participantRole: true,
        certificates: { select: { sessionId: true, certificateType: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    if (registrations.length === 0) {
      return Errors.badRequest(`No attended registrations found for role: ${participantRole}`);
    }

    // For speakers: get session assignments
    let speakerSessions: Record<string, { id: string; title: string }[]> = {};
    if (participantRole.toUpperCase() === "SPEAKER") {
      const speakerEmails = registrations.map(r => r.email.toLowerCase());
      const sessionSpeakers = await prisma.sessionSpeaker.findMany({
        where: {
          session: { eventId },
          speaker: { email: { in: speakerEmails, mode: "insensitive" } },
        },
        include: {
          session: { select: { id: true, title: true } },
          speaker: { select: { id: true, email: true } },
        },
      });
      for (const ss of sessionSpeakers) {
        const email = (ss.speaker.email || ss.speaker.id).toLowerCase();
        if (!speakerSessions[email]) speakerSessions[email] = [];
        speakerSessions[email].push({ id: ss.session.id, title: ss.session.title });
      }
    }

    const certsToCreate: Array<Record<string, unknown>> = [];
    let processedCount = 0;

    for (const reg of registrations) {
      // Respect admin-set limit (counts registrations processed, not certs)
      if (limit && processedCount >= limit) break;

      const existingTypes = new Set(
        reg.certificates.map(c => `${c.sessionId || "none"}_${c.certificateType}`)
      );

      if (participantRole.toUpperCase() === "SPEAKER") {
        const sessions = speakerSessions[reg.email.toLowerCase()] || [];
        if (sessions.length > 0) {
          for (const sess of sessions) {
            const key = `${sess.id}_SPEAKER_SESSION`;
            if (existingTypes.has(key)) continue;
            certsToCreate.push({
              certificateCode: generateCertificateCode(),
              registrationId: reg.id,
              eventId,
              sessionId: sess.id,
              certificateType: "SPEAKER_SESSION",
              recipientName: reg.name,
              recipientEmail: reg.email,
              title: title || `Speaker Certificate - ${sess.title}`,
              description,
              cmeCredits: cmeCredits ?? event.cmeCredits,
              status: "ISSUED",
              issuedAt: new Date(),
            });
          }
        } else {
          const key = `none_SPEAKER_SESSION`;
          if (!existingTypes.has(key)) {
            certsToCreate.push({
              certificateCode: generateCertificateCode(),
              registrationId: reg.id,
              eventId,
              certificateType: "SPEAKER_SESSION",
              recipientName: reg.name,
              recipientEmail: reg.email,
              title: title || `Speaker Certificate - ${event.title}`,
              description,
              cmeCredits: cmeCredits ?? event.cmeCredits,
              status: "ISSUED",
              issuedAt: new Date(),
            });
          }
        }
      } else {
        const certConfig = getCertConfigForRole(event, reg.participantRole, event.title);
        const key = `none_${certConfig.certificateType}`;
        if (!existingTypes.has(key)) {
          certsToCreate.push({
            certificateCode: generateCertificateCode(),
            registrationId: reg.id,
            eventId,
            certificateType: certConfig.certificateType,
            recipientName: reg.name,
            recipientEmail: reg.email,
            title: title || certConfig.title,
            description,
            cmeCredits: cmeCredits ?? event.cmeCredits,
            status: "ISSUED",
            issuedAt: new Date(),
          });
        }
      }
      processedCount++;
    }

    if (certsToCreate.length === 0) {
      return Errors.badRequest("All eligible registrations already have certificates for this role");
    }

    const created = await prisma.$transaction(async (tx) => {
      return tx.certificate.createMany({
        data: certsToCreate as never,
        skipDuplicates: true,
      });
    });

    return successResponse(
      {
        created: created.count,
        role: participantRole,
        limit: limit || "all",
        totalAttended: registrations.length,
      },
      `${created.count} certificates created for ${participantRole}`,
      201
    );
  }

  // ── Bulk create with specific registration IDs ──
  if (body.registrationIds && Array.isArray(body.registrationIds)) {
    const parsed = bulkCertificateSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const { registrationIds, eventId, title, description, cmeCredits } = parsed.data;

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, cmeCredits: true, participantRoles: true },
    });

    if (!event) {
      return Errors.notFound("Event");
    }

    // Get registrations with their existing certificates
    const registrations = await prisma.registration.findMany({
      where: {
        id: { in: registrationIds },
        eventId,
        status: "ATTENDED",
      },
      select: {
        id: true,
        name: true,
        email: true,
        participantRole: true,
        certificates: { select: { sessionId: true, certificateType: true } },
      },
    });

    if (registrations.length === 0) {
      return Errors.badRequest("No eligible registrations found");
    }

    // For speakers: get their session assignments to generate per-session certs
    const speakerEmails = registrations
      .filter(r => r.participantRole === "SPEAKER")
      .map(r => r.email.toLowerCase());

    let speakerSessions: Record<string, { id: string; title: string }[]> = {};
    if (speakerEmails.length > 0) {
      const sessionSpeakers = await prisma.sessionSpeaker.findMany({
        where: {
          session: { eventId },
          speaker: { email: { in: speakerEmails, mode: "insensitive" } },
        },
        include: {
          session: { select: { id: true, title: true } },
          speaker: { select: { id: true, email: true } },
        },
      });
      for (const ss of sessionSpeakers) {
        const email = (ss.speaker.email || ss.speaker.id).toLowerCase();
        if (!speakerSessions[email]) speakerSessions[email] = [];
        speakerSessions[email].push({ id: ss.session.id, title: ss.session.title });
      }
    }

    const certificatesData: Array<{
      certificateCode: string;
      registrationId: string;
      eventId: string;
      sessionId?: string | null;
      certificateType: string;
      recipientName: string;
      recipientEmail: string;
      title: string;
      description: string | undefined;
      cmeCredits: number | null | undefined;
      status: "ISSUED";
      issuedAt: Date;
    }> = [];

    for (const reg of registrations) {
      const existingTypes = new Set(
        reg.certificates.map(c => `${c.sessionId || "none"}_${c.certificateType}`)
      );

      if (reg.participantRole === "SPEAKER") {
        const sessions = speakerSessions[reg.email.toLowerCase()] || [];
        if (sessions.length > 0) {
          // One certificate per session
          for (const sess of sessions) {
            const key = `${sess.id}_SPEAKER_SESSION`;
            if (existingTypes.has(key)) continue; // Already has this cert
            certificatesData.push({
              certificateCode: generateCertificateCode(),
              registrationId: reg.id,
              eventId,
              sessionId: sess.id,
              certificateType: "SPEAKER_SESSION",
              recipientName: reg.name,
              recipientEmail: reg.email,
              title: title || `Speaker Certificate - ${sess.title}`,
              description,
              cmeCredits: cmeCredits ?? event.cmeCredits,
              status: "ISSUED",
              issuedAt: new Date(),
            });
          }
        } else {
          // Speaker with no sessions — give one general speaker cert
          const key = `none_SPEAKER_SESSION`;
          if (!existingTypes.has(key)) {
            certificatesData.push({
              certificateCode: generateCertificateCode(),
              registrationId: reg.id,
              eventId,
              sessionId: null,
              certificateType: "SPEAKER_SESSION",
              recipientName: reg.name,
              recipientEmail: reg.email,
              title: title || `Speaker Certificate - ${event.title}`,
              description,
              cmeCredits: cmeCredits ?? event.cmeCredits,
              status: "ISSUED",
              issuedAt: new Date(),
            });
          }
        }
      } else {
        // Non-speaker: one certificate per role
        const certConfig = getCertConfigForRole(event, reg.participantRole, event.title);
        const key = `none_${certConfig.certificateType}`;
        if (existingTypes.has(key)) continue;
        certificatesData.push({
          certificateCode: generateCertificateCode(),
          registrationId: reg.id,
          eventId,
          sessionId: null,
          certificateType: certConfig.certificateType,
          recipientName: reg.name,
          recipientEmail: reg.email,
          title: title || certConfig.title,
          description,
          cmeCredits: cmeCredits ?? event.cmeCredits,
          status: "ISSUED",
          issuedAt: new Date(),
        });
      }
    }

    if (certificatesData.length === 0) {
      return Errors.badRequest("All eligible registrations already have certificates");
    }

    const created = await prisma.$transaction(async (tx) => {
      return tx.certificate.createMany({
        data: certificatesData,
        skipDuplicates: true,
      });
    });

    return successResponse(
      { created: created.count },
      `${created.count} certificates created`,
      201
    );
  }

  // Single certificate creation
  const parsed = createCertificateSchema.safeParse(body);

  if (!parsed.success) {
    return Errors.validationError(parsed.error);
  }

  const data = parsed.data;

  // Check if registration exists
  const registration = await prisma.registration.findUnique({
    where: { id: data.registrationId },
    include: {
      certificates: true,
      event: {
        select: { title: true, cmeCredits: true, participantRoles: true },
      },
    },
  });

  if (!registration) {
    return Errors.notFound("Registration");
  }

  const certConfig = getCertConfigForRole(registration.event, registration.participantRole, registration.event.title);
  const certificateType = certConfig.certificateType;
  const roleTitle = certConfig.title;

  // Check for duplicate (same registration + same type + same session)
  const hasDuplicate = registration.certificates.some(
    c => c.certificateType === certificateType && !c.sessionId
  );
  if (hasDuplicate && registration.participantRole !== "SPEAKER") {
    return Errors.conflict("Certificate already exists for this registration");
  }

  const certificate = await prisma.certificate.create({
    data: {
      ...data,
      certificateCode: generateCertificateCode(),
      certificateType,
      title: data.title || roleTitle,
      cmeCredits: data.cmeCredits ?? registration.event.cmeCredits,
      status: data.status === "ISSUED" ? "ISSUED" : "PENDING",
      issuedAt: data.status === "ISSUED" ? new Date() : null,
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          type: true,
          startDate: true,
          endDate: true,
          location: true,
          city: true,
          organizer: true,
          cmeCredits: true,
          signatory1Name: true,
          signatory1Title: true,
          signatory2Name: true,
          signatory2Title: true,
        },
      },
      registration: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return successResponse(certificate, "Certificate created successfully", 201);
});
