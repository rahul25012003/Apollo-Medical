"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Star, Loader2, CheckCircle2, Clock, MapPin, UtensilsCrossed, Presentation, Mic2, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { conferenceDay } from "@/lib/ifpc-eoi";
import { FEEDBACK_DAYS, MEALS, SCIENTIFIC_ITEMS, foodKey, type FeedbackKind, type Meal, type SubmittedFeedback } from "@/lib/ifpc-feedback";
import "./food-preference.css";

type Workshop = { sessionId: string; title: string; hall: string | null; sessionDate: string | null; startTime: string | null; endTime: string | null };
type Payload = { vegRating?: number | null; nonVegRating?: number | null; rating?: number | null; comment?: string | null };

const dayLabel = (date: string) => `Day ${conferenceDay(date)} · ${format(parseISO(date), "EEE d MMM")}`;

/**
 * Food, workshop and scientific-session feedback. Each item is sent on its
 * own — a delegate rates Day 1 lunch on Day 1 and Day 4 dinner on Day 4 —
 * and once sent it is shown back read-only.
 */
export function DelegateFeedbackPanel({ general }: { general: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(true);
  const [submitted, setSubmitted] = useState<Record<string, SubmittedFeedback>>({});
  const [workshops, setWorkshops] = useState<Workshop[]>([]);

  useEffect(() => {
    fetch("/api/users/me/feedback", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) return;
        setRegistered(j.data.registered);
        setSubmitted(j.data.submitted);
        setWorkshops(j.data.workshops);
      })
      .catch(() => toast.error("Could not load your feedback"))
      .finally(() => setLoading(false));
  }, []);

  const send = useCallback(async (kind: FeedbackKind, key: string, payload: Payload) => {
    const res = await fetch("/api/users/me/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, key, ...payload }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j.success) {
      toast.error(j?.error?.message || "Could not send your feedback");
      return false;
    }
    setSubmitted((s) => ({ ...s, [`${kind}|${key}`]: { vegRating: null, nonVegRating: null, rating: null, comment: null, ...payload } as SubmittedFeedback }));
    toast.success("Thank you for your feedback");
    return true;
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const done = (kind: FeedbackKind, key: string) => submitted[`${kind}|${key}`];

  return (
    <Tabs defaultValue="food" className="space-y-5">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
        <TabsTrigger value="food" className="gap-1.5"><UtensilsCrossed className="h-3.5 w-3.5" /> Food</TabsTrigger>
        <TabsTrigger value="workshops" className="gap-1.5"><Presentation className="h-3.5 w-3.5" /> Workshops</TabsTrigger>
        <TabsTrigger value="scientific" className="gap-1.5"><Mic2 className="h-3.5 w-3.5" /> Scientific Sessions</TabsTrigger>
        <TabsTrigger value="general" className="gap-1.5"><MessageSquareText className="h-3.5 w-3.5" /> General</TabsTrigger>
      </TabsList>

      {!registered && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          Feedback is for delegates with a confirmed registration.
        </p>
      )}

      {/* Food — Day 1–4 × Lunch/Dinner × Veg/Non-Veg, 1 to 5 */}
      <TabsContent value="food" className="space-y-6">
        <p className="text-sm text-muted-foreground">Rate each meal out of 5. Rate the veg food, the non-veg food, or both — whatever you had.</p>
        {FEEDBACK_DAYS.map((date) => (
          <section key={date} className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{dayLabel(date)}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {MEALS.map((meal) => (
                <FoodMealForm key={meal} date={date} meal={meal} done={done("food", foodKey(date, meal))} disabled={!registered} onSend={(p) => send("food", foodKey(date, meal), p)} />
              ))}
            </div>
          </section>
        ))}
      </TabsContent>

      {/* Workshops — every workshop the delegate picked, grouped by day */}
      <TabsContent value="workshops" className="space-y-6">
        <p className="text-sm text-muted-foreground">Rate each workshop you chose, out of 5, and add any comments.</p>
        {FEEDBACK_DAYS.map((date) => {
          const n = conferenceDay(date);
          const mine = workshops.filter((w) => w.sessionDate === date);
          return (
            <section key={date} className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{dayLabel(date)}</h3>
              {mine.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-muted-foreground dark:bg-slate-800/50">
                  {n === 4 ? (
                    "No workshop on Day 4."
                  ) : (
                    <>You didn&apos;t pick a Day {n} workshop. <Link href="/dashboard/my-interests" className="font-medium text-primary hover:underline">Choose one in My Interests</Link> to rate it here.</>
                  )}
                </p>
              ) : (
                mine.map((w) => (
                  <RatedItemForm
                    key={w.sessionId}
                    title={w.title}
                    meta={<>
                      {w.startTime && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{w.startTime}{w.endTime ? `–${w.endTime}` : ""}</span>}
                      {w.hall && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{w.hall}</span>}
                    </>}
                    done={done("workshop", w.sessionId)}
                    disabled={!registered}
                    onSend={(p) => send("workshop", w.sessionId, p)}
                  />
                ))
              )}
            </section>
          );
        })}
      </TabsContent>

      {/* Scientific sessions — Plenary 1–4, Session 1–2 */}
      <TabsContent value="scientific" className="space-y-3">
        <p className="text-sm text-muted-foreground">Rate each scientific session out of 5, and add any comments.</p>
        {SCIENTIFIC_ITEMS.map((item) => (
          <RatedItemForm key={item.key} title={item.label} done={done("scientific", item.key)} disabled={!registered} onSend={(p) => send("scientific", item.key, p)} />
        ))}
      </TabsContent>

      <TabsContent value="general">{general}</TabsContent>
    </Tabs>
  );
}

/** Five stars as a radio group: one tab stop, arrow keys move, Enter/Space picks. */
function StarRating({ value, onChange, label, readOnly }: { value: number | null; onChange?: (v: number) => void; label: string; readOnly?: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex items-center gap-0.5"
      onMouseLeave={() => setHover(null)}
      onKeyDown={(e) => {
        if (readOnly || !onChange) return;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); onChange(Math.min(5, (value ?? 0) + 1)); }
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); onChange(Math.max(1, (value ?? 1) - 1)); }
      }}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} out of 5`}
          tabIndex={readOnly ? -1 : value ? (value === n ? 0 : -1) : n === 1 ? 0 : -1}
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readOnly && setHover(n)}
          className={cn("rounded p-1 transition-transform", !readOnly && "hover:scale-110 active:scale-95", readOnly && "cursor-default")}
        >
          <Star className={cn("h-6 w-6", n <= shown ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600")} />
        </button>
      ))}
      {value != null && <span className="ml-1 text-sm font-semibold text-slate-600 dark:text-slate-300">{value}/5</span>}
    </div>
  );
}

function SentBadge() {
  return <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Sent</span>;
}

function FoodMealForm({ date, meal, done, disabled, onSend }: { date: string; meal: Meal; done?: SubmittedFeedback; disabled: boolean; onSend: (p: Payload) => Promise<boolean> }) {
  const [veg, setVeg] = useState<number | null>(null);
  const [nonVeg, setNonVeg] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const title = meal === "lunch" ? "Lunch" : "Dinner";
  const d = conferenceDay(date);
  const row = (kind: "veg" | "nonVeg", value: number | null, set?: (v: number) => void) => (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className={cn("ifpc-food ifpc-food--readout", kind === "nonVeg" && "ifpc-food--nonveg")} data-selected="true">
        <span className="ifpc-food-mark" aria-hidden="true" /> {kind === "veg" ? "Veg" : "Non-Veg"}
      </span>
      {done && value == null ? (
        <span className="text-xs text-muted-foreground">Not rated</span>
      ) : (
        <StarRating value={value} onChange={set} readOnly={!!done} label={`Day ${d} ${title} — ${kind === "veg" ? "veg" : "non-veg"} food`} />
      )}
    </div>
  );
  return (
    <div className="space-y-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        {done && <SentBadge />}
      </div>
      {row("veg", done ? done.vegRating : veg, setVeg)}
      {row("nonVeg", done ? done.nonVegRating : nonVeg, setNonVeg)}
      {!done && (
        <Button
          size="sm"
          className="w-full"
          disabled={disabled || busy || (veg == null && nonVeg == null)}
          onClick={async () => { setBusy(true); await onSend({ vegRating: veg, nonVegRating: nonVeg }); setBusy(false); }}
        >
          {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Send {title.toLowerCase()} feedback
        </Button>
      )}
    </div>
  );
}

function RatedItemForm({ title, meta, done, disabled, onSend }: { title: string; meta?: React.ReactNode; done?: SubmittedFeedback; disabled: boolean; onSend: (p: Payload) => Promise<boolean> }) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          {meta && <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">{meta}</p>}
        </div>
        {done && <SentBadge />}
      </div>
      <StarRating value={done ? done.rating : rating} onChange={setRating} readOnly={!!done} label={`Rating for ${title}`} />
      {done ? (
        done.comment ? <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">{done.comment}</p> : <p className="text-xs text-muted-foreground">No comments</p>
      ) : (
        <>
          <Textarea rows={3} maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comments (optional)" aria-label={`Comments on ${title}`} />
          <Button
            size="sm"
            disabled={disabled || busy || rating == null}
            onClick={async () => { setBusy(true); await onSend({ rating, comment: comment.trim() || null }); setBusy(false); }}
          >
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Send feedback
          </Button>
        </>
      )}
    </div>
  );
}
