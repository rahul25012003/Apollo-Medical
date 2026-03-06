import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { successResponse, Errors, withErrorHandler } from "@/lib/api-utils";

// GET /api/users/me/certificates - Get current user's certificates
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session) {
    return Errors.unauthorized();
  }

  // Find certificates by user email through registration
  const certificates = await prisma.certificate.findMany({
    where: {
      registration: {
        email: session.user.email,
      },
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
        },
      },
      registration: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      issuedAt: "desc",
    },
  });

  // Map to response format
  const mappedCertificates = certificates.map((cert) => ({
    id: cert.id,
    certificateCode: cert.certificateCode,
    issuedAt: cert.issuedAt,
    cmeCredits: cert.cmeCredits,
    status: cert.status,
    event: cert.event,
    registration: cert.registration,
  }));

  return successResponse(mappedCertificates);
});
