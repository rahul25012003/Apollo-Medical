import { Section } from "@/components/ifpc/IfpcShell";
import { Reveal } from "@/components/ifpc/design/Reveal";
import "./ifpc-bridges.css";
import { ABOUT } from "@/content/ifpc-2026";

/** An arch bridge spanning the gap between the two sides of each theme pair;
 *  a light runs across it when the card is hovered or focused. */
function BridgeGlyph() {
  return (
    <svg viewBox="0 0 120 44" className="ifpc-bridge-glyph" fill="none" aria-hidden="true">
      <path className="ifpc-bridge-deck" d="M4 34h112" />
      <path className="ifpc-bridge-arch" d="M14 34C32 6 88 6 106 34" />
      <path className="ifpc-bridge-hangers" d="M32 34v-15M46 34v-20.5M60 34v-22.5M74 34v-20.5M88 34v-15" />
      <path className="ifpc-bridge-light" d="M14 34C32 6 88 6 106 34" />
      <circle className="ifpc-bridge-end" cx="4" cy="34" r="3" />
      <circle className="ifpc-bridge-end" cx="116" cy="34" r="3" />
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
      <section className="ifpc-v2 ifpc-bridges">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal>
            <h2 className="ifpc-bridges-title">The Theme Invites Dialogue That <span>Bridges</span></h2>
          </Reveal>
          <div className="ifpc-bridges-grid">
            {ABOUT.theme.bridges.map((b, i) => {
              const [pair, ...rest] = b.split(" — ");
              const [left, right] = pair.split(" and ");
              return (
                <Reveal key={i} delayMs={(i % 3) * 90} className="ifpc-bridge-card">
                  <span className="ifpc-bridge-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  {right ? (
                    <div className="ifpc-bridge-pair">
                      <span className="ifpc-bridge-left">{left}<span className="sr-only"> and </span></span>
                      <BridgeGlyph />
                      <span className="ifpc-bridge-right">{right}</span>
                    </div>
                  ) : (
                    <p className="ifpc-bridge-left">{pair}</p>
                  )}
                  {rest.length > 0 && <p className="ifpc-bridge-desc">{rest.join(" — ")}</p>}
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

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
