import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import "./ifpc-card.css";

export type IfpcCardStat = { value: React.ReactNode; label: string; icon?: LucideIcon };
export type IfpcCardMeta = { icon: LucideIcon; text: React.ReactNode };

/**
 * The IFPC listing card (reference "Bottom" layout). Purely presentational:
 * every slot is filled from data the page already has, and `corner` and
 * `action` hold the page's own existing controls, whose behaviour is kept.
 * Empty slots simply don't render — nothing is invented to fill them.
 */
export function IfpcCard({
  image,
  imageAlt = "",
  avatar,
  title,
  tagline,
  meta,
  stats,
  footer,
  corner,
  action,
  href,
  className,
  children,
}: {
  /** Background photo; the brand gradient is used when there isn't one. */
  image?: string | null;
  imageAlt?: string;
  /** Contents of the round avatar (an <img> or an icon). */
  avatar?: React.ReactNode;
  title: React.ReactNode;
  tagline?: React.ReactNode;
  meta?: IfpcCardMeta[];
  stats?: IfpcCardStat[];
  /** The row under the stats (the reference's "Tools" line). */
  footer?: React.ReactNode;
  /** Round control, top right (the reference's bookmark). */
  corner?: React.ReactNode;
  /** The pill action, bottom right. */
  action?: React.ReactNode;
  /** Makes the whole card a link, as some cards already are. */
  href?: string;
  className?: string;
  /** Extra content under the main block, e.g. an existing description. */
  children?: React.ReactNode;
}) {
  const body = (
    <>
      <div className="ifpc-card-art" data-fallback={!image} aria-hidden={!image || !imageAlt}>
        {image && <img src={image} alt={imageAlt} loading="lazy" />}
      </div>
      <div className="ifpc-card-body">
        {avatar && <div className="ifpc-card-avatar">{avatar}</div>}
        <div>
          <div className="ifpc-card-title">{title}</div>
          {tagline && <p className="ifpc-card-tagline">{tagline}</p>}
          {meta && meta.length > 0 && (
            <p className="ifpc-card-meta">
              {meta.map((m, i) => {
                const Icon = m.icon;
                return <span key={i}><Icon aria-hidden="true" />{m.text}</span>;
              })}
            </p>
          )}
        </div>
        {stats && stats.length > 0 && (
          <div className="ifpc-card-stats">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="ifpc-card-stat">
                  <span className="ifpc-card-stat-value">{Icon && <Icon aria-hidden="true" />}{s.value}</span>
                  <span className="ifpc-card-stat-label">{s.label}</span>
                </div>
              );
            })}
          </div>
        )}
        {children}
        {footer && <div className="ifpc-card-footer">{footer}</div>}
      </div>
    </>
  );

  return (
    <article className={cn("ifpc-card", className)} data-link={!!href}>
      {href ? (
        // The whole card is the link; controls sit above it so they stay usable.
        <Link href={href} className="flex flex-1 flex-col focus-visible:outline-none">{body}</Link>
      ) : (
        body
      )}
      {corner && <div className="ifpc-card-corner">{corner}</div>}
      {action && <div className="ifpc-card-action">{action}</div>}
    </article>
  );
}
