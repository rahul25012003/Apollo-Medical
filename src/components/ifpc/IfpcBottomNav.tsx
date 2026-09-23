"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import "./ifpc-bottom-nav.css";

export type BottomNavGroup = {
    /** Section id this group itself points at, without the leading hash. */
    id: string;
    label: string;
    icon: LucideIcon;
    items: { id: string; label: string }[];
};

/**
 * IFPC 2026 grouped section navigation.
 *
 * Same control in both places, only the anchoring differs: "bottom" floats
 * above the page on mobile, tablet and the installed PWA; "top" sits inline
 * in the desktop header. The sub-item panel opens away from the bar either
 * way, so the gesture reads the same at every size.
 *
 * It navigates to the same section anchors the old nav used — no new routes,
 * no content of its own. The only behaviour it adds is telling you where you
 * are: the old nav compared pathname, which never carries a hash, so on a
 * one-page site nothing but Home could ever read as current.
 */
export function IfpcBottomNav({
    groups,
    placement = "bottom",
    accentFrom,
    accentTo,
}: {
    groups: BottomNavGroup[];
    placement?: "bottom" | "top";
    /** The tenant's own two brand colours, so the selected pill is the same
     *  gradient the page already uses for its primary actions. */
    accentFrom?: string;
    accentTo?: string;
}) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const rootRef = useRef<HTMLElement | null>(null);
    const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const sectionIds = useMemo(
        () => groups.flatMap((g) => [g.id, ...g.items.map((i) => i.id)]),
        [groups]
    );

    // Whichever section is crossing the middle of the viewport is the current
    // one. A thin band means at most one qualifies, so no tie-breaking games.
    useEffect(() => {
        const visible = new Set<string>();
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting) visible.add(e.target.id);
                    else visible.delete(e.target.id);
                }
                setCurrentId(sectionIds.find((id) => visible.has(id)) ?? null);
            },
            { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
        );
        for (const id of sectionIds) {
            const el = document.getElementById(id);
            if (el) io.observe(el);
        }
        return () => io.disconnect();
    }, [sectionIds]);

    // The panel is transient: anything that means "I'm done here" closes it.
    useEffect(() => {
        if (openIndex === null) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpenIndex(null);
                btnRefs.current[openIndex]?.focus();
            }
        };
        const onPointer = (e: PointerEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpenIndex(null);
        };
        document.addEventListener("keydown", onKey);
        document.addEventListener("pointerdown", onPointer);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("pointerdown", onPointer);
        };
    }, [openIndex]);

    const goTo = useCallback((id: string) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", `#${id}`);
    }, []);

    // Left/right walk the groups, matching how a tab bar is expected to behave.
    const onGroupKeyDown = (e: React.KeyboardEvent, i: number) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        const next = (i + (e.key === "ArrowRight" ? 1 : -1) + groups.length) % groups.length;
        btnRefs.current[next]?.focus();
    };

    const selectedIndex = groups.findIndex(
        (g) => g.id === currentId || g.items.some((i) => i.id === currentId)
    );

    return (
        <nav
            ref={rootRef}
            className={
                placement === "top"
                    ? "ifpc-bn ifpc-bn--top hidden xl:block"
                    : "ifpc-bn ifpc-bn--bottom xl:hidden"
            }
            aria-label="Sections"
            style={
                accentFrom && accentTo
                    ? ({
                          "--bn-accent": accentFrom,
                          "--bn-accent-2": accentTo,
                      } as React.CSSProperties)
                    : undefined
            }
        >
            {groups.map((g, i) => (
                <div
                    key={g.id}
                    id={`ifpc-bn-${placement}-panel-${g.id}`}
                    className="ifpc-bn-shell ifpc-bn-panel"
                    data-open={openIndex === i}
                    role="group"
                    aria-label={`${g.label} sections`}
                    aria-hidden={openIndex !== i}
                >
                    {g.items.map((it) => (
                        <a
                            key={it.id}
                            href={`#${it.id}`}
                            className="ifpc-bn-sub"
                            data-current={currentId === it.id}
                            aria-current={currentId === it.id ? "true" : undefined}
                            tabIndex={openIndex === i ? 0 : -1}
                            onClick={(e) => {
                                e.preventDefault();
                                goTo(it.id);
                                setOpenIndex(null);
                            }}
                        >
                            {it.label}
                        </a>
                    ))}
                </div>
            ))}

            <div className="ifpc-bn-shell ifpc-bn-bar">
                {groups.map((g, i) => {
                    const Icon = g.icon;
                    const open = openIndex === i;
                    return (
                        <button
                            key={g.id}
                            ref={(el) => { btnRefs.current[i] = el; }}
                            type="button"
                            className="ifpc-bn-group"
                            data-selected={selectedIndex === i}
                            data-open={open}
                            aria-expanded={open}
                            aria-controls={`ifpc-bn-${placement}-panel-${g.id}`}
                            onKeyDown={(e) => onGroupKeyDown(e, i)}
                            // Opening a group only reveals its sections; the
                            // page moves when you pick one of them.
                            onClick={() => setOpenIndex(open ? null : i)}
                        >
                            <Icon aria-hidden="true" />
                            {/* Collapsed to zero width when not selected, but
                                still the button's accessible name. */}
                            <span className="ifpc-bn-label">{g.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
