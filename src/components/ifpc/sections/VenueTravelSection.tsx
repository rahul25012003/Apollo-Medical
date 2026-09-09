import { CampusMap } from "@/components/ifpc/CampusMap";
import { Section, SectionTitle } from "@/components/ifpc/IfpcShell";
import { Button } from "@/components/ui/button";
import { VENUE_TRAVEL, CTA_LINKS } from "@/content/ifpc-2026";
import { MapPin, Clock, ExternalLink } from "lucide-react";

export function VenueTravelSection() {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(VENUE_TRAVEL.venue.name + ", " + VENUE_TRAVEL.venue.address)}`;

  return (
    <>
      <Section>
        <SectionTitle title={VENUE_TRAVEL.venue.name} subtitle={VENUE_TRAVEL.venue.address} />
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-wrap items-center justify-between gap-4 mb-10 p-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white" style={{ background: "#4B2FE5" }}><MapPin className="h-4 w-4" /></span>
            <div>
              <p className="font-bold">{VENUE_TRAVEL.venue.address}</p>
              <p className="text-xs opacity-60 flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" /> {VENUE_TRAVEL.venue.hours}</p>
            </div>
          </div>
          <Button asChild variant="outline">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              {CTA_LINKS.getDirections.label} <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>

        <SectionTitle title="On-Campus Map" subtitle="Find your way between the Convention Centre, the daily morning Yoga Hall, and the on-campus Guest House." />
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-2 sm:p-4">
          <CampusMap />
        </div>
      </Section>

      <Section tint>
        <SectionTitle title={VENUE_TRAVEL.gettingToBengaluru.title} />
        <p className="opacity-75 leading-relaxed mb-5 max-w-3xl">{VENUE_TRAVEL.gettingToBengaluru.intro}</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {VENUE_TRAVEL.gettingToBengaluru.items.map((it, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 text-sm leading-relaxed">{it}</div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid sm:grid-cols-2 gap-6 mb-10">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <h3 className="font-bold mb-2">{VENUE_TRAVEL.localTravel.title}</h3>
            <p className="text-sm opacity-70 leading-relaxed">{VENUE_TRAVEL.localTravel.text}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <h3 className="font-bold mb-2">{VENUE_TRAVEL.payment.title}</h3>
            <p className="text-sm opacity-70 leading-relaxed">{VENUE_TRAVEL.payment.text}</p>
          </div>
        </div>
        <SectionTitle title={VENUE_TRAVEL.weather.title} />
        <p className="opacity-75 leading-relaxed mb-5 max-w-3xl">{VENUE_TRAVEL.weather.intro}</p>
        <ul className="space-y-2 mb-4">
          {VENUE_TRAVEL.weather.items.map((it, i) => (
            <li key={i} className="text-sm opacity-75 pl-4 relative before:content-['•'] before:absolute before:left-0">{it}</li>
          ))}
        </ul>
        <p className="text-sm opacity-55 italic">{VENUE_TRAVEL.weather.etiquette}</p>
      </Section>

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
