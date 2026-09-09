"use client";

import Link from "next/link";
import { useIfpcEvent } from "@/components/ifpc/useIfpcEvent";
import { Section, SectionTitle } from "@/components/ifpc/IfpcShell";
import { Button } from "@/components/ui/button";
import { REGISTRATION, CTA_LINKS } from "@/content/ifpc-2026";
import { ArrowRight, Loader2, Info } from "lucide-react";

export function RegistrationSection() {
  const { event, loading } = useIfpcEvent();

  return (
    <>
      <Section tint>
        <div className="text-center max-w-2xl mx-auto">
          <SectionTitle title="Register for IFPC 2026" subtitle={REGISTRATION.intro} />
          <Button asChild size="lg" disabled={!event?.id} className="h-14 px-10 text-base">
            {event?.id ? (
              <Link href={`/events/${event.id}/register`}>
                {CTA_LINKS.registerNow.label} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            ) : (
              <span>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registration opening soon"}</span>
            )}
          </Button>
          <p className="text-xs text-slate-500 text-center mt-5 flex items-center justify-center gap-1.5"><Info className="h-3.5 w-3.5 flex-none" />Fees and delegate categories are shown on the registration page.</p>
          <p className="text-xs text-slate-500 mt-3 flex items-start gap-1.5 justify-center"><Info className="h-3.5 w-3.5 flex-none mt-0.5" />{REGISTRATION.creditNote}</p>
        </div>
      </Section>

      <Section>
        <SectionTitle title="Delegate Eligibility" />
        <div className="grid sm:grid-cols-2 gap-4">
          {REGISTRATION.eligibility.map((e, i) => (
            <div key={e.title} className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
              <p className="font-bold text-sm mb-1.5">{e.title}</p>
              <p className="text-sm opacity-70 leading-relaxed">{e.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tint>
        <SectionTitle title="Important Notes" />
        <ul className="space-y-2 mb-10">
          {REGISTRATION.importantNotes.map((n, i) => (
            <li key={i} className="text-sm opacity-75 pl-4 relative before:content-['•'] before:absolute before:left-0">{n}</li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {event?.id && (
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <Link href={`/events/${event.id}/register`}>{CTA_LINKS.registerNow.label}</Link>
            </Button>
          )}
          <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
            <a href="#venue">{CTA_LINKS.planYourVisit.label}</a>
          </Button>
        </div>
      </Section>
    </>
  );
}
