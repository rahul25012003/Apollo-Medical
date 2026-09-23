"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, History, Plus, Minus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogEntry {
    id: string;
    actorEmail: string | null;
    actorRole: string | null;
    action: string;
    summary: string;
    createdAt: string;
    metadata: {
        kind?: string;
        status?: string;
        delegateName?: string | null;
        sessionTitle?: string | null;
        speakerName?: string | null;
        from?: string | null;
        to?: string | null;
    } | null;
}

const KIND_LABEL: Record<string, string> = {
    session: "Session",
    speaker: "Speaker",
    food: "Food",
    accommodation: "Accommodation",
};

const VERB = {
    "interest.add": { label: "Added", icon: Plus, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    "interest.remove": { label: "Removed", icon: Minus, className: "bg-rose-50 text-rose-700 border-rose-200" },
    "interest.change": { label: "Changed", icon: RefreshCw, className: "bg-blue-50 text-blue-700 border-blue-200" },
} as const;

const REFRESH_MS = 10_000;

const when = (iso: string) => {
    const d = new Date(iso);
    const mins = Math.round((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

/**
 * Every interest change delegates make, newest first. It polls while it is on
 * screen — an admin watching this wants the number to move without a reload,
 * and 10s is indistinguishable from instant for choices people make by hand.
 * Rows that arrived since the last poll are marked so the change is findable
 * rather than just present.
 */
export function InterestChangeLog({ eventId }: { eventId: string }) {
    const [entries, setEntries] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
    const [lastAt, setLastAt] = useState<Date | null>(null);
    const seen = useRef<Set<string> | null>(null);

    const load = useCallback(async () => {
        try {
            const json = await fetch(
                `/api/tenants/my/activity-log?prefix=interest.&eventId=${encodeURIComponent(eventId)}&limit=50`,
                { cache: "no-store" }
            ).then((r) => r.json());
            if (!json.success) return;
            const rows: LogEntry[] = json.data;
            // First load is not "new" — only what arrives after it is.
            if (seen.current) {
                const added = rows.filter((r) => !seen.current!.has(r.id)).map((r) => r.id);
                if (added.length) {
                    setFreshIds(new Set(added));
                    window.setTimeout(() => setFreshIds(new Set()), 6000);
                }
            }
            seen.current = new Set(rows.map((r) => r.id));
            setEntries(rows);
            setLastAt(new Date());
        } catch {
            /* keep what we have; the next tick will try again */
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        load();
        const id = window.setInterval(load, REFRESH_MS);
        // Catching up immediately beats waiting out the interval after the
        // admin comes back to the tab.
        const onVisible = () => { if (document.visibilityState === "visible") load(); };
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            window.clearInterval(id);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [load]);

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                    Every change delegates make to their interests, newest first.
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    Live{lastAt ? ` · updated ${when(lastAt.toISOString())}` : ""}
                </span>
            </div>

            {entries.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <History className="mx-auto mb-3 h-8 w-8 opacity-30" />
                        <p>No interest changes recorded yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <ul className="space-y-2">
                    {entries.map((e) => {
                        const verb = VERB[e.action as keyof typeof VERB] ?? VERB["interest.change"];
                        const Icon = verb.icon;
                        const kind = e.metadata?.kind ? KIND_LABEL[e.metadata.kind] ?? e.metadata.kind : null;
                        return (
                            <li
                                key={e.id}
                                className={cn(
                                    "flex flex-wrap items-start gap-3 rounded-xl border bg-white p-3 transition-colors duration-700 dark:bg-slate-900",
                                    freshIds.has(e.id) && "border-emerald-300 bg-emerald-50/70 dark:bg-emerald-900/20"
                                )}
                            >
                                <Badge variant="outline" className={cn("gap-1 shrink-0", verb.className)}>
                                    <Icon className="h-3 w-3" /> {verb.label}
                                </Badge>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-slate-900 dark:text-slate-100">{e.summary}</p>
                                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                                        {e.actorEmail && <span>{e.actorEmail}</span>}
                                        {kind && <span>· {kind}</span>}
                                        {e.metadata?.status && <span>· now: {e.metadata.status}</span>}
                                    </p>
                                </div>
                                <time
                                    dateTime={e.createdAt}
                                    title={new Date(e.createdAt).toLocaleString("en-IN")}
                                    className="shrink-0 text-[11px] text-muted-foreground"
                                >
                                    {when(e.createdAt)}
                                </time>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
