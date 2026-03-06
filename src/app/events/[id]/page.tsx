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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { eventsService, Event, EventSpeaker, EventSponsor, EventSession } from "@/services/events";

// Display types
interface DisplaySession {
    id: string;
    title: string;
    description: string | null;
    date: string | null;
    startTime: string | null;
    endTime: string | null;
    venue: string | null;
    speaker?: {
        id: string;
        name: string;
        designation: string | null;
        institution: string | null;
        photo: string | null;
    } | null;
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
    earlyBirdPrice: number | null;
    earlyBirdDeadline: string | null;
    cmeCredits: number | null;
    contactEmail: string | null;
    contactPhone: string | null;
    website: string | null;
    sponsors: { id: string; name: string; tier: string; website: string | null; logo: string | null }[];
    speakers: { id: string; name: string; designation: string | null; institution: string | null; topic: string | null; photo: string | null }[];
    sessions: DisplaySession[];
    includes: string[];
}

const tierConfig = {
    platinum: { icon: Crown, bgClass: "bg-slate-100", textClass: "text-slate-700", borderClass: "border-slate-300" },
    gold: { icon: Award, bgClass: "bg-yellow-50", textClass: "text-yellow-700", borderClass: "border-yellow-300" },
    silver: { icon: Medal, bgClass: "bg-gray-100", textClass: "text-gray-600", borderClass: "border-gray-300" },
    bronze: { icon: Medal, bgClass: "bg-orange-50", textClass: "text-orange-700", borderClass: "border-orange-300" },
};

export default function EventDetailPage() {
    const params = useParams();
    const eventId = params.id as string;
    const [activeTab, setActiveTab] = useState("overview");
    const [event, setEvent] = useState<DisplayEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    // Check if page was opened as preview from dashboard
    useEffect(() => {
        if (typeof window !== "undefined") {
            // Only show preview mode if explicitly set via query param
            const urlParams = new URLSearchParams(window.location.search);
            const isPreview = urlParams.get("preview") === "true";
            setIsPreviewMode(isPreview);
        }
    }, []);

    // Fetch event from API
    useEffect(() => {
        async function fetchEvent() {
            try {
                setLoading(true);
                setError(null);
                const response = await eventsService.getPublicById(eventId);

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
                        price: Number(apiEvent.price),
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
                        // Get sessions from eventSessions
                        sessions: apiEvent.eventSessions?.map((es: EventSession) => ({
                            id: es.id,
                            title: es.title,
                            description: es.description,
                            date: es.sessionDate ? new Date(es.sessionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : null,
                            startTime: es.startTime,
                            endTime: es.endTime,
                            venue: es.venue,
                            speaker: es.speaker ? {
                                id: es.speaker.id,
                                name: es.speaker.name,
                                designation: es.speaker.designation,
                                institution: es.speaker.institution,
                                photo: es.speaker.photo,
                            } : null,
                        })) || [],
                        // Derive unique speakers from sessions
                        speakers: (() => {
                            const speakerMap = new Map<string, { id: string; name: string; designation: string | null; institution: string | null; topic: string | null; photo: string | null }>();
                            // First add speakers from eventSessions (new model)
                            apiEvent.eventSessions?.forEach((es: EventSession) => {
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
                    };

                    setEvent(displayEvent);
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
                            <Link href="/">
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
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                                <TabsTrigger value="speakers">Speakers</TabsTrigger>
                                <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
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
                                            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                            <p className="text-muted-foreground">No sessions scheduled yet</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="space-y-4">
                                        {event.sessions.map((session) => (
                                            <Card key={session.id} className="card-hover">
                                                <CardContent className="pt-6">
                                                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                                                        <div className="flex-shrink-0 text-center md:text-left md:w-32">
                                                            {session.date && (
                                                                <div className="text-sm font-medium text-primary">{session.date}</div>
                                                            )}
                                                            {session.startTime && (
                                                                <div className="text-xs text-muted-foreground">
                                                                    {session.startTime}{session.endTime ? ` - ${session.endTime}` : ""}
                                                                </div>
                                                            )}
                                                            {session.venue && (
                                                                <div className="text-xs text-muted-foreground mt-1">{session.venue}</div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-lg">{session.title}</h3>
                                                            {session.description && (
                                                                <p className="text-sm text-muted-foreground mt-1">{session.description}</p>
                                                            )}
                                                            {session.speaker && (
                                                                <div className="flex items-center gap-3 mt-3 pt-3 border-t">
                                                                    <Avatar className="h-10 w-10">
                                                                        <AvatarImage src={session.speaker.photo || undefined} />
                                                                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                                                            {getInitials(session.speaker.name)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <div className="font-medium text-sm">{session.speaker.name}</div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {session.speaker.designation}{session.speaker.institution ? `, ${session.speaker.institution}` : ""}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

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
                                                        <div className="mt-2">
                                                            <Badge variant="secondary" className="text-xs">
                                                                {speaker.topic}
                                                            </Badge>
                                                        </div>
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
                                                    tier === "platinum" ? "grid-cols-1 md:grid-cols-2" : tier === "bronze" ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3"
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
                    <div className="space-y-6 sticky top-24 self-start">
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
                                        {event.earlyBirdPrice && (
                                            <p className="text-xs text-muted-foreground line-through">
                                                ₹{event.price.toLocaleString()}
                                            </p>
                                        )}
                                        <p className="font-bold text-2xl text-primary">
                                            ₹{(event.earlyBirdPrice || event.price).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {event.earlyBirdDeadline && (
                                    <div className="p-3 rounded-lg bg-medical-orange-light border border-medical-orange/20">
                                        <p className="text-sm text-medical-orange font-medium">
                                            Early bird pricing ends {event.earlyBirdDeadline}
                                        </p>
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

                                <Link href={`/events/${event.id}/register`} className="block">
                                    <Button className="w-full gap-2 gradient-medical text-white hover:opacity-90" size="lg">
                                        <Ticket className="h-5 w-5" />
                                        Register Now
                                    </Button>
                                </Link>
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
