"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import "./ifpc-about.css";

export type IfpcAboutFeature = { title: string; description: string; Icon: React.ComponentType<{ className?: string }> };

// One accent per card, in order: blue, teal, violet, blue, pink.
const ACCENTS = ["#3b82f6", "#14b8a6", "#7c3aed", "#2563eb", "#db2777"];
const NARROW = "(max-width: 1023px)";

/**
 * IFPC home "About Us": heading and description over a row of numbered
 * feature cards. Content is the tenant's own About title, description and
 * features, unchanged.
 *
 * Selection: on wide screens the middle card is selected until the pointer
 * picks another. On narrow screens the cards are a swipeable row: every card
 * tilts, scales and fades with its distance from the centre (driven by the
 * scroll position itself), and the one that settles in the centre is selected.
 */
export function IfpcAboutSection({ title, description, features }: {
  title?: string | null;
  description?: string | null;
  features: IfpcAboutFeature[];
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [swiped, setSwiped] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const middle = Math.floor((features.length - 1) / 2);
  const active = narrow ? swiped : hovered ?? middle;

  // Entrance: once, when the section first comes into view.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Scroll-driven depth: each card gets its signed distance from the row's
  // centre (--p, in card widths) and its absolute value (--ap); the CSS turns
  // those into tilt, scale, lift and fade. The nearest card is selected.
  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    const rowBox = row.getBoundingClientRect();
    const centre = rowBox.left + rowBox.width / 2;
    let best = 0, bestDist = Infinity;
    Array.from(row.children).forEach((node, i) => {
      const card = node as HTMLElement;
      const box = card.getBoundingClientRect();
      const p = Math.max(-2, Math.min(2, (box.left + box.width / 2 - centre) / (box.width || 1)));
      card.style.setProperty("--p", p.toFixed(3));
      card.style.setProperty("--ap", Math.abs(p).toFixed(3));
      if (Math.abs(p) < bestDist) { bestDist = Math.abs(p); best = i; }
    });
    setSwiped(best);
  }, []);

  useEffect(() => {
    const row = rowRef.current;
    if (!row || !narrow) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    row.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      row.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      Array.from(row.children).forEach((n) => {
        (n as HTMLElement).style.removeProperty("--p");
        (n as HTMLElement).style.removeProperty("--ap");
      });
    };
  }, [narrow, measure, features.length]);

  // Swiped rows start on the middle card, like the wide layout.
  useEffect(() => {
    if (!narrow) return;
    const card = rowRef.current?.children[middle] as HTMLElement | undefined;
    const row = rowRef.current;
    if (card && row) row.scrollLeft = card.offsetLeft - (row.clientWidth - card.offsetWidth) / 2;
  }, [narrow, middle]);

  const goTo = (i: number) => {
    const row = rowRef.current;
    const card = row?.children[i] as HTMLElement | undefined;
    if (row && card) row.scrollTo({ left: card.offsetLeft - (row.clientWidth - card.offsetWidth) / 2, behavior: "smooth" });
  };

  const [lead, ...rest] = (title || "").split(" ");

  return (
    <section id="about" ref={sectionRef} className={shown ? "ifpc-about is-in" : "ifpc-about"}>
      <span className="ifpc-about-orb ifpc-about-orb--a" aria-hidden="true" />
      <span className="ifpc-about-orb ifpc-about-orb--b" aria-hidden="true" />
      <span className="ifpc-about-orb ifpc-about-orb--c" aria-hidden="true" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        <div className="ifpc-about-head">
          <div className="ifpc-about-heading">
            <span className="ifpc-about-chip"><span aria-hidden="true" />About Us</span>
            {title && (
              <h2 className="ifpc-about-title">
                {lead}{rest.length > 0 && <> <span className="ifpc-about-title-accent">{rest.join(" ")}</span></>}
              </h2>
            )}
            <span className="ifpc-about-underline" aria-hidden="true" />
          </div>

          {description && (
            <div className="ifpc-about-text">
              {description.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
            </div>
          )}

          <div className="ifpc-about-art" aria-hidden="true">
            <div className="ifpc-about-art-glow" />
            <div className="ifpc-about-art-photo">
              <img src="/ifpc/convention-centre.jpg" alt="" loading="lazy" decoding="async" />
            </div>
            <svg className="ifpc-about-art-net" viewBox="0 0 200 200" fill="none">
              <path d="M20 150 C 60 40, 140 40, 180 120" />
              <path d="M40 30 C 90 90, 120 120, 190 60" />
              <circle cx="20" cy="150" r="3" /><circle cx="180" cy="120" r="3" />
              <circle cx="40" cy="30" r="2.5" /><circle cx="190" cy="60" r="2.5" /><circle cx="104" cy="74" r="2" />
            </svg>
          </div>
        </div>

        {features.length > 0 && (
          <div className="ifpc-about-stage" style={{ "--active": ACCENTS[active % ACCENTS.length], "--ai": active } as React.CSSProperties}>
            <span className="ifpc-about-stage-glow" aria-hidden="true" />
            <div ref={rowRef} className="ifpc-about-cards" onMouseLeave={() => setHovered(null)}>
              {features.map((f, i) => {
                const { Icon } = f;
                return (
                  <article
                    key={i}
                    className={i === active ? "ifpc-about-card is-active" : "ifpc-about-card"}
                    style={{ "--accent": ACCENTS[i % ACCENTS.length], "--i": i } as React.CSSProperties}
                    tabIndex={narrow ? 0 : undefined}
                    onMouseEnter={narrow ? undefined : () => setHovered(i)}
                    onClick={narrow && i !== active ? () => goTo(i) : undefined}
                    onFocus={narrow ? () => goTo(i) : undefined}
                  >
                    <span className="ifpc-about-shine" aria-hidden="true" />
                    <span className="ifpc-about-ring" aria-hidden="true" />
                    <div className="ifpc-about-card-top">
                      <span className="ifpc-about-num">{String(i + 1).padStart(2, "0")}</span>
                      <span className="ifpc-about-icon" aria-hidden="true"><Icon /></span>
                    </div>
                    <h3>{f.title}</h3>
                    <p>{f.description}</p>
                    <span className="ifpc-about-arrow" aria-hidden="true"><ArrowRight /></span>
                  </article>
                );
              })}
            </div>

            <div className="ifpc-about-foot">
              <span className="ifpc-about-hint"><span className="ifpc-about-mouse" aria-hidden="true" />Scroll to explore</span>
              <div className="ifpc-about-dots">
                {features.map((f, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Show ${f.title}`}
                    aria-current={active === i ? "true" : undefined}
                    style={{ "--c": ACCENTS[i % ACCENTS.length] } as React.CSSProperties}
                    onClick={() => goTo(i)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
