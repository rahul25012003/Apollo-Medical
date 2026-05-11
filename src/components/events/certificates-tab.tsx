"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Award,
  Upload,
  Eye,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  X,
  Plus,
  Trash2,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface CategoryTemplate {
  templateImage?: string;
  nameY: number;
  fontSize: number;
  fontColor: string;
}

interface Category {
  name: string;
  count: number;
  manual?: boolean; // added by admin, not from registrations
}

interface CertificatesTabProps {
  eventId: string;
}

export function CertificatesTab({ eventId }: CertificatesTabProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Record<string, CategoryTemplate>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    sent: number; failed: number; skipped: number; total: number;
    failures: { name: string; email: string; reason: string }[];
    skippedDetails: { name: string; email: string; category: string }[];
  } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [previewNames, setPreviewNames] = useState<Record<string, string>>({});

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/certificates/config`);
      const data = await res.json();
      if (data.success) {
        const fetched: Record<string, CategoryTemplate> = data.data.templates ?? {};
        const cats: Category[] = data.data.categories ?? [];

        setCategories(cats);
        setTemplates((prev) => {
          const merged: Record<string, CategoryTemplate> = { ...prev };
          cats.forEach((cat: Category) => {
            if (!merged[cat.name]) {
              merged[cat.name] = fetched[cat.name] ?? { nameY: 50, fontSize: 36, fontColor: "#000000" };
            } else if (fetched[cat.name]) {
              merged[cat.name] = { ...merged[cat.name], ...fetched[cat.name] };
            }
          });
          return merged;
        });
      }
    } catch {
      toast.error("Failed to load certificate config");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const updateTemplate = (category: string, field: keyof CategoryTemplate, value: unknown) => {
    setTemplates((prev) => ({
      ...prev,
      [category]: { ...prev[category], [field]: value },
    }));
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (name.length > 50) { toast.error("Category name must be 50 characters or less"); return; }
    if (!/^[a-zA-Z0-9 \-_]+$/.test(name)) { toast.error("Only letters, numbers, spaces, hyphens and underscores allowed"); return; }
    if (categories.find((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error("This category already exists");
      return;
    }
    setCategories((prev) => [...prev, { name, count: 0, manual: true }]);
    setTemplates((prev) => ({
      ...prev,
      [name]: { nameY: 50, fontSize: 36, fontColor: "#000000" },
    }));
    setNewCategoryName("");
    setAddingCategory(false);
    toast.success(`Category "${name}" added`);
  };

  const handleRemoveCategory = (name: string) => {
    setCategories((prev) => prev.filter((c) => c.name !== name));
    setTemplates((prev) => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const handleImageUpload = async (category: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "certificates");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        updateTemplate(category, "templateImage", data.data.url);
        toast.success("Template uploaded — adjust name position and click Save");
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    }
  };

  const handleSaveAll = async (silent = false): Promise<boolean> => {
    if (!silent) setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/certificates/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templates }),
      });
      const data = await res.json();
      if (data.success) {
        if (!silent) toast.success("Settings saved");
        return true;
      } else {
        toast.error(data.error || "Save failed");
        return false;
      }
    } catch {
      toast.error("Save failed");
      return false;
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const handlePreview = async (category: string) => {
    const tpl = templates[category];
    if (!tpl?.templateImage) { toast.error("Upload a template image first"); return; }
    const sampleName = previewNames[category]?.trim();
    if (!sampleName) { toast.error("Enter a name in the preview field first"); return; }
    const saved = await handleSaveAll(true);
    if (!saved) return;
    try {
      const res = await fetch(`/api/events/${eventId}/certificates/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, sampleName }),
      });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Preview failed"); return; }
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), "_blank");
    } catch {
      toast.error("Preview failed");
    }
  };

  const handleSendAll = async (filterCategories?: string[]) => {
    setSending(true);
    setSendResult(null);
    try {
      const saved = await handleSaveAll(true); // silent save before send
      if (!saved) { setSending(false); return; }
      const res = await fetch(`/api/events/${eventId}/certificates/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: filterCategories }),
      });
      const data = await res.json();
      if (!data.success && data.error) {
        toast.error(data.error);
        return;
      }
      if (data.success) {
        setSendResult({
          sent: data.sent,
          failed: data.failed,
          skipped: data.skipped,
          total: data.total,
          failures: data.failures ?? [],
          skippedDetails: data.skippedDetails ?? [],
        });
        if (data.sent > 0) toast.success(`${data.sent} certificate${data.sent > 1 ? "s" : ""} sent successfully`);
        else toast.warning("No certificates sent — check templates are uploaded and registrations exist");
      } else {
        toast.error(data.error || "Send failed");
      }
    } catch {
      toast.error("Send failed");
    } finally {
      setSending(false);
    }
  };

  const readyCategories = categories.filter((c) => templates[c.name]?.templateImage);
  const totalRegistrations = categories.reduce((acc, c) => acc + c.count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── How it works ── */}
      <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4 space-y-2">
        <p className="text-sm font-semibold text-teal-800 flex items-center gap-1.5">
          <Info className="h-4 w-4" /> How certificate sending works
        </p>
        <ol className="text-xs text-teal-700 space-y-1 list-decimal list-inside">
          <li><strong>Add roles</strong> — Each attendee category (Faculty, Delegate, Student…) gets its own certificate design.</li>
          <li><strong>Upload template</strong> — Export your PowerPoint slide as a PNG image and upload it for each role.</li>
          <li><strong>Position the name</strong> — Use the slider to place the name at the right spot on the certificate.</li>
          <li><strong>Preview</strong> — Click &quot;Preview PDF&quot; to see a sample before sending.</li>
          <li><strong>Send</strong> — Click Send to email every registrant their personalised certificate as a PDF attachment.</li>
        </ol>
      </div>

      {/* ── Header actions ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{readyCategories.length}</span> of{" "}
          <span className="font-medium text-foreground">{categories.length}</span> roles ready ·{" "}
          <span className="font-medium text-foreground">{totalRegistrations}</span> registrants
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => handleSaveAll()} disabled={saving}>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Save All Settings
          </Button>
          <Button
            size="sm"
            onClick={() => handleSendAll()}
            disabled={sending || readyCategories.length === 0}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Send All Certificates
          </Button>
        </div>
      </div>

      {/* ── Send result banner ── */}
      {sendResult && (
        <div className={`rounded-lg border text-sm overflow-hidden ${
          sendResult.sent > 0 && sendResult.failed === 0
            ? "border-green-200 bg-green-50 text-green-800"
            : sendResult.sent === 0
            ? "border-red-200 bg-red-50 text-red-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}>
          <div className="flex items-start gap-3 p-3">
            {sendResult.sent > 0 && sendResult.failed === 0
              ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="font-semibold">
                {sendResult.sent > 0
                  ? `${sendResult.sent} certificate${sendResult.sent > 1 ? "s" : ""} sent successfully`
                  : "No certificates sent"}
              </p>
              <p className="text-xs mt-0.5 opacity-80">
                {sendResult.sent} sent · {sendResult.failed} failed · {sendResult.skipped} skipped · {sendResult.total} total
              </p>
            </div>
          </div>

          {/* Failure details */}
          {sendResult.failures.length > 0 && (
            <div className="border-t border-current/20 px-3 py-2 space-y-1">
              <p className="text-xs font-semibold">Failed — reason:</p>
              {sendResult.failures.map((f, i) => (
                <p key={i} className="text-xs">
                  <span className="font-medium">{f.name}</span> ({f.email}) — {f.reason}
                </p>
              ))}
            </div>
          )}

          {/* Skipped details */}
          {sendResult.skippedDetails.length > 0 && (
            <div className="border-t border-current/20 px-3 py-2 space-y-1">
              <p className="text-xs font-semibold">
                Skipped — no template uploaded for their category:
              </p>
              {sendResult.skippedDetails.map((s, i) => (
                <p key={i} className="text-xs">
                  <span className="font-medium">{s.name}</span> — category:{" "}
                  <span className="font-mono bg-current/10 px-1 rounded">
                    {s.category === "__no_category__" || !s.category ? "No Category" : s.category}
                  </span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Category cards ── */}
      {categories.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Award className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">No roles added yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
              Roles appear automatically from registrations. You can also add them manually below before registrations open.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {categories.map((cat) => {
          const tpl = templates[cat.name] ?? { nameY: 50, fontSize: 36, fontColor: "#000000" };
          const hasTemplate = !!tpl.templateImage;
          const isManual = cat.manual || cat.count === 0;
          const displayName = cat.name === "__no_category__" ? "No Category (unassigned)" : cat.name;

          return (
            <Card key={cat.name} className={`overflow-hidden transition-all ${hasTemplate ? "border-green-200" : "border-orange-200"}`}>
              {/* Top status bar */}
              <div className={`h-1 ${hasTemplate ? "bg-green-400" : "bg-orange-300"}`} />

              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">

                  {/* ── Image upload area ── */}
                  <div className="relative w-full sm:w-44 shrink-0 bg-muted/20 border-b sm:border-b-0 sm:border-r flex items-center justify-center min-h-[130px]">
                    {hasTemplate ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={tpl.templateImage}
                          alt={`${cat.name} certificate`}
                          className="w-full h-full object-contain max-h-[130px] p-1"
                        />
                        <button
                          onClick={() => updateTemplate(cat.name, "templateImage", undefined)}
                          className="absolute top-1.5 right-1.5 rounded-full bg-black/50 text-white p-0.5 hover:bg-black/70 transition-colors"
                          title="Remove template image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => fileInputRefs.current[cat.name]?.click()}
                        className="flex flex-col items-center gap-2 p-4 w-full h-full text-muted-foreground hover:text-teal-600 hover:bg-teal-50/50 transition-colors"
                      >
                        <ImageIcon className="h-7 w-7" />
                        <span className="text-xs font-semibold">Upload Template</span>
                        <span className="text-[10px] text-muted-foreground/70">PNG or JPG from PowerPoint</span>
                      </button>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                      ref={(el) => { fileInputRefs.current[cat.name] = el; }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(cat.name, file);
                        e.target.value = "";
                      }}
                    />
                  </div>

                  {/* ── Settings area ── */}
                  <div className="flex-1 p-4 space-y-3">

                    {/* Role header */}
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{displayName}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5">
                          {cat.count === 0 ? "No registrations yet" : `${cat.count} registrant${cat.count > 1 ? "s" : ""}`}
                        </Badge>
                        {hasTemplate ? (
                          <Badge className="text-[10px] px-1.5 bg-green-100 text-green-700 border-green-200 gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Ready to send
                          </Badge>
                        ) : (
                          <Badge className="text-[10px] px-1.5 bg-orange-100 text-orange-700 border-orange-200 gap-1">
                            <AlertCircle className="h-2.5 w-2.5" /> Template needed
                          </Badge>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {hasTemplate && (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                            onClick={() => fileInputRefs.current[cat.name]?.click()}>
                            <Upload className="h-3 w-3" /> Replace
                          </Button>
                        )}
                        <Button size="sm" className="h-7 text-xs gap-1 bg-teal-600 hover:bg-teal-700 text-white"
                          onClick={() => handleSendAll([cat.name])} disabled={sending || !hasTemplate}>
                          <Send className="h-3 w-3" />
                          {sending ? "Sending…" : `Send (${cat.count})`}
                        </Button>
                        {isManual && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveCategory(cat.name)} title="Remove this role">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Preview name input */}
                    {hasTemplate && (
                      <div className="flex items-center gap-2 pt-1 pb-1">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide shrink-0">
                          Preview name
                        </Label>
                        <Input
                          placeholder="Type a name first e.g. Dr. Shruthi Srivastava (required)"
                          value={previewNames[cat.name] ?? ""}
                          onChange={(e) =>
                            setPreviewNames((prev) => ({ ...prev, [cat.name]: e.target.value }))
                          }
                          className="h-7 text-xs flex-1"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 shrink-0"
                          onClick={() => handlePreview(cat.name)}
                        >
                          <Eye className="h-3 w-3" /> Preview PDF
                        </Button>
                      </div>
                    )}

                    {/* Name position + font settings */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          Name position (% from top)
                        </Label>
                        <div className="flex items-center gap-2">
                          <input type="range" min={0} max={100} step={1} value={tpl.nameY}
                            onChange={(e) => updateTemplate(cat.name, "nameY", parseInt(e.target.value))}
                            className="flex-1 h-1.5 accent-teal-600" />
                          <span className="text-xs font-mono w-9 text-right tabular-nums">{tpl.nameY}%</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/60">
                          Drag to move name up/down on the certificate
                        </p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Font size (pt)</Label>
                        <Input type="number" min={12} max={96} value={tpl.fontSize}
                          onChange={(e) => updateTemplate(cat.name, "fontSize", parseInt(e.target.value) || 36)}
                          className="h-8 text-sm" />
                        <p className="text-[10px] text-muted-foreground/60">Recommended: 32–48 pt</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Name colour</Label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={tpl.fontColor}
                            onChange={(e) => updateTemplate(cat.name, "fontColor", e.target.value)}
                            className="h-8 w-10 rounded border cursor-pointer p-0.5 shrink-0" />
                          <Input value={tpl.fontColor}
                            onChange={(e) => updateTemplate(cat.name, "fontColor", e.target.value)}
                            className="h-8 text-sm font-mono" maxLength={7} />
                        </div>
                        <p className="text-[10px] text-muted-foreground/60">Click colour box to pick</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Add category ── */}
      <Card className="border-dashed border-2">
        <CardContent className="py-4 px-4">
          {addingCategory ? (
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                placeholder="e.g. Faculty, Delegate, VIP, Organizer…"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); if (e.key === "Escape") { setAddingCategory(false); setNewCategoryName(""); } }}
                className="h-8 text-sm flex-1"
              />
              <Button size="sm" onClick={handleAddCategory} disabled={!newCategoryName.trim()}
                className="bg-teal-600 hover:bg-teal-700 text-white h-8">
                Add
              </Button>
              <Button size="sm" variant="ghost" className="h-8"
                onClick={() => { setAddingCategory(false); setNewCategoryName(""); }}>
                Cancel
              </Button>
            </div>
          ) : (
            <button onClick={() => setAddingCategory(true)}
              className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-teal-600 transition-colors py-1">
              <Plus className="h-4 w-4" />
              Add Role / Category manually
              <span className="text-xs text-muted-foreground/60">(e.g. before registrations open)</span>
            </button>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
