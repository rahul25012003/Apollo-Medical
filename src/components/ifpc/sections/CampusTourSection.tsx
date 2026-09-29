"use client";

import { useSession } from "next-auth/react";
import { Reveal } from "@/components/ifpc/design/Reveal";
import { ExpressInterestButton } from "@/components/ifpc/ExpressInterestButton";
import { CampusPhotoSlideshow } from "@/components/ifpc/CampusPhotoSlideshow";
import { useIfpcEvent } from "@/components/ifpc/useIfpcEvent";
import { HIGHLIGHTS } from "@/content/ifpc-2026";
import { Landmark, Clock } from "lucide-react";
import "../campus-tour.css";

// Same guided-tour item already listed under Delegate Experience — this
// section gives it its own spot right after the venue/location section,
// with the real interest sign-up (the "NIMHANS Campus Tour" EventSession
// seeded alongside the other bookable sessions/workshops).
export function CampusTourSection() {
  const { status } = useSession();
  const { event, loading } = useIfpcEvent();
  const tourItem = HIGHLIGHTS.delegateExperience.items.find((it) =>
    it.title.toLowerCase().includes("campus tour")
  );
  const tourSession = event?.eventSessions?.find((s) =>
    s.title.toLowerCase().includes("campus tour")
  );

  if (!tourItem) return null;
  const [first, ...rest] = tourItem.title.split(" ");

  return (
    <section className="ifpc-v2 ifpc-ct">
      <div className="ifpc-ct-wrap">
        <Reveal>
          <h2 className="ifpc-ct-title">{first} <span>{rest.join(" ")}</span></h2>
          <p className="ifpc-ct-lead">A complimentary guided tour for registered delegates</p>
        </Reveal>
        <div className="ifpc-ct-grid">
          <Reveal delayMs={80}>
            <CampusPhotoSlideshow />
          </Reveal>
          <Reveal delayMs={160} className="ifpc-ct-card">
            <span className="ifpc-ct-card-icon" aria-hidden="true"><Landmark /></span>
            <p className="ifpc-ct-text">{tourItem.text}</p>
            {tourSession?.startTime && (
              <p className="ifpc-ct-time">
                <Clock aria-hidden="true" />
                {tourSession.startTime}{tourSession.endTime ? `–${tourSession.endTime}` : ""}
              </p>
            )}
            {!loading && tourSession && status === "authenticated" && (
              <div className="ifpc-ct-interest"><ExpressInterestButton sessionId={tourSession.id} /></div>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
