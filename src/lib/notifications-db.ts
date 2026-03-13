import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

/**
 * Create in-app notifications for relevant users within a tenant.
 * Notifies SUPER_ADMIN, ADMIN, and EVENT_MANAGER roles.
 */
export async function createNotification({
  type,
  title,
  message,
  link,
  tenantId,
  excludeUserId,
}: {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  tenantId?: string | null;
  excludeUserId?: string | null;
}) {
  try {
    // Find admin/manager users for this tenant (or platform-wide for SUPER_ADMIN)
    const targetRoles = ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER", "REGISTRATION_MANAGER"];

    const users = await prisma.user.findMany({
      where: {
        role: { in: targetRoles as any },
        isActive: true,
        ...(tenantId ? {
          OR: [
            { tenantId },
            { role: "SUPER_ADMIN" },
          ],
        } : {}),
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { id: true },
    });

    if (users.length === 0) return;

    await prisma.notification.createMany({
      data: users.map((u) => ({
        type,
        title,
        message,
        link: link || null,
        userId: u.id,
        tenantId: tenantId || null,
      })),
    });
  } catch (err) {
    // Non-blocking — log and move on
    console.error("Failed to create notifications:", err);
  }
}
