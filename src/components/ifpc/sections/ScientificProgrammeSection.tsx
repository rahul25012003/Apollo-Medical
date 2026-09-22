"use client";

import { useState } from "react";
import { useIfpcEvent } from "@/components/ifpc/useIfpcEvent";
import { Section, SectionTitle } from "@/components/ifpc/IfpcShell";
import { ExpressInterestButton } from "@/components/ifpc/ExpressInterestButton";
import { SCIENTIFIC_PROGRAMME } from "@/content/ifpc-2026";
import { CalendarDays, MapPin, Loader2, Wrench, Presentation, Mic2, Users, Trophy } from "lucide-react";
import { format, parseISO, addDays, differenceInCalendarDays } from "date-fns";
import { cn } from "@/lib/utils";
import type { EventSession } from "@/services/events";

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
const typeMeta = (t: string) => SESSION_TYPE_META[t] ?? SESSION_TYPE_META.OTHER;

function DayWiseSchedule({ sessions, eventStart }: { sessions: EventSession[]; eventStart: string }) {
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
    <Section>
      <SectionTitle title="Day-Wise Schedule" subtitle="Includes any workshops, seminars, and competitions delegates can express interest in attending." />

      {/* Day navigation */}
      <div role="tablist" aria-label="Conference days" className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto pb-2">
        {days.map((d, i) => {
          const selected = d === day;
          const count = sessions.filter((s) => s.sessionDate?.slice(0, 10) === d).length;
          return (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(i)}
              className={cn(
                "flex-none min-w-[128px] rounded-2xl border-2 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B2FE5] focus-visible:ring-offset-2",
                selected ? "border-[#12112B] bg-[#12112B] text-white" : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"
              )}
            >
              <span className={cn("block text-[11px] font-bold uppercase tracking-[0.16em]", selected ? "text-[#CCFF33]" : "text-[#4B2FE5]")}>{dayNumber(d) >= 1 ? `Day ${dayNumber(d)}` : "Before"}</span>
              <span className="block text-base font-extrabold leading-tight">{format(parseISO(d), "EEE, d MMM")}</span>
              <span className={cn("block text-xs mt-0.5", selected ? "text-white/70" : "text-slate-500")}>{count} session{count === 1 ? "" : "s"}</span>
            </button>
          );
        })}
      </div>

      {/* Type legend */}
      <div className="mt-4 mb-8 flex flex-wrap gap-2" aria-hidden="true">
        {typesPresent.map((t) => {
          const m = typeMeta(t);
          return (
            <span key={t} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ color: m.color, background: m.bg }}>
              <m.Icon className="h-3.5 w-3.5" /> {m.label}
            </span>
          );
        })}
      </div>

      <div role="tabpanel" aria-label={format(parseISO(day), "EEEE, d MMMM yyyy")}>
        <h3 className="mb-5 text-xl sm:text-2xl font-extrabold tracking-tight">
          {format(parseISO(day), "EEEE, d MMMM yyyy")}
        </h3>
        <ol className="relative space-y-4 sm:space-y-5 sm:before:absolute sm:before:left-[93px] sm:before:top-2 sm:before:bottom-2 sm:before:w-px sm:before:bg-slate-200">
          {daySessions.map((s) => {
            const m = typeMeta(s.sessionType);
            return (
              <li key={s.id} className="sm:grid sm:grid-cols-[76px_1fr] sm:gap-8">
                <div className="sm:pt-4 sm:text-right mb-2 sm:mb-0 flex sm:block items-baseline gap-2">
                  <p className="text-lg sm:text-xl font-extrabold tabular-nums leading-none text-[#12112B]">{s.startTime ?? "TBA"}</p>
                  {s.endTime && <p className="text-sm sm:mt-1 tabular-nums text-slate-500">to {s.endTime}</p>}
                </div>
                <div className="relative">
                  <span className="hidden sm:block absolute -left-[21px] top-5 h-3 w-3 rounded-full ring-4 ring-white" style={{ background: m.color }} aria-hidden="true" />
                  <article className="rounded-2xl border border-slate-200 border-l-4 bg-white p-4 sm:p-5 shadow-sm" style={{ borderLeftColor: m.color }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider" style={{ color: m.color, background: m.bg }}>
                        <m.Icon className="h-3.5 w-3.5" /> {m.label}
                      </span>
                      {s.hall && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600"><MapPin className="h-3.5 w-3.5" />{s.hall.name}</span>
                      )}
                    </div>
                    <h4 className="mt-2 text-lg font-bold leading-snug text-[#12112B]">{s.title}</h4>
                    {s.description && <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.description}</p>}
                    {s.capacity != null && (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <ExpressInterestButton sessionId={s.id} />
                      </div>
                    )}
                  </article>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Section>
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
        <Section>
          <SectionTitle title={SCIENTIFIC_PROGRAMME.structure.title} subtitle={SCIENTIFIC_PROGRAMME.intro} />
          <ol className="space-y-3 max-w-3xl">
            {structureItems.map((item, i) => (
              <div key={i} className="flex gap-3 leading-relaxed">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white flex-none text-xs" style={{ background: ["#4B2FE5", "#1e3a5f", "#CCFF33"][i % 3], color: i === 2 ? "#0a0a0a" : "#fff" }}>{i + 1}</span>
                <span className="pt-1">{item}</span>
              </div>
            ))}
          </ol>
        </Section>
      )}

      <Section tint>
        <SectionTitle title={SCIENTIFIC_PROGRAMME.formats.title} />
        <div className="grid sm:grid-cols-3 gap-4">
          {SCIENTIFIC_PROGRAMME.formats.items.map((item, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 text-sm leading-relaxed">
              {item}
            </div>
          ))}
        </div>
      </Section>

      {loading ? (
        <Section>
          <div className="flex justify-center py-10 opacity-40"><Loader2 className="h-6 w-6 animate-spin" /></div>
        </Section>
      ) : sessions.length > 0 ? (
        <DayWiseSchedule sessions={sessions} eventStart={event!.startDate} />
      ) : null}
    </>
  );
}
