"use client";

import { TenantProvider } from "@/lib/tenant/context";
import { useTenantFilter } from "@/hooks/use-tenant-filter";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import type { TenantConfig } from "@/lib/tenant/types";
import "../ifpc-neu.css";

export function DashboardTenantWrapper({
    children,
    initialConfig,
}: {
    children: React.ReactNode;
    initialConfig: TenantConfig | null;
}) {
    const { effectiveTenantId } = useTenantFilter();
    // Visual-only: the IFPC dashboard's soft surface treatment (see
    // ifpc-neu.css). Server-resolved, so it's correct on the first paint.
    const neu = initialConfig?.slug === IFPC_TENANT_SLUG;

    return (
        <TenantProvider tenantId={effectiveTenantId} initialConfig={initialConfig ?? undefined}>
            <div className={neu ? "ifpc-neu" : undefined}>{children}</div>
        </TenantProvider>
    );
}
