import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import {
  successResponse,
  Errors,
  withErrorHandler,
} from "@/lib/api-utils";
import { randomBytes } from "crypto";

type RouteContext = { params: Promise<{ id: string }> };

// Generate unique certificate code
function generateCertificateCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(4).toString("hex").toUpperCase();
  return `CERT-${timestamp}-${random}`;
}

// POST /api/certificates/[id]/regenerate - Regenerate certificate (delete and create new)
export const POST = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "certificates")) {
      return Errors.forbidden("You don't have permission to regenerate certificates");
    }

    const { id } = await context!.params;

    // Find existing certificate with registration and event data
    const existingCertificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        registration: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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

    if (!existingCertificate) {
      return Errors.notFound("Certificate");
    }

    // Use a transaction to delete old and create new certificate atomically
    const newCertificate = await prisma.$transaction(async (tx) => {
      // Delete the existing certificate
      await tx.certificate.delete({
        where: { id },
      });

      // Create new certificate with same data
      const created = await tx.certificate.create({
        data: {
          certificateCode: generateCertificateCode(),
          registrationId: existingCertificate.registrationId,
          eventId: existingCertificate.eventId,
          recipientName: existingCertificate.recipientName,
          recipientEmail: existingCertificate.recipientEmail,
          title: existingCertificate.title,
          description: existingCertificate.description,
          cmeCredits: existingCertificate.cmeCredits,
          status: "ISSUED",
          issuedAt: new Date(),
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

      return created;
    });

    return successResponse(newCertificate, "Certificate regenerated successfully");
  }
);
