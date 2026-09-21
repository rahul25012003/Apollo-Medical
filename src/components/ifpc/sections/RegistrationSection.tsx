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
    </>
  );
}
