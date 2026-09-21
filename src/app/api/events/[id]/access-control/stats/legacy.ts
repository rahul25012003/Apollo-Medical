import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { isTenantOwner } from "@/lib/tenant-scope";
import {
  successResponse,
  Errors,
  withErrorHandler,
} from "@/lib/api-utils";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/events/[id]/access-control/stats - Get access control dashboard stats
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to view access control stats");
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

    // Today's start (midnight)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Run all queries in parallel
    const [
      totalRegistrations,
      totalCheckedIn,
      foodServedToday,
      activeAccessPointsCount,
      todayScanLogs,
      recentScanLogs,
      accessPoints,
      foodZones,
    ] = await Promise.all([
      // Total registrations for event
      prisma.registration.count({
        where: { eventId },
      }),

      // Total checked in
      prisma.registration.count({
        where: { eventId, attendanceStatus: "checked_in" },
      }),

      // Food served today
      prisma.foodLog.count({
        where: {
          eventId,
          servedAt: { gte: todayStart },
        },
      }),

      // Active access points count
      prisma.accessPoint.count({
        where: { eventId, isActive: true },
      }),

      // Today's scan logs for hourly breakdown
      prisma.scanLog.findMany({
        where: {
          eventId,
          scannedAt: { gte: todayStart },
        },
        select: {
          scannedAt: true,
        },
      }),

      // Recent 20 scan logs
      prisma.scanLog.findMany({
        where: { eventId },
        orderBy: { scannedAt: "desc" },
        take: 20,
        include: {
          registration: {
            select: { name: true },
          },
          accessPoint: {
            select: { name: true },
          },
        },
      }),

      // Access points with today's scan count
      prisma.accessPoint.findMany({
        where: { eventId },
        include: {
          _count: {
            select: {
              scanLogs: {
                where: {
                  scannedAt: { gte: todayStart },
                },
              },
            },
          },
        },
      }),

      // Food zones with served count
      prisma.foodZone.findMany({
        where: { eventId },
        include: {
          _count: {
            select: { foodLogs: true },
          },
        },
      }),
    ]);

    // Calculate checked in percent
    const checkedInPercent = totalRegistrations > 0
      ? Math.round((totalCheckedIn / totalRegistrations) * 100)
      : 0;

    // Calculate hourly checkins
    const hourCounts: Record<number, number> = {};
    for (const log of todayScanLogs) {
      const hour = new Date(log.scannedAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }

    const hourlyCheckins = [];
    for (let h = 0; h < 24; h++) {
      if (hourCounts[h]) {
        const ampm = h >= 12 ? "PM" : "AM";
        const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
        hourlyCheckins.push({
          hour: `${displayHour}${ampm}`,
          count: hourCounts[h],
        });
      }
    }

    // Find peak hour
    let peakHour = "N/A";
    if (Object.keys(hourCounts).length > 0) {
      const peakH = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
      const h = parseInt(peakH[0]);
      const ampm = h >= 12 ? "PM" : "AM";
      const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
      peakHour = `${displayHour}:00 ${ampm}`;
    }

    // Format recent scans
    const recentScans = recentScanLogs.map((log) => ({
      id: log.id,
      name: log.registration.name,
      result: log.result,
      scanType: log.scanType,
      accessPoint: log.accessPoint?.name || null,
      direction: log.direction,
      scannedAt: log.scannedAt,
    }));

    // Format access points
    const formattedAccessPoints = accessPoints.map((ap) => ({
      id: ap.id,
      name: ap.name,
      type: ap.type,
      isActive: ap.isActive,
      todayScans: ap._count.scanLogs,
    }));

    // Format food zones
    const formattedFoodZones = foodZones.map((fz) => ({
      id: fz.id,
      name: fz.name,
      served: fz._count.foodLogs,
      maxServings: fz.maxServings,
    }));

    return successResponse({
      totalRegistrations,
      totalCheckedIn,
      checkedInPercent,
      foodServedToday,
      activeAccessPoints: activeAccessPointsCount,
      peakHour,
      hourlyCheckins,
      recentScans,
      accessPoints: formattedAccessPoints,
      foodZones: formattedFoodZones,
    });
  }
);
