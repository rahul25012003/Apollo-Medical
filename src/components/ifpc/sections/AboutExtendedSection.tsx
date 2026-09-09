import { Section, SectionTitle } from "@/components/ifpc/IfpcShell";
import { ABOUT } from "@/content/ifpc-2026";
import { ArrowLeftRight } from "lucide-react";

const BADGE_COLORS = ["#4B2FE5", "#1e3a5f", "#CCFF33"];

/**
 * Continues right after the home page's existing "Bridging the Gap" section
 * (theme intro + host cards). Only the content NOT already shown there:
 * the full bridges list, NIMHANS's history, and the host city.
 */
export function AboutExtendedSection() {
  return (
    <>
      <Section tint>
        <SectionTitle title="The Theme Invites Dialogue That Bridges" />
        <div className="grid sm:grid-cols-2 gap-4">
          {ABOUT.theme.bridges.map((b, i) => {
            const [pair, ...rest] = b.split(" — ");
            return (
              <div key={i} className="rounded-xl border border-slate-200 bg-white shadow-sm relative flex items-start gap-3 p-4 pt-5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white absolute -top-3 -left-3" style={{ background: BADGE_COLORS[i % BADGE_COLORS.length] }}>
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                </span>
                <p className="text-sm leading-relaxed pl-2">
                  <span className="font-bold">{pair}</span>
                  {rest.length > 0 && <> — {rest.join(" — ")}</>}
                </p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section>
        <div className="flex items-center gap-4 mb-8">
          <img src="/ifpc/nimhans-logo.png" alt="NIMHANS" className="h-16 w-16 object-contain flex-none rounded-2xl border border-black/5 p-1 bg-white" />
          <h2 className="text-[26px] sm:text-[32px] font-extrabold tracking-tight leading-tight">{ABOUT.nimhans.title}</h2>
        </div>
        <div className="space-y-4 max-w-3xl">
          {ABOUT.nimhans.paragraphs.map((p, i) => (
            <p key={i} className="opacity-75 leading-relaxed">{p}</p>
          ))}
        </div>
      </Section>

      <Section tint>
        <SectionTitle title={ABOUT.city.title} />
        <p className="opacity-75 leading-relaxed max-w-3xl">{ABOUT.city.text}</p>
      </Section>
    </>
  );
}
