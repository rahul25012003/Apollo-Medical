"use client";

import { useEffect, useState } from "react";
import { ExternalLink, MapPin, ChevronLeft, ChevronRight, Building2, Landmark, Flower2, Home } from "lucide-react";
import { CAMPUS_POINTS } from "@/content/ifpc-2026";
import { useTenant } from "@/lib/tenant/context";
import "./campus-tour.css";

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
const TOUR_PLACES: { id: PlaceId; name: string; Icon: typeof MapPin; tone: string }[] = [
    { id: "conventionCentre", name: "Convention Centre", Icon: Building2, tone: "#4f46e5" },
    { id: "administrativeBlock", name: "Administrative Block", Icon: Landmark, tone: "#9333ea" },
    { id: "yogaCentre", name: "Yoga Centre", Icon: Flower2, tone: "#0d9488" },
    { id: "guestHouse", name: "Guest House", Icon: Home, tone: "#d97706" },
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
    const go = (d: number) => setActive((i) => (i + d + PHOTOS.length) % PHOTOS.length);

    return (
        <div className="ifpc-ct-show">
            <div
                className="ifpc-ct-frame"
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
                        data-active={i === active}
                    />
                ))}
                <div className="ifpc-ct-shade" />

                <div className="ifpc-ct-caption" aria-live="polite">
                    <span className="ifpc-ct-pin" aria-hidden="true"><MapPin /></span>
                    <div>
                        <p className="ifpc-ct-eyebrow">NIMHANS Campus Tour</p>
                        <p className="ifpc-ct-name">{current.caption}</p>
                        <a href={mapUrlOf(current.place)} target="_blank" rel="noopener noreferrer">
                            Open in Google Maps <ExternalLink aria-hidden="true" />
                        </a>
                    </div>
                </div>

                <div className="ifpc-ct-nav">
                    <button type="button" onClick={() => go(-1)} aria-label="Previous photo"><ChevronLeft /></button>
                    <button type="button" onClick={() => go(1)} aria-label="Next photo"><ChevronRight /></button>
                </div>
                <div className="ifpc-ct-dots">
                    {PHOTOS.map((p, i) => (
                        <button
                            key={p.src}
                            type="button"
                            onClick={() => setActive(i)}
                            aria-label={`Show photo ${i + 1}: ${p.caption}`}
                            aria-current={i === active}
                        />
                    ))}
                </div>
            </div>

            <div className="ifpc-ct-places">
                <span className="ifpc-ct-places-label">Places on the tour:</span>
                {TOUR_PLACES.map((place) => (
                    <a
                        key={place.id}
                        href={mapUrlOf(place.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={overrides.get(place.id)?.address || CAMPUS_POINTS[place.id].address}
                        style={{ "--tone": place.tone } as React.CSSProperties}
                    >
                        <place.Icon aria-hidden="true" /> {place.name}
                    </a>
                ))}
            </div>
        </div>
    );
}
