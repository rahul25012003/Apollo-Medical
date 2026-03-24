import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  paginatedResponse,
  Errors,
  withErrorHandler,
  getPaginationParams,
  getSortParams,
} from "@/lib/api-utils";
import { Prisma } from "@prisma/client";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

const rateLimiter = createRateLimiter("events-public", { maxRequests: 60, windowSeconds: 60 });

// GET /api/events/public - List published events (public access)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const rl = rateLimiter.check(getClientIp(request));
  if (!rl.allowed) {
    return Errors.badRequest(rl.message);
  }

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
  if (search && search.length > 200) {
    return Errors.badRequest("Search query too long");
  }
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

  const tenantId = searchParams.get("tenantId");
  if (tenantId) {
    where.tenantId = tenantId;
  }

  const tenantSlug = searchParams.get("tenantSlug");
  if (tenantSlug) {
    where.tenant = { slug: tenantSlug };
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
        address: true,
        city: true,
        state: true,
        country: true,
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
        registrationOpensDate: true,
        registrationDeadline: true,
        isRegistrationOpen: true,
        tenantId: true,
        tenant: {
          select: {
            slug: true,
            name: true,
          },
        },
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

  // Add available slots + convert Decimal fields to numbers
  const eventsWithAvailability = events.map((event) => {
    const eventPrice = Number(event.price) || 0;
    const categories = (event as any).pricingCategories?.map((pc: any) => ({
      ...pc,
      price: Number(pc.price) || 0,
      earlyBirdPrice: pc.earlyBirdPrice ? Number(pc.earlyBirdPrice) : null,
    })) || [];
    // Effective price: use lowest category price if categories exist and event price is 0
    const categoryPrices = categories.map((c: any) => Number(c.price)).filter((p: number) => p > 0);
    const effectivePrice = eventPrice > 0 ? eventPrice : (categoryPrices.length > 0 ? Math.min(...categoryPrices) : 0);
    return {
      ...event,
      price: effectivePrice,
      earlyBirdPrice: event.earlyBirdPrice ? Number(event.earlyBirdPrice) : null,
      registeredCount: event._count.registrations,
      availableSlots: event.capacity - event._count.registrations,
      isSoldOut: event._count.registrations >= event.capacity,
      pricingCategories: categories,
    };
  });

  return paginatedResponse(eventsWithAvailability, { page, limit, total });
});
