import { Reveal } from "@/components/ifpc/design/Reveal";
import "./ifpc-bridges.css";
import "./ifpc-sections.css";
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

      {/* About NIMHANS: the text beside original photos of the campus. */}
      <section className="ifpc-v2 ifpc-sx ifpc-sx--soft">
        <div className="ifpc-sx-wrap ifpc-nm">
          <div className="ifpc-nm-text">
            <Reveal>
              <div className="ifpc-nm-head">
                <img src="/ifpc/nimhans-logo.png" alt="NIMHANS" />
                <h2 className="ifpc-sx-title">
                  {ABOUT.nimhans.title.split(" ")[0]} <span>{ABOUT.nimhans.title.split(" ").slice(1).join(" ")}</span>
                </h2>
              </div>
            </Reveal>
            <div className="ifpc-nm-body">
              {ABOUT.nimhans.paragraphs.map((p, i) => (
                <Reveal key={i} delayMs={i * 80}>
                  <p className={i === 0 ? "ifpc-nm-lead" : undefined}>{p}</p>
                </Reveal>
              ))}
            </div>
          </div>
          <Reveal delayMs={120} className="ifpc-nm-photos">
            <figure className="ifpc-nm-main">
              <img src="/ifpc/campus/administrative-block.jpg" alt="NIMHANS Administrative Block" loading="lazy" />
              <figcaption>NIMHANS Administrative Block</figcaption>
            </figure>
            <figure>
              <img src="/ifpc/campus/convention-centre-entrance.jpg" alt="Convention Centre entrance" loading="lazy" />
              <figcaption>Convention Centre entrance</figcaption>
            </figure>
            <figure>
              <img src="/ifpc/campus/convention-centre-night.jpg" alt="The Convention Centre by night" loading="lazy" />
              <figcaption>The Convention Centre by night</figcaption>
            </figure>
          </Reveal>
        </div>
      </section>
    </>
  );
}
