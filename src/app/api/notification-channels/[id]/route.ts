import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateNotificationChannelSchema } from "@/lib/validations/notification-channel";
import { maskConfig } from "@/lib/notifications";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/notification-channels/[id]
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();
    if (!session) return Errors.unauthorized();

    const role = session.user.role;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      return Errors.forbidden();
    }

    const { id } = await context!.params;
    const channel = await prisma.notificationChannel.findUnique({ where: { id } });
    if (!channel) return Errors.notFound("Notification channel");

    // ADMIN can only see own tenant or platform-level
    if (role === "ADMIN" && channel.tenantId && channel.tenantId !== session.user.tenantId) {
      return Errors.forbidden();
    }

    return successResponse({
      ...channel,
      config: maskConfig(channel.config as Record<string, unknown>),
    });
  }
);

// PUT /api/notification-channels/[id]
export const PUT = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();
    if (!session) return Errors.unauthorized();

    const role = session.user.role;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      return Errors.forbidden();
    }

    const { id } = await context!.params;
    const existing = await prisma.notificationChannel.findUnique({ where: { id } });
    if (!existing) return Errors.notFound("Notification channel");

    if (role === "ADMIN" && existing.tenantId && existing.tenantId !== session.user.tenantId) {
      return Errors.forbidden();
    }

    const body = await parseBody(request);
    if (!body) return Errors.badRequest("Invalid request body");

    const parsed = updateNotificationChannelSchema.safeParse(body);
    if (!parsed.success) return Errors.validationError(parsed.error);

    const data = parsed.data;

    // If config is provided, merge with existing (preserve unchanged sensitive fields)
    let finalConfig = existing.config as Record<string, string>;
    if (data.config) {
      const newConfig = data.config as Record<string, string>;
      finalConfig = { ...finalConfig };
      for (const [key, value] of Object.entries(newConfig)) {
        // Skip masked placeholder values
        if (value === "••••••••") continue;
        finalConfig[key] = value;
      }
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.notificationChannel.updateMany({
        where: {
          channel: existing.channel,
          tenantId: existing.tenantId,
          isDefault: true,
          NOT: { id },
        },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.notificationChannel.update({
      where: { id },
      data: {
        ...(data.provider && { provider: data.provider }),
        ...(data.name && { name: data.name }),
        config: finalConfig as Record<string, string>,
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      },
    });

    return successResponse(
      { ...updated, config: maskConfig(updated.config as Record<string, unknown>) },
      "Channel updated"
    );
  }
);

// DELETE /api/notification-channels/[id]
export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();
    if (!session) return Errors.unauthorized();

    const role = session.user.role;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      return Errors.forbidden();
    }

    const { id } = await context!.params;
    const existing = await prisma.notificationChannel.findUnique({ where: { id } });
    if (!existing) return Errors.notFound("Notification channel");

    if (role === "ADMIN" && existing.tenantId && existing.tenantId !== session.user.tenantId) {
      return Errors.forbidden();
    }

    await prisma.notificationChannel.delete({ where: { id } });

    return successResponse({ id }, "Channel deleted");
  }
);
