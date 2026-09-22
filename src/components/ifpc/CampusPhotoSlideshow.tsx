"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// NIMHANS campus photos (from forensicpsychiatry.in), shown above the campus
// tour sign-up as a slow cross-fading slideshow.
const PHOTOS = [
    { src: "/ifpc/campus/convention-centre.jpg", caption: "NIMHANS Convention Centre" },
    { src: "/ifpc/campus/convention-centre-entrance.jpg", caption: "Convention Centre entrance" },
    { src: "/ifpc/campus/administrative-block.jpg", caption: "NIMHANS Administrative Block" },
    { src: "/ifpc/campus/convention-centre-night.jpg", caption: "The Convention Centre by night" },
];

const SLIDE_MS = 4500;

export function CampusPhotoSlideshow() {
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (paused) return;
        const t = setTimeout(() => setActive((i) => (i + 1) % PHOTOS.length), SLIDE_MS);
        return () => clearTimeout(t);
    }, [active, paused]);

    return (
        <div
            className="relative h-56 sm:h-72 overflow-hidden rounded-xl bg-slate-900 shadow-sm"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            aria-roledescription="carousel"
            aria-label="NIMHANS campus photos"
        >
            {PHOTOS.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    key={p.src}
                    src={p.src}
                    alt={p.caption}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                    aria-hidden={i !== active}
                    className={cn(
                        "absolute inset-0 h-full w-full object-cover motion-reduce:!transition-none motion-reduce:!scale-100",
                        i === active ? "opacity-100 scale-110" : "opacity-0 scale-100"
                    )}
                    style={{ transition: "opacity 1.2s ease, transform 6s ease-out" }}
                />
            ))}

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-3 p-4 sm:p-5">
                <div aria-live="polite">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">NIMHANS Campus Tour</p>
                    <p className="text-base sm:text-lg font-bold text-white">{PHOTOS[active].caption}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                    {PHOTOS.map((p, i) => (
                        <button
                            key={p.src}
                            type="button"
                            onClick={() => setActive(i)}
                            aria-label={`Show photo ${i + 1}: ${p.caption}`}
                            aria-current={i === active}
                            className={cn(
                                "h-2 rounded-full transition-all",
                                i === active ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                            )}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
