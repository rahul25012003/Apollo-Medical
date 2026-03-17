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

const foodZoneSchema = z.object({
  name: z.string().min(1, "Food zone name is required"),
  maxServings: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().default(true),
});

const updateFoodZoneSchema = foodZoneSchema.extend({
  foodZoneId: z.string().min(1, "Food zone ID is required"),
});

// GET /api/events/[id]/food-zones - List food zones with served count
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to view food zones");
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

    const foodZones = await prisma.foodZone.findMany({
      where: { eventId },
      include: {
        _count: { select: { foodLogs: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return successResponse(foodZones);
  }
);

// POST /api/events/[id]/food-zones - Create food zone
export const POST = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage food zones");
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

    const parsed = foodZoneSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const foodZone = await prisma.foodZone.create({
      data: {
        eventId,
        name: parsed.data.name,
        maxServings: parsed.data.maxServings || null,
        isActive: parsed.data.isActive,
      },
      include: {
        _count: { select: { foodLogs: true } },
      },
    });

    return successResponse(foodZone, "Food zone created", 201);
  }
);

// PUT /api/events/[id]/food-zones - Update food zone
export const PUT = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage food zones");
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

    const parsed = updateFoodZoneSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const existing = await prisma.foodZone.findFirst({
      where: { id: parsed.data.foodZoneId, eventId },
    });

    if (!existing) {
      return Errors.notFound("Food zone");
    }

    const foodZone = await prisma.foodZone.update({
      where: { id: parsed.data.foodZoneId },
      data: {
        name: parsed.data.name,
        maxServings: parsed.data.maxServings || null,
        isActive: parsed.data.isActive,
      },
      include: {
        _count: { select: { foodLogs: true } },
      },
    });

    return successResponse(foodZone, "Food zone updated");
  }
);

// DELETE /api/events/[id]/food-zones - Delete food zone
export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage food zones");
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
    const foodZoneId = searchParams.get("foodZoneId");

    if (!foodZoneId) {
      return Errors.badRequest("Food zone ID is required");
    }

    const existing = await prisma.foodZone.findFirst({
      where: { id: foodZoneId, eventId },
    });

    if (!existing) {
      return Errors.notFound("Food zone");
    }

    await prisma.foodZone.delete({
      where: { id: foodZoneId },
    });

    return successResponse({ id: foodZoneId }, "Food zone deleted");
  }
);
