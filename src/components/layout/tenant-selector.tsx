"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useUIStore } from "@/store";
import { tenantsService, Tenant } from "@/services/tenants";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

export function TenantSelector() {
    const { data: session } = useSession();
    const { selectedTenantId, setSelectedTenantId } = useUIStore();
    const [tenants, setTenants] = useState<Tenant[]>([]);

    const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

    useEffect(() => {
        if (!isSuperAdmin) return;

        async function fetchTenants() {
            try {
                const res = await tenantsService.getAll();
                if (res.success && res.data) {
                    const list = Array.isArray(res.data) ? res.data : [];
                    setTenants(list.filter((t) => t.isActive));
                }
            } catch {
                // silently fail – selector will just be empty
            }
        }

        fetchTenants();
    }, [isSuperAdmin]);

    // Only render for SUPER_ADMIN
    if (!isSuperAdmin) return null;

    return (
        <div className="hidden md:flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <Select
                value={selectedTenantId ?? "all"}
                onValueChange={(val) => setSelectedTenantId(val === "all" ? null : val)}
            >
                <SelectTrigger className="h-9 w-44 lg:w-52 text-sm">
                    <SelectValue placeholder="All Tenants" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Tenants</SelectItem>
                    {tenants.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                            {t.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
