"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { eventsService } from "@/services/events";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { Star, MessageSquare, RefreshCw, CheckCircle2, Download, ArrowLeft } from "lucide-react";

export type FeedbackQuestionType = "rating" | "text" | "mcq" | "yesno";

export interface FeedbackQuestion {
  text: string;
  type: FeedbackQuestionType;
  /** choices for "mcq" */
  options?: string[];
  /** rating/mcq/yesno are required unless set false; text is optional unless set true */
  required?: boolean;
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
  /** Shows a Back button on the submitted view. */
  onBack?: () => void;
  engagement: FeedbackEngagement;
  eventId: string;
  isAdmin: boolean;
}

const isRequired = (q: FeedbackQuestion) => q.required ?? q.type !== "text";
const choicesOf = (q: FeedbackQuestion) => (q.type === "yesno" ? ["Yes", "No"] : q.options ?? []);

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
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-6 h-6";

  return (
    <div className="flex items-center gap-1" role={readonly ? undefined : "radiogroup"}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          aria-label={readonly ? undefined : `${star} star${star > 1 ? "s" : ""}`}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={cn(
            "transition-all duration-150 p-0.5",
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

function ChoiceButtons({ choices, value, onChange }: { choices: string[]; value?: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {choices.map((c) => {
        const selected = value === c;
        return (
          <button
            key={c}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(c)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3.5 h-11 sm:h-9 text-sm font-medium transition-colors",
              selected ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"
            )}
          >
            {selected && <CheckCircle2 className="h-4 w-4" />}
            {c}
          </button>
        );
      })}
    </div>
  );
}

export function EngagementFeedback({ engagement, eventId, isAdmin, onBack }: EngagementFeedbackProps) {
  const [responses, setResponses] = useState<FeedbackResponseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = engagement.content?.questions || [];

  const fetchResponses = useCallback(async () => {
    try {
      const res = await eventsService.getEngagementResponses(eventId, engagement.id, { limit: 1000 });
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
    for (const q of questions) {
      const a = answers[q.text];
      const missing = a === undefined || a === "" || a === 0;
      if (isRequired(q) && missing) {
        setError(q.type === "rating" ? `Please rate: ${q.text}` : `Please answer: ${q.text}`);
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

  const answersFor = (q: FeedbackQuestion) => responses.map((r) => r.response?.answers?.[q.text]);

  const getAverageRating = (q: FeedbackQuestion): number => {
    const ratings = answersFor(q).filter((v): v is number => typeof v === "number" && v > 0);
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  };

  const getTextResponses = (q: FeedbackQuestion): string[] =>
    answersFor(q).filter((v): v is string => typeof v === "string" && v.trim().length > 0);

  const getChoiceCounts = (q: FeedbackQuestion) => {
    const all = answersFor(q).filter((v): v is string => typeof v === "string" && v !== "");
    const choices = choicesOf(q);
    return { total: all.length, counts: choices.map((c) => ({ choice: c, count: all.filter((a) => a === c).length })) };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <AiimsLoader size="sm" />
      </div>
    );
  }

  // Admin View: aggregated results + download
  if (isAdmin) {
    return (
      <div className="space-y-4">
        {engagement.description && (
          <p className="text-sm text-muted-foreground">{engagement.description}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            {responses.length} response{responses.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1">
            <a
              href={`/api/events/${eventId}/exports?type=feedback&engagementId=${engagement.id}`}
              download
              className="inline-flex items-center gap-1.5 rounded-md border px-2.5 h-7 text-xs font-medium hover:bg-muted transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download CSV
            </a>
            <Button variant="ghost" size="sm" onClick={fetchResponses} className="h-7 gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>
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
                    <StarRating value={Math.round(getAverageRating(q))} readonly size="sm" />
                    <span className="text-lg font-bold text-amber-500">
                      {getAverageRating(q).toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / 5.0 avg
                    </span>
                  </div>
                ) : q.type === "mcq" || q.type === "yesno" ? (
                  <div className="space-y-1.5">
                    {getChoiceCounts(q).counts.map(({ choice, count }) => {
                      const total = getChoiceCounts(q).total;
                      const pct = total ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={choice} className="text-sm">
                          <div className="flex justify-between text-xs mb-0.5">
                            <span>{choice}</span>
                            <span className="text-muted-foreground">{count} ({pct}%)</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {getTextResponses(q).length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No text responses</p>
                    ) : (
                      getTextResponses(q).map((text, i) => (
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

  // Attendee View: already submitted — their own answers, read only.
  if (hasSubmitted) {
    const mine = responses[0]?.response?.answers ?? {};
    const answered = (q: FeedbackQuestion) => mine[q.text];
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/15">
          <CheckCircle2 className="h-5 w-5 flex-none text-emerald-600 dark:text-emerald-400" />
          <div className="min-w-0">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">Feedback already submitted</p>
            <p className="text-sm text-emerald-800/80 dark:text-emerald-300/80">Thank you — here&apos;s what you sent. It can&apos;t be changed.</p>
          </div>
        </div>

        <div className="space-y-3">
          {questions.map((q) => {
            const value = answered(q);
            const given = value !== undefined && value !== "" && value !== 0;
            return (
              <div key={q.text} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/60">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{q.text}</p>
                {!given ? (
                  <p className="mt-1.5 text-sm italic text-muted-foreground">Not answered</p>
                ) : q.type === "rating" ? (
                  <div className="mt-2 flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={cn("h-5 w-5", n <= Number(value) ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600")}
                      />
                    ))}
                    <span className="ml-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{Number(value)}/5</span>
                  </div>
                ) : (
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{String(value)}</p>
                )}
              </div>
            );
          })}
        </div>

        {onBack && (
          <Button variant="outline" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        )}
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
            <label className="text-sm font-medium">
              {q.text}
              {!isRequired(q) && <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>}
            </label>

            {q.type === "rating" ? (
              <StarRating
                value={(answers[q.text] as number) || 0}
                onChange={(v) => setAnswers((prev) => ({ ...prev, [q.text]: v }))}
              />
            ) : q.type === "mcq" || q.type === "yesno" ? (
              <ChoiceButtons
                choices={choicesOf(q)}
                value={answers[q.text] as string | undefined}
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
        className="w-full h-11 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
      >
        {submitting ? "Submitting..." : "Submit Feedback"}
      </Button>
    </div>
  );
}
