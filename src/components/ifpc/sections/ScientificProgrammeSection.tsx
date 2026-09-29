"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useIfpcEvent } from "@/components/ifpc/useIfpcEvent";
import { Reveal } from "@/components/ifpc/design/Reveal";
import { ExpressInterestButton } from "@/components/ifpc/ExpressInterestButton";
import { SCIENTIFIC_PROGRAMME } from "@/content/ifpc-2026";
import { CalendarDays, MapPin, Loader2, Wrench, Presentation, Mic2, Users, Trophy, Star, Image as ImageIcon } from "lucide-react";
import { format, parseISO, addDays, differenceInCalendarDays } from "date-fns";
import type { EventSession } from "@/services/events";
import "./ifpc-programme.css";

// Builds the "Day 1 / Days 2-N / Closing" narrative from the live event's
// own startDate/endDate, so it's always correct for whichever dates this
// year's (or next year's) event actually has — no hardcoded date strings.
function buildStructureItems(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  if (totalDays < 1) return [];

  const items = [`Day 1 (${format(start, "d MMMM yyyy")}) — Pre-conference workshops led by national and international experts.`];

  if (totalDays > 2) {
    const day2 = addDays(start, 1);
    const sameMonth = day2.getMonth() === end.getMonth() && day2.getFullYear() === end.getFullYear();
    const rangeStart = format(day2, sameMonth ? "d" : "d MMM");
    items.push(
      `Days 2–${totalDays} (${rangeStart}–${format(end, "d MMMM yyyy")}) — Plenary sessions, symposia, oral and poster presentations, and panel discussions across the conference’s thematic tracks.`
    );
  }

  items.push("Closing Ceremony — presentation of the Best Oral Presentation and Best ePoster awards.");
  return items;
}

const SESSION_TYPE_META: Record<string, { label: string; color: string; bg: string; Icon: typeof Mic2 }> = {
  WORKSHOP: { label: "Workshop", color: "#047857", bg: "#ECFDF5", Icon: Wrench },
  SEMINAR: { label: "Seminar", color: "#1D4ED8", bg: "#EFF6FF", Icon: Presentation },
  PLENARY: { label: "Plenary", color: "#4B2FE5", bg: "#F1EEFF", Icon: Mic2 },
  KEYNOTE: { label: "Keynote", color: "#B45309", bg: "#FFFBEB", Icon: Mic2 },
  PANEL: { label: "Panel", color: "#4338CA", bg: "#EEF2FF", Icon: Users },
  COMPETITION: { label: "Competition", color: "#7E22CE", bg: "#FAF5FF", Icon: Trophy },
  OTHER: { label: "Session", color: "#1e3a5f", bg: "#F1F5F9", Icon: CalendarDays },
};
// Accent per card, in order (decoration only).
const PG_TONES = ["#7c3aed", "#2563eb", "#16a34a", "#ea580c", "#db2777", "#0d9488"];
const typeMeta = (t: string) => SESSION_TYPE_META[t] ?? SESSION_TYPE_META.OTHER;

/** Title with every word after the first in the brand gradient. */
function PgTitle({ text }: { text: string }) {
  const [first, ...rest] = text.split(" ");
  return <h2 className="ifpc-pg-title">{first} <span>{rest.join(" ")}</span></h2>;
}

function DayWiseSchedule({ sessions, eventStart }: { sessions: EventSession[]; eventStart: string }) {
  // Interest sign-up only for signed-in delegates — never shown to a signed-out home page visitor.
  const { status } = useSession();
  // "Day N" counts from the conference's first day, so it matches the programme structure above.
  const dayNumber = (d: string) => differenceInCalendarDays(parseISO(d), parseISO(eventStart.slice(0, 10))) + 1;
  const days = Array.from(new Set(sessions.filter((s) => s.sessionDate).map((s) => s.sessionDate!.slice(0, 10)))).sort();
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const [active, setActive] = useState(() => Math.max(0, days.indexOf(todayKey)));
  const day = days[Math.min(active, days.length - 1)];
  if (!day) return null;

  const daySessions = sessions
    .filter((s) => s.sessionDate?.slice(0, 10) === day)
    .sort((a, b) => (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99") || (a.sessionOrder ?? 0) - (b.sessionOrder ?? 0));
  const typesPresent = Array.from(new Set(sessions.map((s) => (SESSION_TYPE_META[s.sessionType] ? s.sessionType : "OTHER"))));

  return (
    <section className="ifpc-v2 ifpc-pg ifpc-pg--soft">
      <div className="ifpc-pg-wrap ifpc-dw">
        <div className="ifpc-dw-side">
          <Reveal>
            <PgTitle text="Day-Wise Schedule" />
            <p className="ifpc-pg-lead">Includes any workshops, seminars, and competitions delegates can express interest in attending.</p>
          </Reveal>

          <div className="ifpc-dw-current">
            <span className="ifpc-dw-cal" aria-hidden="true"><CalendarDays /></span>
            <p>{format(parseISO(day), "EEEE, d MMMM yyyy")}</p>
            {dayNumber(day) >= 1 && <span className="ifpc-dw-daytag">Day {dayNumber(day)}</span>}
          </div>

          {/* Day navigation */}
          <div role="tablist" aria-label="Conference days" className="ifpc-dw-days">
            {days.map((d, i) => {
              const selected = d === day;
              const count = sessions.filter((s) => s.sessionDate?.slice(0, 10) === d).length;
              return (
                <button key={d} type="button" role="tab" aria-selected={selected} onClick={() => setActive(i)} className="ifpc-dw-day">
                  <span className="ifpc-dw-day-n">{dayNumber(d) >= 1 ? `Day ${dayNumber(d)}` : "Before"}</span>
                  <span className="ifpc-dw-day-d">{format(parseISO(d), "EEE, d MMM")}</span>
                  <span className="ifpc-dw-day-c">{count} session{count === 1 ? "" : "s"}</span>
                </button>
              );
            })}
          </div>

          {/* Type legend */}
          <div className="ifpc-dw-legend" aria-hidden="true">
            {typesPresent.map((t) => {
              const m = typeMeta(t);
              return (
                <span key={t} style={{ color: m.color, background: m.bg }}>
                  <m.Icon /> {m.label}
                </span>
              );
            })}
          </div>

          <div className="ifpc-dw-photo" aria-hidden="true"><img src="/ifpc/campus/convention-centre.jpg" alt="" loading="lazy" /></div>
        </div>

        <div role="tabpanel" aria-label={format(parseISO(day), "EEEE, d MMMM yyyy")} className="ifpc-dw-panel">
          <ol className="ifpc-dw-list">
            {daySessions.map((s) => {
              const m = typeMeta(s.sessionType);
              return (
                <li key={s.id} style={{ "--tone": m.color, "--tone-bg": m.bg } as React.CSSProperties}>
                  <div className="ifpc-dw-time">
                    <p>{s.startTime ?? "TBA"}</p>
                    {s.endTime && <p className="ifpc-dw-end">to {s.endTime}</p>}
                  </div>
                  <span className="ifpc-dw-dot" aria-hidden="true" />
                  <article className="ifpc-dw-card">
                    <span className="ifpc-dw-type"><m.Icon /> {m.label}</span>
                    <h4>{s.title}</h4>
                    {s.hall && <p className="ifpc-dw-hall"><MapPin />{s.hall.name}</p>}
                    {s.description && <p className="ifpc-dw-desc">{s.description}</p>}
                    {s.capacity != null && status === "authenticated" && (
                      <div className="ifpc-dw-interest">
                        <ExpressInterestButton sessionId={s.id} />
                      </div>
                    )}
                  </article>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function ScientificProgrammeSection() {
  const { event, loading } = useIfpcEvent();
  const hasEnded = !!event?.endDate && new Date(event.endDate) < new Date();
  const structureItems = event?.startDate && event?.endDate ? buildStructureItems(event.startDate, event.endDate) : [];

  const sessions = (event?.eventSessions || []).slice().sort((a, b) => {
    const ad = a.sessionDate ? new Date(a.sessionDate).getTime() : 0;
    const bd = b.sessionDate ? new Date(b.sessionDate).getTime() : 0;
    if (ad !== bd) return ad - bd;
    return (a.sessionOrder ?? 0) - (b.sessionOrder ?? 0);
  });

  return (
    <>
      {!hasEnded && structureItems.length > 0 && (
        <section className="ifpc-v2 ifpc-pg ifpc-pg--sky">
          <div className="ifpc-pg-photo" aria-hidden="true"><img src="/ifpc/campus/convention-centre.jpg" alt="" loading="lazy" /></div>
          <div className="ifpc-pg-wrap">
            <Reveal>
              <PgTitle text={SCIENTIFIC_PROGRAMME.structure.title} />
              <p className="ifpc-pg-lead">{SCIENTIFIC_PROGRAMME.intro}</p>
            </Reveal>
            <ol className="ifpc-ps-grid">
              {structureItems.map((item, i) => {
                // "Day 1 (2 November 2026) — text": heading, date and text shown apart.
                const [head, ...rest] = item.split(" — ");
                const m = head.match(/^(.*?)\s*\((.*)\)$/);
                const Icon = [CalendarDays, Users, Star][i % 3];
                return (
                  <li key={i} style={{ "--tone": PG_TONES[i % PG_TONES.length] } as React.CSSProperties}>
                    <Reveal delayMs={i * 90} className="ifpc-ps-card">
                      <div className="ifpc-ps-top">
                        <span className="ifpc-pg-num">{String(i + 1).padStart(2, "0")}</span>
                        <span className="ifpc-pg-icon" aria-hidden="true"><Icon /></span>
                        <div>
                          <h3>{m ? m[1] : head}</h3>
                          {m && <p className="ifpc-ps-date">{m[2]}</p>}
                        </div>
                      </div>
                      {rest.length > 0 && <p className="ifpc-ps-text">{rest.join(" — ")}</p>}
                    </Reveal>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}

      <section className="ifpc-v2 ifpc-pg ifpc-pg--band">
        <div className="ifpc-pg-wrap ifpc-sf">
          <Reveal className="ifpc-sf-head">
            <PgTitle text={SCIENTIFIC_PROGRAMME.formats.title} />
          </Reveal>
          <div className="ifpc-sf-grid">
            {SCIENTIFIC_PROGRAMME.formats.items.map((item, i) => {
              const [head, ...rest] = item.split(" — ");
              const Icon = [Presentation, Mic2, ImageIcon][i % 3];
              return (
                <Reveal key={i} delayMs={i * 90} className="ifpc-sf-card">
                  <div style={{ "--tone": PG_TONES[(i + 3) % PG_TONES.length] } as React.CSSProperties}>
                    <span className="ifpc-sf-icon" aria-hidden="true"><Icon /></span>
                    <h3>{rest.length ? head : item}</h3>
                    {rest.length > 0 && <p>{rest.join(" — ")}</p>}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-10 opacity-40"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : sessions.length > 0 ? (
        <DayWiseSchedule sessions={sessions} eventStart={event!.startDate} />
      ) : null}
    </>
  );
}
