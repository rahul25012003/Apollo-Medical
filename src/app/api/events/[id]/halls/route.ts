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

const hallSchema = z.object({
  name: z.string().min(1, "Hall name is required"),
  displayOrder: z.number().int().nonnegative().default(0),
});

// GET /api/events/[id]/halls - Get event halls (requires auth)
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to view halls");
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

    const halls = await prisma.eventHall.findMany({
      where: { eventId },
      orderBy: { displayOrder: "asc" },
    });

    return successResponse(halls);
  }
);

// POST /api/events/[id]/halls - Create hall
export const POST = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage halls");
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

    const parsed = hallSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const hall = await prisma.eventHall.create({
      data: {
        eventId,
        name: parsed.data.name,
        displayOrder: parsed.data.displayOrder,
      },
    });

    return successResponse(hall, "Hall created", 201);
  }
);

// PUT /api/events/[id]/halls - Bulk update halls (replace all)
export const PUT = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage halls");
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

    if (!body || !Array.isArray(body.halls)) {
      return Errors.badRequest("halls array is required");
    }

    const hallsData = z.array(z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      displayOrder: z.number().int().nonnegative().default(0),
    })).safeParse(body.halls);

    if (!hallsData.success) {
      return Errors.validationError(hallsData.error);
    }

    // Upsert halls in a transaction
    const halls = await prisma.$transaction(async (tx) => {
      // Get existing hall IDs
      const existingHalls = await tx.eventHall.findMany({
        where: { eventId },
        select: { id: true },
      });
      const existingIds = existingHalls.map(h => h.id);

      // Determine which to keep, create, and delete
      const incomingIds = hallsData.data.filter(h => h.id).map(h => h.id!);
      const toDelete = existingIds.filter(id => !incomingIds.includes(id));

      // Delete removed halls (sessions will have hallId set to null via SetNull)
      if (toDelete.length > 0) {
        await tx.eventHall.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      // Upsert each hall (verify IDs belong to this event)
      const results = [];
      for (const hall of hallsData.data) {
        if (hall.id && existingIds.includes(hall.id)) {
          // Update existing — only if it belongs to this event
          const updated = await tx.eventHall.update({
            where: { id: hall.id, eventId },
            data: { name: hall.name, displayOrder: hall.displayOrder },
          });
          results.push(updated);
        } else {
          // Create new
          const created = await tx.eventHall.create({
            data: {
              eventId,
              name: hall.name,
              displayOrder: hall.displayOrder,
            },
          });
          results.push(created);
        }
      }

      return results;
    });

    return successResponse(halls, "Halls updated");
  }
);

// DELETE /api/events/[id]/halls - Delete a hall
export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage halls");
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
    const hallId = searchParams.get("hallId");

    if (!hallId) {
      return Errors.badRequest("Hall ID is required");
    }

    const existing = await prisma.eventHall.findFirst({
      where: { id: hallId, eventId },
    });

    if (!existing) {
      return Errors.notFound("Hall");
    }

    await prisma.eventHall.delete({
      where: { id: hallId },
    });

    return successResponse({ id: hallId }, "Hall deleted");
  }
);
