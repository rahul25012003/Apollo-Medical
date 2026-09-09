"use client";

import { useIfpcEvent } from "@/components/ifpc/useIfpcEvent";
import { Section, SectionTitle } from "@/components/ifpc/IfpcShell";
import { ExpressInterestButton } from "@/components/ifpc/ExpressInterestButton";
import { SCIENTIFIC_PROGRAMME } from "@/content/ifpc-2026";
import { CalendarDays, Clock, MapPin, Loader2 } from "lucide-react";
import { format, parseISO, addDays } from "date-fns";

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

  const days = Array.from(
    new Set(sessions.filter((s) => s.sessionDate).map((s) => s.sessionDate!.slice(0, 10)))
  );

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
        <Section>
          <SectionTitle title="Day-Wise Schedule" subtitle="Includes any workshops, seminars, and competitions delegates can express interest in attending." />
          <div className="space-y-10">
            {days.map((day) => (
              <div key={day}>
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDays className="h-4 w-4" style={{ color: "#4B2FE5" }} />
                  <h3 className="font-bold">{format(parseISO(day), "EEEE, MMMM d, yyyy")}</h3>
                </div>
                <div className="space-y-3">
                  {sessions.filter((s) => s.sessionDate?.slice(0, 10) === day).map((s) => (
                    <div key={s.id} className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500" style={{ color: "#4B2FE5" }}>{s.sessionType}</span>
                          <h4 className="font-bold mt-0.5">{s.title}</h4>
                        </div>
                        {(s.startTime || s.hall) && (
                          <div className="flex items-center gap-3 text-xs opacity-60">
                            {s.startTime && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{s.startTime}{s.endTime ? `–${s.endTime}` : ""}</span>}
                            {s.hall && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{s.hall.name}</span>}
                          </div>
                        )}
                      </div>
                      {s.description && <p className="text-sm opacity-70 mt-2 leading-relaxed">{s.description}</p>}
                      {s.capacity != null && (
                        <div className="mt-3">
                          <ExpressInterestButton sessionId={s.id} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}
