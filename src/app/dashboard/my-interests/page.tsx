"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useUIStore } from "@/store";
import { cn } from "@/lib/utils";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Calendar, Clock, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

interface InterestData {
    interestId: string;
    registeredAt: string;
    session: {
        id: string;
        title: string;
        description: string | null;
        sessionType: string;
        sessionDate: string | null;
        startTime: string | null;
        endTime: string | null;
        capacity: number | null;
        venue: string | null;
        event: {
            id: string;
            title: string;
            startDate: string;
            endDate: string;
            location: string | null;
            city: string | null;
        };
    };
}

const SESSION_TYPE_STYLES: Record<string, string> = {
    WORKSHOP: "bg-emerald-100 text-emerald-700",
    SEMINAR: "bg-blue-100 text-blue-700",
    COMPETITION: "bg-purple-100 text-purple-700",
    PANEL: "bg-indigo-100 text-indigo-700",
    OTHER: "bg-slate-100 text-slate-700",
};

export default function MyInterestsPage() {
    const { sidebarCollapsed } = useUIStore();
    const [loading, setLoading] = useState(true);
    const [interests, setInterests] = useState<InterestData[]>([]);

    useEffect(() => {
        async function fetchInterests() {
            try {
                const res = await fetch("/api/users/me/interests");
                const data = await res.json();
                if (data.success) setInterests(data.data);
            } finally {
                setLoading(false);
            }
        }
        fetchInterests();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <Sidebar />
            <Header title="My Interests" subtitle="Workshops and sessions you've marked interest in" />
            <main
                className={cn(
                    "pt-16 min-h-screen transition-all duration-300",
                    sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
                )}
            >
                <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
                    {loading ? (
                        <div className="flex justify-center py-20"><AiimsLoader /></div>
                    ) : interests.length === 0 ? (
                        <Card className="border-0 shadow-sm">
                            <CardContent className="py-16 text-center text-muted-foreground">
                                <Heart className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p>You haven&apos;t marked interest in any workshops or sessions yet.</p>
                                <p className="text-sm mt-1">Look for the &quot;I&apos;d like to attend&quot; button on the Scientific Programme page.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {interests.map(({ interestId, session }) => (
                                <Card key={interestId} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-3 flex-wrap">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                    <Badge className={cn("text-xs", SESSION_TYPE_STYLES[session.sessionType] || SESSION_TYPE_STYLES.OTHER)}>
                                                        {session.sessionType}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">{session.event.title}</span>
                                                </div>
                                                <h3 className="font-semibold">{session.title}</h3>
                                                {session.description && (
                                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{session.description}</p>
                                                )}
                                                <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                                                    {session.sessionDate && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {format(new Date(session.sessionDate), "d MMM yyyy")}
                                                        </span>
                                                    )}
                                                    {session.startTime && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {session.startTime}{session.endTime ? ` - ${session.endTime}` : ""}
                                                        </span>
                                                    )}
                                                    {session.venue && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            {session.venue}
                                                        </span>
                                                    )}
                                                    {session.capacity != null && (
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-3.5 w-3.5" />
                                                            Capacity: {session.capacity}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 whitespace-nowrap">
                                                You&apos;re interested
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
