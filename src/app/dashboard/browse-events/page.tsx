"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Calendar,
    Search,
    MapPin,
    Users,
    Clock,
    Eye,
    Ticket,
    Award,
    X,
    ChevronDown,
    SlidersHorizontal,
    CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { format } from "date-fns";
import { EVENT_TYPES, EVENT_CATEGORIES } from "@/lib/event-constants";
import { useTenantFilter } from "@/hooks/use-tenant-filter";

interface PublicEvent {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    startTime: string | null;
    endTime: string | null;
    location: string | null;
    city: string | null;
    type: string;
    category: string | null;
    capacity: number;
    price: number;
    currency: string;
    earlyBirdPrice: number | null;
    cmeCredits: number | null;
    _count?: {
        registrations: number;
    };
}

// Build filter options from shared constants
const eventTypes = ["All Types", ...EVENT_TYPES.map(t => t.value)];
const categories = ["All Categories", ...EVENT_CATEGORIES.map(c => c.value)];

export default function BrowseEventsPage() {
    const [events, setEvents] = useState<PublicEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState("All Types");
    const [selectedCategory, setSelectedCategory] = useState("All Categories");
    const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);
    const { effectiveTenantId, sessionLoading } = useTenantFilter();

    useEffect(() => {
        if (sessionLoading) return;

        async function fetchEvents() {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                params.set("limit", "200");
                if (effectiveTenantId) {
                    params.set("tenantId", effectiveTenantId);
                }
                const [eventsRes, regsRes] = await Promise.all([
                    fetch(`/api/events/public?${params.toString()}`),
                    fetch("/api/users/me/registrations"),
                ]);
                const data = await eventsRes.json();
                if (data.success && data.data) {
                    setEvents(data.data);
                }
                const regsData = await regsRes.json();
                if (regsData.success && Array.isArray(regsData.data)) {
                    setRegisteredEventIds(new Set(regsData.data.map((r: { event?: { id: string } }) => r.event?.id).filter(Boolean)));
                }
            } catch (error) {
                console.error("Failed to fetch events:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, [effectiveTenantId, sessionLoading]);

    // Filter events
    const filteredEvents = events.filter((event) => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (event.city && event.city.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = selectedType === "All Types" || event.type === selectedType;
        const matchesCategory = selectedCategory === "All Categories" || event.category === selectedCategory;
        return matchesSearch && matchesType && matchesCategory;
    });

    // Count active filters
    const activeFilterCount = [
        selectedType !== "All Types",
        selectedCategory !== "All Categories",
    ].filter(Boolean).length;

    // Clear all filters
    const clearFilters = () => {
        setSelectedType("All Types");
        setSelectedCategory("All Categories");
        setSearchQuery("");
    };

    const getAvailability = (event: PublicEvent) => {
        const registered = event._count?.registrations || 0;
        const available = event.capacity - registered;
        const percentage = event.capacity > 0 ? (registered / event.capacity) * 100 : 0;

        if (percentage >= 100) return { text: "Sold Out", color: "text-red-600", available: 0 };
        if (percentage >= 90) return { text: `Only ${available} left!`, color: "text-orange-600", available };
        if (percentage >= 70) return { text: "Filling Fast", color: "text-yellow-600", available };
        return { text: `${available} spots available`, color: "text-green-600", available };
    };

    if (loading) {
        return (
            <DashboardLayout title="Browse Events" subtitle="Find and register for upcoming events">
                <AiimsLoader />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Browse Events" subtitle="Find and register for upcoming events">
            <div className="space-y-6">
                {/* Search and Filters */}
                <div className="flex flex-col gap-4">
                    {/* Top Row: Search and Filter Toggle */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-10 search-premium rounded-xl"
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
                    </div>

                    {/* Desktop Filters */}
                    <div className="hidden lg:flex flex-wrap gap-3 items-center">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger className="w-[140px]">
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

                {/* Events List */}
                {filteredEvents.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-xl">
                        <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                        <h3 className="font-semibold text-lg mb-2">No events found</h3>
                        <p className="text-muted-foreground">
                            {events.length === 0
                                ? "No upcoming events available at the moment."
                                : "Try adjusting your search or filters."}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredEvents.map((event) => {
                            const availability = getAvailability(event);
                            const eventDate = new Date(event.startDate);
                            const isPastEvent = eventDate < new Date();
                            const isSoldOut = availability.available === 0;

                            return (
                                <div
                                    key={event.id}
                                    className="bg-background rounded-xl border border-border p-5 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/20 transition-all duration-400"
                                >
                                    <div className="flex flex-col lg:flex-row gap-4">
                                        {/* Event Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    {event.type}
                                                </Badge>
                                                {event.category && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {event.category}
                                                    </Badge>
                                                )}
                                                {event.cmeCredits && event.cmeCredits > 0 && (
                                                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                                        <Award className="w-3 h-3 mr-1" />
                                                        {event.cmeCredits} CME
                                                    </Badge>
                                                )}
                                            </div>

                                            <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-1">
                                                {event.title}
                                            </h3>

                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                {event.description}
                                            </p>

                                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    {format(eventDate, "MMM d, yyyy")}
                                                    {event.endDate !== event.startDate && (
                                                        <> - {format(new Date(event.endDate), "MMM d, yyyy")}</>
                                                    )}
                                                </span>
                                                {event.startTime && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4" />
                                                        {event.startTime}
                                                        {event.endTime && <> - {event.endTime}</>}
                                                    </span>
                                                )}
                                                {event.city && (
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className="w-4 h-4" />
                                                        {event.city}
                                                    </span>
                                                )}
                                                <span className={cn("flex items-center gap-1.5", availability.color)}>
                                                    <Users className="w-4 h-4" />
                                                    {availability.text}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Price and Actions */}
                                        <div className="flex flex-col items-end justify-between gap-3 lg:min-w-[180px]">
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-primary">
                                                    {Number(event.price) > 0 ? `${event.currency === "INR" ? "₹" : event.currency + " "}${Number(event.price).toLocaleString()}` : "Free"}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Link href={`/dashboard/browse-events/${event.id}`}>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View Details
                                                    </Button>
                                                </Link>
                                                {registeredEventIds.has(event.id) ? (
                                                    <Button size="sm" variant="outline" disabled className="gap-2 text-green-700 border-green-200 bg-green-50">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Already Registered
                                                    </Button>
                                                ) : !isPastEvent && !isSoldOut ? (
                                                    <Link href={`/dashboard/browse-events/${event.id}/register`}>
                                                        <Button size="sm" className="gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/25 font-semibold">
                                                            <Ticket className="w-4 h-4" />
                                                            Register
                                                        </Button>
                                                    </Link>
                                                ) : isSoldOut ? (
                                                    <Button size="sm" disabled>
                                                        Sold Out
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
