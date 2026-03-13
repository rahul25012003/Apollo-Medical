import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, Errors, withErrorHandler } from "@/lib/api-utils";

// GET /api/notifications - Get current user's notifications
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) {
    return Errors.unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  const where: any = { userId: session.user.id };
  if (unreadOnly) {
    where.isRead = false;
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
  ]);

  return successResponse({ notifications, unreadCount });
});

// PATCH /api/notifications - Mark notifications as read
export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) {
    return Errors.unauthorized();
  }

  const body = await request.json();
  const { ids, markAll } = body as { ids?: string[]; markAll?: boolean };

  if (markAll) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });
  } else if (ids && ids.length > 0) {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId: session.user.id },
      data: { isRead: true },
    });
  }

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return successResponse({ unreadCount });
});
