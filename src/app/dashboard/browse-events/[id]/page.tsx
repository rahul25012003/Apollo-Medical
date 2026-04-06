"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    Award,
    Ticket,
    ArrowLeft,
    Mail,
    Phone,
    Globe,
    Building2,
    User,
    CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { format } from "date-fns";

interface EventDetails {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    startTime: string | null;
    endTime: string | null;
    location: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    type: string;
    category: string | null;
    capacity: number;
    price: number;
    currency: string;
    earlyBirdPrice: number | null;
    earlyBirdDeadline: string | null;
    cmeCredits: number | null;
    organizer: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    website: string | null;
    _count?: {
        registrations: number;
    };
    eventSessions?: Array<{
        id: string;
        title: string;
        sessionDate: string | null;
        startTime: string | null;
        endTime: string | null;
        sessionType: string;
        description: string | null;
        venue: string | null;
        hall?: { name: string } | null;
        speaker?: { name: string; designation: string | null } | null;
        sessionSpeakers?: Array<{ speaker: { name: string; designation: string | null } }>;
    }>;
    eventSpeakers?: Array<{
        speaker: {
            id: string;
            name: string;
            designation: string | null;
            institution: string | null;
            photo: string | null;
        };
    }>;
    eventSponsors?: Array<{
        sponsor: {
            id: string;
            name: string;
            logo: string | null;
            tier: string;
        };
    }>;
}

export default function EventDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [event, setEvent] = useState<EventDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRegistered, setIsRegistered] = useState(false);

    useEffect(() => {
        async function fetchEvent() {
            try {
                setLoading(true);
                const [eventRes, regsRes] = await Promise.all([
                    fetch(`/api/events/public/${params.id}`),
                    fetch("/api/users/me/registrations"),
                ]);
                const data = await eventRes.json();
                if (data.success && data.data) {
                    setEvent(data.data);
                } else {
                    setError(data.error?.message || "Event not found");
                }
                try {
                    const regsData = await regsRes.json();
                    if (regsData.success && Array.isArray(regsData.data)) {
                        const eventId = String(params.id);
                        const registered = regsData.data.some((r: { event?: { id: string } }) => r.event?.id === eventId);
                        setIsRegistered(registered);
                    }
                } catch { /* ignore — user might not be logged in */ }
            } catch (err) {
                console.error("Failed to fetch event:", err);
                setError("Failed to load event details");
            } finally {
                setLoading(false);
            }
        }

        if (params.id) {
            fetchEvent();
        }
    }, [params.id]);

    const getAvailability = () => {
        if (!event) return { text: "", color: "", available: 0, percentage: 0 };
        const registered = event._count?.registrations || 0;
        const available = event.capacity - registered;
        const percentage = event.capacity > 0 ? (registered / event.capacity) * 100 : 0;

        if (percentage >= 100) return { text: "Sold Out", color: "text-red-600", available: 0, percentage };
        if (percentage >= 90) return { text: `Only ${available} spots left!`, color: "text-orange-600", available, percentage };
        if (percentage >= 70) return { text: "Filling Fast", color: "text-yellow-600", available, percentage };
        return { text: `${available} spots available`, color: "text-green-600", available, percentage };
    };

    if (loading) {
        return (
            <DashboardLayout title="Event Details" subtitle="Loading...">
                <AiimsLoader />
            </DashboardLayout>
        );
    }

    if (error || !event) {
        return (
            <DashboardLayout title="Event Details" subtitle="Event not found">
                <div className="text-center py-12 bg-muted/30 rounded-xl">
                    <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{error || "Event not found"}</h3>
                    <p className="text-muted-foreground mb-4">
                        The event you&apos;re looking for doesn&apos;t exist or has been removed.
                    </p>
                    <Button onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const availability = getAvailability();
    const eventDate = new Date(event.startDate);
    const isPastEvent = eventDate < new Date();
    const isSoldOut = availability.available === 0;

    return (
        <DashboardLayout
            title={event.title}
            subtitle={`${event.type}${event.category ? ` · ${event.category}` : ""}`}
        >
            <div className="space-y-6">
                {/* Back Button */}
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Events
                </Button>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Event Header */}
                        <div className="bg-background rounded-xl border p-6">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Badge variant="secondary">{event.type}</Badge>
                                {event.category && <Badge variant="outline">{event.category}</Badge>}
                                {event.cmeCredits && event.cmeCredits > 0 && (
                                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                        <Award className="w-3 h-3 mr-1" />
                                        {event.cmeCredits} CME Credits
                                    </Badge>
                                )}
                            </div>

                            <h1 className="text-2xl font-bold mb-4">{event.title}</h1>

                            <div className="grid sm:grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Calendar className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">
                                            {format(eventDate, "EEEE, MMMM d, yyyy")}
                                        </p>
                                        {event.endDate !== event.startDate && (
                                            <p className="text-xs">
                                                to {format(new Date(event.endDate), "MMMM d, yyyy")}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {event.startTime && (
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Clock className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">
                                                {event.startTime}
                                                {event.endTime && ` - ${event.endTime}`}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {(event.location || event.city) && (
                                    <div className="flex items-center gap-3 text-muted-foreground sm:col-span-2">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <MapPin className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{event.location}</p>
                                            {event.address && <p className="text-xs">{event.address}</p>}
                                            {(event.city || event.state) && (
                                                <p className="text-xs">
                                                    {[event.city, event.state].filter(Boolean).join(", ")}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-background rounded-xl border p-6">
                            <h2 className="text-lg font-semibold mb-4">About This Event</h2>
                            <div className="prose prose-sm max-w-none text-muted-foreground">
                                <p className="whitespace-pre-wrap">{event.description}</p>
                            </div>
                        </div>

                        {/* Speakers */}
                        {event.eventSpeakers && event.eventSpeakers.length > 0 && (
                            <div className="bg-background rounded-xl border p-6">
                                <h2 className="text-lg font-semibold mb-4">Speakers</h2>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {event.eventSpeakers.map(({ speaker }) => (
                                        <div key={speaker.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                {speaker.photo ? (
                                                    <img
                                                        src={speaker.photo}
                                                        alt={speaker.name}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <User className="w-6 h-6 text-primary" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">{speaker.name}</p>
                                                {speaker.designation && (
                                                    <p className="text-xs text-muted-foreground">{speaker.designation}</p>
                                                )}
                                                {speaker.institution && (
                                                    <p className="text-xs text-muted-foreground">{speaker.institution}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Scientific Program */}
                        {event.eventSessions && event.eventSessions.length > 0 && (() => {
                            const dayMap = new Map<string, { label: string; date: string; items: typeof event.eventSessions }>();
                            let dc = 0;
                            event.eventSessions!.forEach(s => {
                                let dk = "unscheduled";
                                if (s.sessionDate) { const d = new Date(s.sessionDate); if (!isNaN(d.getTime())) { try { dk = d.toISOString().split("T")[0]; } catch { /* */ } } }
                                if (!dayMap.has(dk)) {
                                    dc++;
                                    let dl = "";
                                    if (s.sessionDate && dk !== "unscheduled") { const d = new Date(s.sessionDate); if (!isNaN(d.getTime())) dl = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }); }
                                    dayMap.set(dk, { label: dk !== "unscheduled" ? `Day ${dc}` : "Unscheduled", date: dl, items: [] });
                                }
                                dayMap.get(dk)!.items!.push(s);
                            });
                            return (
                                <div className="bg-background rounded-xl border p-6">
                                    <h2 className="text-lg font-semibold mb-4">Scientific Program</h2>
                                    {Array.from(dayMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([key, day]) => (
                                        <div key={key} className="mb-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{day.label}</span>
                                                {day.date && <span className="text-xs text-muted-foreground">{day.date}</span>}
                                            </div>
                                            <div className="space-y-2">
                                                {[...day.items!].sort((a, b) => (a.startTime || "").localeCompare(b.startTime || "")).map(session => (
                                                    <div key={session.id} className="p-3 rounded-lg bg-muted/50 border">
                                                        <div className="flex items-start gap-3">
                                                            {session.startTime && (
                                                                <div className="text-xs font-medium text-muted-foreground min-w-[55px]">
                                                                    {session.startTime}
                                                                    {session.endTime && <div>{session.endTime}</div>}
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm">{session.title}</p>
                                                                {(() => {
                                                                    const spks = [...(session.sessionSpeakers || []).map(ss => ss.speaker.name), ...(session.speaker ? [session.speaker.name] : [])];
                                                                    return spks.length > 0 ? <p className="text-xs text-muted-foreground mt-0.5">{spks.join(", ")}</p> : null;
                                                                })()}
                                                                {session.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{session.description}</p>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* Contact Information */}
                        {(event.organizer || event.contactEmail || event.contactPhone || event.website) && (
                            <div className="bg-background rounded-xl border p-6">
                                <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
                                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                                    {event.organizer && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Building2 className="w-4 h-4" />
                                            <span>{event.organizer}</span>
                                        </div>
                                    )}
                                    {event.contactEmail && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Mail className="w-4 h-4" />
                                            <a href={`mailto:${event.contactEmail}`} className="hover:text-primary">
                                                {event.contactEmail}
                                            </a>
                                        </div>
                                    )}
                                    {event.contactPhone && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="w-4 h-4" />
                                            <a href={`tel:${event.contactPhone}`} className="hover:text-primary">
                                                {event.contactPhone}
                                            </a>
                                        </div>
                                    )}
                                    {event.website && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Globe className="w-4 h-4" />
                                            <a href={event.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                                                Website
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Registration Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-background rounded-xl border p-6 sticky top-6">
                            <div className="text-center mb-6">
                                <p className="text-3xl font-bold text-primary">
                                    {Number(event.price) > 0 ? `${event.currency === "INR" ? "₹" : (event.currency || "₹") + " "}${Number(event.price).toLocaleString()}` : "Free"}
                                </p>
                            </div>

                            {/* Availability */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-muted-foreground">Availability</span>
                                    <span className={cn("font-medium", availability.color)}>
                                        {availability.text}
                                    </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all",
                                            availability.percentage >= 100 ? "bg-red-500" :
                                            availability.percentage >= 70 ? "bg-yellow-500" : "bg-green-500"
                                        )}
                                        style={{ width: `${Math.min(availability.percentage, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 text-center">
                                    {event._count?.registrations || 0} / {event.capacity} registered
                                </p>
                            </div>

                            {/* What's Included */}
                            {event.cmeCredits && event.cmeCredits > 0 && (
                                <div className="mb-6 p-3 bg-purple-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-purple-700">
                                        <Award className="w-5 h-5" />
                                        <span className="font-medium">{event.cmeCredits} CME Credits</span>
                                    </div>
                                    <p className="text-xs text-purple-600 mt-1">
                                        Certificate will be issued after completion
                                    </p>
                                </div>
                            )}

                            {/* Register Button */}
                            {isRegistered ? (
                                <Button className="w-full gap-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-50" size="lg" variant="outline" disabled>
                                    <CheckCircle2 className="w-5 h-5" />
                                    Already Registered
                                </Button>
                            ) : !isPastEvent && !isSoldOut ? (
                                <Link href={`/dashboard/browse-events/${event.id}/register`} className="block">
                                    <Button className="w-full gap-2" size="lg">
                                        <Ticket className="w-5 h-5" />
                                        Register Now
                                    </Button>
                                </Link>
                            ) : isPastEvent ? (
                                <Button className="w-full" size="lg" disabled>
                                    Event Ended
                                </Button>
                            ) : (
                                <Button className="w-full" size="lg" disabled>
                                    Sold Out
                                </Button>
                            )}

                            <p className="text-xs text-center text-muted-foreground mt-3">
                                Instant registration · Confirmation via email
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
