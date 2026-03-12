import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  withErrorHandler,
} from "@/lib/api-utils";
import { Prisma } from "@prisma/client";

// GET /api/sponsors/public - List active sponsors (public access, no auth)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  const where: Prisma.SponsorWhereInput = {
    isActive: true,
  };

  const tenantId = searchParams.get("tenantId");
  if (tenantId) {
    where.tenantId = tenantId;
  }

  const sponsors = await prisma.sponsor.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      logo: true,
      website: true,
      eventSponsors: {
        where: { isPublished: true },
        select: {
          tier: true,
        },
        take: 1,
      },
    },
  });

  return successResponse(sponsors);
});
