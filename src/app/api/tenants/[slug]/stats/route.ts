import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  Errors,
  withErrorHandler,
} from "@/lib/api-utils";

type RouteContext = { params: Promise<{ slug: string }> };

// GET /api/tenants/[slug]/stats - Public tenant stats for frontpage
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const { slug } = await context!.params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant || !tenant.isActive) {
      return Errors.notFound("Tenant");
    }

    const [eventCount, registrationCount, speakerCount] = await Promise.all([
      prisma.event.count({
        where: { tenantId: tenant.id, isPublished: true },
      }),
      prisma.registration.count({
        where: { event: { tenantId: tenant.id } },
      }),
      prisma.speaker.count({
        where: { tenantId: tenant.id, isActive: true },
      }),
    ]);

    return successResponse({
      events: eventCount,
      registrations: registrationCount,
      speakers: speakerCount,
    });
  }
);
