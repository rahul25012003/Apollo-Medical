import { IfpcHeader } from "./IfpcHeader";
import { IfpcFooter } from "./IfpcFooter";
import { PwaRegister } from "./PwaRegister";
import { cn } from "@/lib/utils";
import { Reveal } from "./design/Reveal";
import "./design/tokens.css";

/**
 * Shared page chrome for every IFPC 2026 public page (About, Highlights,
 * Speakers, ...). Keeping header/footer/background in one place means every
 * new page is a 5-line wrapper instead of re-implementing chrome.
 */
export function IfpcShell({ tenantSlug, children }: { tenantSlug: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <PwaRegister />
      <IfpcHeader tenantSlug={tenantSlug} />
      <main>{children}</main>
      <IfpcFooter tenantSlug={tenantSlug} />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="relative overflow-hidden bg-slate-900 text-white">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, hsl(var(--primary)) 0%, transparent 45%), radial-gradient(circle at 80% 0%, hsl(var(--secondary)) 0%, transparent 40%)",
        }}
      />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 text-center">
        {eyebrow && (
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-amber-300 mb-3">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">{title}</h1>
        {subtitle && (
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// Background is set via inline `style` (not a bg-* class) — a class-based
// Tailwind background here loses to some other rule in the cascade on this
// page (root-caused as a class-vs-class specificity collision; inline style
// always wins, so it sidesteps the problem reliably).
const VARIANT_STYLE: Record<string, React.CSSProperties> = {
  white: { background: "#ffffff", color: "#111111" },
  tint: { background: "#F1F1F6", color: "#111111" },
  navy: { background: "#12112B", color: "#ffffff" },
  violet: { background: "linear-gradient(135deg, #4B2FE5, #7C5CFF)", color: "#ffffff" },
  lime: { background: "#CCFF33", color: "#0a0a0a" },
};

export function Section({
  id,
  className = "",
  children,
  tint = false,
  variant,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
  tint?: boolean;
  /** New alternating full-bleed background system (IFPC 2026 redesign). Falls back to the plain white/tint bands used elsewhere (e.g. the badge print page) when omitted. */
  variant?: "white" | "tint" | "navy" | "violet" | "lime";
}) {
  const resolved = variant ?? (tint ? "tint" : "white");
  return (
    <section id={id} className={cn("ifpc-v2 py-10 lg:py-14 relative overflow-hidden", className)} style={VARIANT_STYLE[resolved]}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">{children}</div>
    </section>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={cn("mb-10 lg:mb-12", center && "text-center")}>
      <Reveal>
        {eyebrow && <p className="v2-eyebrow mb-3 opacity-70">{eyebrow}</p>}
        <h2 className="text-[28px] sm:text-[34px] lg:text-[42px] font-extrabold tracking-tight leading-[1.1]">{title}</h2>
        {subtitle && <p className={cn("mt-3 opacity-70 leading-relaxed max-w-2xl text-[15px]", center && "mx-auto")}>{subtitle}</p>}
      </Reveal>
    </div>
  );
}
