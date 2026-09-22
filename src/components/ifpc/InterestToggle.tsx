"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import "./interest-toggle.css";

/** Shared look for every IFPC "Interested" action (unselected state). */
export const INTEREST_BUTTON_CLASS =
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-4 h-11 sm:h-9 min-w-[44px] text-sm font-semibold " +
    "bg-primary text-primary-foreground shadow-sm transition-all duration-150 ease-out " +
    "hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 " +
    "disabled:pointer-events-none disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:translate-y-0";

interface Props {
    selected: boolean;
    pending?: boolean;
    disabled?: boolean;
    label: string;
    selectedLabel: string;
    onSelect: () => void;
    /** When given, the selected state offers a "Remove" action. */
    onRemove?: () => void;
    className?: string;
}

/**
 * One consistent Interested button: a prominent action while unselected, and
 * an unmistakable solid "selected" state (check icon, pop + ring pulse) the
 * moment it's chosen.
 */
export function InterestToggle({ selected, pending, disabled, label, selectedLabel, onSelect, onRemove, className }: Props) {
    // Animate only when the user just selected it, not when a page loads with
    // an interest that was saved earlier.
    const wasSelected = useRef(selected);
    const [justSelected, setJustSelected] = useState(false);
    useEffect(() => {
        if (selected && !wasSelected.current) setJustSelected(true);
        wasSelected.current = selected;
    }, [selected]);

    if (selected) {
        const badge = (
            <span
                role="status"
                aria-live="polite"
                onAnimationEnd={() => setJustSelected(false)}
                className={cn(
                    "inline-flex items-center justify-center gap-1.5 rounded-lg px-4 h-11 sm:h-9 min-w-[44px] text-sm font-semibold",
                    // emerald-700 keeps white text above 4.5:1 contrast in light and dark mode
                    "bg-emerald-700 text-white shadow-sm",
                    justSelected && "ifpc-interest-selected-anim",
                    className
                )}
            >
                <CheckCircle2 className="h-4 w-4" /> {selectedLabel}
            </span>
        );
        if (!onRemove) return badge;
        return (
            <span className="inline-flex items-center gap-1">
                {badge}
                <button
                    type="button"
                    onClick={onRemove}
                    disabled={pending}
                    className="inline-flex items-center justify-center h-11 sm:h-9 min-w-[44px] px-3 rounded-lg text-sm font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-60"
                >
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
                </button>
            </span>
        );
    }

    return (
        <button
            type="button"
            aria-pressed={false}
            disabled={disabled || pending}
            onClick={onSelect}
            className={cn(INTEREST_BUTTON_CLASS, className)}
        >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />} {label}
        </button>
    );
}
