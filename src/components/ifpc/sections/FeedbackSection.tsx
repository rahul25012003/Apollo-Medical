"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useIfpcEvent } from "@/components/ifpc/useIfpcEvent";
import { Reveal } from "@/components/ifpc/design/Reveal";
import { IfpcFeedbackForms } from "@/components/ifpc/IfpcFeedbackForms";
import { Loader2, LogIn, MessageSquareHeart, Star, ArrowRight, Sparkles } from "lucide-react";

export function FeedbackSection({ tenantSlug }: { tenantSlug: string }) {
  const { event, loading } = useIfpcEvent();
  const { status } = useSession();
  const signedIn = status === "authenticated";

  return (
    <section className="ifpc-v2 ifpc-fb">
      <div className="ifpc-fb-wrap">
        <Reveal className="ifpc-fb-banner">
          <span className="ifpc-fb-swirl" aria-hidden="true" />
          <span className="ifpc-fb-icon" aria-hidden="true"><MessageSquareHeart /></span>
          <div className="ifpc-fb-body">
            <h2 className="ifpc-fb-title">Share Your <span>Feedback</span></h2>
            <p className="ifpc-fb-lead">Tell us about your experience with sessions, workshops, and the conference overall — it helps us improve every year.</p>
            {loading || status === "loading" ? (
              <div className="ifpc-fb-loading"><Loader2 className="animate-spin" /></div>
            ) : !signedIn ? (
              <div className="ifpc-fb-login">
                <p className="ifpc-fb-login-title">Log in to share your feedback</p>
                <p className="ifpc-fb-login-text">Feedback is linked to your delegate account so we can follow up if needed.</p>
                <Link href={`/auth/login?tenant=${tenantSlug}`} className="ifpc-fb-btn">
                  <LogIn aria-hidden="true" /> Log In <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            ) : !event?.id ? (
              <p className="ifpc-fb-login-text">Feedback isn&apos;t open yet — please check back closer to the conference.</p>
            ) : null}
          </div>
          {/* A feedback card with stars (decoration only). */}
          <div className="ifpc-fb-art" aria-hidden="true">
            <Sparkles className="ifpc-fb-spark ifpc-fb-spark--a" />
            <Sparkles className="ifpc-fb-spark ifpc-fb-spark--b" />
            <span className="ifpc-fb-art-glow" />
            <div className="ifpc-fb-art-card">
              <span className="ifpc-fb-art-bubble"><MessageSquareHeart /></span>
              <span className="ifpc-fb-art-stars">{[0, 1, 2, 3, 4].map((i) => <Star key={i} style={{ "--i": i } as React.CSSProperties} />)}</span>
              <span className="ifpc-fb-art-line" />
              <span className="ifpc-fb-art-line ifpc-fb-art-line--short" />
            </div>
          </div>
        </Reveal>

        {signedIn && event?.id && !loading && (
          <Reveal delayMs={100} className="ifpc-fb-forms">
            <IfpcFeedbackForms event={event} />
          </Reveal>
        )}
      </div>
    </section>
  );
}
