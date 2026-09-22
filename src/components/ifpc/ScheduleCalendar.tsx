"use client";

import { useState } from "react";
import { format, parseISO, addDays, differenceInCalendarDays } from "date-fns";
import { CalendarDays, CheckCircle2, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIfpcEvent } from "@/components/ifpc/useIfpcEvent";
import type { EventSession } from "@/services/events";

const TYPE_COLOR: Record<string, string> = {
  WORKSHOP: "#059669",
  SEMINAR: "#2563eb",
  PLENARY: "#4B2FE5",
  COMPETITION: "#9333ea",
  PANEL: "#4f46e5",
  KEYNOTE: "#b45309",
};

const dayKey = (d: string) => d.slice(0, 10);
const byTime = (a: EventSession, b: EventSession) => (a.startTime ?? "").localeCompare(b.startTime ?? "");

/** Day-by-day conference schedule; the delegate's own picks are highlighted. */
export function ScheduleCalendar({ selectedIds }: { selectedIds: Set<string> }) {
  const { event, loading } = useIfpcEvent();
  const [activeDay, setActiveDay] = useState(0);

  if (loading || !event?.startDate) return null;
  const sessions = (event.eventSessions || []).filter((s) => s.isPublished !== false);
  const start = parseISO(dayKey(event.startDate));
  const end = parseISO(dayKey(event.endDate || event.startDate));
  const days = Array.from({ length: differenceInCalendarDays(end, start) + 1 }, (_, i) => format(addDays(start, i), "yyyy-MM-dd"));
  const undated = sessions.filter((s) => !s.sessionDate);
  if (sessions.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800/80 border-2 border-slate-100 dark:border-slate-700 overflow-hidden mb-6">
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg text-white shadow-md" style={{ background: "linear-gradient(135deg, #4B2FE5, #6366f1)" }}>
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100">My Conference Schedule</h2>
            <p className="text-xs text-slate-500">Every session by day and time</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-3.5 w-3.5" /> Your picks are highlighted
        </span>
      </div>

      {/* Phones: one day at a time */}
      <div className="lg:hidden flex gap-2 overflow-x-auto px-4 pt-4" role="tablist">
        {days.map((d, i) => (
          <button
            key={d}
            role="tab"
            aria-selected={i === activeDay}
            onClick={() => setActiveDay(i)}
            className={cn(
              "flex-none rounded-xl px-3 py-2 text-center min-w-[64px] border transition-colors",
              i === activeDay ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200"
            )}
          >
            <span className="block text-[11px] font-bold uppercase tracking-wider opacity-80">{format(parseISO(d), "EEE")}</span>
            <span className="block text-base font-extrabold">{format(parseISO(d), "d MMM")}</span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-4 gap-4 p-4 sm:p-5">
        {days.map((d, i) => {
          const list = sessions.filter((s) => s.sessionDate && dayKey(s.sessionDate) === d).sort(byTime);
          return (
            <section key={d} className={cn("min-w-0", i !== activeDay && "hidden lg:block")}>
              <h3 className="hidden lg:block mb-3 border-b-2 border-slate-900 pb-2">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Day {i + 1} · {format(parseISO(d), "EEEE")}</span>
                <span className="block text-lg font-extrabold text-slate-900 dark:text-slate-100">{format(parseISO(d), "d MMMM")}</span>
              </h3>
              {list.length === 0 ? (
                <p className="text-sm text-slate-400 py-4">No sessions scheduled.</p>
              ) : (
                <ol className="space-y-2">
                  {list.map((s) => <SessionBlock key={s.id} s={s} mine={selectedIds.has(s.id)} />)}
                </ol>
              )}
            </section>
          );
        })}
      </div>

      {undated.length > 0 && (
        <div className="px-5 pb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Date to be announced</p>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {undated.map((s) => <SessionBlock key={s.id} s={s} mine={selectedIds.has(s.id)} />)}
          </ol>
        </div>
      )}
    </div>
  );
}

function SessionBlock({ s, mine }: { s: EventSession; mine: boolean }) {
  const color = TYPE_COLOR[s.sessionType] ?? "#475569";
  return (
    <li
      className={cn("rounded-xl border p-3 border-l-4", mine ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-900/20" : "bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-700")}
      style={{ borderLeftColor: mine ? "#059669" : color }}
    >
      <div className="flex items-center justify-between gap-2">
        {s.startTime ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
            <Clock className="h-3 w-3" />{s.startTime}{s.endTime ? `–${s.endTime}` : ""}
          </span>
        ) : <span />}
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{s.sessionType}</span>
      </div>
      <p className="mt-1 text-sm font-semibold leading-snug text-slate-800 dark:text-slate-100">{s.title}</p>
      {s.hall?.name && <p className="mt-0.5 text-xs text-slate-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{s.hall.name}</p>}
      {mine && (
        <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Your pick</p>
      )}
    </li>
  );
}
