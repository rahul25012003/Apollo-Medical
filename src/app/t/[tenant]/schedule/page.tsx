"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { format, parseISO } from "date-fns";
import { CalendarDays, Clock, MapPin, CheckCircle2, QrCode, LogIn, Loader2, Map as MapIcon } from "lucide-react";
import { DelegatePageShell } from "@/components/ifpc/DelegatePageShell";
import { useTenant } from "@/lib/tenant/context";
import { useIfpcEvent } from "@/components/ifpc/useIfpcEvent";
import { conferenceDay, eoiCategoryOf, eoiRule } from "@/lib/ifpc-eoi";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import { cn } from "@/lib/utils";

type Session = {
  id: string;
  title: string;
  sessionType: string;
  sessionDate: string | null;
  startTime: string | null;
  endTime: string | null;
  venue: string | null;
  hall?: { name: string } | null;
};

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER"]);

/**
 * The conference schedule — the page the printed QR codes open. Public, so
 * anyone scanning a poster sees it without signing in; a signed-in delegate
 * also sees which sessions are their own picks, and can narrow to just those.
 */
export default function SchedulePage() {
  const params = useParams();
  const tenantSlug = params.tenant as string;
  if (tenantSlug !== IFPC_TENANT_SLUG) notFound();

  const { tenant } = useTenant();
  const { event, loading } = useIfpcEvent();
  const { data: auth, status } = useSession();
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [onlyMine, setOnlyMine] = useState(false);
  const accent = tenant?.theme?.primaryColor || "#2582A1";

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/users/me/interests", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => { if (j.success) setMine(new Set(j.data.sessions.map((s: { sessionId: string }) => s.sessionId))); })
      .catch(() => {});
  }, [status]);

  const sessions = (event?.eventSessions ?? []) as unknown as Session[];
  const days = useMemo(
    () => Array.from(new Set(sessions.filter((s) => s.sessionDate).map((s) => s.sessionDate!.slice(0, 10)))).sort(),
    [sessions]
  );

  // Open on today during the conference, otherwise Day 1.
  const [day, setDay] = useState<string | null>(null);
  useEffect(() => {
    if (day || days.length === 0) return;
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    setDay(days.includes(today) ? today : days[0]);
  }, [days, day]);

  // Sessions of the chosen day, bucketed by time slot so the three parallel
  // workshops read as one choice rather than three unrelated rows.
  const slots = useMemo(() => {
    const list = sessions
      .filter((s) => s.sessionDate?.slice(0, 10) === day)
      .filter((s) => !onlyMine || mine.has(s.id))
      .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? "") || a.title.localeCompare(b.title));
    const map = new Map<string, Session[]>();
    for (const s of list) {
      const key = `${s.startTime ?? ""}–${s.endTime ?? ""}`;
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return Array.from(map.entries());
  }, [sessions, day, onlyMine, mine]);

  const signedIn = status === "authenticated";
  const isAdmin = signedIn && ADMIN_ROLES.has((auth?.user as { role?: string } | undefined)?.role ?? "");

  return (
    <DelegatePageShell
      title="Schedule"
      icon={CalendarDays}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href={`/t/${tenantSlug}/route-map`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <MapIcon className="h-4 w-4" /> Route map
          </Link>
          {isAdmin && (
            <Link href={`/t/${tenantSlug}/schedule/qr`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <QrCode className="h-4 w-4" /> Print QR poster
            </Link>
          )}
        </div>
      }
    >
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        ) : days.length === 0 ? (
          <p className="rounded-xl bg-white p-8 text-center text-slate-500">The schedule will be published soon.</p>
        ) : (
          <>
            {/* Day picker — one tap per day, the chosen one filled. */}
            <div role="tablist" aria-label="Conference days" className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
              {days.map((d) => {
                const active = d === day;
                return (
                  <button
                    key={d}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setDay(d)}
                    className={cn(
                      "flex min-w-[88px] flex-none flex-col items-center rounded-xl border px-3 py-2 text-center transition-colors",
                      active ? "border-transparent text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                    style={active ? { background: accent } : undefined}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide opacity-80">Day {conferenceDay(d)}</span>
                    <span className="text-sm font-bold">{format(parseISO(d), "EEE d MMM")}</span>
                  </button>
                );
              })}
            </div>

            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-slate-200">
              {signedIn ? (
                <>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-slate-700">
                    <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} className="h-4 w-4 accent-current" style={{ color: accent }} />
                    Show only my picks ({sessions.filter((s) => mine.has(s.id)).length})
                  </label>
                  <Link href="/dashboard/my-interests" className="font-medium hover:underline" style={{ color: accent }}>Change my picks</Link>
                </>
              ) : (
                <>
                  <span className="text-slate-600">Registered delegate? Sign in to see your own schedule.</span>
                  <Link href="/auth/login" className="inline-flex items-center gap-1 font-medium hover:underline" style={{ color: accent }}>
                    <LogIn className="h-4 w-4" /> Sign in
                  </Link>
                </>
              )}
            </div>

            {slots.length === 0 ? (
              <p className="rounded-xl bg-white p-8 text-center text-slate-500">
                {onlyMine ? "You haven't picked anything on this day." : "Nothing scheduled on this day yet."}
              </p>
            ) : (
              <ol className="space-y-4">
                {slots.map(([time, items]) => {
                  const group = eoiCategoryOf(items[0]);
                  const choice = items.length > 1 && group && eoiRule(group).single;
                  return (
                    <li key={time} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900">
                          <Clock className="h-4 w-4 text-slate-400" /> {time.replace(/–$/, "")}
                        </span>
                        {choice && (
                          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                            {eoiRule(group!).label} · choose one
                          </span>
                        )}
                      </div>
                      <ul className="divide-y divide-slate-100">
                        {items.map((s) => {
                          const picked = mine.has(s.id);
                          return (
                            <li key={s.id} className="flex items-start justify-between gap-3 py-2.5">
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900">{s.title}</p>
                                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                                  <span>{s.sessionType.charAt(0) + s.sessionType.slice(1).toLowerCase()}</span>
                                  {(s.hall?.name || s.venue) && (
                                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{s.hall?.name || s.venue}</span>
                                  )}
                                </p>
                              </div>
                              {picked && (
                                <span className="inline-flex flex-none items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Your pick
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  );
                })}
              </ol>
            )}
          </>
        )}
    </DelegatePageShell>
  );
}
