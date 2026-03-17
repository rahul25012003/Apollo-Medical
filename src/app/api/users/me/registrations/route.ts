import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { successResponse, Errors, withErrorHandler } from "@/lib/api-utils";

// GET /api/users/me/registrations - Get current user's registrations
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session) {
    return Errors.unauthorized();
  }

  // Find registrations by user email OR userId
  const registrations = await prisma.registration.findMany({
    where: {
      OR: [
        { email: session.user.email },
        { userId: session.user.id },
      ],
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          startTime: true,
          location: true,
          city: true,
        },
      },
      certificates: {
        select: {
          id: true,
          certificateCode: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Map to response format
  const mappedRegistrations = registrations.map((reg) => ({
    id: reg.id,
    status: reg.status,
    paymentStatus: reg.paymentStatus,
    registeredAt: reg.createdAt,
    event: reg.event,
    certificates: reg.certificates,
  }));

  return successResponse(mappedRegistrations);
});
