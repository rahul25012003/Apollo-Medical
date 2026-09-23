import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dbToTenantConfig, type TenantConfig } from "@/lib/tenant/types";
import { DashboardTenantWrapper } from "./dashboard-tenant-wrapper";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // A SUPER_ADMIN's dashboard tenant is a client-side UI selection (can
    // change without a new session), so it can't be fixed at render time —
    // every other role's tenant is fully known from their own session,
    // fetched here so the correct branding renders from the very first
    // paint instead of the client fetch's default placeholder.
    let initialConfig: TenantConfig | null = null;
    if (session?.user && session.user.role !== "SUPER_ADMIN" && session.user.tenantId) {
        try {
            const tenant = await prisma.tenant.findUnique({ where: { id: session.user.tenantId } });
            if (tenant) initialConfig = dbToTenantConfig(tenant);
        } catch {
            // Client-side fetch in TenantProvider still resolves it.
        }
    }

    return (
        <DashboardTenantWrapper initialConfig={initialConfig}>
            {children}
        </DashboardTenantWrapper>
    );
}
