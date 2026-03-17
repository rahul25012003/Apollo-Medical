"use client";

import React, { useState, useEffect } from "react";
import {
    Search,
    Plus,
    MoreHorizontal,
    Globe,
    Mail,
    Building2,
    Edit,
    Trash2,
    Eye,
    RotateCcw,
    ExternalLink,
    Upload,
    Crown,
    Award,
    Medal,
    Star,
    Calendar,
    Link2,
    X,
    Phone,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import { sponsorsService, Sponsor } from "@/services/sponsors";
import { useConfirmDialog, useAlertDialog } from "@/components/ui/confirm-dialog";
import { useTenantFilter } from "@/hooks/use-tenant-filter";

// Display sponsor type
interface DisplaySponsor {
    id: string;
    name: string;
    logo: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    description: string | null;
    isActive: boolean;
    eventCount: number;
    events: {
        id: string;
        title: string;
        tier: string;
        startDate: string;
    }[];
}

const tierConfig = {
    PLATINUM: {
        label: "Platinum",
        icon: Crown,
        className: "tier-platinum",
        textClass: "text-slate-700",
        bgClass: "bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100",
        borderClass: "border-slate-300",
        iconClass: "text-slate-600",
    },
    GOLD: {
        label: "Gold",
        icon: Award,
        className: "tier-gold",
        textClass: "text-yellow-700",
        bgClass: "bg-gradient-to-r from-yellow-50 via-yellow-100 to-yellow-50",
        borderClass: "border-yellow-300",
        iconClass: "text-yellow-600",
    },
    SILVER: {
        label: "Silver",
        icon: Medal,
        className: "tier-silver",
        textClass: "text-gray-600",
        bgClass: "bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100",
        borderClass: "border-gray-300",
        iconClass: "text-gray-500",
    },
    BRONZE: {
        label: "Bronze",
        icon: Star,
        className: "",
        textClass: "text-orange-700",
        bgClass: "bg-gradient-to-r from-orange-50 via-orange-100 to-orange-50",
        borderClass: "border-orange-300",
        iconClass: "text-orange-600",
    },
};

export default function SponsorsPage() {
    const { tenantFilterParams, effectiveTenantId, sessionLoading } = useTenantFilter();
    const [sponsors, setSponsors] = useState<DisplaySponsor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedSponsor, setSelectedSponsor] = useState<DisplaySponsor | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState("all");

    const { confirm, ConfirmDialog } = useConfirmDialog();
    const { alert, AlertDialog } = useAlertDialog();

    // Fetch sponsors from API
    useEffect(() => {
        if (sessionLoading) return;
        async function fetchSponsors() {
            try {
                setLoading(true);
                const response = await sponsorsService.getAll({ ...tenantFilterParams, limit: 500 });

                if (response.success && response.data) {
                    const sponsorsList = Array.isArray(response.data) ? response.data : [];
                    const mappedSponsors: DisplaySponsor[] = sponsorsList.map((sponsor: Sponsor) => ({
                        id: sponsor.id,
                        name: sponsor.name,
                        logo: sponsor.logo,
                        email: sponsor.email,
                        phone: sponsor.phone,
                        website: sponsor.website,
                        description: sponsor.description,
                        isActive: sponsor.isActive,
                        eventCount: sponsor._count?.eventSponsors || sponsor.eventSponsors?.length || 0,
                        events: sponsor.eventSponsors?.map((es) => ({
                            id: es.event.id,
                            title: es.event.title,
                            tier: es.tier,
                            startDate: new Date(es.event.startDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                            }),
                        })) || [],
                    }));
                    setSponsors(mappedSponsors);
                }
            } catch (error) {
                console.error("Failed to fetch sponsors:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchSponsors();
    }, [sessionLoading, effectiveTenantId]);

    // Get primary tier (highest tier from events)
    const getPrimaryTier = (sponsor: DisplaySponsor): string => {
        if (sponsor.events.length === 0) return "BRONZE";
        const tierOrder = ["PLATINUM", "GOLD", "SILVER", "BRONZE"];
        const tiers = sponsor.events.map((e) => e.tier);
        for (const tier of tierOrder) {
            if (tiers.includes(tier)) return tier;
        }
        return "BRONZE";
    };

    // Filter sponsors
    const filteredSponsors = sponsors.filter((sponsor) => {
        const matchesSearch = searchQuery === "" ||
            sponsor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sponsor.email?.toLowerCase().includes(searchQuery.toLowerCase());

        if (selectedTab === "all") return matchesSearch;
        if (selectedTab === "active") return matchesSearch && sponsor.isActive;
        if (selectedTab === "with-events") return matchesSearch && sponsor.eventCount > 0;

        // Filter by tier
        const primaryTier = getPrimaryTier(sponsor);
        return matchesSearch && primaryTier === selectedTab.toUpperCase();
    });

    // Stats
    const totalSponsors = sponsors.length;
    const activeSponsors = sponsors.filter((s) => s.isActive).length;
    const sponsorsWithEvents = sponsors.filter((s) => s.eventCount > 0).length;
    const totalEventAssignments = sponsors.reduce((sum, s) => sum + s.eventCount, 0);

    // Tier counts
    const tierCounts = {
        PLATINUM: sponsors.filter((s) => getPrimaryTier(s) === "PLATINUM").length,
        GOLD: sponsors.filter((s) => getPrimaryTier(s) === "GOLD").length,
        SILVER: sponsors.filter((s) => getPrimaryTier(s) === "SILVER").length,
        BRONZE: sponsors.filter((s) => getPrimaryTier(s) === "BRONZE" || s.eventCount === 0).length,
    };

    // Delete sponsor handler (soft delete - set isActive = false)
    const handleDeleteSponsor = async (sponsor: DisplaySponsor) => {
        const confirmed = await confirm({
            title: "Delete Sponsor",
            description: `Are you sure you want to delete "${sponsor.name}"? They will be marked as inactive and won't appear in new event selections.`,
            confirmText: "Delete",
            cancelText: "Cancel",
            variant: "danger",
        });

        if (!confirmed) return;

        try {
            const response = await sponsorsService.update(sponsor.id, { isActive: false });
            if (response.success) {
                setSponsors((prev) =>
                    prev.map((s) => (s.id === sponsor.id ? { ...s, isActive: false } : s))
                );
            } else {
                const errorMessage = typeof response.error === 'string'
                    ? response.error
                    : response.error?.message || "Failed to delete sponsor";
                alert({
                    title: "Delete Failed",
                    description: errorMessage,
                    variant: "error",
                });
            }
        } catch (error) {
            console.error("Failed to delete sponsor:", error);
            alert({
                title: "Delete Failed",
                description: "An unexpected error occurred while deleting the sponsor.",
                variant: "error",
            });
        }
    };

    // Restore sponsor handler (set isActive = true)
    const handleRestoreSponsor = async (sponsor: DisplaySponsor) => {
        try {
            const response = await sponsorsService.update(sponsor.id, { isActive: true });
            if (response.success) {
                setSponsors((prev) =>
                    prev.map((s) => (s.id === sponsor.id ? { ...s, isActive: true } : s))
                );
            } else {
                const errorMessage = typeof response.error === 'string'
                    ? response.error
                    : response.error?.message || "Failed to restore sponsor";
                alert({
                    title: "Restore Failed",
                    description: errorMessage,
                    variant: "error",
                });
            }
        } catch (error) {
            console.error("Failed to restore sponsor:", error);
            alert({
                title: "Restore Failed",
                description: "An unexpected error occurred while restoring the sponsor.",
                variant: "error",
            });
        }
    };

    const getTierBadge = (tier: string) => {
        const config = tierConfig[tier as keyof typeof tierConfig];
        if (!config) return null;
        const TierIcon = config.icon;
        return (
            <Badge
                variant="outline"
                className={cn(
                    "gap-1 font-medium border",
                    config.bgClass,
                    config.textClass,
                    config.borderClass
                )}
            >
                <TierIcon className={cn("h-3 w-3", config.iconClass)} />
                {config.label}
            </Badge>
        );
    };

    // Loading state
    if (loading) {
        return (
            <DashboardLayout title="Sponsors" subtitle="Manage event sponsors and partnerships">
                <AiimsLoader />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Sponsors"
            subtitle="Manage event sponsors and partnerships"
        >
            <ConfirmDialog />
            <AlertDialog />
            <div className="space-y-6 animate-fadeIn">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="card-premium">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/10">
                                    <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold animate-count">{totalSponsors}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-premium">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/10">
                                    <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold animate-count">{activeSponsors}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Active</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-premium">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-600/10">
                                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold animate-count">{sponsorsWithEvents}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">With Events</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-premium">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-600/10">
                                    <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold animate-count">{totalEventAssignments}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Assignments</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tier Overview */}
                <Card className="card-premium">
                    <CardHeader>
                        <CardTitle className="text-base">Sponsorship Tiers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                            {(["PLATINUM", "GOLD", "SILVER", "BRONZE"] as const).map((tier) => {
                                const config = tierConfig[tier];
                                const count = tierCounts[tier];
                                const TierIcon = config.icon;
                                return (
                                    <div
                                        key={tier}
                                        className={cn(
                                            "p-3 sm:p-4 rounded-xl border-2 text-center transition-all hover:scale-105 cursor-pointer shadow-sm hover:shadow-md",
                                            config.bgClass,
                                            config.borderClass,
                                            selectedTab === tier.toLowerCase() && "ring-2 ring-primary shadow-lg"
                                        )}
                                        onClick={() => setSelectedTab(tier.toLowerCase())}
                                    >
                                        <TierIcon className={cn("h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2", config.iconClass)} />
                                        <p className={cn("text-sm sm:text-base font-semibold", config.textClass)}>
                                            {config.label}
                                        </p>
                                        <p className="text-xl sm:text-2xl font-bold mt-1">{count}</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground">sponsors</p>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="flex flex-1 gap-3">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search sponsors..."
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
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/25">
                                <Plus className="w-4 h-4" />
                                Add Sponsor
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add New Sponsor</DialogTitle>
                                <DialogDescription>
                                    Add a sponsor or partner for your events
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                {/* Logo Upload */}
                                <div className="flex items-center gap-4">
                                    <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-border">
                                        <Upload className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <div className="space-y-1">
                                        <Button variant="outline" size="sm">
                                            Upload Logo
                                        </Button>
                                        <p className="text-xs text-muted-foreground">
                                            Recommended: 400x200px, PNG with transparency
                                        </p>
                                    </div>
                                </div>

                                <div className="section-divider-gradient my-2" />

                                {/* Basic Info */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Company/Organization Name *</Label>
                                    <Input id="name" placeholder="MedTech Solutions Pvt Ltd" />
                                </div>

                                <div className="section-divider-gradient my-2" />

                                {/* Contact Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" placeholder="contact@company.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input id="phone" type="tel" placeholder="+91 98765 43210" />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label htmlFor="website">Website</Label>
                                        <Input id="website" placeholder="https://www.company.com" />
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="description">About the Sponsor</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Brief description about the company..."
                                        rows={3}
                                    />
                                </div>

                                {/* Active Status */}
                                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                    <div className="space-y-0.5">
                                        <Label>Active Sponsor</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Active sponsors can be assigned to events
                                        </p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={() => setIsCreateOpen(false)}>Add Sponsor</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Sponsor View Dialog */}
                <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                    <DialogContent className="w-[95vw] sm:max-w-2xl">
                        {selectedSponsor && (
                            <>
                                <DialogHeader>
                                    <div className="flex items-start gap-4">
                                        <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                                            {selectedSponsor.logo ? (
                                                <img src={selectedSponsor.logo} alt={selectedSponsor.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <Building2 className="h-8 w-8 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <DialogTitle className="text-xl">
                                                    {selectedSponsor.name}
                                                </DialogTitle>
                                                {getTierBadge(getPrimaryTier(selectedSponsor))}
                                            </div>
                                            {selectedSponsor.description && (
                                                <DialogDescription className="mt-2">
                                                    {selectedSponsor.description}
                                                </DialogDescription>
                                            )}
                                            <div className="flex gap-2 mt-3">
                                                <Badge variant={selectedSponsor.isActive ? "default" : "secondary"}>
                                                    {selectedSponsor.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {selectedSponsor.eventCount} Event{selectedSponsor.eventCount !== 1 ? "s" : ""}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                    <div className="section-divider-gradient" />

                                    {/* Event Sponsorships */}
                                    {selectedSponsor.events.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold mb-3">Sponsored Events</h4>
                                            <div className="space-y-2">
                                                {selectedSponsor.events.map((event) => (
                                                    <div key={event.id} className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium text-sm">{event.title}</p>
                                                            <p className="text-xs text-muted-foreground">{event.startDate}</p>
                                                        </div>
                                                        {getTierBadge(event.tier)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Contact */}
                                    <div>
                                        <h4 className="font-semibold mb-3">Contact Information</h4>
                                        <div className="space-y-2 text-sm">
                                            {selectedSponsor.email && (
                                                <p className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <a
                                                        href={`mailto:${selectedSponsor.email}`}
                                                        className="text-primary hover:underline"
                                                    >
                                                        {selectedSponsor.email}
                                                    </a>
                                                </p>
                                            )}
                                            {selectedSponsor.phone && (
                                                <p className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    <a href={`tel:${selectedSponsor.phone}`}>
                                                        {selectedSponsor.phone}
                                                    </a>
                                                </p>
                                            )}
                                            {selectedSponsor.website && (
                                                <p className="flex items-center gap-2">
                                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                                    <a
                                                        href={selectedSponsor.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline flex items-center gap-1"
                                                    >
                                                        {selectedSponsor.website}
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="mt-4">
                                    <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                                        Close
                                    </Button>
                                    <Button>Edit Sponsor</Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Sponsors List */}
                <Card className="card-premium">
                    <CardHeader className="pb-3 px-3 sm:px-6">
                        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                            <TabsList className="w-full sm:w-auto h-auto flex-wrap sm:flex-nowrap gap-1 p-1 bg-muted/50 rounded-xl">
                                <TabsTrigger value="all" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                                    All ({totalSponsors})
                                </TabsTrigger>
                                <TabsTrigger value="active" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                                    Active ({activeSponsors})
                                </TabsTrigger>
                                <TabsTrigger value="with-events" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                                    With Events ({sponsorsWithEvents})
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSponsors.map((sponsor, index) => {
                                const primaryTier = getPrimaryTier(sponsor);
                                const config = tierConfig[primaryTier as keyof typeof tierConfig];
                                const tierGradient = sponsor.eventCount > 0
                                    ? primaryTier === "PLATINUM" ? "bg-gradient-to-r from-slate-400 via-slate-300 to-slate-400"
                                    : primaryTier === "GOLD" ? "bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400"
                                    : primaryTier === "SILVER" ? "bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400"
                                    : "bg-gradient-to-r from-orange-400 via-orange-300 to-orange-400"
                                    : "bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500";
                                return (
                                    <div
                                        key={sponsor.id}
                                        className={cn(
                                            "card-premium rounded-xl overflow-hidden border-2 bg-card animate-fadeIn",
                                            sponsor.eventCount > 0 ? config?.borderClass : "border-border"
                                        )}
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                    >
                                        <div className={cn("h-1", tierGradient)} />
                                        <div className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden",
                                                    sponsor.eventCount > 0 ? config?.bgClass : "bg-muted"
                                                )}>
                                                    {sponsor.logo ? (
                                                        <img src={sponsor.logo} alt={sponsor.name} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Building2 className={cn(
                                                            "w-6 h-6",
                                                            sponsor.eventCount > 0 ? config?.iconClass : "text-muted-foreground"
                                                        )} />
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-foreground line-clamp-1">
                                                        {sponsor.name}
                                                    </h3>
                                                    {sponsor.eventCount > 0 && getTierBadge(primaryTier)}
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedSponsor(sponsor);
                                                            setIsViewOpen(true);
                                                        }}
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    {sponsor.website && (
                                                        <DropdownMenuItem asChild>
                                                            <a href={sponsor.website} target="_blank" rel="noopener noreferrer">
                                                                <Link2 className="mr-2 h-4 w-4" />
                                                                Visit Website
                                                            </a>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    {sponsor.isActive ? (
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => handleDeleteSponsor(sponsor)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            onClick={() => handleRestoreSponsor(sponsor)}
                                                        >
                                                            <RotateCcw className="mr-2 h-4 w-4" />
                                                            Restore
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {sponsor.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                {sponsor.description}
                                            </p>
                                        )}

                                        <div className="space-y-1 text-sm text-muted-foreground mb-3">
                                            {sponsor.email && (
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-3 h-3" />
                                                    <span className="truncate">{sponsor.email}</span>
                                                </div>
                                            )}
                                            {sponsor.website && (
                                                <div className="flex items-center gap-2">
                                                    <Globe className="w-3 h-3" />
                                                    <span className="truncate">
                                                        {sponsor.website.replace("https://", "").replace("http://", "")}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-border">
                                            <Badge variant={sponsor.isActive ? "default" : "secondary"} className="text-xs">
                                                {sponsor.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {sponsor.eventCount} event{sponsor.eventCount !== 1 ? "s" : ""}
                                            </span>
                                        </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {filteredSponsors.length === 0 && (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 mb-5">
                                    <Building2 className="h-10 w-10 text-teal-500" />
                                </div>
                                <h3 className="text-lg font-medium mb-2">No sponsors found</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {sponsors.length === 0
                                        ? "Add your first sponsor to get started"
                                        : "No sponsors match your search"}
                                </p>
                                {sponsors.length === 0 && (
                                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Add Sponsor
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
