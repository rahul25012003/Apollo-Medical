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

  // ?prefix=interest. narrows the trail to delegate interest changes, which is
  // what the event's Change Log shows; ?eventId scopes it to one event.
  const prefix = searchParams.get("prefix");
  const eventId = searchParams.get("eventId");
  const where = {
    tenantId: session.user.tenantId,
    ...(prefix ? { action: { startsWith: prefix } } : {}),
    ...(eventId ? { metadata: { path: ["eventId"], equals: eventId } } : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return paginatedResponse(entries, { page, limit, total });
});
