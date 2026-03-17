import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { getEffectiveTenantId, tenantWhereClause } from "@/lib/tenant-scope";
import {
  successResponse,
  Errors,
  withErrorHandler,
} from "@/lib/api-utils";

// GET /api/reports?type=registrations|revenue|attendance|certificates
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  if (!canAccess(session.user.role, "events")) {
    return Errors.forbidden("You don't have permission to view reports");
  }

  const searchParams = request.nextUrl.searchParams;
  const reportType = searchParams.get("type");
  const tenantId = getEffectiveTenantId(session, searchParams);
  const eventId = searchParams.get("eventId");

  if (!reportType) {
    return Errors.badRequest("type parameter is required (registrations, revenue, attendance, certificates)");
  }

  const tenantFilter = tenantWhereClause(tenantId);

  switch (reportType) {
    case "registrations": {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const baseWhere: Record<string, unknown> = {};
      if (tenantId) {
        baseWhere.event = { tenantId };
      }
      if (eventId) {
        baseWhere.eventId = eventId;
      }

      // Get all registrations for aggregation
      const registrations = await prisma.registration.findMany({
        where: baseWhere,
        select: {
          id: true,
          status: true,
          participantRole: true,
          category: true,
          createdAt: true,
        },
      });

      // Group by date (last 30 days)
      const byDate: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        byDate[d.toISOString().slice(0, 10)] = 0;
      }
      for (const reg of registrations) {
        const dateKey = reg.createdAt.toISOString().slice(0, 10);
        if (byDate[dateKey] !== undefined) {
          byDate[dateKey]++;
        }
      }
      const dailyRegistrations = Object.entries(byDate).map(([date, count]) => ({ date, count }));

      // Group by status
      const byStatus: Record<string, number> = {};
      for (const reg of registrations) {
        byStatus[reg.status] = (byStatus[reg.status] || 0) + 1;
      }
      const statusBreakdown = Object.entries(byStatus).map(([status, count]) => ({ status, count }));

      // Group by role
      const byRole: Record<string, number> = {};
      for (const reg of registrations) {
        const role = reg.participantRole || "UNSPECIFIED";
        byRole[role] = (byRole[role] || 0) + 1;
      }
      const roleBreakdown = Object.entries(byRole).map(([role, count]) => ({ role, count }));

      // Group by category
      const byCategory: Record<string, number> = {};
      for (const reg of registrations) {
        const cat = reg.category || "Uncategorized";
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      }
      const categoryBreakdown = Object.entries(byCategory).map(([category, count]) => ({ category, count }));

      return successResponse({
        total: registrations.length,
        dailyRegistrations,
        statusBreakdown,
        roleBreakdown,
        categoryBreakdown,
      });
    }

    case "revenue": {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const baseWhere: Record<string, unknown> = {};
      if (tenantId) {
        baseWhere.event = { tenantId };
      }
      if (eventId) {
        baseWhere.eventId = eventId;
      }

      const registrations = await prisma.registration.findMany({
        where: baseWhere,
        select: {
          id: true,
          amount: true,
          paymentStatus: true,
          createdAt: true,
          event: {
            select: { id: true, title: true },
          },
        },
      });

      // Group by date (last 30 days)
      const byDate: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        byDate[d.toISOString().slice(0, 10)] = 0;
      }
      for (const reg of registrations) {
        const dateKey = reg.createdAt.toISOString().slice(0, 10);
        if (byDate[dateKey] !== undefined) {
          byDate[dateKey] += Number(reg.amount);
        }
      }
      const dailyRevenue = Object.entries(byDate).map(([date, amount]) => ({ date, amount }));

      // Group by event
      const byEvent: Record<string, { eventTitle: string; amount: number }> = {};
      for (const reg of registrations) {
        const key = reg.event.id;
        if (!byEvent[key]) {
          byEvent[key] = { eventTitle: reg.event.title, amount: 0 };
        }
        byEvent[key].amount += Number(reg.amount);
      }
      const eventBreakdown = Object.values(byEvent).sort((a, b) => b.amount - a.amount);

      // Totals
      let totalRevenue = 0;
      let totalPaid = 0;
      let totalPending = 0;
      let totalFree = 0;

      for (const reg of registrations) {
        const amt = Number(reg.amount);
        totalRevenue += amt;
        if (reg.paymentStatus === "PAID") totalPaid += amt;
        else if (reg.paymentStatus === "PENDING") totalPending += amt;
        else if (reg.paymentStatus === "FREE") totalFree++;
      }

      return successResponse({
        totalRevenue,
        totalPaid,
        totalPending,
        totalFree,
        dailyRevenue,
        eventBreakdown,
      });
    }

    case "attendance": {
      const baseWhere: Record<string, unknown> = {};
      if (tenantId) {
        baseWhere.event = { tenantId };
      }
      if (eventId) {
        baseWhere.eventId = eventId;
      }

      const registrations = await prisma.registration.findMany({
        where: baseWhere,
        select: {
          id: true,
          attendanceStatus: true,
          checkedInAt: true,
        },
      });

      const totalRegistrations = registrations.length;
      const checkedIn = registrations.filter((r) => r.attendanceStatus === "checked_in").length;
      const checkInRate = totalRegistrations > 0 ? (checkedIn / totalRegistrations) * 100 : 0;

      // Hourly check-ins
      const hourlyCheckIns: Record<number, number> = {};
      for (let h = 0; h < 24; h++) {
        hourlyCheckIns[h] = 0;
      }
      for (const reg of registrations) {
        if (reg.checkedInAt) {
          const hour = reg.checkedInAt.getHours();
          hourlyCheckIns[hour]++;
        }
      }
      const hourlyData = Object.entries(hourlyCheckIns).map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
      }));

      // Peak hour
      let peakHour = 0;
      let peakCount = 0;
      for (const [hour, count] of Object.entries(hourlyCheckIns)) {
        if (count > peakCount) {
          peakCount = count;
          peakHour = parseInt(hour);
        }
      }

      return successResponse({
        totalRegistrations,
        checkedIn,
        checkInRate: Math.round(checkInRate * 10) / 10,
        hourlyData,
        peakHour,
        peakCount,
      });
    }

    case "certificates": {
      const baseWhere: Record<string, unknown> = {};
      if (tenantId) {
        baseWhere.event = { tenantId };
      }
      if (eventId) {
        baseWhere.eventId = eventId;
      }

      const certificates = await prisma.certificate.findMany({
        where: baseWhere,
        select: {
          id: true,
          status: true,
          certificateType: true,
        },
      });

      // By status
      const byStatus: Record<string, number> = {};
      for (const cert of certificates) {
        byStatus[cert.status] = (byStatus[cert.status] || 0) + 1;
      }
      const statusBreakdown = Object.entries(byStatus).map(([status, count]) => ({ status, count }));

      // By type
      const byType: Record<string, number> = {};
      for (const cert of certificates) {
        byType[cert.certificateType] = (byType[cert.certificateType] || 0) + 1;
      }
      const typeBreakdown = Object.entries(byType).map(([type, count]) => ({ type, count }));

      return successResponse({
        total: certificates.length,
        statusBreakdown,
        typeBreakdown,
      });
    }

    default:
      return Errors.badRequest("Invalid report type. Use: registrations, revenue, attendance, certificates");
  }
});
