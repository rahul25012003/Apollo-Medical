import { prisma } from "@/lib/prisma";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import { dbToTenantConfig } from "@/lib/tenant/types";
import { notFound } from "next/navigation";
import { TenantLayoutClient } from "./tenant-layout-client";

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}

export default async function TenantLayout({
  children,
  params,
}: TenantLayoutProps) {
  const { tenant: tenantSlug } = await params;

  // Fetch tenant config from database
  let tenant = null;
  try {
    tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });
  } catch (e) {
    console.error("[TenantLayout] DB error:", e);
    notFound();
  }

  if (!tenant || !tenant.isActive) {
    notFound();
  }

  // Convert to plain object for serialization
  const tenantConfig = dbToTenantConfig(tenant as any);

  return (
    <TenantLayoutClient tenantSlug={tenantSlug} tenantConfig={tenantConfig}>
      {children}
    </TenantLayoutClient>
  );
}

// Generate metadata based on tenant
export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantSlug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: {
      name: true,
      tagline: true,
      favicon: true,
    },
  });

  if (!tenant) {
    return {
      title: "Not Found",
    };
  }

  return {
    title: { absolute: tenant.name },
    description: tenant.tagline || `${tenant.name} - Conference Portal`,
    // IFPC 2026 uses its conference emblem everywhere it has an icon. Set in
    // code rather than read from the tenant row, so the live site changes with
    // the deploy instead of waiting on a database edit.
    icons: tenantSlug === IFPC_TENANT_SLUG
      ? [
          { rel: "icon", url: "/ifpc/ifpc-favicon-48.png", sizes: "48x48", type: "image/png" },
          { rel: "apple-touch-icon", url: "/ifpc/ifpc-app-180.png", sizes: "180x180" },
        ]
      : tenant.favicon
        ? [{ rel: "icon", url: tenant.favicon }]
        : undefined,
  };
}
