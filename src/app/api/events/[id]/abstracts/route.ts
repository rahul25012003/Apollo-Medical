import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { isTenantOwner } from "@/lib/tenant-scope";
import { successResponse, Errors, withErrorHandler } from "@/lib/api-utils";
import { AbstractStatus } from "@prisma/client";
import { isIfpcEvent } from "@/lib/ifpc-tenant";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/events/[id]/abstracts — admin: list all abstracts for review
export const GET = withErrorHandler(async (request: NextRequest, context?: RouteContext) => {
  // IFPC (apollo-medical) only — this route doesn't exist for other tenants.
  if (!(await isIfpcEvent((await context!.params).id))) return Errors.notFound("Page");
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (!canAccess(session.user.role, "events")) return Errors.forbidden("You don't have permission to view abstracts");

  const { id: eventId } = await context!.params;
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, tenantId: true } });
  if (!event) return Errors.notFound("Event");
  if (!isTenantOwner(session, event.tenantId)) return Errors.forbidden("You don't have access to this event");

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const status = statusParam && statusParam in AbstractStatus ? (statusParam as AbstractStatus) : undefined;

  const abstracts = await prisma.abstract.findMany({
    where: { eventId, ...(status ? { status } : {}) },
    orderBy: { submittedAt: "desc" },
  });

  return successResponse(abstracts);
});
