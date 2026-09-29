import { Reveal } from "@/components/ifpc/design/Reveal";
import { TOPICS_INTRO, TOPIC_CATEGORIES } from "@/content/ifpc-2026";
import { Scale, Landmark, Lock, Users, Cpu, Globe2, Stethoscope, GraduationCap, FlaskConical, ClipboardList } from "lucide-react";
import "./ifpc-programme.css";

// An icon and accent per category, in order (decoration only).
const ICONS = [Scale, Landmark, Lock, Users, Cpu, Globe2, Stethoscope, GraduationCap, FlaskConical, ClipboardList];
const TONES = ["#7c3aed", "#2563eb", "#ea580c", "#16a34a", "#db2777", "#0d9488", "#4f46e5", "#0ea5e9", "#9333ea", "#d97706"];

export function TopicsSection() {
  return (
    <section className="ifpc-v2 ifpc-pg ifpc-pg--sky">
      <div className="ifpc-pg-wrap">
        <Reveal>
          <h2 className="ifpc-pg-title">Thematic <span>Topics</span></h2>
          <p className="ifpc-pg-lead">{TOPICS_INTRO}</p>
        </Reveal>
        <div className="ifpc-tp-grid">
          {TOPIC_CATEGORIES.map((cat, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <Reveal key={cat.title} delayMs={(i % 3) * 80} className="ifpc-tp-card">
                <div style={{ "--tone": TONES[i % TONES.length] } as React.CSSProperties}>
                  <span className="ifpc-tp-icon" aria-hidden="true"><Icon /></span>
                  <div>
                    <h3>{cat.title}</h3>
                    <ul>
                      {cat.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
