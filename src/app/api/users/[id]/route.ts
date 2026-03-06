import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateUserSchema } from "@/lib/validations/user";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/users/[id] - Get single user
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    const { id } = await context!.params;

    // Users can view their own profile, SUPER_ADMIN and ADMIN can view others
    if (id !== session.user.id && session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
      return Errors.forbidden("You can only view your own profile");
    }

    const user = await prisma.user.findUnique({
      where: { id },
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
        registrations: {
          select: {
            id: true,
            status: true,
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!user) {
      return Errors.notFound("User");
    }

    return successResponse(user);
  }
);

// PUT /api/users/[id] - Update user
export const PUT = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    const { id } = await context!.params;

    // Users can update their own profile (limited fields), SUPER_ADMIN and ADMIN can update others
    const isSelf = id === session.user.id;
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";

    if (!isSelf && !isAdmin) {
      return Errors.forbidden("You can only update your own profile");
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return Errors.notFound("User");
    }

    const body = await parseBody(request);

    if (!body) {
      return Errors.badRequest("Invalid request body");
    }

    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const data = parsed.data;

    // Non-admins cannot change role or isActive
    if (!isAdmin) {
      delete data.role;
      delete data.isActive;
    }

    // Prevent changing own role (even for admins)
    if (isSelf && data.role) {
      delete data.role;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
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
        updatedAt: true,
      },
    });

    return successResponse(user, "User updated successfully");
  }
);

// DELETE /api/users/[id] - Delete user (admin only)
export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
      return Errors.forbidden("Only administrators can delete users");
    }

    const { id } = await context!.params;

    // Prevent self-deletion
    if (id === session.user.id) {
      return Errors.badRequest("You cannot delete your own account");
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return Errors.notFound("User");
    }

    // Soft delete by deactivating
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return successResponse({ id }, "User deactivated successfully");
  }
);
