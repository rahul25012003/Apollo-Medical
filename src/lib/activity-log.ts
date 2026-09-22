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
}

/**
 * Admin audit trail: who did what, when. IFPC (apollo-medical) only — calls
 * for any other tenant are a no-op, so it's safe to call from shared routes.
 * Never throws: a failed log write must not fail the action being logged.
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
        actorId: user?.id ?? null,
        actorEmail: user?.email ?? null,
        actorRole: user?.role ?? null,
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
