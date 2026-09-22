"use client";

import { useEffect, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { CAMPUS_POINTS } from "@/content/ifpc-2026";
import { useTenant } from "@/lib/tenant/context";

type PlaceId = keyof typeof CAMPUS_POINTS;

// NIMHANS campus photos (from forensicpsychiatry.in), shown above the campus
// tour sign-up as a slow cross-fading slideshow. Each photo links to its place.
const PHOTOS: { src: string; caption: string; place: PlaceId }[] = [
    { src: "/ifpc/campus/convention-centre.jpg", caption: "NIMHANS Convention Centre", place: "conventionCentre" },
    { src: "/ifpc/campus/convention-centre-entrance.jpg", caption: "Convention Centre entrance", place: "conventionCentre" },
    { src: "/ifpc/campus/administrative-block.jpg", caption: "NIMHANS Administrative Block", place: "administrativeBlock" },
    { src: "/ifpc/campus/convention-centre-night.jpg", caption: "The Convention Centre by night", place: "conventionCentre" },
];

// Places on the tour, each opening in Google Maps.
const TOUR_PLACES: { id: PlaceId; name: string }[] = [
    { id: "conventionCentre", name: "Convention Centre" },
    { id: "administrativeBlock", name: "Administrative Block" },
    { id: "yogaCentre", name: "Yoga Centre" },
    { id: "guestHouse", name: "Guest House" },
];

const SLIDE_MS = 4500;

export function CampusPhotoSlideshow() {
    const { tenant } = useTenant();
    const overrides = new Map((tenant?.campusLocations?.points ?? []).map((p) => [p.id, p]));
    const mapUrlOf = (id: PlaceId) => overrides.get(id)?.mapUrl || CAMPUS_POINTS[id].mapUrl;

    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (paused) return;
        const t = setTimeout(() => setActive((i) => (i + 1) % PHOTOS.length), SLIDE_MS);
        return () => clearTimeout(t);
    }, [active, paused]);

    const current = PHOTOS[active];

    return (
        <div className="space-y-3">
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
                    <div aria-live="polite" className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">NIMHANS Campus Tour</p>
                        <p className="text-base sm:text-lg font-bold text-white">{current.caption}</p>
                        <a
                            href={mapUrlOf(current.place)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-white/90 underline-offset-2 hover:underline"
                        >
                            <MapPin className="h-3.5 w-3.5" /> Open in Google Maps <ExternalLink className="h-3 w-3" />
                        </a>
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

            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Places on the tour:</span>
                {TOUR_PLACES.map((place) => (
                    <a
                        key={place.id}
                        href={mapUrlOf(place.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={overrides.get(place.id)?.address || CAMPUS_POINTS[place.id].address}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                    >
                        <MapPin className="h-3 w-3 text-slate-400" /> {place.name}
                    </a>
                ))}
            </div>
        </div>
    );
}
