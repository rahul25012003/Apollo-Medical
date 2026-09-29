import { Reveal } from "@/components/ifpc/design/Reveal";
import { ORGANISING_COMMITTEE } from "@/content/ifpc-2026";
import { Crown, Users, FlaskConical } from "lucide-react";
import "./ifpc-committee.css";

/** Conference Manager contact intentionally omitted here — already shown on Contact and in the footer. */
export function OrganisingCommitteeSection() {
  const { patrons, organisingCommittee, scientificCommittee } = ORGANISING_COMMITTEE;
  const committees = [
    { ...organisingCommittee, Icon: Users, tone: "#7c3aed" },
    { ...scientificCommittee, Icon: FlaskConical, tone: "#2563eb" },
  ];

  return (
    <section className="ifpc-v2 ifpc-oc">
      <div className="ifpc-oc-wrap">
        <Reveal>
          <h2 className="ifpc-oc-title">Organising <span>Committee</span></h2>
          <p className="ifpc-oc-lead">{ORGANISING_COMMITTEE.intro}</p>
        </Reveal>

        <div className="ifpc-oc-grid">
          <Reveal className="ifpc-oc-card">
            <div style={{ "--tone": "#16a34a" } as React.CSSProperties}>
              <div className="ifpc-oc-head">
                <span className="ifpc-oc-icon" aria-hidden="true"><Crown /></span>
                <h3>{patrons.title}</h3>
              </div>
              <ul className="ifpc-oc-patrons">
                {patrons.items.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </div>
          </Reveal>

          {committees.map((c, i) => (
            <Reveal key={c.title} delayMs={(i + 1) * 90} className="ifpc-oc-card">
              <div style={{ "--tone": c.tone } as React.CSSProperties}>
                <div className="ifpc-oc-head">
                  <span className="ifpc-oc-icon" aria-hidden="true"><c.Icon /></span>
                  <h3>{c.title}</h3>
                </div>
                <p className="ifpc-oc-chair">Chair: <strong>{c.chair}</strong></p>
                <ul className="ifpc-oc-members">
                  {c.members.map((m) => <li key={m}>{m}</li>)}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
