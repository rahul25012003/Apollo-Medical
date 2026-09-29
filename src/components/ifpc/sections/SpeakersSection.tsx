"use client";

import Image from "next/image";
import { useIfpcEvent } from "@/components/ifpc/useIfpcEvent";
import { Reveal } from "@/components/ifpc/design/Reveal";
import { SPEAKERS_INTRO, SPEAKERS_NOTE } from "@/content/ifpc-2026";
import { User, Loader2 } from "lucide-react";
import "./ifpc-sections.css";

// A pastel wash and accent per card, in order (decoration only).
const TONES = ["#7c3aed", "#2563eb", "#16a34a", "#ea580c", "#db2777", "#0ea5e9", "#9333ea", "#0d9488"];

export function SpeakersSection() {
  const { event, loading } = useIfpcEvent();

  const speakers = (event?.eventSpeakers || [])
    .filter((es) => es.isPublished)
    .slice()
    .sort((a, b) => (a.sessionOrder ?? 0) - (b.sessionOrder ?? 0));

  return (
    <section className="ifpc-v2 ifpc-sx ifpc-sx--sky">
      <div className="ifpc-sx-wrap">
        <Reveal>
          <h2 className="ifpc-sx-title">Speakers &amp; <span>Resource Persons</span></h2>
          <p className="ifpc-sx-lead">{SPEAKERS_INTRO}</p>
        </Reveal>

        {loading ? (
          <div className="flex justify-center py-10 opacity-50"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : speakers.length > 0 ? (
          <div className="ifpc-sp-grid">
            {speakers.map((es, i) => (
              <Reveal key={es.id} delayMs={(i % 4) * 70} className="ifpc-sp-card">
                <div style={{ "--tone": TONES[i % TONES.length] } as React.CSSProperties}>
                  <div className="ifpc-sp-photo">
                    {es.speaker.photo ? (
                      <Image src={es.speaker.photo} alt={es.speaker.name} width={160} height={160} />
                    ) : (
                      <User aria-hidden="true" />
                    )}
                  </div>
                  <h3>{es.speaker.name}</h3>
                  {es.speaker.designation && <p className="ifpc-sp-role">{es.speaker.designation}</p>}
                  {es.speaker.institution && <p className="ifpc-sp-inst">{es.speaker.institution}</p>}
                  {es.topic && (
                    <div className="ifpc-sp-foot">
                      <span className="ifpc-sp-badge">{es.topic}</span>
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-center opacity-45 text-sm py-10">Speaker list will be announced soon.</p>
        )}
        <p className="ifpc-sp-note">{SPEAKERS_NOTE}</p>
      </div>
    </section>
  );
}
