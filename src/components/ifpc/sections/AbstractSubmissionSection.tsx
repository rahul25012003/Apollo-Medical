"use client";

import { useMemo, useState } from "react";
import { useIfpcEvent } from "@/components/ifpc/useIfpcEvent";
import { Section, SectionTitle } from "@/components/ifpc/IfpcShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, Loader2, CalendarClock, Upload, FileText, X } from "lucide-react";
import { ABSTRACT_SUBMISSION, ALL_TOPICS } from "@/content/ifpc-2026";

const SUBMISSION_TYPES = [
  { value: "UNSTRUCTURED", label: "Unstructured Abstract (max 200 words)" },
  { value: "ORAL_POSTER", label: "Original Scientific Abstract — Oral / Poster (max 250 words)" },
  { value: "SYMPOSIUM_WORKSHOP", label: "Symposium / Workshop Abstract" },
];

const WORD_LIMITS: Record<string, number> = { UNSTRUCTURED: 200, ORAL_POSTER: 250 };

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function AbstractSubmissionSection() {
  const { event } = useIfpcEvent();

  const [form, setForm] = useState({
    title: "", authors: "", affiliations: "", topic: "", submissionType: "ORAL_POSTER",
    abstractText: "", presentingAuthorName: "", presentingAuthorEmail: "", presentingAuthorPhone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<{ url: string; name: string } | null>(null);

  const limit = WORD_LIMITS[form.submissionType];
  const words = wordCount(form.abstractText);
  const overLimit = !!limit && words > limit;

  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", selected);
      const res = await fetch("/api/abstracts/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json?.error?.message || "Could not upload file");
        return;
      }
      setFile({ url: json.data.url, name: selected.name });
    } catch {
      toast.error("File upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const canSubmit = useMemo(() => (
    form.title.trim() && form.authors.trim() && form.topic && form.abstractText.trim() &&
    form.presentingAuthorName.trim() && form.presentingAuthorEmail.trim() && !overLimit
  ), [form, overLimit]);

  async function handleSubmit() {
    if (!event?.id) {
      toast.error("The conference is being set up — please try again shortly.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/abstracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, eventId: event.id, fileUrl: file?.url }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json?.error?.message || "Could not submit your abstract");
        return;
      }
      setDone(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Section>
        <SectionTitle title="Submit Your Abstract" subtitle={ABSTRACT_SUBMISSION.method} />
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex items-center gap-3 p-4 mb-10" style={{ background: "#FFF7DB" }}>
          <CalendarClock className="h-5 w-5 flex-none" style={{ color: "#a16207" }} />
          <p className="text-sm"><strong>Submission Deadline:</strong> {ABSTRACT_SUBMISSION.deadline}</p>
        </div>

        <ul className="space-y-2 mb-10">
          {ABSTRACT_SUBMISSION.generalGuidelines.map((g, i) => (
            <li key={i} className="text-sm opacity-75 pl-4 relative before:content-['•'] before:absolute before:left-0">{g}</li>
          ))}
        </ul>

        <div className="grid sm:grid-cols-3 gap-4 mb-14">
          {[ABSTRACT_SUBMISSION.unstructured, ABSTRACT_SUBMISSION.original, ABSTRACT_SUBMISSION.symposiaWorkshop].map((block) => (
            <div key={block.title} className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
              <h4 className="font-bold text-sm mb-2">{block.title}</h4>
              <ul className="space-y-1">
                {block.items.map((it, i) => <li key={i} className="text-xs opacity-65 leading-relaxed">{it}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm max-w-2xl mx-auto p-6 sm:p-8">
          {done ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold">Abstract Submitted</h3>
              <p className="opacity-70 mt-2 text-sm">A confirmation email is on its way. The Scientific Committee will review your submission and notify you of the outcome.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <h3 className="text-xl font-bold">Submission Form</h3>
              <p className="text-xs opacity-60 -mt-3">{ABSTRACT_SUBMISSION.presenterRegistration.text}</p>

              <div>
                <Label className="v2-field-label">Submission Type</Label>
                <Select value={form.submissionType} onValueChange={set("submissionType")}>
                  <SelectTrigger className="v2-select-trigger"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUBMISSION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="v2-field-label">Title</Label>
                <Input className="v2-input" value={form.title} onChange={(e) => set("title")(e.target.value)} placeholder="Title of your abstract" />
              </div>

              <div>
                <Label className="v2-field-label">Authors</Label>
                <Input className="v2-input" value={form.authors} onChange={(e) => set("authors")(e.target.value)} placeholder="A. Author, B. Author, C. Author" />
              </div>

              <div>
                <Label className="v2-field-label">Affiliations (optional)</Label>
                <Input className="v2-input" value={form.affiliations} onChange={(e) => set("affiliations")(e.target.value)} placeholder="Institution(s)" />
              </div>

              <div>
                <Label className="v2-field-label">Topic</Label>
                <Select value={form.topic} onValueChange={set("topic")}>
                  <SelectTrigger className="v2-select-trigger"><SelectValue placeholder="Select a thematic topic" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {ALL_TOPICS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="v2-field-label">Abstract Text</Label>
                  {!!limit && (
                    <span className={overLimit ? "text-xs font-medium text-red-600" : "text-xs opacity-50"}>
                      {words}/{limit} words
                    </span>
                  )}
                </div>
                <Textarea
                  className="v2-textarea"
                  rows={7}
                  value={form.abstractText}
                  onChange={(e) => set("abstractText")(e.target.value)}
                  placeholder={form.submissionType === "ORAL_POSTER" ? "Introduction, Methods, Results, Conclusion" : "Your abstract text"}
                />
              </div>

              {form.submissionType === "SYMPOSIUM_WORKSHOP" && (
                <div>
                  <Label className="v2-field-label">Supporting File (optional — PDF or PPTX, max 10MB)</Label>
                  {file ? (
                    <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: "#EFEFF3" }}>
                      <span className="flex items-center gap-2 text-sm truncate">
                        <FileText className="h-4 w-4 flex-none" style={{ color: "#4B2FE5" }} /> {file.name}
                      </span>
                      <button type="button" onClick={() => setFile(null)} className="opacity-50 hover:opacity-80">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/10 py-4 text-sm opacity-60 cursor-pointer hover:opacity-90">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploading ? "Uploading..." : "Click to upload"}
                      <input type="file" accept=".pdf,.pptx" className="hidden" disabled={uploading} onChange={handleFileSelect} />
                    </label>
                  )}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-black/5">
                <div>
                  <Label className="v2-field-label">Presenting Author Name</Label>
                  <Input className="v2-input" value={form.presentingAuthorName} onChange={(e) => set("presentingAuthorName")(e.target.value)} />
                </div>
                <div>
                  <Label className="v2-field-label">Presenting Author Email</Label>
                  <Input className="v2-input" type="email" value={form.presentingAuthorEmail} onChange={(e) => set("presentingAuthorEmail")(e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="v2-field-label">Presenting Author Phone (optional)</Label>
                <Input className="v2-input" value={form.presentingAuthorPhone} onChange={(e) => set("presentingAuthorPhone")(e.target.value)} />
              </div>

              <div className="flex justify-end pt-1">
                <Button size="lg" className="h-12 px-10" disabled={!canSubmit || submitting} onClick={handleSubmit}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Abstract"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section tint>
        <SectionTitle title={ABSTRACT_SUBMISSION.oralGuidelines.title} />
        <ul className="space-y-2 mb-10">
          {ABSTRACT_SUBMISSION.oralGuidelines.items.map((g, i) => (
            <li key={i} className="text-sm opacity-75 pl-4 relative before:content-['•'] before:absolute before:left-0">{g}</li>
          ))}
        </ul>

        <SectionTitle title={ABSTRACT_SUBMISSION.posterGuidelines.title} />
        <div className="grid sm:grid-cols-3 gap-4">
          {[ABSTRACT_SUBMISSION.posterGuidelines.technical, ABSTRACT_SUBMISSION.posterGuidelines.layout, ABSTRACT_SUBMISSION.posterGuidelines.onSite].map((block) => (
            <div key={block.title} className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
              <h4 className="font-bold text-sm mb-2">{block.title}</h4>
              <ul className="space-y-1">
                {block.items.map((it, i) => <li key={i} className="text-xs opacity-65 leading-relaxed">{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionTitle title={ABSTRACT_SUBMISSION.symposiaGuidelines.title} />
        <ul className="space-y-2 mb-10">
          {ABSTRACT_SUBMISSION.symposiaGuidelines.items.map((g, i) => (
            <li key={i} className="text-sm opacity-75 pl-4 relative before:content-['•'] before:absolute before:left-0">{g}</li>
          ))}
        </ul>

        <SectionTitle title={ABSTRACT_SUBMISSION.awards.title} />
        <ul className="space-y-2">
          {ABSTRACT_SUBMISSION.awards.items.map((g, i) => (
            <li key={i} className="text-sm opacity-75 pl-4 relative before:content-['•'] before:absolute before:left-0">{g}</li>
          ))}
        </ul>
      </Section>
    </>
  );
}
