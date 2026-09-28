"use client";

import { useState } from "react";
import { Building2, Flower2, Navigation, ExternalLink, MapPin, Footprints, Clock, Info } from "lucide-react";
import { CAMPUS_POINTS } from "@/content/ifpc-2026";
import { useTenant } from "@/lib/tenant/context";
import { cn } from "@/lib/utils";
import { CampusMap } from "./CampusMap";

type DestId = "conventionCentre" | "yogaCentre";

// What a delegate goes to each place for, and when. The place itself (name,
// address, Google Maps link, on-campus note) is admin-editable content.
// `directionsTo` is the search Google resolves to exactly this building —
// checked against Google's own place card. The admin's display name and
// address can't be used for it: "Yoga Hall — Dept. of Integrative
// Medicine, …" matches three nearby places and Google picks none.
const DESTINATIONS: Record<DestId, { name: string; icon: typeof Building2; color: string; purpose: string; when: string; directionsTo: string }> = {
  conventionCentre: {
    name: "Conference Hall",
    icon: Building2,
    color: "#1e3a5f",
    purpose: "Scientific sessions, plenaries and the Audi 1, 2 and 3 workshops.",
    when: "2–5 November, from 9:00 AM",
    directionsTo: "NIMHANS Convention Centre, 15, Hosur Main Road, Lakkasandra, Hombegowda Nagar, Bengaluru, Karnataka 560029",
  },
  yogaCentre: {
    name: "Yoga Hall",
    icon: Flower2,
    color: "#0d9488",
    purpose: "Morning yoga with the Department of Integrative Medicine.",
    when: "Day 2, 3 and 4 (3–5 November), 7:00–8:00 AM",
    directionsTo: "NIMHANS Integrated Centre for Yoga, Hombegowda Nagar, Bengaluru, Karnataka 560029",
  },
};
const IDS = Object.keys(DESTINATIONS) as DestId[];

/**
 * Routes to the Conference Hall and the Yoga Hall. Turn-by-turn walking
 * directions come from Google Maps, starting wherever the delegate is — the
 * gate, their hotel, the other hall — because there are no verified
 * building-level coordinates to draw a route of our own from. A live map of
 * the chosen hall and the campus schematic give orientation alongside.
 */
export function RouteMap() {
  const { tenant } = useTenant();
  const [id, setId] = useState<DestId>("conventionCentre");
  const overrides = new Map((tenant?.campusLocations?.points ?? []).map((p) => [p.id, p]));
  const place = (d: DestId) => ({ ...CAMPUS_POINTS[d], ...overrides.get(d) });

  const dest = DESTINATIONS[id];
  const p = place(id);
  const walk = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest.directionsTo)}&travelmode=walking`;
  // The admin-managed Google Maps link carries the exact place (cid); prefer
  // it for the embedded map so it follows any correction made there.
  const cid = p.mapUrl?.match(/[?&]cid=(\d+)/)?.[1];
  const embed = cid
    ? `https://maps.google.com/maps?cid=${cid}&z=17&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(dest.directionsTo)}&z=17&output=embed`;
  const Icon = dest.icon;

  return (
    <div className="space-y-5">
      {/* Destination picker */}
      <div role="tablist" aria-label="Destination" className="grid grid-cols-2 gap-2">
        {IDS.map((d) => {
          const D = DESTINATIONS[d];
          const DIcon = D.icon;
          const active = d === id;
          return (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setId(d)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors",
                active ? "border-transparent text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
              style={active ? { background: D.color } : undefined}
            >
              <DIcon className="h-4 w-4" /> {D.name}
            </button>
          );
        })}
      </div>

      {/* The chosen destination */}
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        <div className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-white" style={{ background: dest.color }}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900">{dest.name}</h2>
              <p className="text-sm text-slate-600">{p.label}</p>
            </div>
          </div>
          <p className="text-sm text-slate-700">{dest.purpose}</p>
          <p className="flex items-center gap-1.5 text-sm text-slate-600"><Clock className="h-4 w-4 flex-none text-slate-400" /> {dest.when}</p>
          <p className="flex items-start gap-1.5 text-xs text-slate-500"><MapPin className="mt-0.5 h-3.5 w-3.5 flex-none" /> {p.address}</p>
          {p.note && (
            <p className="flex items-start gap-1.5 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600"><Info className="mt-0.5 h-3.5 w-3.5 flex-none" /> {p.note}</p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={walk}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
              style={{ background: dest.color }}
            >
              <Navigation className="h-4 w-4" /> Walking directions from here
            </a>
            <a
              href={p.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Open in Google Maps <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        <iframe
          key={id}
          src={embed}
          title={`Map of ${dest.name}`}
          className="block h-[260px] w-full border-0 sm:h-[320px]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </section>

      {/* Between the two: the walk delegates make every yoga morning. */}
      <div className="flex items-start gap-2.5 rounded-xl bg-teal-50 p-3 text-sm text-teal-900 ring-1 ring-teal-200">
        <Footprints className="mt-0.5 h-4 w-4 flex-none" />
        <span>Yoga Hall → Conference Hall is about an 8-minute walk — yoga ends at 8:00, sessions begin at 9:00.</span>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Campus at a glance</h3>
        <CampusMap />
      </div>
    </div>
  );
}
