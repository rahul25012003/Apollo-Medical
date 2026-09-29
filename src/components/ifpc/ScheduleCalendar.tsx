"use client";

import { useState } from "react";
import { format, parseISO, addDays, differenceInCalendarDays } from "date-fns";
import { CalendarDays, CheckCircle2, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIfpcEvent } from "@/components/ifpc/useIfpcEvent";
import type { EventSession } from "@/services/events";
import "./schedule-calendar.css";

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
    <div className="v3-sch">
      <div className="v3-sch-head">
        <div className="v3-sch-title">
          <span className="v3-sch-ic" aria-hidden="true"><CalendarDays /></span>
          <div>
            <h2>My Conference <span>Schedule</span></h2>
            <p>Every session by day and time</p>
          </div>
        </div>
        <span className="v3-sch-note">
          <CheckCircle2 aria-hidden="true" /> Your picks are highlighted
        </span>
      </div>

      {/* Phones: one day at a time */}
      <div className="v3-sch-tabs lg:hidden" role="tablist">
        {days.map((d, i) => (
          <button key={d} role="tab" aria-selected={i === activeDay} onClick={() => setActiveDay(i)}>
            <span>{format(parseISO(d), "EEE")}</span>
            <strong>{format(parseISO(d), "d MMM")}</strong>
          </button>
        ))}
      </div>

      <div className="v3-sch-grid">
        {days.map((d, i) => {
          const list = sessions.filter((s) => s.sessionDate && dayKey(s.sessionDate) === d).sort(byTime);
          return (
            <section key={d} className={cn("v3-sch-day", i !== activeDay && "hidden lg:block")} style={{ "--i": i } as React.CSSProperties}>
              <h3 className="v3-sch-dayhead">
                <span className="v3-sch-daynum">Day {i + 1}</span>
                <span className="v3-sch-dayname">{format(parseISO(d), "EEEE")}</span>
                <span className="v3-sch-date">{format(parseISO(d), "d MMMM")}</span>
              </h3>
              {list.length === 0 ? (
                <p className="v3-sch-empty">No sessions scheduled.</p>
              ) : (
                <ol className="v3-sch-list">
                  {list.map((s) => <SessionBlock key={s.id} s={s} mine={selectedIds.has(s.id)} />)}
                </ol>
              )}
            </section>
          );
        })}
      </div>

      {undated.length > 0 && (
        <div className="v3-sch-undated">
          <p>Date to be announced</p>
          <ol className="v3-sch-list v3-sch-list--grid">
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
    <li className="v3-sch-card" data-mine={mine} style={{ "--tone": color } as React.CSSProperties}>
      <div className="v3-sch-card-top">
        {s.startTime ? (
          <span className="v3-sch-time"><Clock aria-hidden="true" />{s.startTime}{s.endTime ? `–${s.endTime}` : ""}</span>
        ) : <span />}
        <span className="v3-sch-type">{s.sessionType}</span>
      </div>
      <p className="v3-sch-name">{s.title}</p>
      {s.hall?.name && <p className="v3-sch-hall"><MapPin aria-hidden="true" />{s.hall.name}</p>}
      {mine && (
        <p className="v3-sch-mine"><CheckCircle2 aria-hidden="true" /> Your pick</p>
      )}
    </li>
  );
}
