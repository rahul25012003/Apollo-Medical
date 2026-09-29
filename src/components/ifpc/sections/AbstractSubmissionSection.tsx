import { Reveal } from "@/components/ifpc/design/Reveal";
import { ABSTRACT_SUBMISSION } from "@/content/ifpc-2026";
import {
  Clock, FileText, Monitor, Mic2, Upload, ClipboardList, Users, Settings, CheckCircle2,
  Presentation, Trophy, Medal, Award, ScrollText,
} from "lucide-react";
import "./ifpc-guidelines.css";

// "Submit Your Abstract" (deadline, guidelines, submission form) was removed
// from the home page per request. The presentation/poster/symposia guidelines
// and awards have their own headings and stay. The /api/abstracts endpoints
// and admin review flow are untouched.

const TONES = ["#7c3aed", "#2563eb", "#16a34a", "#ea580c", "#db2777", "#0d9488"];
const ORAL_ICONS = [Clock, FileText, Monitor, Mic2, Upload];
const AWARD_ICONS = [Medal, Award, ScrollText];

/** "Label: text" shows the label in bold; anything else as it is. */
function Point({ text }: { text: string }) {
  const i = text.indexOf(":");
  if (i > 0 && i < 40) return <><strong>{text.slice(0, i + 1)}</strong>{text.slice(i + 1)}</>;
  return <>{text}</>;
}

/** Title with its last word(s) in the brand gradient. */
function GTitle({ text, split }: { text: string; split: number }) {
  const w = text.split(" ");
  return <h2 className="ifpc-gd-title">{w.slice(0, split).join(" ")} <span>{w.slice(split).join(" ")}</span></h2>;
}

export function AbstractSubmissionSection() {
  const { oralGuidelines, posterGuidelines, symposiaGuidelines, awards } = ABSTRACT_SUBMISSION;
  const posterBlocks = [posterGuidelines.technical, posterGuidelines.layout, posterGuidelines.onSite];

  return (
    <>
      {/* Oral presentations */}
      <section className="ifpc-v2 ifpc-gd ifpc-gd--sky">
        <div className="ifpc-gd-wrap ifpc-or">
          <div>
            <Reveal><GTitle text={oralGuidelines.title} split={2} /></Reveal>
            <ul className="ifpc-or-list">
              {oralGuidelines.items.map((g, i) => {
                const Icon = ORAL_ICONS[i % ORAL_ICONS.length];
                return (
                  <Reveal key={i} delayMs={i * 70}>
                    <li style={{ "--tone": TONES[i % TONES.length] } as React.CSSProperties}>
                      <span className="ifpc-gd-icon" aria-hidden="true"><Icon /></span>
                      <p><Point text={g} /></p>
                    </li>
                  </Reveal>
                );
              })}
            </ul>
          </div>
          <Reveal delayMs={150} className="ifpc-gd-art ifpc-gd-art--stage">
            <span aria-hidden="true" className="ifpc-gd-ring ifpc-gd-ring--a" />
            <span aria-hidden="true" className="ifpc-gd-ring ifpc-gd-ring--b" />
            <span className="ifpc-gd-art-icon" aria-hidden="true"><Presentation /></span>
            <span aria-hidden="true" className="ifpc-gd-art-chip ifpc-gd-art-chip--a"><Mic2 /></span>
            <span aria-hidden="true" className="ifpc-gd-art-chip ifpc-gd-art-chip--b"><Clock /></span>
          </Reveal>
        </div>
      </section>

      {/* Posters */}
      <section className="ifpc-v2 ifpc-gd ifpc-gd--soft">
        <div className="ifpc-gd-wrap">
          <Reveal><GTitle text={posterGuidelines.title} split={2} /></Reveal>
          <div className="ifpc-po-grid">
            {posterBlocks.map((block, i) => {
              const Icon = [ClipboardList, Users, Settings][i];
              return (
                <Reveal key={block.title} delayMs={i * 90} className="ifpc-po-card">
                  <div style={{ "--tone": TONES[i] } as React.CSSProperties}>
                    <div className="ifpc-po-top">
                      <span className="ifpc-gd-num">{String(i + 1).padStart(2, "0")}</span>
                      <span className="ifpc-gd-icon" aria-hidden="true"><Icon /></span>
                    </div>
                    <h3>{block.title}</h3>
                    <ul>
                      {block.items.map((it, j) => <li key={j}><Point text={it} /></li>)}
                    </ul>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Symposia & workshops */}
      <section className="ifpc-v2 ifpc-gd ifpc-gd--sky">
        <div className="ifpc-gd-wrap">
          <Reveal><GTitle text={symposiaGuidelines.title} split={2} /></Reveal>
          <div className="ifpc-sy">
            <Reveal className="ifpc-gd-art ifpc-gd-art--round">
              <span aria-hidden="true" className="ifpc-gd-ring ifpc-gd-ring--a" />
              <span className="ifpc-gd-art-icon" aria-hidden="true"><Users /></span>
            </Reveal>
            <Reveal delayMs={100}>
              <ul className="ifpc-sy-list">
                {symposiaGuidelines.items.map((g, i) => (
                  <li key={i}><CheckCircle2 aria-hidden="true" /><p><Point text={g} /></p></li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Awards & certificates */}
      <section className="ifpc-v2 ifpc-gd ifpc-gd--soft">
        <div className="ifpc-gd-wrap">
          <Reveal><GTitle text={awards.title} split={2} /></Reveal>
          <div className="ifpc-aw">
            <Reveal className="ifpc-gd-art ifpc-gd-art--trophy">
              <span aria-hidden="true" className="ifpc-gd-ring ifpc-gd-ring--a" />
              <span className="ifpc-gd-art-icon" aria-hidden="true"><Trophy /></span>
            </Reveal>
            <div className="ifpc-aw-grid">
              {awards.items.map((g, i) => {
                const Icon = AWARD_ICONS[i % AWARD_ICONS.length];
                return (
                  <Reveal key={i} delayMs={i * 90} className="ifpc-aw-card">
                    <div style={{ "--tone": [TONES[4], TONES[1], TONES[3]][i % 3] } as React.CSSProperties}>
                      <span className="ifpc-aw-icon" aria-hidden="true"><Icon /></span>
                      <p>{g}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
