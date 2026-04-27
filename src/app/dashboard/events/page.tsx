"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Calendar,
    Plus,
    Search,
    MoreHorizontal,
    MapPin,
    Users,
    Clock,
    Eye,
    Edit,
    Copy,
    Trash2,
    UserPlus,
    Award,
    Mail,
    FileText,
    ChevronDown,
    X,
    SlidersHorizontal,
    Grid3X3,
    List,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { validateEventForPublish, calculateEventStatus } from "@/lib/event-validations";
import { getEffectiveEventStatus } from "@/lib/event-utils";
import { EVENT_TYPES, EVENT_CATEGORIES, EVENT_STATUSES } from "@/lib/event-constants";
import { eventsService, Event } from "@/services/events";
import { useTenantFilter } from "@/hooks/use-tenant-filter";
import { useConfirmDialog, useAlertDialog } from "@/components/ui/confirm-dialog";
import { usePermissions } from "@/hooks/use-permissions";

// Display event type
interface DisplayEvent {
    id: string;
    title: string;
    date: string;
    startDate: string;
    endDate: string;
    time: string;
    location: string;
    city: string;
    registrations: number;
    capacity: number;
    status: string;
    type: string;
    category: string | null;
    revenue: number;
    cmeCredits: number | null;
    isPublished: boolean;
    /** Total registrations across all roles (delegates + speakers + organizers + ...) */
    totalRegistrations: number;
    /** Registrations grouped by participantRole (DELEGATE, SPEAKER, ORGANIZER, …). */
    registrationsByRole: Record<string, number>;
}

// Build filter options from shared constants
const categories = ["All Categories", ...EVENT_CATEGORIES.map(c => c.value)];
const eventTypes = ["All Types", ...EVENT_TYPES.map(t => t.value)];
const statuses = ["All Status", ...EVENT_STATUSES.map(s => s.value)];

export default function EventsPage() {
    const router = useRouter();
    const { tenantFilterParams, effectiveTenantId, sessionLoading } = useTenantFilter();
    const [events, setEvents] = useState<DisplayEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All Categories");
    const [selectedType, setSelectedType] = useState("All Types");
    const [selectedStatus, setSelectedStatus] = useState("All Status");
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Validation errors dialog state
    const [validationErrorsOpen, setValidationErrorsOpen] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [validationEventId, setValidationEventId] = useState<string>("");

    const { confirm, ConfirmDialog } = useConfirmDialog();
    const { alert, AlertDialog } = useAlertDialog();

    // RBAC Permissions
    const { can } = usePermissions();
    const canCreateEvent = can("events.create");
    const canEditEvent = can("events.edit");
    const canDeleteEvent = can("events.delete");
    const canCreateRegistration = can("registrations.create");
    const canViewRegistrations = can("registrations.view");
    const canIssueCertificates = can("certificates.issue");

    // Fetch events from API
    useEffect(() => {
        if (sessionLoading) return;
        async function fetchEvents() {
            try {
                setLoading(true);
                const response = await eventsService.getAll({ ...tenantFilterParams, limit: 200 });

                if (response.success && response.data) {
                    const eventsList = Array.isArray(response.data) ? response.data : [];
                    const mappedEvents: DisplayEvent[] = eventsList.map((event: Event) => {
                        const roleCounts = event.registrationsByRole || {};
                        const totalReg = Object.values(roleCounts).reduce((sum, n) => sum + n, 0);
                        const delegateCount = event._count?.registrations || 0;
                        return {
                            id: event.id,
                            title: event.title,
                            date: new Date(event.startDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                            }),
                            startDate: event.startDate,
                            endDate: event.endDate,
                            time: event.startTime && event.endTime
                                ? `${event.startTime} - ${event.endTime}`
                                : event.startTime || "TBA",
                            location: event.location || "TBA",
                            city: event.city || "Virtual",
                            registrations: delegateCount,
                            capacity: event.capacity,
                            status: getEffectiveEventStatus({ status: event.status, startDate: event.startDate, endDate: event.endDate }),
                            type: event.type,
                            category: event.category,
                            revenue: delegateCount * event.price,
                            cmeCredits: event.cmeCredits,
                            isPublished: event.isPublished,
                            totalRegistrations: totalReg,
                            registrationsByRole: roleCounts,
                        };
                    });
                    setEvents(mappedEvents);
                }
            } catch (error) {
                console.error("Failed to fetch events:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, [sessionLoading, effectiveTenantId]);

    // Filter events
    const filteredEvents = events.filter((event) => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "All Categories" || event.category === selectedCategory;
        const matchesType = selectedType === "All Types" || event.type === selectedType;
        const matchesStatus = selectedStatus === "All Status" || event.status === selectedStatus;
        return matchesSearch && matchesCategory && matchesType && matchesStatus;
    });

    // Count active filters
    const activeFilterCount = [
        selectedCategory !== "All Categories",
        selectedType !== "All Types",
        selectedStatus !== "All Status",
    ].filter(Boolean).length;

    // Clear all filters
    const clearFilters = () => {
        setSelectedCategory("All Categories");
        setSelectedType("All Types");
        setSelectedStatus("All Status");
        setSearchQuery("");
    };

    // Duplicate event handler
    const handleDuplicateEvent = async (eventId: string, eventTitle: string) => {
        const confirmed = await confirm({
            title: "Duplicate Event",
            description: `Create a copy of "${eventTitle}"? The new event will be scheduled 3 months from now and set as a draft.`,
            confirmText: "Duplicate",
            cancelText: "Cancel",
            variant: "info",
        });

        if (!confirmed) return;

        try {
            const response = await eventsService.duplicate(eventId);
            if (response.success && response.data) {
                // Redirect to edit the new event
                router.push(`/dashboard/events/${response.data.id}/edit`);
            } else {
                const errorMessage = typeof response.error === 'string'
                    ? response.error
                    : response.error?.message || "Failed to duplicate event";
                alert({
                    title: "Duplicate Failed",
                    description: errorMessage,
                    variant: "error",
                });
            }
        } catch (error) {
            console.error("Failed to duplicate event:", error);
            alert({
                title: "Duplicate Failed",
                description: "An unexpected error occurred while duplicating the event.",
                variant: "error",
            });
        }
    };

    // Delete event handler
    const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
        const event = events.find(e => e.id === eventId);
        const regCount = event?.registrations || 0;
        const confirmed = await confirm({
            title: "Delete Event",
            description: regCount > 0
                ? `Are you sure you want to delete "${eventTitle}"? This will also delete ${regCount} registration(s). This action cannot be undone.`
                : `Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`,
            confirmText: "Delete",
            cancelText: "Cancel",
            variant: "danger",
        });

        if (!confirmed) return;

        try {
            const response = await eventsService.delete(eventId);
            if (response.success) {
                setEvents((prev) => prev.filter((e) => e.id !== eventId));
            } else {
                const errorMessage = typeof response.error === 'string'
                    ? response.error
                    : response.error?.message || "Failed to delete event";
                alert({
                    title: "Delete Failed",
                    description: errorMessage,
                    variant: "error",
                });
            }
        } catch (error) {
            console.error("Failed to delete event:", error);
            alert({
                title: "Delete Failed",
                description: "An unexpected error occurred while deleting the event.",
                variant: "error",
            });
        }
    };

    // Publish event handler
    const handlePublishEvent = async (eventId: string, eventTitle: string) => {
        // First fetch full event data to validate
        try {
            const eventResponse = await eventsService.getById(eventId);
            if (!eventResponse.success || !eventResponse.data) {
                alert({
                    title: "Error",
                    description: "Failed to fetch event details for validation.",
                    variant: "error",
                });
                return;
            }

            const fullEvent = eventResponse.data;

            // Validate the event
            const validation = validateEventForPublish({
                title: fullEvent.title,
                description: fullEvent.description,
                startDate: fullEvent.startDate,
                endDate: fullEvent.endDate,
                startTime: fullEvent.startTime,
                endTime: fullEvent.endTime,
                registrationDeadline: fullEvent.registrationDeadline,
                location: fullEvent.location,
                capacity: fullEvent.capacity,
                organizer: fullEvent.organizer,
                contactEmail: fullEvent.contactEmail,
                contactPhone: fullEvent.contactPhone,
                price: fullEvent.price,
                eventSpeakers: fullEvent.eventSpeakers,
            });

            if (!validation.isValid) {
                setValidationErrors(validation.errors);
                setValidationEventId(eventId);
                setValidationErrorsOpen(true);
                return;
            }

            // Show confirmation dialog
            const confirmed = await confirm({
                title: "Publish Event",
                description: `Are you sure you want to publish "${eventTitle}"? This will make the event visible to the public.`,
                confirmText: "Publish",
                cancelText: "Cancel",
                variant: "info",
            });

            if (!confirmed) return;

            const newStatus = calculateEventStatus(fullEvent.startDate, fullEvent.endDate);

            const response = await eventsService.update(eventId, {
                isPublished: true,
                status: newStatus
            });
            if (response.success) {
                setEvents((prev) =>
                    prev.map((e) => (e.id === eventId ? { ...e, isPublished: true, status: newStatus } : e))
                );
            } else {
                const errorMessage = typeof response.error === 'string'
                    ? response.error
                    : response.error?.message || "Failed to publish event";
                alert({
                    title: "Publish Failed",
                    description: errorMessage,
                    variant: "error",
                });
            }
        } catch (error) {
            console.error("Failed to publish event:", error);
            alert({
                title: "Publish Failed",
                description: "An unexpected error occurred while publishing the event.",
                variant: "error",
            });
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "UPCOMING":
                return { label: "Upcoming", className: "bg-blue-100 text-blue-700 border-blue-200 font-semibold shadow-sm", icon: Calendar };
            case "ACTIVE":
                return { label: "Active", className: "bg-green-100 text-green-700 border-green-200 font-semibold shadow-sm", icon: CheckCircle2 };
            case "COMPLETED":
                return { label: "Completed", className: "bg-gray-100 text-gray-700 border-gray-200 font-semibold shadow-sm", icon: CheckCircle2 };
            case "DRAFT":
                return { label: "Draft", className: "bg-yellow-100 text-yellow-700 border-yellow-200 font-semibold shadow-sm", icon: FileText };
            case "CANCELLED":
                return { label: "Cancelled", className: "bg-red-100 text-red-700 border-red-200 font-semibold shadow-sm", icon: AlertCircle };
            default:
                return { label: status, className: "bg-gray-100 text-gray-700 border-gray-200 font-semibold shadow-sm", icon: Calendar };
        }
    };

    const getCapacityStatus = (registrations: number, capacity: number) => {
        const percentage = capacity > 0 ? (registrations / capacity) * 100 : 0;
        if (percentage >= 100) return { text: "Registration Closed", color: "text-red-600", bgColor: "bg-red-500" };
        if (percentage >= 80) return { text: "Almost Full", color: "text-orange-600", bgColor: "bg-orange-500" };
        if (percentage >= 50) return { text: "Filling Up", color: "text-yellow-600", bgColor: "bg-yellow-500" };
        return { text: "Available", color: "text-green-600", bgColor: "bg-green-500" };
    };

    // Build an ordered list of (roleLabel, count) for display, delegate first
    const roleBreakdown = (byRole: Record<string, number>): { key: string; label: string; count: number }[] => {
        const order = ["DELEGATE", "SPEAKER", "ORGANIZER", "CHAIRPERSON", "JUDGE", "VOLUNTEER"];
        const labelFor = (key: string) => {
            const k = key.toUpperCase();
            return k.charAt(0) + k.slice(1).toLowerCase();
        };
        const keys = Object.keys(byRole).filter((k) => byRole[k] > 0);
        keys.sort((a, b) => {
            const ai = order.indexOf(a.toUpperCase());
            const bi = order.indexOf(b.toUpperCase());
            if (ai === -1 && bi === -1) return a.localeCompare(b);
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
        });
        return keys.map((k) => ({ key: k, label: labelFor(k), count: byRole[k] }));
    };

    // Loading state
    if (loading) {
        return (
            <DashboardLayout title="Events" subtitle="Manage your events and sessions">
                <AiimsLoader />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Events" subtitle="Manage your events and sessions">
            <ConfirmDialog />
            <AlertDialog />
            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col gap-4">
                    {/* Top Row: Search and Create */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-between">
                        <div className="flex flex-1 gap-3">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md search-premium rounded-xl">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search events..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-10 h-11 rounded-xl border-border/60 bg-background"
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

                            {/* Filter Toggle - Mobile */}
                            <Button
                                variant="outline"
                                className="lg:hidden gap-2"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                                        {activeFilterCount}
                                    </Badge>
                                )}
                                <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
                            </Button>

                            {/* View Toggle */}
                            <div className="hidden sm:flex border rounded-lg p-1">
                                <Button
                                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setViewMode("grid")}
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant={viewMode === "list" ? "secondary" : "ghost"}
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setViewMode("list")}
                                >
                                    <List className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {canCreateEvent && (
                            <Link href="/dashboard/events/create">
                                <Button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all w-full sm:w-auto h-11 rounded-xl px-6">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Event
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Desktop Filters */}
                    <div className="hidden lg:flex flex-wrap gap-3 items-center">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-full sm:w-[160px]">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger className="w-full sm:w-[140px]">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {eventTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type === "All Types" ? type : type.charAt(0) + type.slice(1).toLowerCase()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="w-full sm:w-[140px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {statuses.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {status === "All Status" ? status : status.charAt(0) + status.slice(1).toLowerCase()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {activeFilterCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                                <X className="w-4 h-4 mr-1" />
                                Clear filters
                            </Button>
                        )}
                    </div>

                    {/* Mobile Filters */}
                    {showFilters && (
                        <div className="lg:hidden grid grid-cols-2 gap-3 p-4 bg-muted/50 rounded-xl animate-fadeIn">
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {eventTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type === "All Types" ? type : type.charAt(0) + type.slice(1).toLowerCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {status === "All Status" ? status : status.charAt(0) + status.slice(1).toLowerCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {activeFilterCount > 0 && (
                                <Button variant="outline" size="sm" onClick={clearFilters} className="col-span-2">
                                    <X className="w-4 h-4 mr-1" />
                                    Clear all filters
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Results Count */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing <span className="font-medium text-foreground">{filteredEvents.length}</span> of {events.length} events
                    </p>
                </div>

                {/* Events Grid */}
                {filteredEvents.length === 0 ? (
                    <div className="text-center py-16 bg-gradient-to-b from-muted/10 to-muted/30 rounded-2xl border border-dashed border-border/40 backdrop-blur-sm">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center mx-auto mb-4">
                            <Calendar className="h-8 w-8 text-teal-600" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">No events found</h3>
                        <p className="text-muted-foreground mb-4">
                            {events.length === 0
                                ? "Create your first event to get started"
                                : "Try adjusting your filters or search query"}
                        </p>
                        {events.length === 0 ? (
                            <Link href="/dashboard/events/create">
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Event
                                </Button>
                            </Link>
                        ) : (
                            <Button variant="outline" onClick={clearFilters}>
                                Clear all filters
                            </Button>
                        )}
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredEvents.map((event) => {
                            const statusConfig = getStatusConfig(event.status);
                            const capacityStatus = getCapacityStatus(event.registrations, event.capacity);
                            const StatusIcon = statusConfig.icon;

                            return (
                                <div
                                    key={event.id}
                                    className="card-premium group relative bg-background rounded-2xl border border-border/60 p-5 hover:border-primary/20 overflow-hidden hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-400"
                                >
                                    {/* Top gradient accent line */}
                                    <div className={cn(
                                        "absolute top-0 left-0 right-0 h-1 rounded-t-2xl",
                                        event.status === "ACTIVE" && "bg-gradient-to-r from-green-400 to-emerald-500",
                                        event.status === "UPCOMING" && "bg-gradient-to-r from-blue-400 to-cyan-500",
                                        event.status === "DRAFT" && "bg-gradient-to-r from-amber-400 to-yellow-500",
                                        event.status === "COMPLETED" && "bg-gradient-to-r from-gray-300 to-gray-400",
                                        event.status === "CANCELLED" && "bg-gradient-to-r from-red-400 to-rose-500",
                                    )} />
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={cn("text-xs", statusConfig.className)}>
                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                {statusConfig.label}
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs">
                                                {event.type}
                                            </Badge>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/events/${event.id}`}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </Link>
                                                </DropdownMenuItem>
                                                {canEditEvent && (
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/events/${event.id}/edit`}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit Event
                                                        </Link>
                                                    </DropdownMenuItem>
                                                )}
                                                {canEditEvent && !event.isPublished && (
                                                    <DropdownMenuItem
                                                        onClick={() => handlePublishEvent(event.id, event.title)}
                                                    >
                                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                                        Publish Event
                                                    </DropdownMenuItem>
                                                )}
                                                {canCreateEvent && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleDuplicateEvent(event.id, event.title)}
                                                    >
                                                        <Copy className="mr-2 h-4 w-4" />
                                                        Duplicate
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem>
                                                    <QrCode className="mr-2 h-4 w-4" />
                                                    Generate QR Code
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {canCreateRegistration && event.status !== "COMPLETED" && event.status !== "DRAFT" && (
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/registrations?event=${event.id}&action=add`}>
                                                            <UserPlus className="mr-2 h-4 w-4" />
                                                            Register New
                                                        </Link>
                                                    </DropdownMenuItem>
                                                )}
                                                {canViewRegistrations && event.status !== "DRAFT" && (
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/registrations?event=${event.id}`}>
                                                            <Users className="mr-2 h-4 w-4" />
                                                            View Registrations
                                                        </Link>
                                                    </DropdownMenuItem>
                                                )}
                                                {canViewRegistrations && event.status !== "DRAFT" && (
                                                    <DropdownMenuItem>
                                                        <Mail className="mr-2 h-4 w-4" />
                                                        Email Attendees
                                                    </DropdownMenuItem>
                                                )}
                                                {canIssueCertificates && event.status === "COMPLETED" && (
                                                    <DropdownMenuItem>
                                                        <Award className="mr-2 h-4 w-4" />
                                                        Generate Certificates
                                                    </DropdownMenuItem>
                                                )}
                                                {event.status !== "DRAFT" && (
                                                    <DropdownMenuItem>
                                                        <FileText className="mr-2 h-4 w-4" />
                                                        Export Report
                                                    </DropdownMenuItem>
                                                )}
                                                {canDeleteEvent && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => handleDeleteEvent(event.id, event.title)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Event
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <Link href={`/dashboard/events/${event.id}`}>
                                        <h3 className="font-semibold text-foreground mb-3 line-clamp-2 hover:text-primary transition-colors">
                                            {event.title}
                                        </h3>
                                    </Link>

                                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 shrink-0" />
                                            <span>{event.date}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 shrink-0" />
                                            <span>{event.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 shrink-0" />
                                            <span className="truncate">{event.location}</span>
                                        </div>
                                    </div>

                                    {/* Capacity Bar */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-muted-foreground">Delegate Spots</span>
                                            <span className={cn("font-medium", capacityStatus.color)}>
                                                {capacityStatus.text}
                                            </span>
                                        </div>
                                        <div className="progress-premium">
                                            <div
                                                className="progress-premium-fill"
                                                style={{ width: `${Math.min((event.registrations / event.capacity) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-xs mt-1">
                                            <span className="text-muted-foreground">{event.registrations} / {event.capacity} delegates</span>
                                            <span className="text-muted-foreground">
                                                {event.capacity > 0 ? Math.round((event.registrations / event.capacity) * 100) : 0}%
                                            </span>
                                        </div>
                                        {/* Role breakdown */}
                                        {event.totalRegistrations > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {roleBreakdown(event.registrationsByRole).map(({ key, label, count }) => (
                                                    <Badge
                                                        key={key}
                                                        variant="outline"
                                                        className={cn(
                                                            "text-[10px] px-1.5 py-0 font-medium",
                                                            key.toUpperCase() === "DELEGATE"
                                                                ? "bg-primary/5 text-primary border-primary/20"
                                                                : "bg-muted/60 text-muted-foreground border-border"
                                                        )}
                                                    >
                                                        {label}: {count}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-border">
                                        <div className="flex items-center gap-2">
                                            {event.cmeCredits && event.cmeCredits > 0 && (
                                                <>
                                                    <Award className="w-4 h-4 text-primary" />
                                                    <span className="text-sm font-medium">{event.cmeCredits} CME</span>
                                                </>
                                            )}
                                        </div>
                                        {event.revenue > 0 && (
                                            <div className="flex items-center gap-1 text-sm">
                                                <TrendingUp className="w-4 h-4 text-green-600" />
                                                <span className="font-medium text-green-600">
                                                    ₹{(event.revenue / 1000).toFixed(0)}K
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* List View */
                    <div className="bg-background rounded-2xl border border-border/60 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full table-premium">
                                <thead className="bg-gradient-to-b from-muted/60 to-muted/30 border-b">
                                    <tr>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Event</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden md:table-cell">Date</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Location</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Registrations</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden xl:table-cell">Revenue</th>
                                        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredEvents.map((event) => {
                                        const statusConfig = getStatusConfig(event.status);
                                        const StatusIcon = statusConfig.icon;

                                        return (
                                            <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-4">
                                                    <div>
                                                        <Link href={`/dashboard/events/${event.id}`}>
                                                            <p className="font-medium hover:text-primary transition-colors line-clamp-1">
                                                                {event.title}
                                                            </p>
                                                        </Link>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="secondary" className="text-xs">{event.type}</Badge>
                                                            {event.category && (
                                                                <Badge variant="outline" className="text-xs">{event.category}</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 hidden md:table-cell">
                                                    <div className="text-sm">
                                                        <p>{event.date}</p>
                                                        <p className="text-muted-foreground text-xs">{event.time}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 hidden lg:table-cell">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                                                        <span className="truncate max-w-[200px]">{event.city}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge variant="outline" className={cn("text-xs", statusConfig.className)}>
                                                        <StatusIcon className="w-3 h-3 mr-1" />
                                                        {statusConfig.label}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4 hidden sm:table-cell">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="w-4 h-4 text-muted-foreground" />
                                                            <span className="text-sm font-medium">
                                                                {event.registrations}/{event.capacity}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">delegates</span>
                                                        </div>
                                                        {event.totalRegistrations > event.registrations && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {roleBreakdown(event.registrationsByRole)
                                                                    .filter(({ key }) => key.toUpperCase() !== "DELEGATE")
                                                                    .map(({ key, label, count }) => (
                                                                        <Badge
                                                                            key={key}
                                                                            variant="outline"
                                                                            className="text-[10px] px-1.5 py-0 font-medium bg-muted/60 text-muted-foreground border-border"
                                                                        >
                                                                            {label}: {count}
                                                                        </Badge>
                                                                    ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 hidden xl:table-cell">
                                                    {event.revenue > 0 ? (
                                                        <span className="text-sm font-medium text-green-600">
                                                            ₹{event.revenue.toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/dashboard/events/${event.id}`}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View Details
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            {canEditEvent && (
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/dashboard/events/${event.id}/edit`}>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit Event
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            )}
                                                            {canEditEvent && !event.isPublished && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handlePublishEvent(event.id, event.title)}
                                                                >
                                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                    Publish Event
                                                                </DropdownMenuItem>
                                                            )}
                                                            {canCreateEvent && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDuplicateEvent(event.id, event.title)}
                                                                >
                                                                    <Copy className="mr-2 h-4 w-4" />
                                                                    Duplicate
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem>
                                                                <QrCode className="mr-2 h-4 w-4" />
                                                                Generate QR Code
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {canCreateRegistration && event.status !== "COMPLETED" && event.status !== "DRAFT" && (
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/dashboard/registrations?event=${event.id}&action=add`}>
                                                                        <UserPlus className="mr-2 h-4 w-4" />
                                                                        Register New
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            )}
                                                            {canViewRegistrations && event.status !== "DRAFT" && (
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/dashboard/registrations?event=${event.id}`}>
                                                                        <Users className="mr-2 h-4 w-4" />
                                                                        View Registrations
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            )}
                                                            {canViewRegistrations && event.status !== "DRAFT" && (
                                                                <DropdownMenuItem>
                                                                    <Mail className="mr-2 h-4 w-4" />
                                                                    Email Attendees
                                                                </DropdownMenuItem>
                                                            )}
                                                            {canIssueCertificates && event.status === "COMPLETED" && (
                                                                <DropdownMenuItem>
                                                                    <Award className="mr-2 h-4 w-4" />
                                                                    Generate Certificates
                                                                </DropdownMenuItem>
                                                            )}
                                                            {event.status !== "DRAFT" && (
                                                                <DropdownMenuItem>
                                                                    <FileText className="mr-2 h-4 w-4" />
                                                                    Export Report
                                                                </DropdownMenuItem>
                                                            )}
                                                            {canDeleteEvent && event.registrations === 0 && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-destructive"
                                                                        onClick={() => handleDeleteEvent(event.id, event.title)}
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete Event
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Publish Validation Errors Dialog */}
            <Dialog open={validationErrorsOpen} onOpenChange={setValidationErrorsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-full shrink-0 bg-amber-100">
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="space-y-1">
                                <DialogTitle>Cannot Publish Event</DialogTitle>
                                <DialogDescription>
                                    Please complete the following required fields before publishing:
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="mt-4 space-y-2">
                        {validationErrors.map((error, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                                {error}
                            </div>
                        ))}
                    </div>
                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setValidationErrorsOpen(false)}>
                            Close
                        </Button>
                        <Link href={`/dashboard/events/${validationEventId}/edit`}>
                            <Button className="gap-2">
                                <Edit className="h-4 w-4" />
                                Edit Event
                            </Button>
                        </Link>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog />
            <AlertDialog />
        </DashboardLayout>
    );
}
