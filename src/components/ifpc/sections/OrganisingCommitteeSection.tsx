import { Section, SectionTitle } from "@/components/ifpc/IfpcShell";
import { ORGANISING_COMMITTEE } from "@/content/ifpc-2026";
import { Crown } from "lucide-react";

function MemberGrid({ members }: { members: string[] }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {members.map((m, i) => (
        <div key={m} className="rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-3 text-sm font-semibold">{m}</div>
      ))}
    </div>
  );
}

/** Conference Manager contact intentionally omitted here — already shown on Contact and in the footer. */
export function OrganisingCommitteeSection() {
  return (
    <>
      <Section tint>
        <SectionTitle title="Organising Committee" subtitle={ORGANISING_COMMITTEE.intro} />
        <div className="flex items-center gap-2 mb-6">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white" style={{ background: "#CCFF33", color: "#0a0a0a" }}><Crown className="h-4 w-4" /></span>
          <h3 className="text-xl font-bold">{ORGANISING_COMMITTEE.patrons.title}</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {ORGANISING_COMMITTEE.patrons.items.map((p, i) => (
            <div key={p} className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 text-sm leading-relaxed">{p}</div>
          ))}
        </div>
      </Section>

      <Section tint>
        <SectionTitle title={ORGANISING_COMMITTEE.organisingCommittee.title} />
        <p className="text-sm opacity-60 mb-4">Chair: <span className="font-bold" style={{ color: "#4B2FE5" }}>{ORGANISING_COMMITTEE.organisingCommittee.chair}</span></p>
        <MemberGrid members={ORGANISING_COMMITTEE.organisingCommittee.members} />
      </Section>

      <Section>
        <SectionTitle title={ORGANISING_COMMITTEE.scientificCommittee.title} />
        <p className="text-sm opacity-60 mb-4">Chair: <span className="font-bold" style={{ color: "#4B2FE5" }}>{ORGANISING_COMMITTEE.scientificCommittee.chair}</span></p>
        <MemberGrid members={ORGANISING_COMMITTEE.scientificCommittee.members} />
      </Section>
    </>
  );
}
