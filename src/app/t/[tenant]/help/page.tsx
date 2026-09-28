"use client";

import { notFound, useParams } from "next/navigation";
import { Shield, Ambulance, Flame, HeartHandshake, Phone, LifeBuoy, BriefcaseMedical, Mail, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import { HELPLINE, CONTACT } from "@/content/ifpc-2026";
import { DelegatePageShell } from "@/components/ifpc/DelegatePageShell";

const LOOK: Record<string, { icon: LucideIcon; color: string; tint: string }> = {
  police: { icon: Shield, color: "#1d4ed8", tint: "#eff6ff" },
  ambulance: { icon: Ambulance, color: "#dc2626", tint: "#fef2f2" },
  fire: { icon: Flame, color: "#ea580c", tint: "#fff7ed" },
  telemanas: { icon: HeartHandshake, color: "#0f766e", tint: "#f0fdfa" },
};

const telOf = (n: string) => `tel:${n.replace(/[^\d+]/g, "")}`;

/**
 * Help Line / Emergency. Every number is a single tap to call — in an
 * emergency nobody should have to copy digits. Public, like the other
 * at-the-venue pages, so it works for anyone who reaches it.
 */
export default function HelpPage() {
  const params = useParams();
  if ((params.tenant as string) !== IFPC_TENANT_SLUG) notFound();
  const team = CONTACT.conferenceManager;

  return (
    <DelegatePageShell title="Help Line" icon={LifeBuoy}>
      <div className="space-y-5">
        {/* Emergency numbers: big, coloured, tap to call. */}
        <section aria-labelledby="emergency-heading">
          <h2 id="emergency-heading" className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Emergency</h2>
          <ul className="grid grid-cols-2 gap-3">
            {HELPLINE.emergency.map((e) => {
              const look = LOOK[e.id];
              const Icon = look.icon;
              return (
                <li key={e.id}>
                  <a
                    href={telOf(e.dial)}
                    aria-label={`Call ${e.label}, ${e.number}`}
                    className="flex h-full flex-col gap-2 rounded-2xl p-4 ring-1 transition-transform active:scale-[0.98]"
                    style={{ background: look.tint, color: look.color, boxShadow: `inset 0 0 0 1px ${look.color}22` }}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Icon className="h-5 w-5 flex-none" /> {e.label}
                    </span>
                    <span className="text-3xl font-extrabold tracking-tight">{e.number}</span>
                    {e.alt && <span className="text-xs font-medium opacity-80">{e.alt}</span>}
                    <span className="text-xs text-slate-600">{e.note}</span>
                    <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: look.color }}>
                      <Phone className="h-3.5 w-3.5" /> Call
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
            <MapPin className="mt-0.5 h-3.5 w-3.5 flex-none" />
            <span>Tell them where you are: <strong className="text-slate-700">{CONTACT.venueAddress}</strong></span>
          </p>
        </section>

        {/* First aid — the required message, verbatim and hard to miss. */}
        <section aria-labelledby="first-aid-heading" className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-300">
          <h2 id="first-aid-heading" className="flex items-center gap-2 text-base font-bold text-amber-900">
            <BriefcaseMedical className="h-5 w-5 flex-none" /> First Aid
          </h2>
          <p className="mt-2 text-lg font-semibold leading-snug text-amber-950">{HELPLINE.firstAid}</p>

          <div className="mt-4 rounded-xl bg-white p-3 ring-1 ring-amber-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Organizing team</p>
            <p className="mt-0.5 font-semibold text-slate-900">{team.name}</p>
            <p className="text-xs text-slate-500">Conference Manager</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={telOf(team.mobile)} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700">
                <Phone className="h-4 w-4" /> {team.mobile}
              </a>
              <a href={`mailto:${CONTACT.generalEmail}`} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Mail className="h-4 w-4" /> {CONTACT.generalEmail}
              </a>
            </div>
          </div>
        </section>
      </div>
    </DelegatePageShell>
  );
}
