"use client";

import { TenantProvider } from "@/lib/tenant";
import { TenantConfig } from "@/lib/tenant/types";

interface TenantLayoutClientProps {
  children: React.ReactNode;
  tenantSlug: string;
  tenantConfig: TenantConfig;
}

export function TenantLayoutClient({
  children,
  tenantSlug,
  tenantConfig,
}: TenantLayoutClientProps) {
  return (
    <TenantProvider tenantSlug={tenantSlug} initialConfig={tenantConfig}>
      {children}
    </TenantProvider>
  );
}
