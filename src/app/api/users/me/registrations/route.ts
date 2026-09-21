import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { successResponse, Errors, withErrorHandler } from "@/lib/api-utils";
import { isIfpcTenantId } from "@/lib/ifpc-tenant";

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
  const isIfpc = await isIfpcTenantId(session.user.tenantId);
  const mappedRegistrations = registrations.map((reg) => ({
    id: reg.id,
    name: reg.name,
    participantRole: reg.participantRole,
    status: reg.status,
    paymentStatus: reg.paymentStatus,
    amount: Number(reg.amount) || 0,
    currency: reg.currency,
    registeredAt: reg.createdAt,
    event: reg.event,
    certificates: reg.certificates,
    qrCode: reg.qrCode,
    badgeGenerated: reg.badgeGenerated,
    // ID-card fields — IFPC (apollo-medical) only.
    ...(isIfpc
      ? {
          photo: reg.photo,
          designation: reg.designation,
          organization: reg.organization,
          category: reg.category,
          registrationCode: reg.registrationCode,
        }
      : {}),
  }));

  return successResponse(mappedRegistrations);
});
