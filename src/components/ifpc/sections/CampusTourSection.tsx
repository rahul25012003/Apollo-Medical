"use client";

import { Section, SectionTitle } from "@/components/ifpc/IfpcShell";
import { ExpressInterestButton } from "@/components/ifpc/ExpressInterestButton";
import { CampusPhotoSlideshow } from "@/components/ifpc/CampusPhotoSlideshow";
import { useIfpcEvent } from "@/components/ifpc/useIfpcEvent";
import { HIGHLIGHTS } from "@/content/ifpc-2026";
import { Landmark, Clock } from "lucide-react";

// Same guided-tour item already listed under Delegate Experience — this
// section gives it its own spot right after the venue/location section,
// with the real interest sign-up (the "NIMHANS Campus Tour" EventSession
// seeded alongside the other bookable sessions/workshops).
export function CampusTourSection() {
  const { event, loading } = useIfpcEvent();
  const tourItem = HIGHLIGHTS.delegateExperience.items.find((it) =>
    it.title.toLowerCase().includes("campus tour")
  );
  const tourSession = event?.eventSessions?.find((s) =>
    s.title.toLowerCase().includes("campus tour")
  );

  if (!tourItem) return null;

  return (
    <Section tint>
      <SectionTitle title={tourItem.title} subtitle="A complimentary guided tour for registered delegates" />
      <div className="max-w-3xl mb-6">
        <CampusPhotoSlideshow />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8 max-w-3xl">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white" style={{ background: "#4B2FE5" }}>
            <Landmark className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="opacity-75 leading-relaxed">{tourItem.text}</p>
            {tourSession?.startTime && (
              <p className="text-sm opacity-60 flex items-center gap-1.5 mt-3">
                <Clock className="h-3.5 w-3.5" />
                {tourSession.startTime}{tourSession.endTime ? `–${tourSession.endTime}` : ""}
              </p>
            )}
            <div className="mt-4">
              {!loading && tourSession && <ExpressInterestButton sessionId={tourSession.id} />}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
