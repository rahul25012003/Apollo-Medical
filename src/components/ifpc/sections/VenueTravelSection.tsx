import { CampusMap } from "@/components/ifpc/CampusMap";
import { Reveal } from "@/components/ifpc/design/Reveal";
import { VENUE_TRAVEL, CTA_LINKS } from "@/content/ifpc-2026";
import { MapPin, Clock, ExternalLink, Car, Wallet } from "lucide-react";
import "./ifpc-guidelines.css";

export function VenueTravelSection() {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(VENUE_TRAVEL.venue.name + ", " + VENUE_TRAVEL.venue.address)}`;

  return (
    <>
      <section className="ifpc-v2 ifpc-gd ifpc-gd--sky">
        <div className="ifpc-gd-wrap">
          <Reveal>
            <h2 className="ifpc-gd-title">{VENUE_TRAVEL.venue.name.split(" ")[0]} <span>{VENUE_TRAVEL.venue.name.split(" ").slice(1).join(" ")}</span></h2>
          </Reveal>
          <Reveal delayMs={80} className="ifpc-vn-bar">
            <div className="ifpc-vn-where">
              <span className="ifpc-vn-pin" aria-hidden="true"><MapPin /></span>
              <div>
                <p className="ifpc-vn-addr">{VENUE_TRAVEL.venue.address}</p>
                <p className="ifpc-vn-hours"><Clock aria-hidden="true" /> {VENUE_TRAVEL.venue.hours}</p>
              </div>
            </div>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="ifpc-vn-btn">
              {CTA_LINKS.getDirections.label} <ExternalLink aria-hidden="true" />
            </a>
          </Reveal>

          <Reveal delayMs={120}>
            <h2 className="ifpc-gd-title ifpc-vn-sub">On-Campus <span>Map</span></h2>
            <p className="ifpc-vn-lead">Find your way between the Convention Centre, the daily morning Yoga Hall, and the on-campus Guest House.</p>
          </Reveal>
          <Reveal delayMs={160} className="ifpc-vn-map">
            <CampusMap />
          </Reveal>

          <div className="ifpc-vn-grid">
            <Reveal className="ifpc-vn-card">
              <div style={{ "--tone": "#2563eb" } as React.CSSProperties}>
                <span className="ifpc-gd-icon" aria-hidden="true"><Car /></span>
                <div>
                  <h3>{VENUE_TRAVEL.localTravel.title}</h3>
                  <p>{VENUE_TRAVEL.localTravel.text}</p>
                </div>
              </div>
            </Reveal>
            <Reveal delayMs={90} className="ifpc-vn-card">
              <div style={{ "--tone": "#16a34a" } as React.CSSProperties}>
                <span className="ifpc-gd-icon" aria-hidden="true"><Wallet /></span>
                <div>
                  <h3>{VENUE_TRAVEL.payment.title}</h3>
                  <p>{VENUE_TRAVEL.payment.text}</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Accommodation Near the Venue — not needed as of now, disabled per request. Content preserved in VENUE_TRAVEL.accommodation; uncomment to re-enable.
      <Section tint>
        <SectionTitle title={VENUE_TRAVEL.accommodation.title} subtitle={VENUE_TRAVEL.accommodation.intro} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Hotel</th>
                <th className="text-right px-4 py-3 font-semibold">Distance</th>
                <th className="text-right px-4 py-3 font-semibold">Approx. Price / Night</th>
              </tr>
            </thead>
            <tbody>
              {VENUE_TRAVEL.accommodation.hotels.map((h, i) => (
                <tr key={h.name} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                  <td className="px-4 py-3 font-medium text-slate-900">{h.name}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{h.distance}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{h.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      */}

      {/* Optional Excursions Beyond Bengaluru — not needed as of now, disabled per request. Content preserved in VENUE_TRAVEL.excursions; uncomment to re-enable.
      <Section>
        <SectionTitle title={VENUE_TRAVEL.excursions.title} subtitle={VENUE_TRAVEL.excursions.intro} />
        <div className="grid sm:grid-cols-2 gap-4">
          {VENUE_TRAVEL.excursions.items.map((it) => (
            <div key={it.name} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="font-semibold text-sm text-slate-900">{it.name}</h4>
                <span className="text-xs text-slate-400 whitespace-nowrap">{it.distance}</span>
              </div>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{it.text}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 italic mt-6">{VENUE_TRAVEL.excursions.note}</p>
      </Section>
      */}
    </>
  );
}
