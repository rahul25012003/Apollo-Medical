"use client";

import { useIfpcEvent } from "@/components/ifpc/useIfpcEvent";
import { Reveal } from "@/components/ifpc/design/Reveal";
import { HIGHLIGHTS, CTA_LINKS } from "@/content/ifpc-2026";
import {
  ArrowRight, ChevronRight, CalendarDays, FileText,
  Mic2, Layers, ClipboardList, Users, Globe2, Handshake, TrendingUp,
  Landmark, Flower2, Music, UtensilsCrossed, Award, BadgeCheck, ScrollText,
} from "lucide-react";
import { format } from "date-fns";
import "./ifpc-sections.css";

// One accent per row, in order (decoration only).
const TONES = ["#7c3aed", "#2563eb", "#16a34a", "#ea580c", "#db2777", "#4f46e5", "#0d9488"];
const HIGHLIGHT_ICONS = [Mic2, Layers, ClipboardList, Users, Globe2, Handshake, TrendingUp];
const EXPERIENCE_ICONS = [Landmark, Flower2, Music, UtensilsCrossed, Award, BadgeCheck, ScrollText];

/** Last word of a title in the brand gradient. */
function Title({ text }: { text: string }) {
  const words = text.split(" ");
  const last = words.pop();
  return (
    <h2 className="ifpc-sx-title">
      {words.join(" ")} <span>{last}</span>
    </h2>
  );
}

export function HighlightsSection() {
  const { event } = useIfpcEvent();
  const hasEnded = !!event?.endDate && new Date(event.endDate) < new Date();

  return (
    <>
      <section className="ifpc-v2 ifpc-sx ifpc-sx--sky">
        <div className="ifpc-sx-wrap">
          <div className="ifpc-hl">
            <div className="ifpc-hl-intro">
              <Reveal>
                <Title text={HIGHLIGHTS.scientific.title} />
                <p className="ifpc-sx-lead">{HIGHLIGHTS.intro}</p>
                <a href={CTA_LINKS.viewProgramme.href} className="ifpc-sx-btn ifpc-sx-btn--primary">
                  {CTA_LINKS.viewProgramme.label} <ArrowRight aria-hidden="true" />
                </a>
              </Reveal>
              <Reveal delayMs={120} className="ifpc-hl-photo">
                <img src="/ifpc/campus/convention-centre.jpg" alt="NIMHANS Convention Centre" loading="lazy" />
                <span>NIMHANS Convention Centre</span>
              </Reveal>
            </div>

            <div className="ifpc-hl-list" role="list">
              {HIGHLIGHTS.scientific.items.map((item, i) => {
                const Icon = HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length];
                return (
                  <Reveal key={i} delayMs={i * 60} className="ifpc-hl-item">
                    <div role="listitem" style={{ "--tone": TONES[i % TONES.length] } as React.CSSProperties}>
                      <span className="ifpc-hl-num">{String(i + 1).padStart(2, "0")}</span>
                      <span className="ifpc-hl-icon" aria-hidden="true"><Icon /></span>
                      <p>{item}</p>
                      <ChevronRight className="ifpc-hl-chev" aria-hidden="true" />
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>

          {event?.startDate && !hasEnded && (
            <Reveal className="ifpc-pre">
              <span className="ifpc-pre-icon" aria-hidden="true"><CalendarDays /></span>
              <div>
                <p className="ifpc-pre-title">{HIGHLIGHTS.preConference.title}</p>
                <p className="ifpc-pre-text">
                  Hands-on workshops on {format(new Date(event.startDate), "d MMMM yyyy")}, led by national and international experts, offering interactive sessions designed to bridge psychiatry and the justice system effectively.
                </p>
                <p className="ifpc-pre-note">
                  Seat availability for individual workshops is tracked live on the{" "}
                  <a href="#programme">Scientific Programme</a> section below.
                </p>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <section className="ifpc-v2 ifpc-sx ifpc-sx--soft">
        <div className="ifpc-sx-wrap">
          <Reveal>
            <Title text={HIGHLIGHTS.delegateExperience.title} />
          </Reveal>
          <div className="ifpc-dx-grid">
            {HIGHLIGHTS.delegateExperience.items.map((item, i) => {
              const Icon = EXPERIENCE_ICONS[i % EXPERIENCE_ICONS.length];
              return (
                <Reveal key={item.title} delayMs={(i % 2) * 90} className="ifpc-dx-card">
                  <div style={{ "--tone": TONES[i % TONES.length] } as React.CSSProperties}>
                    <span className="ifpc-dx-icon" aria-hidden="true"><Icon /></span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <div className="ifpc-sx-actions">
            <a href="#registration" className="ifpc-sx-btn ifpc-sx-btn--primary">
              <CalendarDays aria-hidden="true" /> {CTA_LINKS.registerNow.label} <ArrowRight aria-hidden="true" />
            </a>
            <a href="#programme" className="ifpc-sx-btn ifpc-sx-btn--ghost">
              <FileText aria-hidden="true" /> {CTA_LINKS.viewProgramme.label} <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
