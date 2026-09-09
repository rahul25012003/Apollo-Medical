"use client";

import Image from "next/image";
import { useIfpcEvent } from "@/components/ifpc/useIfpcEvent";
import { Section, SectionTitle } from "@/components/ifpc/IfpcShell";
import { SPEAKERS_INTRO, SPEAKERS_NOTE } from "@/content/ifpc-2026";
import { User, Loader2 } from "lucide-react";

const RING_COLORS = ["#4B2FE5", "#1e3a5f", "#CCFF33"];

export function SpeakersSection() {
  const { event, loading } = useIfpcEvent();

  const speakers = (event?.eventSpeakers || [])
    .filter((es) => es.isPublished)
    .slice()
    .sort((a, b) => (a.sessionOrder ?? 0) - (b.sessionOrder ?? 0));

  return (
    <Section tint>
      <SectionTitle title="Speakers & Resource Persons" subtitle={SPEAKERS_INTRO} />
      {loading ? (
        <div className="flex justify-center py-10 opacity-50"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : speakers.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {speakers.map((es, i) => (
            <div key={es.id} className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 text-center">
              <div
                className="mx-auto mb-4 h-20 w-20 rounded-full overflow-hidden flex items-center justify-center border-4"
                style={{ borderColor: RING_COLORS[i % RING_COLORS.length] }}
              >
                {es.speaker.photo ? (
                  <Image src={es.speaker.photo} alt={es.speaker.name} width={80} height={80} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8" style={{ color: RING_COLORS[i % RING_COLORS.length] }} />
                )}
              </div>
              <h3 className="font-bold">{es.speaker.name}</h3>
              {es.speaker.designation && <p className="text-sm opacity-60 mt-1">{es.speaker.designation}</p>}
              {es.speaker.institution && <p className="text-xs opacity-45 mt-0.5">{es.speaker.institution}</p>}
              {es.topic && <p className="text-xs mt-2 font-semibold" style={{ color: "#4B2FE5" }}>{es.topic}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center opacity-45 text-sm py-10">Speaker list will be announced soon.</p>
      )}
      <p className="mt-10 text-center text-sm opacity-50 italic">{SPEAKERS_NOTE}</p>
    </Section>
  );
}
