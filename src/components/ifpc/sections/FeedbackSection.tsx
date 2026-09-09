"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useIfpcEvent } from "@/components/ifpc/useIfpcEvent";
import { Section, SectionTitle } from "@/components/ifpc/IfpcShell";
import { EngagementFeedback } from "@/components/events/engagement-feedback";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn } from "lucide-react";

export function FeedbackSection({ tenantSlug }: { tenantSlug: string }) {
  const { event, loading } = useIfpcEvent();
  const { status } = useSession();

  const engagement = event?.engagements?.find((e) => e.type === "FEEDBACK" && e.isActive);

  return (
    <Section tint>
      <SectionTitle title="Share Your Feedback" subtitle="Tell us about your experience with sessions, workshops, and the conference overall — it helps us improve every year." />
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm max-w-xl mx-auto p-6 sm:p-8">
        {loading || status === "loading" ? (
          <div className="flex justify-center py-8 opacity-40"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : status !== "authenticated" ? (
          <div className="text-center py-6">
            <p className="font-semibold">Log in to share your feedback</p>
            <p className="text-sm opacity-60 mt-2">Feedback is linked to your delegate account so we can follow up if needed.</p>
            <Button asChild className="h-11 px-6 mt-5">
              <Link href={`/auth/login?tenant=${tenantSlug}`}><LogIn className="mr-2 h-4 w-4" /> Log In</Link>
            </Button>
          </div>
        ) : engagement && event?.id ? (
          <EngagementFeedback engagement={engagement as unknown as Parameters<typeof EngagementFeedback>[0]["engagement"]} eventId={event.id} isAdmin={false} />
        ) : (
          <p className="text-sm opacity-55 text-center">Feedback isn&apos;t open yet — please check back closer to the conference.</p>
        )}
      </div>
    </Section>
  );
}
