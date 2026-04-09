import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { createEventSchema } from "@/lib/validations/event";
import { generateUniqueSlug } from "@/lib/auth-utils";
import {
  successResponse,
  paginatedResponse,
  Errors,
  withErrorHandler,
  parseBody,
  getPaginationParams,
  getSortParams,
} from "@/lib/api-utils";
import { Prisma } from "@prisma/client";
import { createNotification } from "@/lib/notifications-db";
import { getEffectiveTenantId, tenantWhereClause } from "@/lib/tenant-scope";

// GET /api/events - List all events (with filters)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  if (!canAccess(session.user.role, "events")) {
    return Errors.forbidden("You don't have permission to view events");
  }

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);
  const { field: sortBy, order: sortOrder } = getSortParams(
    searchParams,
    ["createdAt", "startDate", "title", "status"],
    "createdAt"
  );

  // Build filters
  const where: Prisma.EventWhereInput = {};

  // Tenant scoping
  const effectiveTenantId = getEffectiveTenantId(session, searchParams);
  Object.assign(where, tenantWhereClause(effectiveTenantId));

  const status = searchParams.get("status");
  if (status) {
    where.status = status as Prisma.EnumEventStatusFilter;
  }

  const type = searchParams.get("type");
  if (type) {
    where.type = type as Prisma.EnumEventTypeFilter;
  }

  const search = searchParams.get("search");
  if (search && search.length > 200) {
    return Errors.badRequest("Search query too long");
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
    ];
  }

  const isPublished = searchParams.get("isPublished");
  if (isPublished !== null) {
    where.isPublished = isPublished === "true";
  }

  const isFeatured = searchParams.get("isFeatured");
  if (isFeatured !== null) {
    where.isFeatured = isFeatured === "true";
  }

  // Date range filters
  const startDateFrom = searchParams.get("startDateFrom");
  const startDateTo = searchParams.get("startDateTo");
  if (startDateFrom || startDateTo) {
    where.startDate = {};
    if (startDateFrom) {
      where.startDate.gte = new Date(startDateFrom);
    }
    if (startDateTo) {
      where.startDate.lte = new Date(startDateTo);
    }
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    }),
    prisma.event.count({ where }),
  ]);

  // Convert Prisma Decimal + compute effective price from categories
  const safeEvents = events.map((e) => {
    const eventPrice = Number(e.price) || 0;
    const cats = ((e as any).pricingCategories || []).map((pc: any) => Number(pc?.price) || 0).filter((p: number) => p > 0);
    const effectivePrice = eventPrice > 0 ? eventPrice : (cats.length > 0 ? Math.min(...cats) : 0);
    return {
      ...e,
      price: effectivePrice,
      earlyBirdPrice: e.earlyBirdPrice ? Number(e.earlyBirdPrice) : null,
    };
  });

  return paginatedResponse(safeEvents, { page, limit, total });
});

// POST /api/events - Create a new event
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  if (!canAccess(session.user.role, "events")) {
    return Errors.forbidden("You don't have permission to create events");
  }

  const body = await parseBody(request);

  if (!body) {
    return Errors.badRequest("Invalid request body");
  }

  const parsed = createEventSchema.safeParse(body);

  if (!parsed.success) {
    return Errors.validationError(parsed.error);
  }

  const { pricingCategories, ...eventData } = parsed.data;

  // Determine tenant: SUPER_ADMIN can specify in body, others use session
  const tenantId: string | null = session.user.role === "SUPER_ADMIN"
    ? (typeof body.tenantId === "string" ? body.tenantId : null)
    : (session.user.tenantId || null);

  // Generate slug if not provided
  const slug = eventData.slug || generateUniqueSlug(eventData.title);

  // Check if slug is unique
  const existingEvent = await prisma.event.findUnique({
    where: { slug },
  });

  if (existingEvent) {
    return Errors.conflict("An event with this slug already exists");
  }

  // Create event with pricing categories in a transaction
  const event = await prisma.$transaction(async (tx) => {
    // Create the event
    const newEvent = await tx.event.create({
      data: {
        ...eventData,
        slug,
        tenantId,
        startDate: eventData.startDate ? new Date(eventData.startDate) : null,
        endDate: eventData.endDate ? new Date(eventData.endDate) : null,
        registrationOpensDate: eventData.registrationOpensDate
          ? new Date(eventData.registrationOpensDate)
          : null,
        registrationDeadline: eventData.registrationDeadline
          ? new Date(eventData.registrationDeadline)
          : null,
        earlyBirdDeadline: eventData.earlyBirdDeadline
          ? new Date(eventData.earlyBirdDeadline)
          : null,
      },
    });

    // Create pricing categories if provided
    if (pricingCategories && pricingCategories.length > 0) {
      await tx.eventPricing.createMany({
        data: pricingCategories.map((category, index) => ({
          eventId: newEvent.id,
          name: category.name,
          description: category.description || null,
          totalSlots: category.totalSlots || 20,
          price: category.price,
          earlyBirdPrice: category.earlyBirdPrice || null,
          earlyBirdDeadline: category.earlyBirdDeadline
            ? new Date(category.earlyBirdDeadline)
            : null,
          displayOrder: category.displayOrder ?? index,
        })),
      });
    }

    // Return event with pricing categories
    return tx.event.findUnique({
      where: { id: newEvent.id },
      include: {
        _count: {
          select: { registrations: true },
        },
        pricingCategories: {
          orderBy: { displayOrder: "asc" },
        },
      },
    });
  });

  // Create in-app notification (non-blocking)
  createNotification({
    type: "NEW_EVENT",
    title: "New Event Created",
    message: `"${event?.title || eventData.title}" has been created.`,
    link: `/dashboard/events/${event?.id}`,
    tenantId,
    excludeUserId: session.user.id,
  });

  return successResponse(event, "Event created successfully", 201);
});
