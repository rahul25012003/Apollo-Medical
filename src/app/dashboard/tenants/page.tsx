"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    Search,
    Plus,
    MoreHorizontal,
    Landmark,
    Edit,
    Trash2,
    ExternalLink,
    X,
    Users,
    Calendar,
    CheckCircle2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { tenantsService, Tenant } from "@/services/tenants";
import { useConfirmDialog, useAlertDialog } from "@/components/ui/confirm-dialog";

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTab, setSelectedTab] = useState("all");

    const { confirm, ConfirmDialog } = useConfirmDialog();
    const { alert, AlertDialog } = useAlertDialog();

    useEffect(() => {
        async function fetchTenants() {
            try {
                setLoading(true);
                const response = await tenantsService.getAll();
                if (response.success && response.data) {
                    const list = Array.isArray(response.data) ? response.data : [];
                    setTenants(list);
                }
            } catch (error) {
                console.error("Failed to fetch tenants:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchTenants();
    }, []);

    const filteredTenants = tenants.filter((tenant) => {
        const matchesSearch =
            searchQuery === "" ||
            tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tenant.slug.toLowerCase().includes(searchQuery.toLowerCase());

        if (selectedTab === "all") return matchesSearch;
        if (selectedTab === "active") return matchesSearch && tenant.isActive;
        if (selectedTab === "inactive") return matchesSearch && !tenant.isActive;
        return matchesSearch;
    });

    const totalTenants = tenants.length;
    const activeTenants = tenants.filter((t) => t.isActive).length;
    const totalEvents = tenants.reduce((sum, t) => sum + (t._count?.events || 0), 0);
    const totalUsers = tenants.reduce((sum, t) => sum + (t._count?.users || 0), 0);

    const handleDeleteTenant = async (tenant: Tenant) => {
        const confirmed = await confirm({
            title: "Delete Tenant",
            description: `Are you sure you want to delete "${tenant.name}"? This action cannot be undone.${
                (tenant._count?.events || 0) > 0 || (tenant._count?.users || 0) > 0
                    ? ` This tenant has ${tenant._count?.events || 0} events and ${tenant._count?.users || 0} users.`
                    : ""
            }`,
            confirmText: "Delete",
            cancelText: "Cancel",
            variant: "danger",
        });

        if (!confirmed) return;

        try {
            const response = await tenantsService.delete(tenant.slug);
            if (response.success) {
                setTenants((prev) => prev.filter((t) => t.id !== tenant.id));
            } else {
                const errorMessage =
                    typeof response.error === "string"
                        ? response.error
                        : response.error?.message || "Failed to delete tenant";
                alert({
                    title: "Delete Failed",
                    description: errorMessage,
                    variant: "error",
                });
            }
        } catch (error) {
            console.error("Failed to delete tenant:", error);
            alert({
                title: "Delete Failed",
                description: "An unexpected error occurred while deleting the tenant.",
                variant: "error",
            });
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="Tenants" subtitle="Manage client organizations and their branding">
                <AiimsLoader />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Tenants" subtitle="Manage client organizations and their branding">
            <ConfirmDialog />
            <AlertDialog />
            <div className="space-y-6 animate-fadeIn">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="card-premium">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/10">
                                    <Landmark className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold animate-count">{totalTenants}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Total Tenants</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-premium">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
                                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold animate-count">{activeTenants}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Active</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-premium">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10">
                                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold animate-count">{totalEvents}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Total Events</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-premium">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10">
                                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold animate-count">{totalUsers}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Total Users</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="flex flex-1 gap-3">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search tenants..."
                                className="pl-10 pr-10 search-premium rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                    <Link href="/dashboard/tenants/create">
                        <Button className="gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/25">
                            <Plus className="w-4 h-4" />
                            Create Tenant
                        </Button>
                    </Link>
                </div>

                {/* Tenants List */}
                <Card className="card-premium">
                    <CardHeader className="pb-3 px-3 sm:px-6">
                        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                            <TabsList className="w-full sm:w-auto h-auto flex-wrap sm:flex-nowrap gap-1 p-1 bg-muted/50 rounded-xl">
                                <TabsTrigger value="all" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                                    All ({totalTenants})
                                </TabsTrigger>
                                <TabsTrigger value="active" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                                    Active ({activeTenants})
                                </TabsTrigger>
                                <TabsTrigger value="inactive" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                                    Inactive ({totalTenants - activeTenants})
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTenants.map((tenant, index) => (
                                <div
                                    key={tenant.id}
                                    className="card-premium rounded-xl overflow-hidden animate-fadeIn"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <div className="h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500" />
                                    <div className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/50">
                                                {tenant.logo ? (
                                                    <img
                                                        src={tenant.logo}
                                                        alt={tenant.name}
                                                        className="w-full h-full object-contain"
                                                    />
                                                ) : (
                                                    <Landmark className="w-6 h-6 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-foreground line-clamp-1">
                                                    {tenant.name}
                                                </h3>
                                                <p className="text-xs text-muted-foreground">/{tenant.slug}</p>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/tenants/${tenant.slug}/edit`}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <a
                                                        href={tenant.domain ? `https://${tenant.domain}` : `/t/${tenant.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <ExternalLink className="mr-2 h-4 w-4" />
                                                        View Live
                                                    </a>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => handleDeleteTenant(tenant)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {tenant.tagline && (
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                            {tenant.tagline}
                                        </p>
                                    )}

                                    {/* Color Dots */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <div
                                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                            style={{ backgroundColor: tenant.primaryColor }}
                                            title={`Primary: ${tenant.primaryColor}`}
                                        />
                                        <div
                                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                            style={{ backgroundColor: tenant.secondaryColor }}
                                            title={`Secondary: ${tenant.secondaryColor}`}
                                        />
                                        <div
                                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                            style={{ backgroundColor: tenant.accentColor }}
                                            title={`Accent: ${tenant.accentColor}`}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-border">
                                        <Badge
                                            variant={tenant.isActive ? "default" : "secondary"}
                                            className="text-xs"
                                        >
                                            {tenant.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {tenant._count?.events || 0}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {tenant._count?.users || 0}
                                            </span>
                                        </div>
                                    </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredTenants.length === 0 && (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 mb-5">
                                    <Landmark className="h-12 w-12 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-lg font-medium mb-2">No tenants found</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {tenants.length === 0
                                        ? "Create your first tenant to get started"
                                        : "No tenants match your search"}
                                </p>
                                {tenants.length === 0 && (
                                    <Link href="/dashboard/tenants/create">
                                        <Button className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Create Tenant
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
