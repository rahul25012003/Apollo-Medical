"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { eventsService } from "@/services/events";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { Star, MessageSquare, RefreshCw, CheckCircle2 } from "lucide-react";

interface FeedbackQuestion {
  text: string;
  type: "rating" | "text";
}

interface FeedbackEngagement {
  id: string;
  title: string;
  description?: string | null;
  content: {
    questions?: FeedbackQuestion[];
  };
  isActive: boolean;
}

interface FeedbackResponseData {
  id: string;
  userName: string | null;
  response: {
    answers?: Record<string, string | number>;
  };
  createdAt: string;
  _meta?: { userResponded?: boolean };
}

interface EngagementFeedbackProps {
  engagement: FeedbackEngagement;
  eventId: string;
  isAdmin: boolean;
}

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}) {
  const [hovered, setHovered] = useState(0);
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={cn(
            "transition-all duration-150",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
        >
          <Star
            className={cn(
              sizeClass,
              "transition-colors",
              (hovered || value) >= star
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function EngagementFeedback({ engagement, eventId, isAdmin }: EngagementFeedbackProps) {
  const [responses, setResponses] = useState<FeedbackResponseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = engagement.content?.questions || [];

  const fetchResponses = useCallback(async () => {
    try {
      const res = await eventsService.getEngagementResponses(eventId, engagement.id, { limit: 200 });
      if (res.success && res.data) {
        const data = res.data as unknown;
        if (Array.isArray(data)) {
          setResponses(data as FeedbackResponseData[]);
          // Check if user has responded
          if (data.length > 0 && (data[0] as FeedbackResponseData)?._meta?.userResponded) {
            setHasSubmitted(true);
          }
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [eventId, engagement.id]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  const handleSubmit = async () => {
    // Validate all questions have answers
    for (const q of questions) {
      const key = q.text;
      if (q.type === "rating" && (!answers[key] || answers[key] === 0)) {
        setError(`Please rate: ${q.text}`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await eventsService.submitEngagementResponse(eventId, engagement.id, {
        response: { answers },
      });

      if (res.success) {
        setHasSubmitted(true);
        await fetchResponses();
      } else {
        setError(res.error?.message || "Failed to submit feedback");
      }
    } catch {
      setError("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate average ratings for admin view
  const getAverageRating = (questionText: string): number => {
    const ratings = responses
      .map((r) => r.response?.answers?.[questionText])
      .filter((v): v is number => typeof v === "number" && v > 0);

    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  };

  const getTextResponses = (questionText: string): string[] => {
    return responses
      .map((r) => r.response?.answers?.[questionText])
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <AiimsLoader size="sm" />
      </div>
    );
  }

  // Admin View: Show aggregated results
  if (isAdmin) {
    return (
      <div className="space-y-4">
        {engagement.description && (
          <p className="text-sm text-muted-foreground">{engagement.description}</p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {responses.length} response{responses.length !== 1 ? "s" : ""}
          </span>
          <Button variant="ghost" size="sm" onClick={fetchResponses} className="h-7 gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>

        {responses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No feedback received yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <div
                key={q.text}
                className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2"
              >
                <h4 className="text-sm font-medium">{q.text}</h4>

                {q.type === "rating" ? (
                  <div className="flex items-center gap-3">
                    <StarRating value={Math.round(getAverageRating(q.text))} readonly size="md" />
                    <span className="text-lg font-bold text-amber-500">
                      {getAverageRating(q.text).toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / 5.0 avg
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {getTextResponses(q.text).length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No text responses</p>
                    ) : (
                      getTextResponses(q.text).map((text, i) => (
                        <div
                          key={i}
                          className="text-sm px-3 py-2 rounded-lg bg-background/50 border border-border/30"
                        >
                          {text}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Attendee View: Already submitted
  if (hasSubmitted) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold">Thank You!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Your feedback has been submitted successfully.
          </p>
        </div>
      </div>
    );
  }

  // Attendee View: Feedback Form
  return (
    <div className="space-y-4">
      {engagement.description && (
        <p className="text-sm text-muted-foreground">{engagement.description}</p>
      )}

      <div className="space-y-4">
        {questions.map((q) => (
          <div
            key={q.text}
            className="p-4 rounded-xl bg-muted/20 border border-border/50 space-y-2"
          >
            <label className="text-sm font-medium">{q.text}</label>

            {q.type === "rating" ? (
              <StarRating
                value={(answers[q.text] as number) || 0}
                onChange={(v) => setAnswers((prev) => ({ ...prev, [q.text]: v }))}
              />
            ) : (
              <textarea
                placeholder="Your thoughts..."
                value={(answers[q.text] as string) || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [q.text]: e.target.value }))
                }
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                maxLength={1000}
              />
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        onClick={handleSubmit}
        disabled={submitting || !engagement.isActive}
        className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
      >
        {submitting ? "Submitting..." : "Submit Feedback"}
      </Button>
    </div>
  );
}
