import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { getEffectiveTenantId, tenantWhereClause } from "@/lib/tenant-scope";
import {
  paginatedResponse,
  Errors,
  withErrorHandler,
  getPaginationParams,
} from "@/lib/api-utils";

// GET /api/communications/history — List message logs with pagination
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  if (!canAccess(session.user.role, "events")) {
    return Errors.forbidden("You don't have permission to view communication history");
  }

  const searchParams = request.nextUrl.searchParams;
  const { page, limit, skip } = getPaginationParams(searchParams);
  const tenantId = getEffectiveTenantId(session, searchParams);

  const eventId = searchParams.get("eventId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {
    ...tenantWhereClause(tenantId),
  };

  if (eventId) {
    where.eventId = eventId;
  }
  if (status) {
    where.status = status;
  }

  const [logs, total] = await Promise.all([
    prisma.messageLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        event: {
          select: { id: true, title: true },
        },
      },
    }),
    prisma.messageLog.count({ where }),
  ]);

  return paginatedResponse(logs, { page, limit, total });
});
