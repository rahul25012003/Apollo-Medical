import { prisma } from "@/lib/prisma";
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
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });

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
    title: tenant.name,
    description: tenant.tagline || `${tenant.name} - Conference Portal`,
    icons: tenant.favicon
      ? [{ rel: "icon", url: tenant.favicon }]
      : undefined,
  };
}
