"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useUIStore } from "@/store";
import { cn } from "@/lib/utils";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Mic2,
    Calendar,
    Clock,
    MapPin,
    DoorOpen,
    Users,
    FileText,
} from "lucide-react";
import { format } from "date-fns";

interface SessionData {
    id: string;
    title: string;
    description: string | null;
    sessionType: string;
    sessionDate: string | null;
    startTime: string | null;
    endTime: string | null;
    status: string;
    hall: string | null;
    talkTitle: string | null;
    talkDescription: string | null;
    event: {
        id: string;
        title: string;
        startDate: string;
        endDate: string;
        location: string | null;
        city: string | null;
    };
    coSpeakers: { name: string; photo: string | null; designation: string | null }[];
}

interface EventAssignment {
    eventId: string;
    eventTitle: string;
    topic: string | null;
    sessionDate: string | null;
    sessionTime: string | null;
    event: {
        id: string;
        title: string;
        startDate: string;
        endDate: string;
        location: string | null;
        city: string | null;
    };
}

const SESSION_TYPE_STYLES: Record<string, { badge: string; icon: string }> = {
    KEYNOTE: { badge: "bg-blue-100 text-blue-700", icon: "🎤" },
    PLENARY: { badge: "bg-indigo-100 text-indigo-700", icon: "🏛️" },
    WORKSHOP: { badge: "bg-emerald-100 text-emerald-700", icon: "🔬" },
    PANEL: { badge: "bg-purple-100 text-purple-700", icon: "👥" },
    BREAK: { badge: "bg-amber-100 text-amber-700", icon: "☕" },
    OTHER: { badge: "bg-slate-100 text-slate-700", icon: "📋" },
};

export default function MySessionsPage() {
    const { sidebarCollapsed } = useUIStore();
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [events, setEvents] = useState<EventAssignment[]>([]);

    useEffect(() => {
        async function fetchMySessions() {
            try {
                const res = await fetch("/api/users/me/speaker-sessions");
                const data = await res.json();
                if (data.success && data.data) {
                    setSessions(data.data.sessions || []);
                    setEvents(data.data.events || []);
                }
            } catch (err) {
                console.error("Failed to fetch sessions:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchMySessions();
    }, []);

    // Group sessions by event
    const sessionsByEvent = sessions.reduce<Record<string, { event: SessionData["event"]; sessions: SessionData[] }>>((acc, s) => {
        const key = s.event.id;
        if (!acc[key]) acc[key] = { event: s.event, sessions: [] };
        acc[key].sessions.push(s);
        return acc;
    }, {});

    const isEmpty = sessions.length === 0 && events.length === 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <Sidebar />
            <Header title="My Sessions" subtitle="Sessions you are speaking at" />
            <main className={cn(
                "pt-16 min-h-screen transition-all duration-300",
                sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64",
                "pl-0"
            )}>
                <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                    {loading ? (
                        <AiimsLoader />
                    ) : isEmpty ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
                                <Mic2 className="h-10 w-10 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-1">No sessions assigned</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                You haven&apos;t been assigned to any sessions yet. Sessions will appear here once an event organizer adds you as a speaker.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Sessions grouped by event */}
                            {Object.values(sessionsByEvent).map(({ event, sessions: eventSessions }) => (
                                <div key={event.id} className="space-y-3">
                                    {/* Event header */}
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-foreground">{event.title}</h2>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {format(new Date(event.startDate), "MMM d, yyyy")}
                                                </span>
                                                {(event.location || event.city) && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {[event.location, event.city].filter(Boolean).join(", ")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Session cards */}
                                    <div className="grid gap-3 pl-4 border-l-2 border-blue-200 ml-4">
                                        {eventSessions.map((s) => {
                                            const typeStyle = SESSION_TYPE_STYLES[s.sessionType] || SESSION_TYPE_STYLES.OTHER;
                                            return (
                                                <Card key={s.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start gap-4">
                                                            {/* Time */}
                                                            <div className="flex-shrink-0 text-center min-w-[70px]">
                                                                {s.startTime && (
                                                                    <div className="text-sm font-semibold text-foreground">
                                                                        {s.startTime}
                                                                    </div>
                                                                )}
                                                                {s.endTime && (
                                                                    <div className="text-xs text-muted-foreground">{s.endTime}</div>
                                                                )}
                                                                {s.sessionDate && (
                                                                    <div className="text-[10px] text-muted-foreground mt-1">
                                                                        {format(new Date(s.sessionDate), "MMM d")}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                    <Badge className={cn("text-xs", typeStyle.badge)}>
                                                                        {typeStyle.icon} {s.sessionType}
                                                                    </Badge>
                                                                    {s.hall && (
                                                                        <Badge variant="outline" className="text-xs gap-1">
                                                                            <DoorOpen className="w-3 h-3" /> {s.hall}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <h3 className="font-semibold text-foreground">{s.title}</h3>

                                                                {s.talkTitle && (
                                                                    <p className="text-sm text-primary mt-1 flex items-center gap-1.5">
                                                                        <FileText className="w-3.5 h-3.5" />
                                                                        Your talk: {s.talkTitle}
                                                                    </p>
                                                                )}

                                                                {s.description && (
                                                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                                                                )}

                                                                {s.coSpeakers.length > 0 && (
                                                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                                                                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                                                        <span className="text-xs text-muted-foreground">
                                                                            Co-speakers: {s.coSpeakers.map(cs => cs.name).join(", ")}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Event-level assignments without specific sessions */}
                            {events.length > 0 && (
                                <div className="space-y-3">
                                    {events.map((e) => (
                                        <div key={e.eventId} className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <a href={`/dashboard/events/${e.event.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                                                        {e.event.title}
                                                    </a>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {format(new Date(e.event.startDate), "MMM d, yyyy")}
                                                            {e.event.endDate && e.event.endDate !== e.event.startDate && (
                                                                <> - {format(new Date(e.event.endDate), "MMM d, yyyy")}</>
                                                            )}
                                                        </span>
                                                        {(e.event.location || e.event.city) && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" />
                                                                {[e.event.location, e.event.city].filter(Boolean).join(", ")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid gap-3 pl-4 border-l-2 border-violet-200 ml-4">
                                                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                                                    <CardContent className="p-4 flex items-center gap-4">
                                                        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100">
                                                            <Mic2 className="w-5 h-5 text-violet-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-foreground">Speaker Assignment</p>
                                                            {e.topic && <p className="text-sm text-primary mt-0.5">{e.topic}</p>}
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                                                {e.sessionDate && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="w-3 h-3" />
                                                                        {format(new Date(e.sessionDate), "MMM d, yyyy")}
                                                                    </span>
                                                                )}
                                                                {e.sessionTime && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" /> {e.sessionTime}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
