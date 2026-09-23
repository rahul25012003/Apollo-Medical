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
import { Heart, Calendar, Clock, MapPin, CircleDot, ListChecks } from "lucide-react";
import { EOI_CATEGORIES, EOI_CATEGORY_ORDER, eoiCategoryOf, INTEREST_CHANGED_EVENT } from "@/lib/ifpc-eoi";
import type { EventSession } from "@/services/events";
import { format, parseISO } from "date-fns";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import { notFound } from "next/navigation";
import { useIsIfpcDashboard } from "@/components/ifpc/guard";

const SESSION_TYPE_STYLES: Record<string, string> = {
    WORKSHOP: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    SEMINAR: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    COMPETITION: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    PANEL: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    OTHER: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
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

    // Live refresh: pick up interest changes made anywhere (e.g. a speaker
    // marked "Interested" on the event page), not just from buttons on this page.
    useEffect(() => {
        if (status !== "authenticated" || !ifpcCheck.isIfpc) return;
        window.addEventListener(INTEREST_CHANGED_EVENT, loadMine);
        return () => window.removeEventListener(INTEREST_CHANGED_EVENT, loadMine);
    }, [status, ifpcCheck.isIfpc, loadMine]);

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

    // Tour / yoga / morning & afternoon workshops each follow a selection rule;
    // everything else stays grouped by day as before.
    const groups = EOI_CATEGORY_ORDER
        .map((cat) => ({ cat, sessions: workshops.filter((s) => eoiCategoryOf(s) === cat) }))
        .filter((g) => g.sessions.length > 0);
    const others = workshops.filter((s) => !eoiCategoryOf(s));
    const days = Array.from(
        new Set(others.filter((s) => s.sessionDate).map((s) => s.sessionDate!.slice(0, 10)))
    );

    const sessionCard = (s: EventSession, showDate: boolean) => (
        <Card key={s.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                    <div>
                        <Badge className={cn("text-xs mb-1.5", SESSION_TYPE_STYLES[s.sessionType] || SESSION_TYPE_STYLES.OTHER)}>
                            {s.sessionType}
                        </Badge>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">{s.title}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {showDate && (
                            <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                                <Calendar className="h-3.5 w-3.5" />
                                {s.sessionDate ? format(parseISO(s.sessionDate.slice(0, 10)), "EEE, d MMM") : "Date to be announced"}
                            </span>
                        )}
                        {s.startTime && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{s.startTime}{s.endTime ? `–${s.endTime}` : ""}</span>}
                        {s.hall && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{s.hall.name}</span>}
                    </div>
                </div>
                {s.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{s.description}</p>
                )}
                <ExpressInterestButton sessionId={s.id} onInterested={loadMine} showRule={false} />
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
            <Sidebar />
            <Header title="My Interests" subtitle="Express interest in workshops and sessions for your event" />
            <main
                className={cn(
                    "pt-16 min-h-screen transition-all duration-300",
                    sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
                )}
            >
                <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto grid gap-6 lg:grid-cols-[340px_1fr] items-start">
                    <aside className="lg:order-1 lg:sticky lg:top-20">
                        <MyInterestsPanel data={mine} loading={mineLoading} />
                    </aside>
                    <div className="lg:order-2 min-w-0">
                        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">More Interests</h2>
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
                            {groups.map(({ cat, sessions }) => {
                                const rule = EOI_CATEGORIES[cat];
                                return (
                                    <section key={cat}>
                                        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{rule.label}</h3>
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                                                rule.single ? "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50" : "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50"
                                            )}>
                                                {rule.single ? <CircleDot className="h-3.5 w-3.5" /> : <ListChecks className="h-3.5 w-3.5" />}
                                                {rule.rule}
                                            </span>
                                        </div>
                                        {rule.single && sessions.length > 1 && (
                                            <p className="text-xs text-muted-foreground -mt-1 mb-3">Choosing another option replaces your current choice.</p>
                                        )}
                                        <div className="space-y-3">{sessions.map((s) => sessionCard(s, true))}</div>
                                    </section>
                                );
                            })}
                            {days.map((day) => (
                                <div key={day}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        <h3 className="font-bold">{format(parseISO(day), "EEEE, MMMM d, yyyy")}</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {others.filter((s) => s.sessionDate?.slice(0, 10) === day).map((s) => sessionCard(s, false))}
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
