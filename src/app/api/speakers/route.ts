import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { createSpeakerSchema } from "@/lib/validations/speaker";
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

// GET /api/speakers - List all speakers
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);
  const { field: sortBy, order: sortOrder } = getSortParams(
    searchParams,
    ["createdAt", "name", "institution"],
    "name"
  );

  // Build filters
  const where: Prisma.SpeakerWhereInput = {};

  // Tenant scoping
  const effectiveTenantId = getEffectiveTenantId(session, searchParams);
  Object.assign(where, tenantWhereClause(effectiveTenantId));

  const search = searchParams.get("search");
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { institution: { contains: search, mode: "insensitive" } },
      { designation: { contains: search, mode: "insensitive" } },
    ];
  }

  const isActive = searchParams.get("isActive");
  if (isActive !== null) {
    where.isActive = isActive === "true";
  }

  const [speakers, total] = await Promise.all([
    prisma.speaker.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        eventSpeakers: {
          select: {
            id: true,
            topic: true,
            status: true,
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
          select: { eventSpeakers: true },
        },
      },
    }),
    prisma.speaker.count({ where }),
  ]);

  return paginatedResponse(speakers, { page, limit, total });
});

// POST /api/speakers - Create new speaker
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  if (!canAccess(session.user.role, "speakers")) {
    return Errors.forbidden("You don't have permission to create speakers");
  }

  const body = await parseBody(request);

  if (!body) {
    return Errors.badRequest("Invalid request body");
  }

  const parsed = createSpeakerSchema.safeParse(body);

  if (!parsed.success) {
    return Errors.validationError(parsed.error);
  }

  const data = parsed.data;

  // Check for duplicate email
  const existingSpeaker = await prisma.speaker.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingSpeaker) {
    return Errors.conflict("A speaker with this email already exists");
  }

  // Determine tenant: SUPER_ADMIN can specify in body, others use session
  const tenantId: string | null = session.user.role === "SUPER_ADMIN"
    ? (typeof body.tenantId === "string" ? body.tenantId : null)
    : (session.user.tenantId || null);

  const speaker = await prisma.speaker.create({
    data: {
      ...data,
      email: data.email.toLowerCase(),
      tenantId,
    },
  });

  return successResponse(speaker, "Speaker created successfully", 201);
});
