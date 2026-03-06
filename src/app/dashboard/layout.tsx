"use client";

import { TenantProvider } from "@/lib/tenant/context";
import { useTenantFilter } from "@/hooks/use-tenant-filter";

function DashboardTenantWrapper({ children }: { children: React.ReactNode }) {
    const { effectiveTenantId } = useTenantFilter();

    return (
        <TenantProvider tenantId={effectiveTenantId}>
            {children}
        </TenantProvider>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardTenantWrapper>{children}</DashboardTenantWrapper>;
}
