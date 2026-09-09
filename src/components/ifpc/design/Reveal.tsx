"use client";

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** IntersectionObserver-based scroll-into-view flag. Native platform API, no library. */
export function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/**
 * Wraps content that should fade/blur/slide into sharp focus as it scrolls
 * into view (the video's scroll-reveal feel), settling in ~500ms ease-out.
 */
export function Reveal({
  children,
  className,
  delayMs = 0,
  as: Tag = "div",
  style,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  as?: "div" | "section";
  style?: CSSProperties;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <Tag
      ref={ref as never}
      className={cn("v2-reveal", inView && "v2-in", className)}
      style={{ ...style, transitionDelay: inView ? `${delayMs}ms` : "0ms" }}
    >
      {children}
    </Tag>
  );
}

/** Headline whose words settle from muted gray to full ink/white as it scrolls into view. */
export function RevealHeadline({
  text,
  className,
  activeColor = "inherit",
  idleColor = "#b9b9c4",
}: {
  text: string;
  className?: string;
  activeColor?: string;
  idleColor?: string;
}) {
  const { ref, inView } = useInView<HTMLHeadingElement>();
  const words = text.split(" ");
  return (
    <span ref={ref as never} className={cn("v2-headline", className)}>
      {words.map((w, i) => (
        <span
          key={i}
          style={{
            color: inView ? activeColor : idleColor,
            opacity: inView ? 1 : 0.6,
            transitionDelay: `${i * 40}ms`,
          }}
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
