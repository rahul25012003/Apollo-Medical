"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useUIStore } from "@/store";
import { cn } from "@/lib/utils";
import { useTenant } from "@/lib/tenant/context";
import { useIfpcEvent } from "@/components/ifpc/useIfpcEvent";
import { ExpressInterestButton } from "@/components/ifpc/ExpressInterestButton";
import { MyInterestsPanel, type MyInterests } from "@/components/ifpc/MyInterestsPanel";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Calendar, Clock, MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import { notFound } from "next/navigation";
import { useIsIfpcDashboard } from "@/components/ifpc/guard";

const SESSION_TYPE_STYLES: Record<string, string> = {
    WORKSHOP: "bg-emerald-100 text-emerald-700",
    SEMINAR: "bg-blue-100 text-blue-700",
    COMPETITION: "bg-purple-100 text-purple-700",
    PANEL: "bg-indigo-100 text-indigo-700",
    OTHER: "bg-slate-100 text-slate-700",
};

export default function MyInterestsPage() {
    // IFPC (apollo-medical) only — this page doesn't exist for other tenants.
    const ifpcCheck = useIsIfpcDashboard();
    if (!ifpcCheck.loading && !ifpcCheck.isIfpc) notFound();
    const { sidebarCollapsed } = useUIStore();
    const { tenant, isLoading: tenantLoading } = useTenant();
    const isIfpc = tenant?.slug === IFPC_TENANT_SLUG;
    const { event, loading: eventLoading } = useIfpcEvent();

    const loading = tenantLoading || (isIfpc && eventLoading);

    // The signed-in user's own selections, refreshed whenever they add one here.
    const { data: authSession, status } = useSession();
    const userId = authSession?.user?.id;
    const [mine, setMine] = useState<MyInterests | null>(null);
    const [mineLoading, setMineLoading] = useState(true);
    const loadMine = useCallback(async () => {
        try {
            const json = await fetch("/api/users/me/interests", { cache: "no-store" }).then((r) => r.json());
            if (json.success) setMine(json.data);
        } catch { /* keep what we have */ } finally {
            setMineLoading(false);
        }
    }, []);
    useEffect(() => {
        if (status !== "authenticated" || !ifpcCheck.isIfpc) return;
        setMine(null);
        setMineLoading(true);
        loadMine();
    }, [status, userId, ifpcCheck.isIfpc, loadMine]);

    // Only sessions with a capacity set take sign-ups ("Express Interest") —
    // same convention the public Scientific Programme page uses.
    const workshops = (event?.eventSessions || [])
        .filter((s) => s.capacity != null)
        .slice()
        .sort((a, b) => {
            const ad = a.sessionDate ? new Date(a.sessionDate).getTime() : 0;
            const bd = b.sessionDate ? new Date(b.sessionDate).getTime() : 0;
            if (ad !== bd) return ad - bd;
            return (a.sessionOrder ?? 0) - (b.sessionOrder ?? 0);
        });

    const days = Array.from(
        new Set(workshops.filter((s) => s.sessionDate).map((s) => s.sessionDate!.slice(0, 10)))
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <Sidebar />
            <Header title="My Interests" subtitle="Express interest in workshops and sessions for your event" />
            <main
                className={cn(
                    "pt-16 min-h-screen transition-all duration-300",
                    sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
                )}
            >
                <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto grid gap-6 lg:grid-cols-[1fr_320px] items-start">
                    <aside className="lg:order-2 lg:sticky lg:top-20">
                        <MyInterestsPanel data={mine} loading={mineLoading} />
                    </aside>
                    <div className="lg:order-1 min-w-0">
                    {loading ? (
                        <div className="flex justify-center py-20"><AiimsLoader /></div>
                    ) : !isIfpc ? (
                        <Card className="border-0 shadow-sm">
                            <CardContent className="py-16 text-center text-muted-foreground">
                                <Heart className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p>No workshops or sessions are configured for interest sign-up yet.</p>
                            </CardContent>
                        </Card>
                    ) : workshops.length === 0 ? (
                        <Card className="border-0 shadow-sm">
                            <CardContent className="py-16 text-center text-muted-foreground">
                                <Heart className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p>No workshops or sessions are open for interest sign-up right now.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-8">
                            {days.map((day) => (
                                <div key={day}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        <h3 className="font-bold">{format(parseISO(day), "EEEE, MMMM d, yyyy")}</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {workshops.filter((s) => s.sessionDate?.slice(0, 10) === day).map((s) => (
                                            <Card key={s.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                                                        <div>
                                                            <Badge className={cn("text-xs mb-1.5", SESSION_TYPE_STYLES[s.sessionType] || SESSION_TYPE_STYLES.OTHER)}>
                                                                {s.sessionType}
                                                            </Badge>
                                                            <h4 className="font-semibold">{s.title}</h4>
                                                        </div>
                                                        {(s.startTime || s.hall) && (
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                {s.startTime && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{s.startTime}{s.endTime ? `–${s.endTime}` : ""}</span>}
                                                                {s.hall && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{s.hall.name}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {s.description && (
                                                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{s.description}</p>
                                                    )}
                                                    <ExpressInterestButton sessionId={s.id} onInterested={loadMine} />
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    </div>
                </div>
            </main>
        </div>
    );
}
