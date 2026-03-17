import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { isTenantOwner } from "@/lib/tenant-scope";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const accessPointSchema = z.object({
  name: z.string().min(1, "Access point name is required"),
  type: z.enum(["ACCESS", "FOOD"]).default("ACCESS"),
  hallId: z.string().nullable().optional(),
  direction: z.enum(["IN", "OUT", "BOTH"]).default("BOTH"),
  isActive: z.boolean().default(true),
});

const updateAccessPointSchema = accessPointSchema.extend({
  accessPointId: z.string().min(1, "Access point ID is required"),
});

// GET /api/events/[id]/access-points - List all access points for event
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to view access points");
    }

    const { id: eventId } = await context!.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, tenantId: true },
    });

    if (!event) {
      return Errors.notFound("Event");
    }

    if (!isTenantOwner(session, event.tenantId)) {
      return Errors.forbidden("You don't have access to this event");
    }

    const accessPoints = await prisma.accessPoint.findMany({
      where: { eventId },
      include: {
        hall: { select: { name: true } },
        _count: { select: { scanLogs: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return successResponse(accessPoints);
  }
);

// POST /api/events/[id]/access-points - Create access point
export const POST = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage access points");
    }

    const { id: eventId } = await context!.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, tenantId: true },
    });

    if (!event) {
      return Errors.notFound("Event");
    }

    if (!isTenantOwner(session, event.tenantId)) {
      return Errors.forbidden("You don't have access to this event");
    }

    const body = await parseBody(request);

    if (!body) {
      return Errors.badRequest("Invalid request body");
    }

    const parsed = accessPointSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const accessPoint = await prisma.accessPoint.create({
      data: {
        eventId,
        name: parsed.data.name,
        type: parsed.data.type,
        hallId: parsed.data.hallId || null,
        direction: parsed.data.direction,
        isActive: parsed.data.isActive,
      },
      include: {
        hall: { select: { name: true } },
        _count: { select: { scanLogs: true } },
      },
    });

    return successResponse(accessPoint, "Access point created", 201);
  }
);

// PUT /api/events/[id]/access-points - Update access point
export const PUT = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage access points");
    }

    const { id: eventId } = await context!.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, tenantId: true },
    });

    if (!event) {
      return Errors.notFound("Event");
    }

    if (!isTenantOwner(session, event.tenantId)) {
      return Errors.forbidden("You don't have access to this event");
    }

    const body = await parseBody(request);

    if (!body) {
      return Errors.badRequest("Invalid request body");
    }

    const parsed = updateAccessPointSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const existing = await prisma.accessPoint.findFirst({
      where: { id: parsed.data.accessPointId, eventId },
    });

    if (!existing) {
      return Errors.notFound("Access point");
    }

    const accessPoint = await prisma.accessPoint.update({
      where: { id: parsed.data.accessPointId },
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        hallId: parsed.data.hallId || null,
        direction: parsed.data.direction,
        isActive: parsed.data.isActive,
      },
      include: {
        hall: { select: { name: true } },
        _count: { select: { scanLogs: true } },
      },
    });

    return successResponse(accessPoint, "Access point updated");
  }
);

// DELETE /api/events/[id]/access-points - Delete access point
export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage access points");
    }

    const { id: eventId } = await context!.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, tenantId: true },
    });

    if (!event) {
      return Errors.notFound("Event");
    }

    if (!isTenantOwner(session, event.tenantId)) {
      return Errors.forbidden("You don't have access to this event");
    }

    const { searchParams } = new URL(request.url);
    const accessPointId = searchParams.get("accessPointId");

    if (!accessPointId) {
      return Errors.badRequest("Access point ID is required");
    }

    const existing = await prisma.accessPoint.findFirst({
      where: { id: accessPointId, eventId },
    });

    if (!existing) {
      return Errors.notFound("Access point");
    }

    await prisma.accessPoint.delete({
      where: { id: accessPointId },
    });

    return successResponse({ id: accessPointId }, "Access point deleted");
  }
);
