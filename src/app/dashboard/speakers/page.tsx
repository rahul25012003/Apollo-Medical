"use client";

import React, { useState, useEffect } from "react";
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    RotateCcw,
    Mail,
    Phone,
    Building2,
    Calendar,
    Upload,
    User,
    GraduationCap,
    Linkedin,
    Twitter,
    Globe,
    X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { speakersService, Speaker } from "@/services/speakers";
import { useConfirmDialog, useAlertDialog } from "@/components/ui/confirm-dialog";
import { useTenantFilter } from "@/hooks/use-tenant-filter";

// Display speaker type
interface DisplaySpeaker {
    id: string;
    name: string;
    photo: string | null;
    designation: string | null;
    department: string | null;
    institution: string | null;
    email: string | null;
    phone: string | null;
    biography: string | null;
    isActive: boolean;
    linkedin: string | null;
    twitter: string | null;
    website: string | null;
    eventCount: number;
    events: {
        id: string;
        title: string;
        topic: string | null;
        status: string;
        startDate: string;
    }[];
}

export default function SpeakersPage() {
    const { tenantFilterParams, effectiveTenantId, sessionLoading } = useTenantFilter();
    const [speakers, setSpeakers] = useState<DisplaySpeaker[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedSpeaker, setSelectedSpeaker] = useState<DisplaySpeaker | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState("all");

    const { confirm, ConfirmDialog } = useConfirmDialog();
    const { alert, AlertDialog } = useAlertDialog();

    // Fetch speakers from API
    useEffect(() => {
        if (sessionLoading) return;
        async function fetchSpeakers() {
            try {
                setLoading(true);
                const response = await speakersService.getAll({ ...tenantFilterParams, limit: 500 });

                if (response.success && response.data) {
                    const speakersList = Array.isArray(response.data) ? response.data : [];
                    const mappedSpeakers: DisplaySpeaker[] = speakersList.map((speaker: Speaker) => ({
                        id: speaker.id,
                        name: speaker.name,
                        photo: speaker.photo,
                        designation: speaker.designation,
                        department: speaker.department,
                        institution: speaker.institution,
                        email: speaker.email,
                        phone: speaker.phone,
                        biography: speaker.biography,
                        isActive: speaker.isActive,
                        linkedin: speaker.linkedin,
                        twitter: speaker.twitter,
                        website: speaker.website,
                        eventCount: speaker._count?.eventSpeakers || speaker.eventSpeakers?.length || 0,
                        events: speaker.eventSpeakers?.map((es) => ({
                            id: es.event.id,
                            title: es.event.title,
                            topic: es.topic,
                            status: es.status,
                            startDate: new Date(es.event.startDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                            }),
                        })) || [],
                    }));
                    setSpeakers(mappedSpeakers);
                }
            } catch (error) {
                console.error("Failed to fetch speakers:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchSpeakers();
    }, [sessionLoading, effectiveTenantId]);

    // Filter speakers
    const filteredSpeakers = speakers.filter((speaker) => {
        const matchesSearch = searchQuery === "" ||
            speaker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            speaker.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            speaker.institution?.toLowerCase().includes(searchQuery.toLowerCase());

        if (selectedTab === "all") return matchesSearch;
        if (selectedTab === "active") return matchesSearch && speaker.isActive;
        if (selectedTab === "inactive") return matchesSearch && !speaker.isActive;
        if (selectedTab === "with-events") return matchesSearch && speaker.eventCount > 0;
        return matchesSearch;
    });

    // Stats
    const totalSpeakers = speakers.length;
    const activeSpeakers = speakers.filter((s) => s.isActive).length;
    const speakersWithEvents = speakers.filter((s) => s.eventCount > 0).length;
    const totalEventAssignments = speakers.reduce((sum, s) => sum + s.eventCount, 0);

    // Delete speaker handler (soft delete - set isActive = false)
    const handleDeleteSpeaker = async (speaker: DisplaySpeaker) => {
        const confirmed = await confirm({
            title: "Delete Speaker",
            description: `Are you sure you want to delete "${speaker.name}"? They will be marked as inactive and won't appear in new event selections.`,
            confirmText: "Delete",
            cancelText: "Cancel",
            variant: "danger",
        });

        if (!confirmed) return;

        try {
            const response = await speakersService.update(speaker.id, { isActive: false });
            if (response.success) {
                setSpeakers((prev) =>
                    prev.map((s) => (s.id === speaker.id ? { ...s, isActive: false } : s))
                );
            } else {
                const errorMessage = typeof response.error === 'string'
                    ? response.error
                    : response.error?.message || "Failed to delete speaker";
                alert({
                    title: "Delete Failed",
                    description: errorMessage,
                    variant: "error",
                });
            }
        } catch (error) {
            console.error("Failed to delete speaker:", error);
            alert({
                title: "Delete Failed",
                description: "An unexpected error occurred while deleting the speaker.",
                variant: "error",
            });
        }
    };

    // Restore speaker handler (set isActive = true)
    const handleRestoreSpeaker = async (speaker: DisplaySpeaker) => {
        try {
            const response = await speakersService.update(speaker.id, { isActive: true });
            if (response.success) {
                setSpeakers((prev) =>
                    prev.map((s) => (s.id === speaker.id ? { ...s, isActive: true } : s))
                );
            } else {
                const errorMessage = typeof response.error === 'string'
                    ? response.error
                    : response.error?.message || "Failed to restore speaker";
                alert({
                    title: "Restore Failed",
                    description: errorMessage,
                    variant: "error",
                });
            }
        } catch (error) {
            console.error("Failed to restore speaker:", error);
            alert({
                title: "Restore Failed",
                description: "An unexpected error occurred while restoring the speaker.",
                variant: "error",
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { class: string; label: string }> = {
            CONFIRMED: { class: "bg-green-100 text-green-700", label: "Confirmed" },
            PENDING: { class: "bg-yellow-100 text-yellow-700", label: "Pending" },
            INVITED: { class: "bg-blue-100 text-blue-700", label: "Invited" },
            DECLINED: { class: "bg-red-100 text-red-700", label: "Declined" },
        };
        const config = statusConfig[status] || statusConfig.PENDING;
        return (
            <Badge variant="outline" className={cn("border-0 text-xs", config.class)}>
                {config.label}
            </Badge>
        );
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    // Loading state
    if (loading) {
        return (
            <DashboardLayout title="Speakers" subtitle="Manage speaker profiles and session assignments">
                <AiimsLoader />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Speakers"
            subtitle="Manage speaker profiles and session assignments"
        >
            <ConfirmDialog />
            <AlertDialog />
            <div className="space-y-6 animate-fadeIn bg-gradient-to-br from-slate-50/80 via-white to-teal-50/20 -m-6 p-6 rounded-2xl">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="card-premium">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/10">
                                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold animate-count">{totalSpeakers}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-premium">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
                                    <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold animate-count">{activeSpeakers}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Active</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-premium">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10">
                                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold animate-count">{speakersWithEvents}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">With Events</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-premium">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                                    <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold animate-count">{totalEventAssignments}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Assignments</p>
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
                                placeholder="Search speakers..."
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
                                Add Speaker
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add New Speaker</DialogTitle>
                                <DialogDescription>
                                    Add a speaker profile for your events
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                {/* Photo Upload */}
                                <div className="flex items-center gap-4">
                                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                                        <Upload className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <div className="space-y-1">
                                        <Button variant="outline" size="sm">
                                            Upload Photo
                                        </Button>
                                        <p className="text-xs text-muted-foreground">
                                            Recommended: 400x400px, JPG or PNG
                                        </p>
                                    </div>
                                </div>

                                <div className="section-divider-gradient my-2" />

                                {/* Basic Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="sm:col-span-2 space-y-2">
                                        <Label htmlFor="name" className="text-xs sm:text-sm">Full Name *</Label>
                                        <Input id="name" placeholder="Dr. John Smith" className="h-9 sm:h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="designation" className="text-xs sm:text-sm">Designation</Label>
                                        <Input id="designation" placeholder="Professor & Head" className="h-9 sm:h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="department" className="text-xs sm:text-sm">Department</Label>
                                        <Input id="department" placeholder="Neurology" className="h-9 sm:h-10" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="institution">Institution</Label>
                                    <Input id="institution" placeholder="Medical College Name" />
                                </div>

                                <div className="section-divider-gradient my-2" />

                                {/* Contact Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                                        <Input id="email" type="email" placeholder="speaker@institution.edu" className="h-9 sm:h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-xs sm:text-sm">Phone</Label>
                                        <Input id="phone" type="tel" placeholder="+91 98765 43210" className="h-9 sm:h-10" />
                                    </div>
                                </div>

                                <div className="section-divider-gradient my-2" />

                                {/* Biography */}
                                <div className="space-y-2">
                                    <Label htmlFor="biography">Short Biography</Label>
                                    <Textarea
                                        id="biography"
                                        placeholder="A brief introduction about the speaker's background, achievements, and expertise..."
                                        rows={4}
                                    />
                                </div>

                                {/* Social Links */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="linkedin" className="text-xs sm:text-sm">LinkedIn URL</Label>
                                        <Input id="linkedin" placeholder="https://linkedin.com/in/..." className="h-9 sm:h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="website" className="text-xs sm:text-sm">Website</Label>
                                        <Input id="website" placeholder="https://..." className="h-9 sm:h-10" />
                                    </div>
                                </div>

                                {/* Active Status */}
                                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                    <div className="space-y-0.5">
                                        <Label>Active Speaker</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Active speakers can be assigned to events
                                        </p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={() => setIsCreateOpen(false)}>Add Speaker</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Speaker View Dialog */}
                <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                    <DialogContent className="w-[95vw] sm:max-w-2xl">
                        {selectedSpeaker && (
                            <>
                                <DialogHeader>
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-20 w-20">
                                            <AvatarImage src={selectedSpeaker.photo || undefined} />
                                            <AvatarFallback className="text-lg bg-primary/10 text-primary">
                                                {getInitials(selectedSpeaker.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <DialogTitle className="text-xl">
                                                {selectedSpeaker.name}
                                            </DialogTitle>
                                            <DialogDescription className="mt-1">
                                                <span className="font-medium text-foreground">
                                                    {selectedSpeaker.designation}
                                                </span>
                                                {selectedSpeaker.department && `, ${selectedSpeaker.department}`}
                                            </DialogDescription>
                                            {selectedSpeaker.institution && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm">{selectedSpeaker.institution}</span>
                                                </div>
                                            )}
                                            <div className="flex gap-2 mt-3">
                                                <Badge variant={selectedSpeaker.isActive ? "default" : "secondary"}>
                                                    {selectedSpeaker.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {selectedSpeaker.eventCount} Event{selectedSpeaker.eventCount !== 1 ? "s" : ""}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                    <div className="section-divider-gradient" />

                                    {/* Event Assignments */}
                                    {selectedSpeaker.events.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold mb-2">Event Assignments</h4>
                                            <div className="space-y-2">
                                                {selectedSpeaker.events.map((event) => (
                                                    <div key={event.id} className="p-3 rounded-lg bg-muted/50">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <p className="font-medium text-sm">{event.title}</p>
                                                                {event.topic && (
                                                                    <p className="text-sm text-primary mt-1">Topic: {event.topic}</p>
                                                                )}
                                                                <p className="text-xs text-muted-foreground mt-1">{event.startDate}</p>
                                                            </div>
                                                            {getStatusBadge(event.status)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Biography */}
                                    {selectedSpeaker.biography && (
                                        <div>
                                            <h4 className="font-semibold mb-2">Biography</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {selectedSpeaker.biography}
                                            </p>
                                        </div>
                                    )}

                                    {/* Contact */}
                                    <div>
                                        <h4 className="font-semibold mb-2">Contact</h4>
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <a
                                                href={`mailto:${selectedSpeaker.email}`}
                                                className="flex items-center gap-1 text-primary hover:underline"
                                            >
                                                <Mail className="h-4 w-4" />
                                                {selectedSpeaker.email}
                                            </a>
                                            {selectedSpeaker.phone && (
                                                <a
                                                    href={`tel:${selectedSpeaker.phone}`}
                                                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                                                >
                                                    <Phone className="h-4 w-4" />
                                                    {selectedSpeaker.phone}
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Social Links */}
                                    {(selectedSpeaker.linkedin || selectedSpeaker.twitter || selectedSpeaker.website) && (
                                        <div>
                                            <h4 className="font-semibold mb-2">Links</h4>
                                            <div className="flex gap-2">
                                                {selectedSpeaker.linkedin && (
                                                    <Button variant="outline" size="sm" asChild>
                                                        <a href={selectedSpeaker.linkedin} target="_blank" rel="noopener noreferrer">
                                                            <Linkedin className="h-4 w-4 mr-1" />
                                                            LinkedIn
                                                        </a>
                                                    </Button>
                                                )}
                                                {selectedSpeaker.twitter && (
                                                    <Button variant="outline" size="sm" asChild>
                                                        <a href={selectedSpeaker.twitter} target="_blank" rel="noopener noreferrer">
                                                            <Twitter className="h-4 w-4 mr-1" />
                                                            Twitter
                                                        </a>
                                                    </Button>
                                                )}
                                                {selectedSpeaker.website && (
                                                    <Button variant="outline" size="sm" asChild>
                                                        <a href={selectedSpeaker.website} target="_blank" rel="noopener noreferrer">
                                                            <Globe className="h-4 w-4 mr-1" />
                                                            Website
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <DialogFooter className="mt-4">
                                    <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                                        Close
                                    </Button>
                                    <Button>Edit Speaker</Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Speakers Grid */}
                <Card className="card-premium">
                    <CardHeader className="pb-3 px-3 sm:px-6">
                        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                            <TabsList className="w-full sm:w-auto h-auto flex-wrap sm:flex-nowrap gap-1 p-1 bg-muted/50 rounded-xl">
                                <TabsTrigger value="all" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                                    All ({totalSpeakers})
                                </TabsTrigger>
                                <TabsTrigger value="active" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                                    Active ({activeSpeakers})
                                </TabsTrigger>
                                <TabsTrigger value="with-events" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                                    With Events ({speakersWithEvents})
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSpeakers.map((speaker, index) => (
                                <div
                                    key={speaker.id}
                                    className="card-premium rounded-xl overflow-hidden animate-fadeIn hover:shadow-xl hover:-translate-y-1 hover:border-teal-200/30 transition-all duration-400"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <div className="h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500" />
                                    <div className="p-4">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-14 w-14 ring-2 ring-white shadow-md">
                                            <AvatarImage src={speaker.photo || undefined} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                                {getInitials(speaker.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-semibold truncate">{speaker.name}</h3>
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {speaker.designation || "Speaker"}
                                                    </p>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedSpeaker(speaker);
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
                                                        <DropdownMenuItem>
                                                            <Mail className="mr-2 h-4 w-4" />
                                                            Send Email
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {speaker.isActive ? (
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => handleDeleteSpeaker(speaker)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem
                                                                onClick={() => handleRestoreSpeaker(speaker)}
                                                            >
                                                                <RotateCcw className="mr-2 h-4 w-4" />
                                                                Restore
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>

                                    {speaker.institution && (
                                        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                                            <Building2 className="h-3 w-3" />
                                            <span className="truncate">{speaker.institution}</span>
                                        </div>
                                    )}

                                    {speaker.events.length > 0 && (
                                        <div className="mt-3 p-3 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/50">
                                            <p className="text-sm font-medium text-foreground line-clamp-1">
                                                {speaker.events[0].title}
                                            </p>
                                            {speaker.events[0].topic && (
                                                <p className="text-xs text-primary mt-1 line-clamp-1">
                                                    {speaker.events[0].topic}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {speaker.events[0].startDate}
                                                </div>
                                                {speaker.eventCount > 1 && (
                                                    <span className="text-primary">+{speaker.eventCount - 1} more</span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-3 flex items-center justify-between">
                                        <Badge variant={speaker.isActive ? "default" : "secondary"} className="text-xs">
                                            {speaker.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {speaker.eventCount} event{speaker.eventCount !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredSpeakers.length === 0 && (
                            <div className="text-center py-16 px-8">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 mb-5">
                                    <User className="h-10 w-10 text-teal-500/50" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">No speakers found</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {speakers.length === 0
                                        ? "Add your first speaker to get started"
                                        : "No speakers match your search"}
                                </p>
                                {speakers.length === 0 && (
                                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Add Speaker
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
