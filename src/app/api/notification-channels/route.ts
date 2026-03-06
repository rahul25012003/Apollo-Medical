import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createNotificationChannelSchema } from "@/lib/validations/notification-channel";
import { maskConfig } from "@/lib/notifications";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";

// GET /api/notification-channels - List all channels
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session) return Errors.unauthorized();

  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return Errors.forbidden("Only admins can manage notification channels");
  }

  const tenantId = session.user.tenantId || null;

  // SUPER_ADMIN sees all; ADMIN sees own tenant + platform-level
  const where = role === "SUPER_ADMIN"
    ? {}
    : { OR: [{ tenantId }, { tenantId: null }] };

  const channels = await prisma.notificationChannel.findMany({
    where,
    orderBy: [{ channel: "asc" }, { isDefault: "desc" }, { createdAt: "desc" }],
  });

  // Mask sensitive fields before returning
  const masked = channels.map((ch) => ({
    ...ch,
    config: maskConfig(ch.config as Record<string, unknown>),
  }));

  return successResponse(masked);
});

// POST /api/notification-channels - Create a channel
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session) return Errors.unauthorized();

  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return Errors.forbidden("Only admins can manage notification channels");
  }

  const body = await parseBody(request);
  if (!body) return Errors.badRequest("Invalid request body");

  const parsed = createNotificationChannelSchema.safeParse(body);
  if (!parsed.success) return Errors.validationError(parsed.error);

  const data = parsed.data;

  // ADMIN can only create for their own tenant
  const tenantId = role === "SUPER_ADMIN"
    ? (data.tenantId ?? null)
    : (session.user.tenantId || null);

  // If setting as default, unset other defaults for same channel+tenant
  if (data.isDefault) {
    await prisma.notificationChannel.updateMany({
      where: { channel: data.channel, tenantId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const channel = await prisma.notificationChannel.create({
    data: {
      channel: data.channel,
      provider: data.provider,
      name: data.name,
      config: data.config as Record<string, string>,
      isActive: data.isActive,
      isDefault: data.isDefault,
      tenantId,
    },
  });

  return successResponse(
    { ...channel, config: maskConfig(channel.config as Record<string, unknown>) },
    "Notification channel created",
    201
  );
});
