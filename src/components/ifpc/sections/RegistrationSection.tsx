"use client";

import Link from "next/link";
import { useIfpcEvent } from "@/components/ifpc/useIfpcEvent";
import { Reveal } from "@/components/ifpc/design/Reveal";
import { REGISTRATION, CTA_LINKS } from "@/content/ifpc-2026";
import { ArrowRight, Loader2, Info, CalendarDays, ClipboardCheck } from "lucide-react";
import "./ifpc-guidelines.css";

export function RegistrationSection() {
  const { event, loading } = useIfpcEvent();

  return (
    <section className="ifpc-v2 ifpc-gd ifpc-gd--soft ifpc-rg-sec">
      <div className="ifpc-gd-wrap">
        <Reveal className="ifpc-rg">
          <span className="ifpc-rg-deco" aria-hidden="true"><ClipboardCheck /></span>
          <div className="ifpc-rg-main">
            <span className="ifpc-rg-cal" aria-hidden="true"><CalendarDays /></span>
            <div>
              <h2>Register for IFPC 2026</h2>
              <p>{REGISTRATION.intro}</p>
            </div>
          </div>
          <div className="ifpc-rg-side">
            {event?.id ? (
              <Link href={`/events/${event.id}/register`} className="ifpc-rg-btn">
                {CTA_LINKS.registerNow.label} <ArrowRight aria-hidden="true" />
              </Link>
            ) : (
              <span className="ifpc-rg-btn is-off">{loading ? <Loader2 className="animate-spin" /> : "Registration opening soon"}</span>
            )}
            <p><Info aria-hidden="true" />Fees and delegate categories are shown on the registration page.</p>
            <p><Info aria-hidden="true" />{REGISTRATION.creditNote}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
