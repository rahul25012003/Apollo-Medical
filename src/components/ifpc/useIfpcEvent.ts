"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/lib/tenant";
import { eventsService, Event, EventSpeaker, EventSession, EventSponsor } from "@/services/events";

export interface IfpcEventEngagement {
  id: string;
  title: string;
  type: string;
  description: string | null;
  content: unknown;
  isActive: boolean;
}

export type IfpcEvent = Event & {
  eventSpeakers: EventSpeaker[];
  eventSessions: EventSession[];
  eventSponsors: EventSponsor[];
  engagements: IfpcEventEngagement[];
};

/**
 * Loads the single IFPC 2026 event for the apollo-medical tenant (with
 * sessions, speakers, pricing) so every new public page can pull live,
 * admin-editable data instead of hardcoding it a second time.
 */
export function useIfpcEvent() {
  const { tenant } = useTenant();
  const [event, setEvent] = useState<IfpcEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!tenant?.id) return;

    async function load() {
      try {
        const listRes = await eventsService.getPublic({ tenantId: tenant.id, limit: 1 });
        const list = listRes.success && Array.isArray(listRes.data) ? listRes.data : [];
        const first = list[0];
        if (!first) {
          if (!cancelled) setLoading(false);
          return;
        }
        const detailRes = await eventsService.getPublicById(first.id);
        if (!cancelled && detailRes.success && detailRes.data) {
          setEvent(detailRes.data as IfpcEvent);
        }
      } catch (e) {
        console.error("[useIfpcEvent]", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [tenant?.id]);

  return { event, loading };
}
