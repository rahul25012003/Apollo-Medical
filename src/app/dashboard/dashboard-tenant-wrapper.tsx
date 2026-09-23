"use client";

import { TenantProvider } from "@/lib/tenant/context";
import { useTenantFilter } from "@/hooks/use-tenant-filter";
import type { TenantConfig } from "@/lib/tenant/types";

export function DashboardTenantWrapper({
    children,
    initialConfig,
}: {
    children: React.ReactNode;
    initialConfig: TenantConfig | null;
}) {
    const { effectiveTenantId } = useTenantFilter();

    return (
        <TenantProvider tenantId={effectiveTenantId} initialConfig={initialConfig ?? undefined}>
            {children}
        </TenantProvider>
    );
}
