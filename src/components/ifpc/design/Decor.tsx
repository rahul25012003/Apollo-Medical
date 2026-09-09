import { cn } from "@/lib/utils";

/** Faceted triangular "kite" accent in lime/cyan/violet, per the reference design. */
export function Kite({ className, size = 120 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden
      className={cn("pointer-events-none", className)}
    >
      <polygon points="60,4 116,70 60,70" fill="#29C5E8" opacity="0.9" />
      <polygon points="60,70 116,70 60,116" fill="#4B2FE5" opacity="0.9" />
      <polygon points="4,70 60,70 60,116" fill="#CCFF33" opacity="0.9" />
      <polygon points="60,4 60,70 4,70" fill="#ffffff" opacity="0.9" />
    </svg>
  );
}

/** Thin curved swirl line accent. */
export function Swirl({ className, stroke = "#7C5CFF" }: { className?: string; stroke?: string }) {
  return (
    <svg width="140" height="180" viewBox="0 0 140 180" fill="none" aria-hidden className={cn("pointer-events-none", className)}>
      <path
        d="M10 10 C 110 30, 130 90, 60 120 C 10 145, 60 175, 110 160"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

/** Soft blurred color blob for corner ambience. */
export function Blob({ className, color = "#7C5CFF", size = 340 }: { className?: string; color?: string; size?: number }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute rounded-full", className)}
      style={{ width: size, height: size, background: color, opacity: 0.25, filter: "blur(90px)" }}
    />
  );
}
