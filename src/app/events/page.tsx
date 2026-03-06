"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    Search,
    ChevronRight,
    Award,
    Crown,
    Medal,
    ArrowRight,
    Ticket,
    GraduationCap,
    Sparkles,
    TrendingUp,
    Zap,
    Globe,
    Star,
    Loader2,
    Eye,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { getEventImage } from "@/lib/event-utils";
import { EVENT_TYPES, PUBLIC_STATUS_OPTIONS } from "@/lib/event-constants";
import { eventsService, Event } from "@/services/events";

// Display event type for the UI
interface DisplayEvent {
    id: string;
    title: string;
    shortDescription: string | null;
    date: string;
    time: string;
    location: string;
    type: string;
    registrations: number;
    capacity: number;
    status: string;
    price: number;
    earlyBirdPrice: number | null;
    earlyBirdDeadline: string | null;
    cmeCredits: number | null;
    image: string | null;
    featured: boolean;
    sponsors: { name: string; tier: string; logo: string | null }[];
    speakers: number;
    sessions: number;
}

const tierIcons = {
    platinum: Crown,
    gold: Award,
    silver: Medal,
};

const typeColors: Record<string, { bg: string; text: string; icon: string }> = {
    Conference: { bg: "bg-medical-blue-light", text: "text-medical-blue", icon: "bg-medical-blue" },
    Workshop: { bg: "bg-medical-purple-light", text: "text-medical-purple", icon: "bg-medical-purple" },
    Symposium: { bg: "bg-medical-teal-light", text: "text-medical-teal", icon: "bg-medical-teal" },
    Seminar: { bg: "bg-medical-green-light", text: "text-medical-green", icon: "bg-medical-green" },
    "CME Session": { bg: "bg-medical-orange-light", text: "text-medical-orange", icon: "bg-medical-orange" },
};

const typeIcons: Record<string, React.ElementType> = {
    Conference: Globe,
    Workshop: Zap,
    Symposium: TrendingUp,
    Seminar: GraduationCap,
    "CME Session": Award,
};

export default function PublicEventsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("UPCOMING");

    // Data from API
    const [events, setEvents] = useState<DisplayEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        upcoming: 0,
        speakers: 0,
        cmeCredits: 0,
        registrations: 0,
    });

    // Fetch events from API
    useEffect(() => {
        async function fetchEvents() {
            try {
                setLoading(true);
                const response = await eventsService.getPublic({ limit: 50 });

                if (response.success && response.data) {
                    const eventList = Array.isArray(response.data) ? response.data : [];
                    const displayEvents: DisplayEvent[] = eventList.map((event: Event) => ({
                        id: event.id,
                        title: event.title,
                        shortDescription: event.shortDescription,
                        date: new Date(event.startDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                        }),
                        time: event.startTime ? `${event.startTime} - ${event.endTime || ""}` : "TBA",
                        location: [event.location, event.city].filter(Boolean).join(", ") || (event.isVirtual ? "Virtual Event" : "TBA"),
                        type: event.type,
                        registrations: event._count?.registrations || 0,
                        capacity: event.capacity,
                        status: event.status,
                        price: event.price,
                        earlyBirdPrice: event.earlyBirdPrice,
                        earlyBirdDeadline: event.earlyBirdDeadline ? new Date(event.earlyBirdDeadline).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                        }) : null,
                        cmeCredits: event.cmeCredits,
                        image: getEventImage(event.bannerImage, event.thumbnailImage, event.type),
                        featured: event.isFeatured,
                        sponsors: event.eventSponsors?.map(es => ({
                            name: es.sponsor.name,
                            tier: es.tier.toLowerCase(),
                            logo: es.sponsor.logo,
                        })) || [],
                        speakers: event.eventSpeakers?.length || 0,
                        sessions: event.eventSpeakers?.length || 0, // Using speaker count as session estimate
                    }));

                    setEvents(displayEvents);

                    // Calculate stats from live data
                    const upcomingCount = displayEvents.filter(e => e.status === "UPCOMING").length;
                    const totalCME = displayEvents.reduce((acc, e) => acc + (e.cmeCredits || 0), 0);
                    const totalRegistrations = displayEvents.reduce((acc, e) => acc + e.registrations, 0);
                    // Count unique speakers across all events
                    const uniqueSpeakers = new Set<string>();
                    eventList.forEach(event => {
                        event.eventSpeakers?.forEach(es => uniqueSpeakers.add(es.speaker.id));
                    });

                    setStats({
                        upcoming: upcomingCount,
                        speakers: uniqueSpeakers.size,
                        cmeCredits: totalCME,
                        registrations: totalRegistrations,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch events:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, []);

    const filteredEvents = events.filter((event) => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === "all" || event.type === filterType;
        const matchesStatus = filterStatus === "all" || event.status === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
    });

    const featuredEvent = filteredEvents.find(e => e.featured && e.status === "UPCOMING");
    const regularEvents = filteredEvents.filter(e => e !== featuredEvent);

    const getSlotsInfo = (event: DisplayEvent) => {
        const remaining = event.capacity - event.registrations;
        const percentage = (event.registrations / event.capacity) * 100;
        if (remaining <= 0) return { text: "Sold Out", color: "text-destructive", percentage: 100, urgent: true };
        if (remaining <= 10) return { text: `${remaining} left`, color: "text-medical-orange", percentage, urgent: true };
        return { text: `${remaining} available`, color: "text-medical-green", percentage, urgent: false };
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-xl gradient-medical flex items-center justify-center">
                                <GraduationCap className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-xl">ICMS</span>
                        </Link>
                        <nav className="hidden md:flex items-center gap-6">
                            <Link href="/events" className="text-sm font-medium text-primary">
                                Events
                            </Link>
                            <Link href="/#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                About
                            </Link>
                            <Link href="/#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                Contact
                            </Link>
                        </nav>
                        <div className="flex items-center gap-3">
                            <Link href="/auth/login">
                                <Button variant="outline" size="sm" className="rounded-full">
                                    Login
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative py-20 overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0 wavy-bg" />
                <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-medical-teal/5 blur-3xl animate-float-slow" />
                <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-medical-blue/5 blur-3xl animate-float" />

                <div className="container mx-auto px-4 relative">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fadeIn">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-primary">Medical Education & CME Programs</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                            Discover Medical
                            <span className="text-gradient block mt-2">Conferences & Events</span>
                        </h1>
                        <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                            Register for the latest medical conferences, CME sessions, workshops, and symposiums from leading healthcare institutions.
                        </p>

                        {/* Search Bar */}
                        <div className="relative max-w-xl mx-auto animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                                <Input
                                    placeholder="Search events by name..."
                                    className="w-full pl-12 pr-4 h-14 rounded-2xl text-base bg-background/80 backdrop-blur border-border/50 shadow-lg shadow-primary/5 focus:shadow-primary/10 transition-shadow"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="py-6 border-y bg-background/50 backdrop-blur">
                <div className="container mx-auto px-4">
                    {loading ? (
                        <div className="flex justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-primary">{stats.upcoming}</div>
                                <div className="text-sm text-muted-foreground">Upcoming Events</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-primary">{stats.speakers}</div>
                                <div className="text-sm text-muted-foreground">Expert Speakers</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-primary">{stats.cmeCredits}</div>
                                <div className="text-sm text-muted-foreground">CME Credits Available</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-primary">{stats.registrations}+</div>
                                <div className="text-sm text-muted-foreground">Registrations</div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Filters */}
            <section className="py-8">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex flex-wrap gap-3">
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-[160px] rounded-xl">
                                    <SelectValue placeholder="Event Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {EVENT_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[160px] rounded-xl">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PUBLIC_STATUS_OPTIONS.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Showing <span className="font-semibold text-foreground">{filteredEvents.length}</span> events
                        </p>
                    </div>
                </div>
            </section>

            {/* Featured Event */}
            {featuredEvent && (
                <section className="pb-8">
                    <div className="container mx-auto px-4">
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-medical-blue/10 border border-primary/20 p-1">
                            <div className="relative overflow-hidden rounded-[22px] bg-background">
                                <div className="grid lg:grid-cols-2 gap-0">
                                    {/* Featured Image Section */}
                                    <div className="relative h-64 lg:h-auto min-h-[320px] bg-gradient-to-br from-primary via-medical-blue to-medical-teal flex items-center justify-center">
                                        <div className="absolute inset-0 opacity-20">
                                            <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-2 border-white/30 animate-pulse-slow" />
                                            <div className="absolute bottom-20 right-20 w-24 h-24 rounded-full border-2 border-white/20 animate-float" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-white/10" />
                                        </div>
                                        <div className="relative text-center text-white p-8">
                                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur mb-4">
                                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                <span className="text-sm font-medium">Featured Event</span>
                                            </div>
                                            <Calendar className="h-20 w-20 mx-auto mb-4 opacity-90" />
                                            <div className="text-2xl font-bold">{featuredEvent.date}</div>
                                        </div>
                                    </div>

                                    {/* Featured Content */}
                                    <div className="p-8 lg:p-10 flex flex-col justify-center">
                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            <Badge className={cn("rounded-full", typeColors[featuredEvent.type]?.bg, typeColors[featuredEvent.type]?.text)}>
                                                {featuredEvent.type}
                                            </Badge>
                                            {(featuredEvent.cmeCredits ?? 0) > 0 && (
                                                <Badge variant="outline" className="rounded-full gap-1 status-active">
                                                    <Award className="h-3 w-3" />
                                                    {featuredEvent.cmeCredits} CME Credits
                                                </Badge>
                                            )}
                                        </div>

                                        <h2 className="text-2xl lg:text-3xl font-bold mb-4">
                                            <Link href={`/events/${featuredEvent.id}`} className="hover:text-primary transition-colors">
                                                {featuredEvent.title}
                                            </Link>
                                        </h2>

                                        <p className="text-muted-foreground mb-6 text-lg">
                                            {featuredEvent.shortDescription}
                                        </p>

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Clock className="h-4 w-4 text-primary" />
                                                {featuredEvent.time}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="h-4 w-4 text-primary" />
                                                {featuredEvent.location.split(',')[0]}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Users className="h-4 w-4 text-primary" />
                                                {featuredEvent.speakers} Speakers
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Ticket className="h-4 w-4 text-primary" />
                                                {featuredEvent.sessions} Sessions
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t">
                                            <div>
                                                {featuredEvent.earlyBirdPrice && (
                                                    <span className="text-sm text-muted-foreground line-through mr-2">
                                                        ₹{featuredEvent.price.toLocaleString()}
                                                    </span>
                                                )}
                                                <span className="text-3xl font-bold text-primary">
                                                    ₹{(featuredEvent.earlyBirdPrice || featuredEvent.price).toLocaleString()}
                                                </span>
                                                {featuredEvent.earlyBirdDeadline && (
                                                    <p className="text-xs text-medical-orange mt-1">
                                                        Early bird until {featuredEvent.earlyBirdDeadline}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-3">
                                                <Link href={`/events/${featuredEvent.id}`}>
                                                    <Button size="lg" variant="outline" className="rounded-xl gap-2">
                                                        <Eye className="h-5 w-5" />
                                                        View Details
                                                    </Button>
                                                </Link>
                                                <Link href={`/events/${featuredEvent.id}/register`}>
                                                    <Button size="lg" className="rounded-xl gap-2 gradient-medical text-white hover:opacity-90 shadow-lg shadow-primary/25">
                                                        <Ticket className="h-5 w-5" />
                                                        Register Now
                                                        <ArrowRight className="h-5 w-5" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Events Grid */}
            <section className="py-12">
                <div className="container mx-auto px-4">
                    {/* Empty State */}
                    {!loading && filteredEvents.length === 0 && (
                        <div className="text-center py-16">
                            <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No Events Found</h3>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                {searchQuery || filterType !== "all" || filterStatus !== "all"
                                    ? "No events match your search criteria. Try adjusting your filters."
                                    : "No events are currently available. Please check back later."}
                            </p>
                        </div>
                    )}

                    {regularEvents.length > 0 && (
                        <>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="h-10 w-1 rounded-full gradient-medical" />
                                <h2 className="text-2xl font-bold">All Events</h2>
                            </div>

                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {regularEvents.map((event, index) => {
                                    const slots = getSlotsInfo(event);
                                    const TypeIcon = typeIcons[event.type] || Calendar;
                                    const colors = typeColors[event.type] || typeColors.Seminar;

                                    return (
                                        <Link
                                            key={event.id}
                                            href={`/events/${event.id}`}
                                            className={cn(
                                                "group relative bg-card rounded-2xl border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30",
                                                event.status === "COMPLETED" && "opacity-75"
                                            )}
                                            style={{ animationDelay: `${index * 0.1}s` }}
                                        >
                                            {/* Compact Header */}
                                            <div className={cn(
                                                "relative p-4 flex items-start gap-4",
                                                "bg-gradient-to-r from-muted/30 to-transparent"
                                            )}>
                                                {/* Type Icon */}
                                                <div className={cn(
                                                    "w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105",
                                                    colors.icon
                                                )}>
                                                    <TypeIcon className="h-7 w-7 text-white" />
                                                </div>

                                                {/* Title & Type */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant="outline" className={cn("rounded-full text-xs", colors.text)}>
                                                            {event.type}
                                                        </Badge>
                                                        {(event.cmeCredits ?? 0) > 0 && (
                                                            <Badge variant="secondary" className="rounded-full gap-1 text-xs">
                                                                <Award className="h-3 w-3 text-medical-gold" />
                                                                {event.cmeCredits} CME
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <h3 className="font-bold text-base line-clamp-2 group-hover:text-primary transition-colors">
                                                        {event.title}
                                                    </h3>
                                                </div>
                                            </div>

                                            {/* Card Content */}
                                            <div className="px-4 pb-4">
                                                {/* Event Meta */}
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5 text-primary" />
                                                        {event.date}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        <span className="truncate max-w-[120px]">{event.location}</span>
                                                    </span>
                                                </div>

                                                {/* Short Description */}
                                                {event.shortDescription && (
                                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                                        {event.shortDescription}
                                                    </p>
                                                )}

                                                {/* Progress Bar */}
                                                <div className="mb-4">
                                                    <div className="flex items-center justify-between mb-1.5 text-xs">
                                                        <span className="text-muted-foreground">
                                                            {event.registrations}/{event.capacity} registered
                                                        </span>
                                                        <span className={cn("font-medium", slots.color)}>
                                                            {slots.urgent && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />}
                                                            {slots.text}
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                                        <div
                                                            className={cn(
                                                                "h-full rounded-full transition-all duration-700",
                                                                slots.percentage >= 90 ? "bg-destructive" :
                                                                    slots.percentage >= 70 ? "bg-medical-orange" : "bg-medical-teal"
                                                            )}
                                                            style={{ width: `${slots.percentage}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Footer */}
                                                <div className="flex items-center justify-between pt-3 border-t">
                                                    <div>
                                                        {event.earlyBirdPrice && (
                                                            <span className="text-xs text-muted-foreground line-through mr-1">
                                                                ₹{event.price.toLocaleString()}
                                                            </span>
                                                        )}
                                                        <span className="text-lg font-bold text-primary">
                                                            ₹{(event.earlyBirdPrice || event.price).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {event.status === "UPCOMING" || event.status === "ACTIVE" ? (
                                                        <div
                                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium group-hover:bg-primary/90 transition-colors"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                window.location.href = `/events/${event.id}/register`;
                                                            }}
                                                        >
                                                            Register
                                                            <ArrowRight className="h-4 w-4" />
                                                        </div>
                                                    ) : (
                                                        <Badge variant="secondary" className="rounded-full">
                                                            Completed
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {filteredEvents.length === 0 && (
                        <div className="text-center py-20">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-muted flex items-center justify-center">
                                <Calendar className="h-12 w-12 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">No events found</h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                Try adjusting your search or filters to discover more events
                            </p>
                            <Button variant="outline" className="rounded-xl" onClick={() => {
                                setSearchQuery("");
                                setFilterType("all");
                                setFilterStatus("all");
                            }}>
                                Clear Filters
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-10 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl gradient-medical flex items-center justify-center">
                                <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <span className="font-bold text-lg">ICMS</span>
                                <p className="text-sm text-muted-foreground">
                                    Integrated Conference Management System
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            © 2025 Medical College. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
