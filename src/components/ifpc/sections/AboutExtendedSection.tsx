import { Section, SectionTitle } from "@/components/ifpc/IfpcShell";
import { ABOUT } from "@/content/ifpc-2026";

/** An arch bridge spanning the gap between the two sides of each theme pair. */
function BridgeGlyph({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 56 28" className="h-7 w-14 flex-none" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M2 21h52" />
      <path d="M7 21C15 5 41 5 49 21" />
      <path d="M17 21v-8.5M28 21v-12M39 21v-8.5" strokeWidth="1.6" />
      <path d="M2 21v5M54 21v5" />
    </svg>
  );
}

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
        <div className="grid sm:grid-cols-2 gap-4 sm:[&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:mx-auto sm:[&>*:last-child:nth-child(odd)]:w-[calc(50%-0.5rem)]">
          {ABOUT.theme.bridges.map((b, i) => {
            const [pair, ...rest] = b.split(" — ");
            const [left, right] = pair.split(" and ");
            return (
              <div key={i} className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
                {right ? (
                  <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
                    <span className="text-right text-sm font-bold leading-snug text-[#1e3a5f]">{left}<span className="sr-only"> and </span></span>
                    <BridgeGlyph color={i % 2 ? "#1e3a5f" : "#4B2FE5"} />
                    <span className="text-left text-sm font-bold leading-snug text-[#1e3a5f]">{right}</span>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-[#1e3a5f]">{pair}</p>
                )}
                {rest.length > 0 && (
                  <p className="mt-3 border-t border-slate-100 pt-3 text-center text-sm leading-relaxed opacity-70">{rest.join(" — ")}</p>
                )}
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
    </>
  );
}
