"use client";

import { useSession } from "next-auth/react";
import { useUIStore } from "@/store";

export function useTenantFilter() {
    const { data: session, status } = useSession();
    const { selectedTenantId } = useUIStore();

    const sessionLoading = status === "loading";
    const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

    // SUPER_ADMIN uses the store selection; others use their own tenantId
    // Always return string | null (never undefined) to keep useEffect deps stable
    const effectiveTenantId: string | null = isSuperAdmin
        ? selectedTenantId
        : (session?.user?.tenantId ?? null);

    const isAllTenants = effectiveTenantId === null;

    // Params to spread into service calls
    const tenantFilterParams: { tenantId?: string } = effectiveTenantId
        ? { tenantId: effectiveTenantId }
        : {};

    return {
        effectiveTenantId,
        tenantFilterParams,
        isAllTenants,
        isSuperAdmin,
        sessionLoading,
    };
}
