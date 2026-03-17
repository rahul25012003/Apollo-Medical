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

const zoneSchema = z.object({
  name: z.string().min(1, "Zone name is required"),
  description: z.string().optional(),
  displayOrder: z.number().int().nonnegative().default(0),
});

const bulkZoneSchema = z.object({
  zones: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      description: z.string().optional(),
      displayOrder: z.number().int().nonnegative().default(0),
      rules: z
        .array(
          z.object({
            category: z.string().min(1),
            allowed: z.boolean(),
          })
        )
        .optional(),
    })
  ),
});

// GET /api/events/[id]/zones - List zones with access rules
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
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

    const zones = await prisma.eventZone.findMany({
      where: { eventId },
      include: { accessRules: true },
      orderBy: { displayOrder: "asc" },
    });

    return successResponse(zones);
  }
);

// POST /api/events/[id]/zones - Create zone
export const POST = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage zones");
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

    const parsed = zoneSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const zone = await prisma.eventZone.create({
      data: {
        eventId,
        name: parsed.data.name,
        description: parsed.data.description,
        displayOrder: parsed.data.displayOrder,
      },
    });

    return successResponse(zone, "Zone created", 201);
  }
);

// PUT /api/events/[id]/zones - Bulk update zones and access rules
export const PUT = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage zones");
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

    const parsed = bulkZoneSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const zones = await prisma.$transaction(async (tx) => {
      // Get existing zone IDs
      const existingZones = await tx.eventZone.findMany({
        where: { eventId },
        select: { id: true },
      });
      const existingIds = existingZones.map((z) => z.id);

      // Determine which to keep, create, and delete
      const incomingIds = parsed.data.zones
        .filter((z) => z.id)
        .map((z) => z.id!);
      const toDelete = existingIds.filter((id) => !incomingIds.includes(id));

      // Delete removed zones
      if (toDelete.length > 0) {
        await tx.eventZone.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      // Upsert each zone
      const results = [];
      for (const zone of parsed.data.zones) {
        let savedZone;

        if (zone.id && existingIds.includes(zone.id)) {
          // Update existing zone
          savedZone = await tx.eventZone.update({
            where: { id: zone.id, eventId },
            data: {
              name: zone.name,
              description: zone.description,
              displayOrder: zone.displayOrder,
            },
          });
        } else {
          // Create new zone
          savedZone = await tx.eventZone.create({
            data: {
              eventId,
              name: zone.name,
              description: zone.description,
              displayOrder: zone.displayOrder,
            },
          });
        }

        // Handle access rules if provided
        if (zone.rules) {
          // Delete existing rules for this zone
          await tx.zoneAccessRule.deleteMany({
            where: { zoneId: savedZone.id },
          });

          // Create new rules
          for (const rule of zone.rules) {
            await tx.zoneAccessRule.create({
              data: {
                zoneId: savedZone.id,
                category: rule.category,
                allowed: rule.allowed,
              },
            });
          }
        }

        // Fetch zone with access rules
        const zoneWithRules = await tx.eventZone.findUnique({
          where: { id: savedZone.id },
          include: { accessRules: true },
        });

        results.push(zoneWithRules);
      }

      return results;
    });

    return successResponse(zones, "Zones updated");
  }
);

// DELETE /api/events/[id]/zones - Delete a zone
export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage zones");
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
    const zoneId = searchParams.get("zoneId");

    if (!zoneId) {
      return Errors.badRequest("Zone ID is required");
    }

    const existing = await prisma.eventZone.findFirst({
      where: { id: zoneId, eventId },
    });

    if (!existing) {
      return Errors.notFound("Zone");
    }

    await prisma.eventZone.delete({
      where: { id: zoneId },
    });

    return successResponse({ id: zoneId }, "Zone deleted");
  }
);
