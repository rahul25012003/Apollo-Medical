"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import "./ifpc-about.css";

export type IfpcAboutFeature = { title: string; description: string; Icon: React.ComponentType<{ className?: string }> };

// One accent per card, in order: blue, teal, violet, blue, pink.
const ACCENTS = ["#3b82f6", "#14b8a6", "#7c3aed", "#2563eb", "#db2777"];

/**
 * IFPC home "About Us": heading and description over a row of numbered
 * feature cards. Content is the tenant's own About title, description and
 * features, unchanged. On narrow screens the cards become a swipeable row.
 */
export function IfpcAboutSection({ title, description, features }: {
  title?: string | null;
  description?: string | null;
  features: IfpcAboutFeature[];
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(false);

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

  // Which card is in view while the row is swiped (narrow screens only).
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const onScroll = () => {
      const first = row.firstElementChild as HTMLElement | null;
      if (!first) return;
      const step = first.offsetWidth + parseFloat(getComputedStyle(row).columnGap || "0");
      setActive(Math.min(features.length - 1, Math.round(row.scrollLeft / step)));
    };
    row.addEventListener("scroll", onScroll, { passive: true });
    return () => row.removeEventListener("scroll", onScroll);
  }, [features.length]);

  const goTo = (i: number) => {
    const card = rowRef.current?.children[i] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
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
          <>
            <div ref={rowRef} className="ifpc-about-cards">
              {features.map((f, i) => {
                const { Icon } = f;
                return (
                  <article
                    key={i}
                    className="ifpc-about-card"
                    style={{ "--accent": ACCENTS[i % ACCENTS.length], "--i": i } as React.CSSProperties}
                  >
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
                    onClick={() => goTo(i)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
