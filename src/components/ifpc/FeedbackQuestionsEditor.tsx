"use client";

import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FeedbackQuestion, FeedbackQuestionType } from "@/components/events/engagement-feedback";

const TYPE_LABELS: Record<FeedbackQuestionType, string> = {
  rating: "Star rating (1–5)",
  mcq: "Multiple choice",
  yesno: "Yes / No",
  text: "Text comment",
};

/** Starting point for a new feedback form; the admin can change everything. */
export const DEFAULT_FEEDBACK_QUESTIONS: FeedbackQuestion[] = [
  { text: "Overall, how would you rate this?", type: "rating" },
  { text: "Was the content relevant to your practice?", type: "yesno" },
  { text: "What could be improved?", type: "text" },
];

const isRequired = (q: FeedbackQuestion) => q.required ?? q.type !== "text";

/** Question list editor for FEEDBACK engagements (IFPC admin). */
export function FeedbackQuestionsEditor({ questions, onChange }: { questions: FeedbackQuestion[]; onChange: (q: FeedbackQuestion[]) => void }) {
  const update = (i: number, patch: Partial<FeedbackQuestion>) => onChange(questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...questions];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <div key={i} className="rounded-lg border p-3 space-y-2 bg-muted/20">
          <div className="flex items-start gap-2">
            <span className="mt-2 text-xs font-semibold text-muted-foreground w-5 shrink-0">{i + 1}.</span>
            <Input value={q.text} onChange={(e) => update(i, { text: e.target.value })} placeholder="Question" className="flex-1" />
            <div className="flex shrink-0">
              <Button type="button" variant="ghost" size="icon" className="h-9 w-8" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-8" disabled={i === questions.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-8 text-destructive hover:text-destructive" onClick={() => onChange(questions.filter((_, idx) => idx !== i))} aria-label="Remove question"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pl-7">
            <Select
              value={q.type}
              onValueChange={(v) => update(i, { type: v as FeedbackQuestionType, options: v === "mcq" ? (q.options?.length ? q.options : ["", ""]) : undefined })}
            >
              <SelectTrigger className="w-48 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(TYPE_LABELS) as FeedbackQuestionType[]).map((t) => (
                  <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch checked={isRequired(q)} onCheckedChange={(v) => update(i, { required: v })} /> Required
            </label>
          </div>
          {q.type === "mcq" && (
            <div className="pl-7 space-y-1.5">
              {(q.options ?? []).map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => update(i, { options: (q.options ?? []).map((o, x) => (x === oi ? e.target.value : o)) })}
                    placeholder={`Choice ${oi + 1}`}
                    className="h-8 text-sm"
                  />
                  {(q.options?.length ?? 0) > 2 && (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => update(i, { options: (q.options ?? []).filter((_, x) => x !== oi) })} aria-label="Remove choice">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {(q.options?.length ?? 0) < 8 && (
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => update(i, { options: [...(q.options ?? []), ""] })}>
                  <Plus className="h-3 w-3 mr-1" /> Add choice
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => onChange([...questions, { text: "", type: "rating" }])}>
        <Plus className="h-3.5 w-3.5 mr-1" /> Add question
      </Button>
      <p className="text-[11px] text-muted-foreground">
        Answers are matched to the question wording — rewording a question after responses arrive starts a new column in the results.
      </p>
    </div>
  );
}

/** Drop blank questions/choices; returns an error message if the form isn't usable. */
export function cleanFeedbackQuestions(questions: FeedbackQuestion[]): { questions: FeedbackQuestion[]; error?: string } {
  const cleaned = questions
    .map((q) => ({
      ...q,
      text: q.text.trim(),
      options: q.type === "mcq" ? (q.options ?? []).map((o) => o.trim()).filter(Boolean) : undefined,
    }))
    .filter((q) => q.text);
  if (cleaned.length === 0) return { questions: cleaned, error: "Add at least one question" };
  const texts = cleaned.map((q) => q.text.toLowerCase());
  if (new Set(texts).size !== texts.length) return { questions: cleaned, error: "Each question needs different wording" };
  const badMcq = cleaned.find((q) => q.type === "mcq" && (q.options?.length ?? 0) < 2);
  if (badMcq) return { questions: cleaned, error: `"${badMcq.text}" needs at least two choices` };
  return { questions: cleaned };
}
