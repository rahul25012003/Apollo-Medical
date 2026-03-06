import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  Errors,
  withErrorHandler,
} from "@/lib/api-utils";

type RouteContext = { params: Promise<{ code: string }> };

// GET /api/certificates/verify/[code] - Public certificate verification
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const { code } = await context!.params;

    const certificate = await prisma.certificate.findUnique({
      where: { certificateCode: code },
      select: {
        id: true,
        certificateCode: true,
        recipientName: true,
        title: true,
        description: true,
        cmeCredits: true,
        status: true,
        issuedAt: true,
        revokedAt: true,
        revokedReason: true,
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
          },
        },
      },
    });

    if (!certificate) {
      return Errors.notFound("Certificate");
    }

    // Check if certificate is valid
    const isValid = certificate.status === "ISSUED";

    return successResponse({
      valid: isValid,
      certificate: {
        certificateCode: certificate.certificateCode,
        recipientName: certificate.recipientName,
        title: certificate.title,
        description: certificate.description,
        cmeCredits: certificate.cmeCredits,
        status: certificate.status,
        issuedAt: certificate.issuedAt,
        revokedAt: certificate.revokedAt,
        revokedReason: certificate.revokedReason,
        event: {
          title: certificate.event.title,
          type: certificate.event.type,
          startDate: certificate.event.startDate,
          endDate: certificate.event.endDate,
          location: certificate.event.location,
          city: certificate.event.city,
          organizer: certificate.event.organizer,
        },
      },
    });
  }
);
