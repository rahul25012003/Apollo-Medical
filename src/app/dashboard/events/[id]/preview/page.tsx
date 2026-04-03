"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import {
    ArrowLeft,
    Calendar,
    MapPin,
    Clock,
    Users,
    Award,
    Mic2,
    Globe,
    Mail,
    Phone,
    DoorOpen,
    CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { eventsService } from "@/services/events";

export default function EventPreviewPage() {
    const params = useParams();
    const eventId = params.id as string;
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEvent() {
            try {
                const res = await eventsService.getById(eventId);
                if (res.success && res.data) {
                    setEvent(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch event:", err);
            } finally {
                setLoading(false);
            }
        }
        if (eventId) fetchEvent();
    }, [eventId]);

    if (loading) return <AiimsLoader fullPage />;

    if (!event) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
                <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
                <Link href="/dashboard/events"><Button variant="outline">Back to Events</Button></Link>
            </div>
        );
    }

    const startDate = event.startDate ? new Date(event.startDate) : null;
    const endDate = event.endDate ? new Date(event.endDate) : null;
    const speakers = event.eventSpeakers?.map((es: any) => es.speaker) || [];
    const sessions = event.eventSessions || [];

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-2xl shadow-sm border-b border-slate-200/50">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex h-14 items-center justify-between">
                        <Link href={`/dashboard/events/${eventId}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Event
                        </Link>
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">Preview Mode</Badge>
                    </div>
                </div>
            </header>

            {/* Hero Banner */}
            <div className="relative h-[300px] sm:h-[400px] overflow-hidden">
                {event.bannerImage ? (
                    <Image src={event.bannerImage} alt={event.title} fill className="object-cover" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-700" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 text-white">
                    <div className="container mx-auto">
                        <Badge className="mb-3 bg-white/20 backdrop-blur-sm border-0">{event.type || "Conference"}</Badge>
                        {!event.isPublished && <Badge className="mb-3 ml-2 bg-amber-500/80 border-0">Draft</Badge>}
                        <h1 className="text-2xl sm:text-4xl font-bold mb-2 drop-shadow-md">{event.title}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                            {startDate && (
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    {format(startDate, "d MMM yyyy")}
                                    {endDate && startDate.toDateString() !== endDate.toDateString() && ` — ${format(endDate, "d MMM yyyy")}`}
                                </span>
                            )}
                            {event.location && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4" />
                                    {[event.location, event.city].filter(Boolean).join(", ")}
                                </span>
                            )}
                            {event.startTime && (
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    {event.startTime}{event.endTime ? ` — ${event.endTime}` : ""}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Description */}
                        {event.description && (
                            <div>
                                <h2 className="text-xl font-bold mb-4">About This Event</h2>
                                <div className="prose prose-slate max-w-none text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: event.description.replace(/\n/g, "<br/>") }} />
                            </div>
                        )}

                        {/* Speakers */}
                        {speakers.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Mic2 className="h-5 w-5 text-teal-600" /> Speakers</h2>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {speakers.map((speaker: any) => (
                                        <Card key={speaker.id} className="overflow-hidden">
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                                                    {speaker.photo ? (
                                                        <img src={speaker.photo} alt={speaker.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        speaker.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold truncate">{speaker.name}</p>
                                                    {speaker.designation && <p className="text-sm text-muted-foreground truncate">{speaker.designation}</p>}
                                                    {speaker.institution && <p className="text-xs text-muted-foreground truncate">{speaker.institution}</p>}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sessions */}
                        {sessions.length > 0 && (() => {
                            // Group sessions by day
                            const dayMap = new Map<string, { label: string; date: string; sessions: any[] }>();
                            let dayCounter = 0;
                            sessions.forEach((session: any) => {
                                let dateKey = "unscheduled";
                                if (session.sessionDate) {
                                    const d = new Date(session.sessionDate);
                                    if (!isNaN(d.getTime())) {
                                        try { dateKey = d.toISOString().split("T")[0]; } catch { /* */ }
                                    }
                                }
                                if (!dayMap.has(dateKey)) {
                                    dayCounter++;
                                    let dateLabel = "";
                                    if (session.sessionDate && dateKey !== "unscheduled") {
                                        const d = new Date(session.sessionDate);
                                        if (!isNaN(d.getTime())) dateLabel = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
                                    }
                                    dayMap.set(dateKey, { label: dateKey !== "unscheduled" ? `Day ${dayCounter}` : "Unscheduled", date: dateLabel, sessions: [] });
                                }
                                dayMap.get(dateKey)!.sessions.push(session);
                            });
                            const days = Array.from(dayMap.entries()).sort(([a], [b]) => a.localeCompare(b));
                            return (
                            <div>
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><DoorOpen className="h-5 w-5 text-teal-600" /> Scientific Program</h2>
                                {days.map(([key, day]) => (
                                <div key={key} className="mb-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">{day.label}</span>
                                        {day.date && <span className="text-xs text-muted-foreground">{day.date}</span>}
                                    </div>
                                    <div className="space-y-3">
                                    {day.sessions.map((session: any) => (
                                        <Card key={session.id} className="overflow-hidden">
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-4">
                                                    {session.startTime && (
                                                        <div className="text-sm font-medium text-foreground min-w-[70px]">
                                                            {session.startTime}
                                                            {session.endTime && <div className="text-xs text-muted-foreground">{session.endTime}</div>}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Badge variant="outline" className="text-xs">{session.sessionType || "OTHER"}</Badge>
                                                            <h3 className="font-semibold">{session.title}</h3>
                                                        </div>
                                                        {session.description && <p className="text-sm text-muted-foreground mt-1">{session.description}</p>}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    </div>
                                </div>
                                ))}
                            </div>
                            );
                        })()}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Key Info Card */}
                        <Card className="sticky top-20">
                            <CardContent className="p-6 space-y-4">
                                <div className="text-center mb-4">
                                    <p className="text-3xl font-bold text-teal-600">
                                        {Number(event.price) > 0 ? `${event.currency === "INR" ? "₹" : (event.currency || "₹") + " "}${Number(event.price).toLocaleString()}` : "Free"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Registration Fee</p>
                                </div>

                                <div className="space-y-3 text-sm">
                                    {event.capacity && (
                                        <div className="flex items-center gap-3">
                                            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <span>{event.capacity} seats</span>
                                        </div>
                                    )}
                                    {event.cmeCredits && (
                                        <div className="flex items-center gap-3">
                                            <Award className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <span>{event.cmeCredits} CME Credits</span>
                                        </div>
                                    )}
                                    {event.organizer && (
                                        <div className="flex items-center gap-3">
                                            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <span>{event.organizer}</span>
                                        </div>
                                    )}
                                    {event.contactEmail && (
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <a href={`mailto:${event.contactEmail}`} className="text-teal-600 hover:underline truncate">{event.contactEmail}</a>
                                        </div>
                                    )}
                                    {event.contactPhone && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <a href={`tel:${event.contactPhone}`} className="text-teal-600 hover:underline">{event.contactPhone}</a>
                                        </div>
                                    )}
                                    {event.website && (
                                        <div className="flex items-center gap-3">
                                            <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <a href={event.website} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline truncate">{event.website}</a>
                                        </div>
                                    )}
                                </div>

                                {event.includes && event.includes.length > 0 && (
                                    <div className="pt-4 border-t">
                                        <h4 className="font-semibold text-sm mb-2">What's Included</h4>
                                        <ul className="space-y-1.5">
                                            {event.includes.map((item: string, i: number) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-500 mt-0.5 flex-shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="pt-4">
                                    <Badge variant="outline" className="w-full justify-center py-2 text-amber-700 bg-amber-50 border-amber-200">
                                        This is a preview — event is {event.isPublished ? "published" : "not published yet"}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
