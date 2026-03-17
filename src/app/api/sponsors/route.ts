import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { createSponsorSchema } from "@/lib/validations/sponsor";
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

// GET /api/sponsors - List all sponsors
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);
  const { field: sortBy, order: sortOrder } = getSortParams(
    searchParams,
    ["createdAt", "name"],
    "name"
  );

  // Build filters
  const where: Prisma.SponsorWhereInput = {};

  // Tenant scoping
  const effectiveTenantId = getEffectiveTenantId(session, searchParams);
  Object.assign(where, tenantWhereClause(effectiveTenantId));

  const search = searchParams.get("search");
  if (search && search.length > 200) {
    return Errors.badRequest("Search query too long");
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const isActive = searchParams.get("isActive");
  if (isActive !== null) {
    where.isActive = isActive === "true";
  }

  const [sponsors, total] = await Promise.all([
    prisma.sponsor.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        eventSponsors: {
          select: {
            id: true,
            tier: true,
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
              },
            },
          },
          orderBy: {
            event: { startDate: "desc" },
          },
          take: 3,
        },
        _count: {
          select: { eventSponsors: true },
        },
      },
    }),
    prisma.sponsor.count({ where }),
  ]);

  return paginatedResponse(sponsors, { page, limit, total });
});

// POST /api/sponsors - Create new sponsor
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  if (!canAccess(session.user.role, "sponsors")) {
    return Errors.forbidden("You don't have permission to create sponsors");
  }

  const body = await parseBody(request);

  if (!body) {
    return Errors.badRequest("Invalid request body");
  }

  const parsed = createSponsorSchema.safeParse(body);

  if (!parsed.success) {
    return Errors.validationError(parsed.error);
  }

  const data = parsed.data;

  // Determine tenant: SUPER_ADMIN can specify in body, others use session
  const tenantId: string | null = session.user.role === "SUPER_ADMIN"
    ? (typeof body.tenantId === "string" ? body.tenantId : null)
    : (session.user.tenantId || null);

  const sponsor = await prisma.sponsor.create({
    data: {
      ...data,
      email: data.email ? data.email.toLowerCase() : null,
      tenantId,
    },
  });

  return successResponse(sponsor, "Sponsor created successfully", 201);
});
