import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { updateCertificateSchema } from "@/lib/validations/certificate";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/certificates/[id] - Get single certificate
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    const { id } = await context!.params;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!certificate) {
      return Errors.notFound("Certificate");
    }

    // Check access - own certificate or manager role
    const isOwner =
      certificate.registration.userId === session.user.id ||
      certificate.recipientEmail === session.user.email;

    if (!isOwner && !canAccess(session.user.role, "certificates")) {
      return Errors.forbidden("You don't have permission to view this certificate");
    }

    // Track download
    await prisma.certificate.update({
      where: { id },
      data: {
        downloadCount: { increment: 1 },
        lastDownloadedAt: new Date(),
      },
    });

    return successResponse(certificate);
  }
);

// PUT /api/certificates/[id] - Update certificate
export const PUT = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "certificates")) {
      return Errors.forbidden("You don't have permission to update certificates");
    }

    const { id } = await context!.params;

    // Check if certificate exists
    const existingCertificate = await prisma.certificate.findUnique({
      where: { id },
    });

    if (!existingCertificate) {
      return Errors.notFound("Certificate");
    }

    const body = await parseBody(request);

    if (!body) {
      return Errors.badRequest("Invalid request body");
    }

    const parsed = updateCertificateSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = { ...data };

    // Handle status changes
    if (data.status === "ISSUED" && existingCertificate.status !== "ISSUED") {
      updateData.issuedAt = new Date();
    }

    if (data.status === "REVOKED" && existingCertificate.status !== "REVOKED") {
      updateData.revokedAt = new Date();
      if (!data.revokedReason) {
        return Errors.badRequest("Revoked reason is required when revoking a certificate");
      }
    }

    const certificate = await prisma.certificate.update({
      where: { id },
      data: updateData,
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
      },
    });

    return successResponse(certificate, "Certificate updated successfully");
  }
);

// DELETE /api/certificates/[id] - Delete certificate
export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "certificates")) {
      return Errors.forbidden("You don't have permission to delete certificates");
    }

    const { id } = await context!.params;

    // Check if certificate exists
    const existingCertificate = await prisma.certificate.findUnique({
      where: { id },
    });

    if (!existingCertificate) {
      return Errors.notFound("Certificate");
    }

    await prisma.certificate.delete({
      where: { id },
    });

    return successResponse({ id }, "Certificate deleted successfully");
  }
);
