"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TenantForm } from "../_components/tenant-form";
import { tenantsService } from "@/services/tenants";
import { TenantFormData } from "@/lib/tenant/validation";

export default function CreateTenantPage() {
    const router = useRouter();

    const handleSubmit = async (data: TenantFormData) => {
        const response = await tenantsService.create(data);
        if (response.success) {
            router.push("/dashboard/tenants");
        } else {
            const errorMessage =
                typeof response.error === "string"
                    ? response.error
                    : response.error?.message || "Failed to create tenant";
            throw new Error(errorMessage);
        }
    };

    return (
        <DashboardLayout title="Create Tenant" subtitle="Set up a new client organization">
            <TenantForm onSubmit={handleSubmit} />
        </DashboardLayout>
    );
}
