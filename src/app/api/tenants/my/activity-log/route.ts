import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Errors, withErrorHandler, getPaginationParams, paginatedResponse } from "@/lib/api-utils";
import { isIfpcTenantId } from "@/lib/ifpc-tenant";

// GET /api/tenants/my/activity-log — the signed-in admin's tenant audit trail.
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return Errors.forbidden("You don't have permission to view the activity log");
  }
  if (!(await isIfpcTenantId(session.user.tenantId))) return Errors.notFound("Page");

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);

  const [entries, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where: { tenantId: session.user.tenantId } }),
  ]);

  return paginatedResponse(entries, { page, limit, total });
});
