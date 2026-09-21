import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { isTenantOwner } from "@/lib/tenant-scope";
import {
  successResponse,
  Errors,
  withErrorHandler,
} from "@/lib/api-utils";
import { isIfpcEvent } from "@/lib/ifpc-tenant";
import * as legacy from "./legacy";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/events/[id]/access-control/stats - Get access control dashboard stats
const ifpcGET = withErrorHandler(
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
      select: { id: true, tenantId: true, timezone: true },
    });

    if (!event) {
      return Errors.notFound("Event");
    }

    if (!isTenantOwner(session, event.tenantId)) {
      return Errors.forbidden("You don't have access to this event");
    }

    // Today's start (midnight)
    // ponytail: server-local midnight (UTC on Render); use the event timezone if early-morning counts matter
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

      // Today's successful check-ins (not check-outs) for the hourly/peak breakdown
      prisma.scanLog.findMany({
        where: {
          eventId,
          scannedAt: { gte: todayStart },
          scanType: "CHECK_IN",
          result: "SUCCESS",
          OR: [{ direction: null }, { direction: { not: "OUT" } }],
        },
        select: {
          scannedAt: true,
        },
      }),

      // Recent 20 scan logs. "ALREADY_*" rows are repeat scans that no longer
      // get logged; older ones from before that change are left out so the
      // feed never shows the same person as several new entries.
      prisma.scanLog.findMany({
        where: {
          eventId,
          result: { notIn: ["ALREADY_CHECKED_IN", "ALREADY_CHECKED_OUT", "ALREADY_SERVED"] },
        },
        orderBy: { scannedAt: "desc" },
        take: 20,
        include: {
          registration: {
            select: { name: true, registrationCode: true, category: true, participantRole: true },
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
          hall: { select: { name: true } },
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
    // Bucket by the event's local hour, not the server's (Render runs in UTC)
    const hourFormat = (timeZone: string) => new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone });
    let hourFmt: Intl.DateTimeFormat;
    try { hourFmt = hourFormat(event.timezone || "UTC"); } catch { hourFmt = hourFormat("UTC"); } // free-text field; bad value -> UTC
    const hourCounts: Record<number, number> = {};
    for (const log of todayScanLogs) {
      const hour = Number(hourFmt.format(new Date(log.scannedAt)));
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
    let peakHourCount = 0;
    if (Object.keys(hourCounts).length > 0) {
      const peakH = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
      const h = parseInt(peakH[0]);
      const ampm = h >= 12 ? "PM" : "AM";
      const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
      peakHour = `${displayHour}:00 ${ampm}`;
      peakHourCount = peakH[1];
    }

    // Format recent scans
    const recentScans = recentScanLogs.map((log) => ({
      id: log.id,
      name: log.registration.name,
      registrationCode: log.registration.registrationCode,
      category: log.registration.category,
      participantRole: log.registration.participantRole,
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
      direction: ap.direction,
      hallName: ap.hall?.name ?? null,
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
      totalAccessPoints: accessPoints.length,
      peakHour,
      peakHourCount,
      hourlyCheckins,
      recentScans,
      accessPoints: formattedAccessPoints,
      foodZones: formattedFoodZones,
    });
  }
);

// IFPC (apollo-medical) uses the handlers above. Every other tenant keeps the
// original pre-IFPC handlers, unchanged, in ./legacy.ts.
export async function GET(request: NextRequest, context: RouteContext) {
  return (await isIfpcEvent((await context.params).id)) ? ifpcGET(request, context) : legacy.GET(request, context);
}
