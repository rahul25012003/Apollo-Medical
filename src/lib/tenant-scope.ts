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
    // Non-super-admin MUST have a tenantId — if missing, return a dummy ID
    // that won't match anything, preventing data leaks across tenants
    return session.user.tenantId ?? "no-tenant-assigned";
}

/**
 * Returns a Prisma `where` clause fragment for tenant scoping.
 * If tenantId is null (All Tenants / SUPER_ADMIN), returns empty object.
 */
export function tenantWhereClause(tenantId: string | null): { tenantId?: string } {
    return tenantId ? { tenantId } : {};
}

/**
 * Check if a resource belongs to the user's tenant.
 * SUPER_ADMIN can access any resource. Others must match tenantId.
 * Returns true if access is allowed.
 */
export function isTenantOwner(
    session: Session,
    resourceTenantId: string | null | undefined
): boolean {
    if (session.user.role === "SUPER_ADMIN") return true;
    if (!session.user.tenantId) return false;
    return session.user.tenantId === resourceTenantId;
}
