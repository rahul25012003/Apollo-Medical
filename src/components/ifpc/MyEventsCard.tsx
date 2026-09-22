"use client";

import Link from "next/link";
import { format, parseISO, formatDistanceToNowStrict, isToday, isTomorrow } from "date-fns";
import { ArrowRight, Heart, Clock, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMySelections, useUpNextMessages, type MySelection } from "@/components/ifpc/useMySelections";
import { ScheduleCalendar } from "@/components/ifpc/ScheduleCalendar";

function whenText(s: MySelection, now: Date) {
  if (!s.startsAt) return "Date to be announced";
  if (s.startsAt < now) return "Finished";
  if (isToday(s.startsAt)) return `Today · ${s.startTime ?? ""}`;
  if (isTomorrow(s.startsAt)) return `Tomorrow · ${s.startTime ?? ""}`;
  return `in ${formatDistanceToNowStrict(s.startsAt)}`;
}

/** Dashboard block for IFPC delegates: live notices + My Events, from one fetch. */
export function DelegateSchedule() {
  const items = useMySelections();
  return (
    <>
      <UpNextNotices items={items} />
      <MyEventsCard items={items} />
      <ScheduleCalendar selectedIds={new Set(items?.map((i) => i.sessionId) ?? [])} />
    </>
  );
}

const TONE_STYLE = {
  now: { dot: "bg-rose-500 animate-pulse", tag: "Live now", tagCls: "bg-rose-100 text-rose-700" },
  soon: { dot: "bg-amber-500", tag: "Starting soon", tagCls: "bg-amber-100 text-amber-800" },
  today: { dot: "bg-emerald-500", tag: "Today", tagCls: "bg-emerald-100 text-emerald-700" },
  next: { dot: "bg-slate-400", tag: "Upcoming", tagCls: "bg-slate-100 text-slate-600" },
} as const;

export function UpNextNotices({ items }: { items: MySelection[] | null }) {
  const messages = useUpNextMessages(items);
  if (messages.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800/80 border-2 border-slate-100 dark:border-slate-700 p-4 sm:p-5 mb-6" aria-live="polite">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-4 h-4 text-primary" />
        <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Notifications</h2>
        <span className="text-xs text-slate-500">for the sessions you chose</span>
      </div>
      <ul className="space-y-2">
        {messages.map((m) => {
          const t = TONE_STYLE[m.tone];
          return (
            <li key={m.sessionId + m.tone} className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 px-3 py-2.5">
              <span className={cn("h-2.5 w-2.5 flex-none rounded-full", t.dot)} />
              <p className="flex-1 min-w-0 text-sm font-semibold text-slate-800 dark:text-slate-100">{m.text}</p>
              <span className={cn("hidden sm:inline flex-none rounded-full px-2 py-0.5 text-[11px] font-bold", t.tagCls)}>{t.tag}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function MyEventsCard({ items }: { items: MySelection[] | null }) {
  const now = new Date();
  const shown = items?.slice(0, 5) ?? [];

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800/80 border-2 border-slate-100 dark:border-slate-700 overflow-hidden mb-6">
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg text-white shadow-md" style={{ background: "linear-gradient(135deg, #ec4899, #f43f5e)" }}>
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100">My Events</h2>
            <p className="text-xs text-slate-500">Your expressions of interest — next up first</p>
          </div>
        </div>
        <Link href="/dashboard/my-interests" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          View All Events <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {items === null ? (
        <div className="p-5 space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-700/50 animate-pulse" />)}
        </div>
      ) : shown.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">You haven&apos;t chosen any sessions yet.</p>
          <Link href="/dashboard/my-interests" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            Choose your tour day, yoga sessions and workshops <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {shown.map((s, i) => {
            const next = i === 0 && !!s.startsAt && s.startsAt >= now;
            const past = !!s.startsAt && s.startsAt < now;
            return (
              <li key={s.sessionId} className={cn("flex items-center gap-4 px-5 py-4", next && "bg-emerald-50/60 dark:bg-emerald-900/10", past && "opacity-60")}>
                <div className="w-12 flex-none text-center">
                  {s.sessionDate ? (
                    <>
                      <p className="text-xl font-extrabold leading-none text-slate-800 dark:text-slate-100">{format(parseISO(s.sessionDate.slice(0, 10)), "d")}</p>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{format(parseISO(s.sessionDate.slice(0, 10)), "MMM")}</p>
                    </>
                  ) : (
                    <p className="text-xs font-bold text-slate-400">TBA</p>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">{s.label}</span>
                    {next && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Next up</span>}
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{s.title}</p>
                  {s.startTime && (
                    <p className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{s.startTime}{s.endTime ? `–${s.endTime}` : ""}{s.hall ? ` · ${s.hall}` : ""}</p>
                  )}
                </div>
                <span className="hidden sm:block flex-none text-xs font-semibold text-slate-600 dark:text-slate-300">{whenText(s, now)}</span>
              </li>
            );
          })}
        </ul>
      )}
      {items && items.length > shown.length && (
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">
          +{items.length - shown.length} more — <Link href="/dashboard/my-interests" className="font-semibold text-primary hover:underline">View All Events</Link>
        </div>
      )}
    </div>
  );
}
