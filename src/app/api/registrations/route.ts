import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { createRegistrationSchema } from "@/lib/validations/registration";
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
import { getEffectiveTenantId, tenantWhereClause } from "@/lib/tenant-scope";
import { createAdminRegistration } from "@/lib/registration-creation";
import { isIfpcEvent } from "@/lib/ifpc-tenant";
import * as legacy from "./legacy";

// GET /api/registrations - List all registrations (with filters)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  if (!canAccess(session.user.role, "registrations")) {
    return Errors.forbidden("You don't have permission to view registrations");
  }

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);
  const { field: sortBy, order: sortOrder } = getSortParams(
    searchParams,
    ["createdAt", "name", "status", "paymentStatus"],
    "createdAt"
  );

  // Build filters
  const where: Prisma.RegistrationWhereInput = {};

  // Tenant scoping (via event's tenantId)
  const effectiveTenantId = getEffectiveTenantId(session, searchParams);
  if (effectiveTenantId) {
    where.event = { ...where.event as object, tenantId: effectiveTenantId };
  }

  const eventId = searchParams.get("eventId");
  if (eventId) {
    where.eventId = eventId;
  }

  const status = searchParams.get("status");
  if (status) {
    where.status = status as Prisma.EnumRegistrationStatusFilter;
  }

  const paymentStatus = searchParams.get("paymentStatus");
  if (paymentStatus) {
    where.paymentStatus = paymentStatus as Prisma.EnumPaymentStatusFilter;
  }

  const search = searchParams.get("search");
  if (search && search.length > 200) {
    return Errors.badRequest("Search query too long");
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  // Date range filters
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  const [registrations, total] = await Promise.all([
    prisma.registration.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        registeredBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        certificates: {
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

  // Convert Prisma Decimal to plain numbers
  const safeRegistrations = registrations.map((r) => ({
    ...r,
    amount: Number(r.amount) || 0,
  }));

  return paginatedResponse(safeRegistrations, { page, limit, total });
});

// POST /api/registrations - Create new registration
const ifpcPOST = withErrorHandler(async (request: NextRequest) => {
  // Check if user is authenticated (for admin registrations)
  const session = await auth();

  const body = await parseBody(request);

  if (!body) {
    return Errors.badRequest("Invalid request body");
  }

  const parsed = createRegistrationSchema.safeParse(body);

  if (!parsed.success) {
    return Errors.validationError(parsed.error);
  }

  const data = parsed.data;

  // Check if event exists and is open for registration
  const event = await prisma.event.findUnique({
    where: { id: data.eventId },
    select: {
      id: true,
      title: true,
      tenantId: true,
      capacity: true,
      isRegistrationOpen: true,
      registrationOpensDate: true,
      registrationDeadline: true,
      price: true,
      earlyBirdPrice: true,
      earlyBirdDeadline: true,
      currency: true,
      pricingCategories: {
        select: {
          id: true,
          name: true,
          price: true,
          earlyBirdPrice: true,
          earlyBirdDeadline: true,
        },
      },
      _count: {
        select: {
          // Only DELEGATE (and legacy null) registrations count toward capacity.
          registrations: {
            where: { OR: [{ participantRole: "DELEGATE" }, { participantRole: null }] },
          },
        },
      },
    },
  });

  if (!event) {
    return Errors.notFound("Event");
  }

  // Check if user is admin/staff - they can bypass registration restrictions
  const isAdminRegistration = session && canAccess(session.user.role, "registrations");

  // Tenant isolation: admin can only create registrations for their tenant's events
  if (isAdminRegistration && session.user.role !== "SUPER_ADMIN") {
    if (session.user.tenantId && event.tenantId !== session.user.tenantId) {
      return Errors.forbidden("You can only create registrations for your own tenant's events");
    }
  }

  // Only enforce registration restrictions for public (non-admin) registrations
  if (!isAdminRegistration) {
    if (!event.isRegistrationOpen) {
      return Errors.badRequest("Registration is closed for this event");
    }

    if (event.registrationOpensDate && new Date() < event.registrationOpensDate) {
      return Errors.badRequest("Registration has not opened yet");
    }

    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return Errors.badRequest("Registration deadline has passed");
    }
  }

  const registeredById = session?.user?.id || null;

  const result = await createAdminRegistration(
    event,
    {
      name: data.name,
      email: data.email,
      phone: data.phone,
      organization: data.organization,
      designation: data.designation,
      category: data.category,
      categoryId: data.categoryId,
      participantRole: data.participantRole,
      foodPreference: data.foodPreference,
      notes: data.notes,
      specialRequests: data.specialRequests,
      userId: data.userId,
      status: data.status,
      paymentStatus: data.paymentStatus,
      // Only an admin/staff request may override the server-calculated amount.
      amount: isAdminRegistration && data.amount !== undefined ? data.amount : undefined,
    },
    registeredById
  );

  if (!result.ok) {
    if (result.reason === "invalid-category") {
      return Errors.badRequest("Selected pricing category not found for this event");
    }
    return Errors.conflict("You are already registered for this event");
  }

  return successResponse(result.registration, "Registration successful", 201);
});

// IFPC (apollo-medical) uses the handlers above. Every other tenant keeps the
// original pre-IFPC handlers, unchanged, in ./legacy.ts.
export async function POST(request: NextRequest) {
  // Peek at a clone so the chosen handler can still read the original body.
  const body = await request.clone().json().catch(() => null);
  const eventId = body && typeof body.eventId === "string" ? body.eventId : null;
  return (await isIfpcEvent(eventId)) ? ifpcPOST(request) : legacy.POST(request);
}
