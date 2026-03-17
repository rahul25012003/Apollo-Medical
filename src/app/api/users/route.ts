import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { createUserSchema } from "@/lib/validations/user";
import { hashPassword } from "@/lib/auth-utils";
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

// GET /api/users - List all users (admin only)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  // Only SUPER_ADMIN and ADMIN can list users
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return Errors.forbidden("Only administrators can view all users");
  }

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);
  const { field: sortBy, order: sortOrder } = getSortParams(
    searchParams,
    ["createdAt", "name", "email", "role"],
    "createdAt"
  );

  // Build filters
  const where: Prisma.UserWhereInput = {};

  // Tenant scoping
  const effectiveTenantId = getEffectiveTenantId(session, searchParams);
  Object.assign(where, tenantWhereClause(effectiveTenantId));

  const role = searchParams.get("role");
  if (role) {
    where.role = role as Prisma.EnumUserRoleFilter;
  }

  const isActive = searchParams.get("isActive");
  if (isActive !== null) {
    where.isActive = isActive === "true";
  }

  const search = searchParams.get("search");
  if (search && search.length > 200) {
    return Errors.badRequest("Search query too long");
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { registrations: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return paginatedResponse(users, { page, limit, total });
});

// POST /api/users - Create new user (admin only)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  // Only SUPER_ADMIN and ADMIN can create users
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return Errors.forbidden("Only administrators can create users");
  }

  const body = await parseBody(request);

  if (!body) {
    return Errors.badRequest("Invalid request body");
  }

  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return Errors.validationError(parsed.error);
  }

  const { password, ...data } = parsed.data;

  // Check for duplicate email
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
    return Errors.conflict("A user with this email already exists");
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Determine tenant: ADMIN forced to own tenant, SUPER_ADMIN can assign any
  let tenantId: string | null = null;
  if (session.user.role === "ADMIN") {
    tenantId = session.user.tenantId ?? null;
  } else if (typeof body.tenantId === "string") {
    tenantId = body.tenantId;
  }

  const user = await prisma.user.create({
    data: {
      ...data,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      tenantId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return successResponse(user, "User created successfully", 201);
});
