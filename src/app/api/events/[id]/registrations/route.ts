import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import {
  successResponse,
  paginatedResponse,
  Errors,
  withErrorHandler,
  getPaginationParams,
} from "@/lib/api-utils";
import { Prisma } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/events/[id]/registrations - Get registrations for an event
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "registrations")) {
      return Errors.forbidden("You don't have permission to view registrations");
    }

    const { id: eventId } = await context!.params;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true },
    });

    if (!event) {
      return Errors.notFound("Event");
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);

    // Build filters
    const where: Prisma.RegistrationWhereInput = { eventId };

    const status = searchParams.get("status");
    if (status) {
      where.status = status as Prisma.EnumRegistrationStatusFilter;
    }

    const paymentStatus = searchParams.get("paymentStatus");
    if (paymentStatus) {
      where.paymentStatus = paymentStatus as Prisma.EnumPaymentStatusFilter;
    }

    const search = searchParams.get("search");
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          certificate: {
            select: {
              id: true,
              certificateCode: true,
              status: true,
            },
          },
        },
      }),
      prisma.registration.count({ where }),
    ]);

    // Add summary stats
    const stats = await prisma.registration.groupBy({
      by: ["status"],
      where: { eventId },
      _count: { status: true },
    });

    const paymentStats = await prisma.registration.groupBy({
      by: ["paymentStatus"],
      where: { eventId },
      _count: { paymentStatus: true },
    });

    const totalRevenue = await prisma.registration.aggregate({
      where: { eventId, paymentStatus: "PAID" },
      _sum: { amount: true },
    });

    return successResponse({
      event,
      registrations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        byStatus: Object.fromEntries(
          stats.map((s) => [s.status, s._count.status])
        ),
        byPayment: Object.fromEntries(
          paymentStats.map((s) => [s.paymentStatus, s._count.paymentStatus])
        ),
        totalRevenue: totalRevenue._sum.amount || 0,
      },
    });
  }
);
