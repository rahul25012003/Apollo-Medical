"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EngagementFeedback } from "@/components/events/engagement-feedback";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { IfpcEvent } from "@/components/ifpc/useIfpcEvent";

type Engagement = Parameters<typeof EngagementFeedback>[0]["engagement"];

/**
 * Every open feedback form for the event: the overall conference form first,
 * then one per session (a FEEDBACK engagement linked to that session).
 */
export function IfpcFeedbackForms({ event }: { event: IfpcEvent }) {
  const router = useRouter();
  const forms = (event.engagements || [])
    .filter((e) => e.type === "FEEDBACK" && e.isActive)
    .sort((a, b) => Number(!!a.sessionId) - Number(!!b.sessionId));
  const [activeId, setActiveId] = useState<string | undefined>(forms[0]?.id);

  if (forms.length === 0) {
    return <p className="text-sm opacity-55 text-center">Feedback isn&apos;t open yet — please check back closer to the conference.</p>;
  }

  const sessionTitle = (id: string | null | undefined) =>
    id ? event.eventSessions?.find((s) => s.id === id)?.title ?? "Session" : null;
  const labelOf = (f: (typeof forms)[number]) => (f.sessionId ? `Session: ${sessionTitle(f.sessionId)}` : `Overall conference — ${f.title}`);
  const active = forms.find((f) => f.id === activeId) ?? forms[0];

  return (
    <div className="space-y-4">
      {forms.length > 1 && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Which feedback would you like to give?</label>
          <Select value={active.id} onValueChange={setActiveId}>
            <SelectTrigger className="w-full h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {forms.map((f) => (
                <SelectItem key={f.id} value={f.id}>{labelOf(f)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <EngagementFeedback key={active.id} engagement={active as unknown as Engagement} eventId={event.id} isAdmin={false} onBack={() => router.back()} />
    </div>
  );
}
