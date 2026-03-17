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

  // Find certificates by user email OR userId through registration
  const certificates = await prisma.certificate.findMany({
    where: {
      registration: {
        OR: [
          { email: session.user.email },
          { userId: session.user.id },
        ],
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
          participantRole: true,
        },
      },
      session: {
        select: {
          id: true,
          title: true,
          sessionDate: true,
        },
      },
      quiz: {
        select: {
          id: true,
          title: true,
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
    title: cert.title,
    certificateType: cert.certificateType,
    position: cert.position,
    issuedAt: cert.issuedAt,
    cmeCredits: cert.cmeCredits,
    status: cert.status,
    event: cert.event,
    registration: cert.registration,
    session: cert.session,
    quiz: cert.quiz,
  }));

  return successResponse(mappedCertificates);
});
