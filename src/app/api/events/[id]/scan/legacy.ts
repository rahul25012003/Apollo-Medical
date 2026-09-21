import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { isTenantOwner } from "@/lib/tenant-scope";
import {
  successResponse,
  paginatedResponse,
  Errors,
  withErrorHandler,
  parseBody,
  getPaginationParams,
} from "@/lib/api-utils";
import { z } from "zod";
import { Prisma } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

const scanSchema = z.object({
  qrCode: z.string().min(1, "QR code is required"),
  scanType: z.enum(["CHECK_IN", "ZONE_ACCESS", "FOOD_DISTRIBUTION"]),
  zoneId: z.string().optional(),
  foodZoneId: z.string().optional(),
  accessPointId: z.string().optional(),
  direction: z.enum(["IN", "OUT"]).optional(),
});

// POST /api/events/[id]/scan - Process a QR scan
export const POST = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to scan");
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

    const parsed = scanSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const { qrCode, scanType, zoneId, foodZoneId, accessPointId, direction } = parsed.data;

    // Parse QR code - extract registrationId from "ICMS:{registrationId}" format
    const qrMatch = qrCode.match(/^ICMS:(.+)$/);

    if (!qrMatch) {
      // Invalid QR format - we can't create a scan log without a registrationId
      return successResponse(
        {
          result: "INVALID",
          registration: null,
          message: "Invalid QR code format",
          zone: null,
        },
        "Invalid QR code format"
      );
    }

    const registrationId = qrMatch[1];

    // Find the registration
    const registration = await prisma.registration.findFirst({
      where: { id: registrationId, eventId },
      select: {
        id: true,
        name: true,
        email: true,
        organization: true,
        designation: true,
        category: true,
        participantRole: true,
        attendanceStatus: true,
        checkedInAt: true,
        status: true,
      },
    });

    if (!registration) {
      // Create scan log for not found
      await prisma.scanLog.create({
        data: {
          eventId,
          registrationId,
          scanType: scanType,
          zoneId: zoneId || null,
          accessPointId: accessPointId || null,
          direction: direction || null,
          result: "NOT_FOUND",
          scannedBy: session.user.id,
        },
      }).catch(() => {
        // registrationId may not exist in DB, skip logging if foreign key fails
      });

      return successResponse(
        {
          result: "NOT_FOUND",
          registration: null,
          message: "Registration not found for this event",
          zone: null,
        },
        "Registration not found"
      );
    }

    const registrationInfo = {
      id: registration.id,
      name: registration.name,
      email: registration.email,
      organization: registration.organization,
      designation: registration.designation,
      category: registration.category,
      participantRole: registration.participantRole,
      checkedInAt: registration.checkedInAt,
    };

    // Handle CHECK_IN scan type
    if (scanType === "CHECK_IN") {
      if (registration.attendanceStatus === "checked_in") {
        // Already checked in
        await prisma.scanLog.create({
          data: {
            eventId,
            registrationId: registration.id,
            scanType: "CHECK_IN",
            accessPointId: accessPointId || null,
            direction: direction || null,
            result: "ALREADY_CHECKED_IN",
            scannedBy: session.user.id,
          },
        });

        return successResponse({
          result: "ALREADY_CHECKED_IN",
          registration: registrationInfo,
          message: `${registration.name} is already checked in`,
          zone: null,
        });
      }

      // Check in the attendee
      const now = new Date();
      await prisma.registration.update({
        where: { id: registration.id },
        data: {
          attendanceStatus: "checked_in",
          checkedInAt: now,
          status: "ATTENDED",
        },
      });

      await prisma.scanLog.create({
        data: {
          eventId,
          registrationId: registration.id,
          scanType: "CHECK_IN",
          accessPointId: accessPointId || null,
          direction: direction || null,
          result: "SUCCESS",
          scannedBy: session.user.id,
        },
      });

      return successResponse({
        result: "SUCCESS",
        registration: { ...registrationInfo, checkedInAt: now },
        message: `${registration.name} checked in successfully`,
        zone: null,
      });
    }

    // Handle ZONE_ACCESS scan type
    if (scanType === "ZONE_ACCESS") {
      if (!zoneId) {
        return Errors.badRequest("zoneId is required for ZONE_ACCESS scan type");
      }

      // Verify zone exists and belongs to this event
      const zone = await prisma.eventZone.findFirst({
        where: { id: zoneId, eventId },
        select: { id: true, name: true },
      });

      if (!zone) {
        return Errors.notFound("Zone");
      }

      // Look up access rule for this zone and registration category
      const accessRule = registration.category
        ? await prisma.zoneAccessRule.findUnique({
            where: {
              zoneId_category: {
                zoneId: zone.id,
                category: registration.category,
              },
            },
          })
        : null;

      const allowed = accessRule ? accessRule.allowed : false;
      const result = allowed ? "SUCCESS" : "DENIED";

      await prisma.scanLog.create({
        data: {
          eventId,
          registrationId: registration.id,
          scanType: "ZONE_ACCESS",
          zoneId: zone.id,
          accessPointId: accessPointId || null,
          direction: direction || null,
          result,
          scannedBy: session.user.id,
        },
      });

      return successResponse({
        result,
        registration: registrationInfo,
        message: allowed
          ? `${registration.name} granted access to ${zone.name}`
          : `${registration.name} denied access to ${zone.name}`,
        zone: { id: zone.id, name: zone.name },
      });
    }

    // Handle FOOD_DISTRIBUTION scan type
    if (scanType === "FOOD_DISTRIBUTION") {
      if (!foodZoneId) {
        return Errors.badRequest("foodZoneId is required for FOOD_DISTRIBUTION scan type");
      }

      // Verify food zone exists and belongs to this event
      const foodZone = await prisma.foodZone.findFirst({
        where: { id: foodZoneId, eventId },
        select: { id: true, name: true, maxServings: true, isActive: true },
      });

      if (!foodZone) {
        return Errors.notFound("Food zone");
      }

      if (!foodZone.isActive) {
        return successResponse({
          result: "DENIED",
          registration: registrationInfo,
          message: `Food zone "${foodZone.name}" is currently inactive`,
          zone: null,
        });
      }

      // Check if registration is CONFIRMED or ATTENDED
      if (!["CONFIRMED", "ATTENDED"].includes(registration.status)) {
        return successResponse({
          result: "DENIED",
          registration: registrationInfo,
          message: `${registration.name} registration status is ${registration.status}. Must be CONFIRMED or ATTENDED.`,
          zone: null,
        });
      }

      // Check if already served in this food zone
      const existingFoodLog = await prisma.foodLog.findUnique({
        where: {
          foodZoneId_registrationId: {
            foodZoneId: foodZone.id,
            registrationId: registration.id,
          },
        },
      });

      if (existingFoodLog) {
        await prisma.scanLog.create({
          data: {
            eventId,
            registrationId: registration.id,
            scanType: "FOOD_DISTRIBUTION",
            accessPointId: accessPointId || null,
            direction: direction || null,
            result: "ALREADY_SERVED",
            scannedBy: session.user.id,
          },
        });

        return successResponse({
          result: "ALREADY_SERVED",
          registration: registrationInfo,
          message: `${registration.name} has already been served in ${foodZone.name}`,
          zone: null,
        });
      }

      // Check if max servings reached
      if (foodZone.maxServings) {
        const servedCount = await prisma.foodLog.count({
          where: { foodZoneId: foodZone.id },
        });

        if (servedCount >= foodZone.maxServings) {
          await prisma.scanLog.create({
            data: {
              eventId,
              registrationId: registration.id,
              scanType: "FOOD_DISTRIBUTION",
              accessPointId: accessPointId || null,
              direction: direction || null,
              result: "ZONE_FULL",
              scannedBy: session.user.id,
            },
          });

          return successResponse({
            result: "ZONE_FULL",
            registration: registrationInfo,
            message: `${foodZone.name} has reached maximum servings (${foodZone.maxServings})`,
            zone: null,
          });
        }
      }

      // Create food log entry and scan log
      await prisma.foodLog.create({
        data: {
          eventId,
          foodZoneId: foodZone.id,
          registrationId: registration.id,
          scannedBy: session.user.id,
        },
      });

      await prisma.scanLog.create({
        data: {
          eventId,
          registrationId: registration.id,
          scanType: "FOOD_DISTRIBUTION",
          accessPointId: accessPointId || null,
          direction: direction || null,
          result: "SUCCESS",
          scannedBy: session.user.id,
        },
      });

      return successResponse({
        result: "SUCCESS",
        registration: registrationInfo,
        message: `${registration.name} served at ${foodZone.name}`,
        zone: null,
      });
    }

    return Errors.badRequest("Invalid scan type");
  }
);

// GET /api/events/[id]/scan - Get scan logs
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to view scan logs");
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
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where: Prisma.ScanLogWhereInput = { eventId };

    const scanType = searchParams.get("scanType");
    if (scanType) {
      where.scanType = scanType as Prisma.EnumScanTypeFilter;
    }

    const result = searchParams.get("result");
    if (result) {
      where.result = result as Prisma.EnumScanResultFilter;
    }

    const [scanLogs, total] = await Promise.all([
      prisma.scanLog.findMany({
        where,
        orderBy: { scannedAt: "desc" },
        skip,
        take: limit,
        include: {
          registration: {
            select: {
              name: true,
              email: true,
              category: true,
            },
          },
          zone: {
            select: {
              name: true,
            },
          },
          accessPoint: {
            select: {
              name: true,
              type: true,
            },
          },
        },
      }),
      prisma.scanLog.count({ where }),
    ]);

    return paginatedResponse(scanLogs, { page, limit, total });
  }
);
