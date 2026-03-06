import type { Session } from "next-auth";

/**
 * Determine the effective tenant ID for a request.
 * - SUPER_ADMIN: uses query param `tenantId` (or null for "All Tenants")
 * - Others: forced to their own session tenantId
 */
export function getEffectiveTenantId(
    session: Session,
    searchParams: URLSearchParams
): string | null {
    if (session.user.role === "SUPER_ADMIN") {
        return searchParams.get("tenantId") || null;
    }
    return session.user.tenantId ?? null;
}

/**
 * Returns a Prisma `where` clause fragment for tenant scoping.
 * If tenantId is null (All Tenants / SUPER_ADMIN), returns empty object.
 */
export function tenantWhereClause(tenantId: string | null): { tenantId?: string } {
    return tenantId ? { tenantId } : {};
}
