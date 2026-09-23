import type { Session } from "next-auth";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { isIfpcTenantId } from "./ifpc-tenant";

interface ActivityInput {
  /** dotted verb, e.g. "registration.update", "user.deactivate" */
  action: string;
  /** one readable line for the log screen, e.g. "Updated registration for Dr. A. Rao" */
  summary: string;
  entityType?: string;
  entityId?: string | null;
  /** tenant the change belongs to; defaults to the actor's tenant */
  tenantId?: string | null;
  metadata?: Record<string, unknown>;
  request?: Request;
  /**
   * Who to record when the change was not made by a signed-in admin — a
   * delegate editing their own choices, or an anonymous expression of
   * interest from the public page. Falls back to the session user.
   */
  actor?: { email?: string | null; id?: string | null; role?: string | null };
}

/**
 * Audit trail: who did what, when — every role, not only admins. A delegate
 * changing their own interests is logged against their own account via
 * `actor`. IFPC (apollo-medical) only — calls for any other tenant are a
 * no-op, so it's safe to call from shared routes. Never throws: a failed log
 * write must not fail the action being logged.
 */
export async function logActivity(session: Session | null, input: ActivityInput): Promise<void> {
  try {
    const user = session?.user as { id?: string; email?: string; role?: string; tenantId?: string | null } | undefined;
    const tenantId = input.tenantId ?? user?.tenantId ?? null;
    if (!(await isIfpcTenantId(tenantId))) return;

    const ipAddress = input.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    await prisma.activityLog.create({
      data: {
        tenantId,
        actorId: input.actor?.id ?? user?.id ?? null,
        actorEmail: input.actor?.email ?? user?.email ?? null,
        actorRole: input.actor?.role ?? user?.role ?? null,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        summary: input.summary.slice(0, 500),
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        ipAddress,
      },
    });
  } catch (err) {
    console.error("[activity-log] write failed:", err);
  }
}
