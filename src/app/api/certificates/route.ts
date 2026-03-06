import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { createCertificateSchema, bulkCertificateSchema } from "@/lib/validations/certificate";
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

  // Check if it's a bulk create request
  if (body.registrationIds && Array.isArray(body.registrationIds)) {
    const parsed = bulkCertificateSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const { registrationIds, eventId, title, description, cmeCredits } = parsed.data;

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, cmeCredits: true },
    });

    if (!event) {
      return Errors.notFound("Event");
    }

    // Get registrations
    const registrations = await prisma.registration.findMany({
      where: {
        id: { in: registrationIds },
        eventId,
        status: "ATTENDED",
        certificate: null, // No certificate yet
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (registrations.length === 0) {
      return Errors.badRequest("No eligible registrations found");
    }

    // Create certificates in bulk
    const certificatesData = registrations.map((reg) => ({
      certificateCode: generateCertificateCode(),
      registrationId: reg.id,
      eventId,
      recipientName: reg.name,
      recipientEmail: reg.email,
      title: title || `Certificate of Attendance - ${event.title}`,
      description,
      cmeCredits: cmeCredits ?? event.cmeCredits,
      status: "ISSUED" as const,
      issuedAt: new Date(),
    }));

    const created = await prisma.certificate.createMany({
      data: certificatesData,
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
      certificate: true,
      event: {
        select: { title: true, cmeCredits: true },
      },
    },
  });

  if (!registration) {
    return Errors.notFound("Registration");
  }

  if (registration.certificate) {
    return Errors.conflict("Certificate already exists for this registration");
  }

  const certificate = await prisma.certificate.create({
    data: {
      ...data,
      certificateCode: generateCertificateCode(),
      title: data.title || `Certificate of Attendance - ${registration.event.title}`,
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
