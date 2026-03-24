"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    Award,
    ArrowLeft,
    Share2,
    Ticket,
    GraduationCap,
    Building2,
    Crown,
    Medal,
    ExternalLink,
    Phone,
    Mail,
    Globe,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Megaphone,
    MessageSquare,
    BarChart3,
    HelpCircle,
    Mic2,
    DoorOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { eventsService, Event, EventSpeaker, EventSponsor, EventSession } from "@/services/events";

// Display types
interface DisplaySessionSpeaker {
    id: string;
    name: string;
    designation: string | null;
    institution: string | null;
    photo: string | null;
    talkTitle: string | null;
}

interface DisplaySession {
    id: string;
    title: string;
    description: string | null;
    sessionType: string;
    date: string | null;
    dateRaw: string | null;
    startTime: string | null;
    endTime: string | null;
    venue: string | null;
    hallName: string | null;
    speakers: DisplaySessionSpeaker[];
    // Legacy single speaker fallback
    speaker?: {
        id: string;
        name: string;
        designation: string | null;
        institution: string | null;
        photo: string | null;
    } | null;
}

interface DisplayEngagement {
    id: string;
    title: string;
    type: string;
    description: string | null;
    content: unknown;
}

interface DisplayEvent {
    id: string;
    title: string;
    description: string | null;
    date: string;
    startDate: string;
    endDate: string;
    time: string;
    location: string;
    address: string | null;
    mapLink: string | null;
    type: string;
    registrations: number;
    capacity: number;
    status: string;
    price: number;
    currency: string;
    earlyBirdPrice: number | null;
    earlyBirdDeadline: string | null;
    cmeCredits: number | null;
    contactEmail: string | null;
    contactPhone: string | null;
    website: string | null;
    sponsors: { id: string; name: string; tier: string; website: string | null; logo: string | null }[];
    speakers: { id: string; name: string; designation: string | null; institution: string | null; topic: string | null; photo: string | null }[];
    sessions: DisplaySession[];
    engagements: DisplayEngagement[];
    halls: { id: string; name: string }[];
    includes: string[];
    isRegistrationOpen: boolean;
    registrationDeadline: string | null;
    registrationOpensDate: string | null;
}

const SESSION_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
    PLENARY: { label: "Plenary", color: "bg-purple-100 text-purple-700 border-purple-200" },
    KEYNOTE: { label: "Keynote", color: "bg-blue-100 text-blue-700 border-blue-200" },
    WORKSHOP: { label: "Workshop", color: "bg-green-100 text-green-700 border-green-200" },
    PANEL: { label: "Panel", color: "bg-orange-100 text-orange-700 border-orange-200" },
    BREAK: { label: "Break", color: "bg-gray-100 text-gray-500 border-gray-200" },
    OTHER: { label: "Session", color: "bg-slate-100 text-slate-600 border-slate-200" },
};

const ENGAGEMENT_ICON: Record<string, typeof Megaphone> = {
    POLL: BarChart3,
    QA: HelpCircle,
    FEEDBACK: MessageSquare,
    ANNOUNCEMENT: Megaphone,
    QUIZ: Award,
};

const tierConfig = {
    platinum: { icon: Crown, bgClass: "bg-slate-100", textClass: "text-slate-700", borderClass: "border-slate-300" },
    gold: { icon: Award, bgClass: "bg-yellow-50", textClass: "text-yellow-700", borderClass: "border-yellow-300" },
    silver: { icon: Medal, bgClass: "bg-gray-100", textClass: "text-gray-600", borderClass: "border-gray-300" },
    bronze: { icon: Medal, bgClass: "bg-orange-50", textClass: "text-orange-700", borderClass: "border-orange-300" },
};

function ordSuffix(d: number) {
  if (d >= 11 && d <= 13) return `${d}th`;
  return `${d}${{ 1: "st", 2: "nd", 3: "rd" }[d % 10] ?? "th"}`;
}
function fmtEventRange(start: string, end?: string | null) {
  const s = new Date(start), e = end ? new Date(end) : null;
  const sd = ordSuffix(s.getDate());
  if (!e || s.toDateString() === e.toDateString()) {
    return `${sd} ${s.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`;
  }
  const ed = ordSuffix(e.getDate());
  const em = e.toLocaleDateString("en-IN", { month: "long" });
  const ey = e.getFullYear();
  if (s.getMonth() === e.getMonth() && s.getFullYear() === ey)
    return `${sd} to ${ed} ${em} ${ey}`;
  const sm = s.toLocaleDateString("en-IN", { month: "long" });
  return s.getFullYear() === ey
    ? `${sd} ${sm} to ${ed} ${em} ${ey}`
    : `${sd} ${sm} ${s.getFullYear()} to ${ed} ${em} ${ey}`;
}

export default function EventDetailPage() {
    const params = useParams();
    const eventId = params.id as string;
    const [activeTab, setActiveTab] = useState("overview");
    const [event, setEvent] = useState<DisplayEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [tenantSlug, setTenantSlug] = useState<string | null>(null);

    // Fetch event — check URL params directly to avoid timing issues
    useEffect(() => {
        // Read preview/tenant params from URL on every render
        const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const isPreview = urlParams?.get("preview") === "true";
        const tenant = urlParams?.get("tenant");
        setIsPreviewMode(isPreview);
        if (tenant) setTenantSlug(tenant);

        async function fetchEvent() {
            try {
                setLoading(true);
                setError(null);
                let response;
                if (isPreview) {
                    const res = await fetch(`/api/events/public/${eventId}?preview=true`, { credentials: "include" });
                    response = await res.json();
                } else {
                    response = await eventsService.getPublicById(eventId);
                }

                if (response.success && response.data) {
                    const apiEvent = response.data;
                    const startDate = new Date(apiEvent.startDate);
                    const endDate = new Date(apiEvent.endDate);

                    const displayEvent: DisplayEvent = {
                        id: apiEvent.id,
                        title: apiEvent.title,
                        description: apiEvent.description,
                        date: startDate.toDateString() === endDate.toDateString()
                            ? startDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                            : `${startDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - ${endDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
                        startDate: apiEvent.startDate,
                        endDate: apiEvent.endDate,
                        time: apiEvent.startTime ? `${apiEvent.startTime} - ${apiEvent.endTime || ""}` : "TBA",
                        location: [apiEvent.location, apiEvent.city].filter(Boolean).join(", ") || (apiEvent.isVirtual ? "Virtual Event" : "TBA"),
                        address: [apiEvent.address, apiEvent.city, apiEvent.state, apiEvent.country].filter(Boolean).join(", "),
                        mapLink: apiEvent.mapLink,
                        type: apiEvent.type,
                        registrations: apiEvent._count?.registrations || 0,
                        capacity: apiEvent.capacity,
                        status: apiEvent.status.toLowerCase(),
                        price: Number(apiEvent.price) || 0,
                        currency: apiEvent.currency || "INR",
                        earlyBirdPrice: apiEvent.earlyBirdPrice ? Number(apiEvent.earlyBirdPrice) : null,
                        earlyBirdDeadline: apiEvent.earlyBirdDeadline ? new Date(apiEvent.earlyBirdDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null,
                        cmeCredits: apiEvent.cmeCredits,
                        contactEmail: apiEvent.contactEmail,
                        contactPhone: apiEvent.contactPhone,
                        website: apiEvent.website,
                        sponsors: apiEvent.eventSponsors?.map((es: EventSponsor) => ({
                            id: es.sponsor.id,
                            name: es.sponsor.name,
                            tier: es.tier.toLowerCase(),
                            website: null,
                            logo: es.sponsor.logo,
                        })) || [],
                        // Get sessions from eventSessions with multi-speaker + hall support
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        sessions: apiEvent.eventSessions?.map((es: any) => ({
                            id: es.id,
                            title: es.title,
                            description: es.description,
                            sessionType: es.sessionType || "OTHER",
                            date: es.sessionDate ? new Date(es.sessionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : null,
                            dateRaw: es.sessionDate || null,
                            startTime: es.startTime,
                            endTime: es.endTime,
                            venue: es.venue,
                            hallName: es.hall?.name || es.venue || null,
                            speakers: (es.sessionSpeakers || []).map((ss: { speaker: { id: string; name: string; designation: string | null; institution: string | null; photo: string | null }; talkTitle: string | null }) => ({
                                id: ss.speaker.id,
                                name: ss.speaker.name,
                                designation: ss.speaker.designation,
                                institution: ss.speaker.institution,
                                photo: ss.speaker.photo,
                                talkTitle: ss.talkTitle || null,
                            })),
                            speaker: es.speaker ? {
                                id: es.speaker.id,
                                name: es.speaker.name,
                                designation: es.speaker.designation,
                                institution: es.speaker.institution,
                                photo: es.speaker.photo,
                            } : null,
                        })) || [],
                        // Engagements (active only from API)
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        engagements: (apiEvent.engagements || []).map((eng: any) => ({
                            id: eng.id,
                            title: eng.title,
                            type: eng.type,
                            description: eng.description,
                            content: eng.content,
                        })),
                        // Halls
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        halls: (apiEvent.halls || []).map((h: any) => ({
                            id: h.id,
                            name: h.name,
                        })),
                        // Derive unique speakers from sessionSpeakers first, then legacy
                        speakers: (() => {
                            const speakerMap = new Map<string, { id: string; name: string; designation: string | null; institution: string | null; topic: string | null; photo: string | null }>();
                            // First: sessionSpeakers (new multi-speaker model)
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            apiEvent.eventSessions?.forEach((es: any) => {
                                if (es.sessionSpeakers) {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    es.sessionSpeakers.forEach((ss: any) => {
                                        if (ss.speaker && !speakerMap.has(ss.speaker.id)) {
                                            speakerMap.set(ss.speaker.id, {
                                                id: ss.speaker.id,
                                                name: ss.speaker.name,
                                                designation: ss.speaker.designation,
                                                institution: ss.speaker.institution,
                                                topic: ss.talkTitle || es.title,
                                                photo: ss.speaker.photo,
                                            });
                                        }
                                    });
                                }
                                // Fallback: legacy single speaker
                                if (es.speaker && !speakerMap.has(es.speaker.id)) {
                                    speakerMap.set(es.speaker.id, {
                                        id: es.speaker.id,
                                        name: es.speaker.name,
                                        designation: es.speaker.designation,
                                        institution: es.speaker.institution,
                                        topic: es.title, // Use session title as topic
                                        photo: es.speaker.photo,
                                    });
                                }
                            });
                            // Fallback to eventSpeakers for backward compatibility
                            if (speakerMap.size === 0 && apiEvent.eventSpeakers) {
                                apiEvent.eventSpeakers.forEach((es: EventSpeaker) => {
                                    if (!speakerMap.has(es.speaker.id)) {
                                        speakerMap.set(es.speaker.id, {
                                            id: es.speaker.id,
                                            name: es.speaker.name,
                                            designation: es.speaker.designation,
                                            institution: es.speaker.institution,
                                            topic: es.topic,
                                            photo: es.speaker.photo,
                                        });
                                    }
                                });
                            }
                            return Array.from(speakerMap.values());
                        })(),
                        includes: apiEvent.includes?.length > 0
                            ? apiEvent.includes
                            : [
                                "Conference kit and materials",
                                "Refreshments during sessions",
                                apiEvent.cmeCredits ? `CME Certificate (${apiEvent.cmeCredits} credits)` : null,
                                "Access to all sessions",
                                "Networking opportunities",
                            ].filter(Boolean) as string[],
                        isRegistrationOpen: apiEvent.isRegistrationOpen !== false,
                        registrationDeadline: apiEvent.registrationDeadline || null,
                        registrationOpensDate: apiEvent.registrationOpensDate || null,
                    };

                    setEvent(displayEvent);

                    // Set tenant slug from API response if not already set from query param
                    if (!tenantSlug && apiEvent.tenant?.slug) {
                        setTenantSlug(apiEvent.tenant.slug);
                    }
                } else {
                    setError("Event not found");
                }
            } catch (err) {
                console.error("Failed to fetch event:", err);
                setError("Failed to load event");
            } finally {
                setLoading(false);
            }
        }

        if (eventId) {
            fetchEvent();
        }
    }, [eventId]);

    const getInitials = (name: string) => {
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    };

    // Render a list of sessions (used in day-wise tabs)
    const renderSessionList = (sessions: DisplaySession[], getInitialsFn: (name: string) => string) => (
        <>
            {sessions.map((session) => {
                const typeConfig = SESSION_TYPE_CONFIG[session.sessionType] || SESSION_TYPE_CONFIG.OTHER;
                const isBreak = session.sessionType === "BREAK";
                const allSpeakers = session.speakers.length > 0 ? session.speakers : (session.speaker ? [{
                    id: session.speaker.id,
                    name: session.speaker.name,
                    designation: session.speaker.designation,
                    institution: session.speaker.institution,
                    photo: session.speaker.photo,
                    talkTitle: null,
                }] : []);

                return (
                    <Card key={session.id} className={cn("card-hover", isBreak && "bg-muted/30 border-dashed")}>
                        <CardContent className="pt-5 pb-4">
                            <div className="flex flex-col md:flex-row md:items-start gap-4">
                                {/* Time + Hall column */}
                                <div className="flex-shrink-0 md:w-28 flex md:flex-col items-center md:items-start gap-2 md:gap-1">
                                    {session.startTime && (
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-sm font-medium">
                                                {session.startTime}{session.endTime ? ` - ${session.endTime}` : ""}
                                            </span>
                                        </div>
                                    )}
                                    {session.hallName && (
                                        <div className="flex items-center gap-1.5">
                                            <DoorOpen className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">{session.hallName}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Main content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-2 mb-1">
                                        <Badge variant="outline" className={cn("text-[10px] shrink-0 border", typeConfig.color)}>
                                            {typeConfig.label}
                                        </Badge>
                                    </div>
                                    <h3 className={cn("font-semibold", isBreak ? "text-muted-foreground" : "text-lg")}>
                                        {session.title}
                                    </h3>
                                    {session.description && (
                                        <p className="text-sm text-muted-foreground mt-1">{session.description}</p>
                                    )}

                                    {/* Speakers */}
                                    {!isBreak && allSpeakers.length > 0 && (
                                        <div className="mt-3 pt-3 border-t space-y-2">
                                            {allSpeakers.map((sp) => (
                                                <div key={sp.id} className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={sp.photo || undefined} />
                                                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                            {getInitialsFn(sp.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-sm">{sp.name}</div>
                                                        <div className="text-xs text-muted-foreground truncate">
                                                            {sp.talkTitle && <span className="text-primary">{sp.talkTitle}</span>}
                                                            {sp.talkTitle && sp.designation && " · "}
                                                            {sp.designation}
                                                            {sp.institution ? `, ${sp.institution}` : ""}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </>
    );

    const handleBack = () => {
        if (isPreviewMode) {
            window.close();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h1 className="text-xl font-semibold">{error || "Event not found"}</h1>
                <Link href="/events">
                    <Button variant="outline">Back to Events</Button>
                </Link>
            </div>
        );
    }

    const slotsRemaining = event.capacity - event.registrations;
    const isAlmostFull = slotsRemaining <= 20;

    return (
        <div className="min-h-screen bg-background">
            <style>{`
                @keyframes flash { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
                .animate-flash { animation: flash 1s ease-in-out infinite; }
            `}</style>
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg gradient-medical flex items-center justify-center">
                                <GraduationCap className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-xl">ICMS</span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon">
                                <Share2 className="h-4 w-4" />
                            </Button>
                            <Link href="/auth/login">
                                <Button variant="outline" size="sm">
                                    Login
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Back Navigation */}
            <div className="border-b">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    {isPreviewMode ? (
                        <button
                            onClick={handleBack}
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Close Preview
                        </button>
                    ) : (
                        <Link href="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Events
                        </Link>
                    )}
                    {isPreviewMode && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                            Preview Mode
                        </Badge>
                    )}
                </div>
            </div>

            <main className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Event Header */}
                        <div className="animate-fadeIn">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Badge className="status-upcoming">{event.status}</Badge>
                                <Badge variant="outline">{event.type}</Badge>
                                {(event.cmeCredits ?? 0) > 0 && (
                                    <Badge variant="outline" className="gap-1 status-active">
                                        <Award className="h-3 w-3" />
                                        {event.cmeCredits} CME Credits
                                    </Badge>
                                )}
                                {event.startDate && (
                                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border font-bold text-sm bg-primary/8 border-primary/30 text-primary">
                                        <span className="w-2.5 h-2.5 rounded-full bg-primary animate-flash flex-shrink-0" />
                                        <span className="animate-flash">
                                            Registrations open for {fmtEventRange(event.startDate, event.endDate)}
                                        </span>
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>
                            <div className="flex flex-wrap gap-4 text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    {event.date}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    {event.time}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    {event.location}
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fadeIn stagger-1">
                            <TabsList className={cn("grid w-full h-10 sm:h-12", event.engagements.length > 0 ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4")}>
                                <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                                <TabsTrigger value="schedule" className="text-xs sm:text-sm gap-1">
                                    <Mic2 className="h-3.5 w-3.5 hidden sm:block" />
                                    <span className="hidden sm:inline">Scientific Program</span>
                                    <span className="sm:hidden">Program</span>
                                </TabsTrigger>
                                {event.engagements.length > 0 && (
                                    <TabsTrigger value="engagement" className="text-xs sm:text-sm gap-1">
                                        <Megaphone className="h-3.5 w-3.5 hidden sm:block" />
                                        <span className="hidden sm:inline">Engagement</span>
                                        <span className="sm:hidden">Engage</span>
                                    </TabsTrigger>
                                )}
                                <TabsTrigger value="speakers" className="text-xs sm:text-sm">Speakers</TabsTrigger>
                                <TabsTrigger value="sponsors" className="text-xs sm:text-sm">Sponsors</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-6 mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>About This Event</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                                            {event.description}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>What's Included</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {event.includes.map((item, index) => (
                                                <li key={index} className="flex items-center gap-2">
                                                    <CheckCircle2 className="h-5 w-5 text-medical-green shrink-0" />
                                                    <span className="text-sm">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Venue</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <h4 className="font-medium">{event.location}</h4>
                                            <p className="text-sm text-muted-foreground">{event.address}</p>
                                        </div>
                                        {event.mapLink && (
                                            <Button variant="outline" className="gap-2" asChild>
                                                <a href={event.mapLink} target="_blank" rel="noopener noreferrer">
                                                    <MapPin className="h-4 w-4" />
                                                    View on Google Maps
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="schedule" className="space-y-6 mt-6">
                                {event.sessions.length === 0 ? (
                                    <Card>
                                        <CardContent className="py-12 text-center">
                                            <Mic2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                            <p className="text-muted-foreground">No sessions scheduled yet</p>
                                        </CardContent>
                                    </Card>
                                ) : (() => {
                                    // Group sessions by day
                                    const dayMap = new Map<string, { label: string; date: string; sessions: DisplaySession[] }>();
                                    let dayCounter = 0;
                                    event.sessions.forEach((session) => {
                                        let dateKey = "unscheduled";
                                        if (session.dateRaw) {
                                            try { dateKey = new Date(session.dateRaw).toISOString().split("T")[0]; } catch { dateKey = "unscheduled"; }
                                        }
                                        if (!dayMap.has(dateKey)) {
                                            dayCounter++;
                                            let dateLabel = "Unscheduled";
                                            if (session.dateRaw && dateKey !== "unscheduled") {
                                                try { dateLabel = new Date(session.dateRaw).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }); } catch { /* keep default */ }
                                            }
                                            dayMap.set(dateKey, {
                                                label: session.dateRaw ? `Day ${dayCounter}` : "Unscheduled",
                                                date: dateLabel,
                                                sessions: [],
                                            });
                                        }
                                        dayMap.get(dateKey)!.sessions.push(session);
                                    });
                                    const days = Array.from(dayMap.entries());

                                    // Summary stats
                                    const totalSessions = event.sessions.length;
                                    const totalDays = days.filter(([k]) => k !== "unscheduled").length;
                                    const uniqueHalls = new Set(event.sessions.map(s => s.hallName).filter(Boolean));

                                    return (
                                        <div className="space-y-6">
                                            {/* Summary bar */}
                                            <div className="flex flex-wrap gap-3">
                                                <Badge variant="outline" className="gap-1.5 px-3 py-1">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {totalDays} Day{totalDays !== 1 ? "s" : ""}
                                                </Badge>
                                                <Badge variant="outline" className="gap-1.5 px-3 py-1">
                                                    <Mic2 className="h-3.5 w-3.5" />
                                                    {totalSessions} Session{totalSessions !== 1 ? "s" : ""}
                                                </Badge>
                                                {uniqueHalls.size > 0 && (
                                                    <Badge variant="outline" className="gap-1.5 px-3 py-1">
                                                        <DoorOpen className="h-3.5 w-3.5" />
                                                        {uniqueHalls.size} Hall{uniqueHalls.size !== 1 ? "s" : ""}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Day-wise tabs if multiple days */}
                                            {days.length > 1 ? (
                                                <Tabs defaultValue={days[0][0]} className="w-full">
                                                    <TabsList className="w-full flex overflow-x-auto">
                                                        {days.map(([key, day]) => (
                                                            <TabsTrigger key={key} value={key} className="flex-shrink-0 text-xs sm:text-sm">
                                                                <div className="text-center">
                                                                    <div className="font-medium">{day.label}</div>
                                                                    <div className="text-[10px] text-muted-foreground">{day.date}</div>
                                                                </div>
                                                            </TabsTrigger>
                                                        ))}
                                                    </TabsList>
                                                    {days.map(([key, day]) => (
                                                        <TabsContent key={key} value={key} className="mt-4 space-y-3">
                                                            {renderSessionList(day.sessions, getInitials)}
                                                        </TabsContent>
                                                    ))}
                                                </Tabs>
                                            ) : (
                                                <div className="space-y-3">
                                                    {renderSessionList(days[0]?.[1]?.sessions || event.sessions, getInitials)}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </TabsContent>

                            {/* Engagement Tab */}
                            {event.engagements.length > 0 && (
                                <TabsContent value="engagement" className="space-y-6 mt-6">
                                    <div className="flex flex-wrap gap-3 mb-4">
                                        <Badge variant="outline" className="gap-1.5 px-3 py-1">
                                            <Megaphone className="h-3.5 w-3.5" />
                                            {event.engagements.length} Engagement{event.engagements.length !== 1 ? "s" : ""}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {event.engagements.map((engagement) => {
                                            const EngIcon = ENGAGEMENT_ICON[engagement.type] || Megaphone;
                                            const typeLabels: Record<string, string> = {
                                                POLL: "Poll",
                                                QA: "Q&A Session",
                                                FEEDBACK: "Feedback Form",
                                                ANNOUNCEMENT: "Announcement",
                                                QUIZ: "Quiz",
                                            };
                                            return (
                                                <Card key={engagement.id} className="card-hover">
                                                    <CardContent className="pt-6">
                                                        <div className="flex items-start gap-4">
                                                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                                <EngIcon className="h-6 w-6 text-primary" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <Badge variant="outline" className="text-[10px]">
                                                                        {typeLabels[engagement.type] || engagement.type}
                                                                    </Badge>
                                                                </div>
                                                                <h3 className="font-semibold">{engagement.title}</h3>
                                                                {engagement.description && (
                                                                    <p className="text-sm text-muted-foreground mt-1">{engagement.description}</p>
                                                                )}
                                                                {engagement.type === "POLL" && !!engagement.content && (
                                                                    <div className="mt-3 space-y-1.5">
                                                                        {((engagement.content as { options?: string[] })?.options || []).map((opt: string, i: number) => (
                                                                            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                                <div className="h-2 w-2 rounded-full bg-primary/40" />
                                                                                {opt}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </TabsContent>
                            )}

                            <TabsContent value="speakers" className="space-y-6 mt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {event.speakers.map((speaker) => (
                                        <Card key={speaker.id} className="card-hover">
                                            <CardContent className="pt-6">
                                                <div className="flex items-start gap-4">
                                                    <Avatar className="h-16 w-16">
                                                        <AvatarImage src={speaker.photo || undefined} />
                                                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                                            {getInitials(speaker.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h3 className="font-semibold">{speaker.name}</h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {speaker.designation}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {speaker.institution}
                                                        </p>
                                                        {speaker.topic && (
                                                            <div className="mt-2">
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {speaker.topic}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="sponsors" className="space-y-6 mt-6">
                                {(["platinum", "gold", "silver", "bronze"] as const).map((tier) => {
                                    const tierSponsors = event.sponsors.filter((s) => s.tier === tier);
                                    if (tierSponsors.length === 0) return null;
                                    const config = tierConfig[tier];
                                    const TierIcon = config.icon;

                                    return (
                                        <Card key={tier}>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 capitalize">
                                                    <TierIcon className={cn("h-5 w-5", config.textClass)} />
                                                    {tier} Sponsors
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className={cn(
                                                    "grid gap-4",
                                                    tier === "platinum" ? "grid-cols-1 md:grid-cols-2" : tier === "bronze" ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                                                )}>
                                                    {tierSponsors.map((sponsor) => (
                                                        <a
                                                            key={sponsor.id}
                                                            href={sponsor.website || "#"}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={cn(
                                                                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all hover:shadow-md",
                                                                config.bgClass,
                                                                config.borderClass
                                                            )}
                                                        >
                                                            <div className="h-12 w-12 rounded-lg bg-white flex items-center justify-center shrink-0">
                                                                <Building2 className="h-6 w-6 text-muted-foreground" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={cn("font-medium truncate", config.textClass)}>
                                                                    {sponsor.name}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    Visit website <ExternalLink className="h-3 w-3" />
                                                                </p>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6 lg:sticky lg:top-24 self-start">
                        {/* Registration Card */}
                        <Card className="animate-fadeIn">
                            <CardHeader>
                                <CardTitle>Register Now</CardTitle>
                                {isAlmostFull && (
                                    <div className="flex items-center gap-2 text-medical-orange text-sm">
                                        <AlertCircle className="h-4 w-4" />
                                        Only {slotsRemaining} slots remaining!
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Pricing */}
                                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                    <div>
                                        <p className="font-medium">Registration Fee</p>
                                        <p className="text-xs text-muted-foreground">
                                            {slotsRemaining} slots available
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-2xl text-primary">
                                            {Number(event.price) > 0 ? `${event.currency === "INR" ? "₹" : (event.currency || "₹") + " "}${Number(event.price).toLocaleString()}` : "Free"}
                                        </p>
                                    </div>
                                </div>

                                {/* Early bird hidden */}

                                {/* Registration opens date */}
                                {event.startDate && (
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border font-bold text-sm bg-primary/8 border-primary/30 text-primary">
                                        <span className="w-2.5 h-2.5 rounded-full bg-primary animate-flash flex-shrink-0" />
                                        <span className="animate-flash">
                                            Registrations open for {fmtEventRange(event.startDate, event.endDate)}
                                        </span>
                                    </div>
                                )}

                                {/* Progress */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Registration Progress</span>
                                        <span className="font-medium">
                                            {event.registrations}/{event.capacity}
                                        </span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${(event.registrations / event.capacity) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Registration closed check */}
                                {event.isRegistrationOpen === false || (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) ? (
                                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                                        <p className="text-sm font-medium text-destructive">Registration Closed</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {event.registrationDeadline && new Date(event.registrationDeadline) < new Date()
                                                ? "The registration deadline has passed"
                                                : "Registration is currently closed for this event"}
                                        </p>
                                    </div>
                                ) : event.registrations >= event.capacity ? (
                                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                                        <p className="text-sm font-medium text-destructive">Event Full</p>
                                        <p className="text-xs text-muted-foreground mt-1">All slots have been filled</p>
                                    </div>
                                ) : (
                                    <Link href={`/events/${event.id}/register`} className="block">
                                        <Button className="w-full gap-2 gradient-medical text-white hover:opacity-90" size="lg">
                                            <Ticket className="h-5 w-5" />
                                            Register Now
                                        </Button>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>

                        {/* Contact Card */}
                        <Card className="animate-fadeIn stagger-1">
                            <CardHeader>
                                <CardTitle className="text-base">Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {event.contactEmail && (
                                    <a
                                        href={`mailto:${event.contactEmail}`}
                                        className="flex items-center gap-3 text-sm hover:text-primary"
                                    >
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        {event.contactEmail}
                                    </a>
                                )}
                                {event.contactPhone && (
                                    <a
                                        href={`tel:${event.contactPhone}`}
                                        className="flex items-center gap-3 text-sm hover:text-primary"
                                    >
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        {event.contactPhone}
                                    </a>
                                )}
                                {event.website && (
                                    <a
                                        href={event.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 text-sm hover:text-primary"
                                    >
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        Event Website
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t py-8 bg-muted/30 mt-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg gradient-medical flex items-center justify-center">
                                <GraduationCap className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold">ICMS</span>
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
