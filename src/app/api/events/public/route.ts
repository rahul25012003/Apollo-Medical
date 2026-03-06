import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  paginatedResponse,
  withErrorHandler,
  getPaginationParams,
  getSortParams,
} from "@/lib/api-utils";
import { Prisma } from "@prisma/client";

// GET /api/events/public - List published events (public access)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);
  const { field: sortBy, order: sortOrder } = getSortParams(
    searchParams,
    ["startDate", "title", "createdAt"],
    "startDate"
  );

  // Base filter: only published events
  const where: Prisma.EventWhereInput = {
    isPublished: true,
    status: { in: ["UPCOMING", "ACTIVE"] },
  };

  // Optional filters
  const type = searchParams.get("type");
  if (type) {
    where.type = type as Prisma.EnumEventTypeFilter;
  }

  const category = searchParams.get("category");
  if (category) {
    where.category = category;
  }

  const city = searchParams.get("city");
  if (city) {
    where.city = { contains: city, mode: "insensitive" };
  }

  const search = searchParams.get("search");
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { shortDescription: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
    ];
  }

  const isFeatured = searchParams.get("featured");
  if (isFeatured === "true") {
    where.isFeatured = true;
  }

  // Upcoming events only (start date in future)
  const upcomingOnly = searchParams.get("upcoming");
  if (upcomingOnly === "true") {
    where.startDate = { gte: new Date() };
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: sortOrder === "asc" ? { [sortBy]: "asc" } : { [sortBy]: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        startDate: true,
        endDate: true,
        startTime: true,
        endTime: true,
        location: true,
        city: true,
        isVirtual: true,
        capacity: true,
        price: true,
        earlyBirdPrice: true,
        earlyBirdDeadline: true,
        currency: true,
        status: true,
        type: true,
        category: true,
        cmeCredits: true,
        thumbnailImage: true,
        bannerImage: true,
        isFeatured: true,
        registrationDeadline: true,
        isRegistrationOpen: true,
        _count: {
          select: { registrations: true },
        },
        eventSpeakers: {
          where: { isPublished: true },
          select: {
            speaker: {
              select: {
                id: true,
                name: true,
                designation: true,
                institution: true,
                photo: true,
              },
            },
            topic: true,
          },
          take: 4,
        },
        eventSponsors: {
          where: { isPublished: true },
          select: {
            sponsor: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
            tier: true,
          },
          orderBy: { displayOrder: "asc" },
        },
        pricingCategories: {
          select: {
            id: true,
            name: true,
            description: true,
            totalSlots: true,
            price: true,
            earlyBirdPrice: true,
            earlyBirdDeadline: true,
            displayOrder: true,
          },
          orderBy: { displayOrder: "asc" },
        },
      },
    }),
    prisma.event.count({ where }),
  ]);

  // Add available slots calculation
  const eventsWithAvailability = events.map((event) => ({
    ...event,
    registeredCount: event._count.registrations,
    availableSlots: event.capacity - event._count.registrations,
    isSoldOut: event._count.registrations >= event.capacity,
  }));

  return paginatedResponse(eventsWithAvailability, { page, limit, total });
});
