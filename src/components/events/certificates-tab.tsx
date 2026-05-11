"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Award, Upload, Eye, Send, Loader2, CheckCircle2, AlertCircle,
  ImageIcon, X, Plus, Trash2, Info, Users, UserCheck, Edit2, Search,
} from "lucide-react";
import { toast } from "sonner";

const CERT_FONTS = [
  { label: "Script — like Alex Brush", value: "Times-Italic"      },
  { label: "Bold Script",              value: "Times-BoldItalic"  },
  { label: "Bold Serif",               value: "Times-Bold"        },
  { label: "Regular Serif",            value: "Times-Roman"       },
  { label: "Bold Sans",                value: "Helvetica-Bold"    },
  { label: "Regular Sans",             value: "Helvetica"         },
];

interface CategoryTemplate {
  templateImage?: string;
  nameY: number;
  fontSize: number;
  fontColor: string;
  fontFamily: string;
}

interface Category {
  name: string;
  count: number;
  manual?: boolean;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  category: string | null;
  alreadySent: boolean;
  issuedAt: string | null;
}

interface CertificatesTabProps {
  eventId: string;
}

export function CertificatesTab({ eventId }: CertificatesTabProps) {
  // ── Config state ──
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Record<string, CategoryTemplate>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewNames, setPreviewNames] = useState<Record<string, string>>({});
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Bulk send result ──
  const [sendResult, setSendResult] = useState<{
    sent: number; failed: number; skipped: number; total: number;
    failures: { name: string; email: string; reason: string }[];
    skippedDetails: { name: string; email: string; category: string }[];
  } | null>(null);

  // ── Option 1: Review & Send by role ──
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewCategory, setReviewCategory] = useState("");
  const [reviewParticipants, setReviewParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reviewSending, setReviewSending] = useState(false);
  const [reviewResult, setReviewResult] = useState<{ sent: number; failed: number } | null>(null);

  // ── Option 2: Send to individual ──
  const [indivOpen, setIndivOpen] = useState(false);
  const [indivSearch, setIndivSearch] = useState("");
  const [indivResults, setIndivResults] = useState<Participant[]>([]);
  const [indivSearching, setIndivSearching] = useState(false);
  const [indivSelected, setIndivSelected] = useState<Participant | null>(null);
  const [indivName, setIndivName] = useState("");
  const [indivCategory, setIndivCategory] = useState("");
  const [indivSending, setIndivSending] = useState(false);
  const [indivPreviewing, setIndivPreviewing] = useState(false);

  // ── Load config ──
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
              merged[cat.name] = fetched[cat.name] ?? { nameY: 50, fontSize: 36, fontColor: "#000000", fontFamily: "Times-Italic" };
            } else if (fetched[cat.name]) {
              merged[cat.name] = { ...merged[cat.name], ...fetched[cat.name] };
            }
          });
          return merged;
        });
      }
    } catch { toast.error("Failed to load certificate config"); }
    finally { setLoading(false); }
  }, [eventId]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const updateTemplate = (category: string, field: keyof CategoryTemplate, value: unknown) => {
    setTemplates((prev) => ({ ...prev, [category]: { ...prev[category], [field]: value } }));
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (name.length > 50) { toast.error("Max 50 characters"); return; }
    if (!/^[a-zA-Z0-9 \-_]+$/.test(name)) { toast.error("Only letters, numbers, spaces, hyphens, underscores"); return; }
    if (categories.find((c) => c.name.toLowerCase() === name.toLowerCase())) { toast.error("Category already exists"); return; }
    setCategories((prev) => [...prev, { name, count: 0, manual: true }]);
    setTemplates((prev) => ({ ...prev, [name]: { nameY: 50, fontSize: 36, fontColor: "#000000", fontFamily: "Times-Italic" } }));
    setNewCategoryName("");
    setAddingCategory(false);
    toast.success(`"${name}" added`);
  };

  const handleRemoveCategory = (name: string) => {
    setCategories((prev) => prev.filter((c) => c.name !== name));
    setTemplates((prev) => { const copy = { ...prev }; delete copy[name]; return copy; });
  };

  const handleImageUpload = async (category: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "certificates");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) { updateTemplate(category, "templateImage", data.data.url); toast.success("Template uploaded — adjust position and Save"); }
      else toast.error(data.error || "Upload failed");
    } catch { toast.error("Upload failed"); }
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
      if (data.success) { if (!silent) toast.success("Settings saved"); return true; }
      toast.error(data.error || "Save failed"); return false;
    } catch { toast.error("Save failed"); return false; }
    finally { if (!silent) setSaving(false); }
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
      window.open(URL.createObjectURL(await res.blob()), "_blank");
    } catch { toast.error("Preview failed"); }
  };

  // ── Option 1: Open review dialog for a role ──
  const openReview = async (category: string) => {
    const tpl = templates[category];
    if (!tpl?.templateImage) { toast.error("Upload a template image for this role first"); return; }
    setReviewCategory(category);
    setNameOverrides({});
    setSelected(new Set());
    setReviewResult(null);
    setReviewOpen(true);
    setLoadingParticipants(true);
    try {
      const res = await fetch(`/api/events/${eventId}/certificates/participants?category=${encodeURIComponent(category)}`);
      const data = await res.json();
      if (data.success) {
        setReviewParticipants(data.data.participants);
        // Pre-select all who haven't received yet
        const notSent = data.data.participants.filter((p: Participant) => !p.alreadySent);
        setSelected(new Set(notSent.map((p: Participant) => p.id)));
      } else toast.error("Failed to load participants");
    } catch { toast.error("Failed to load participants"); }
    finally { setLoadingParticipants(false); }
  };

  // ── Option 1: Send selected participants ──
  const handleReviewSend = async () => {
    if (selected.size === 0) { toast.error("Select at least one participant"); return; }
    const saved = await handleSaveAll(true);
    if (!saved) return;
    setReviewSending(true);
    setReviewResult(null);
    try {
      const res = await fetch(`/api/events/${eventId}/certificates/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: [reviewCategory],
          nameOverrides,
          registrationIds: Array.from(selected),
        }),
      });
      const data = await res.json();
      if (!data.success && data.error) { toast.error(data.error); return; }
      setReviewResult({ sent: data.sent, failed: data.failed });
      if (data.sent > 0) toast.success(`${data.sent} certificate${data.sent > 1 ? "s" : ""} sent!`);
      // Refresh participant list
      const res2 = await fetch(`/api/events/${eventId}/certificates/participants?category=${encodeURIComponent(reviewCategory)}`);
      const data2 = await res2.json();
      if (data2.success) setReviewParticipants(data2.data.participants);
    } catch { toast.error("Send failed"); }
    finally { setReviewSending(false); }
  };

  // ── Option 2: Search participants ──
  const handleIndivSearch = async (q: string) => {
    setIndivSearch(q);
    if (!q.trim()) { setIndivResults([]); return; }
    setIndivSearching(true);
    try {
      const res = await fetch(`/api/events/${eventId}/certificates/participants?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success) setIndivResults(data.data.participants.slice(0, 8));
    } catch { /* silent */ }
    finally { setIndivSearching(false); }
  };

  const handleIndivSelect = (p: Participant) => {
    setIndivSelected(p);
    setIndivName(p.name);
    setIndivCategory(p.category ?? categories.find((c) => templates[c.name]?.templateImage) ?.name ?? "");
    setIndivResults([]);
    setIndivSearch(p.name);
  };

  // ── Option 2: Send to individual ──
  const handleIndivSend = async () => {
    if (!indivSelected) { toast.error("Select a participant first"); return; }
    if (!indivCategory) { toast.error("Select which template to use"); return; }
    const saved = await handleSaveAll(true);
    if (!saved) return;
    setIndivSending(true);
    try {
      const res = await fetch(`/api/events/${eventId}/certificates/send-one`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: indivSelected.id, nameOverride: indivName, templateCategory: indivCategory }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Certificate sent to ${data.email}`);
        setIndivOpen(false);
        setIndivSelected(null);
        setIndivSearch("");
        setIndivName("");
        setIndivCategory("");
      } else {
        toast.error(data.error || "Send failed");
      }
    } catch { toast.error("Send failed"); }
    finally { setIndivSending(false); }
  };

  // ── Option 2: Preview individual certificate ──
  const handleIndivPreview = async () => {
    if (!indivSelected || !indivCategory || !indivName.trim()) { toast.error("Select participant, template and name first"); return; }
    const saved = await handleSaveAll(true);
    if (!saved) return;
    setIndivPreviewing(true);
    try {
      const res = await fetch(`/api/events/${eventId}/certificates/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: indivCategory, sampleName: indivName.trim() }),
      });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Preview failed"); return; }
      window.open(URL.createObjectURL(await res.blob()), "_blank");
    } catch { toast.error("Preview failed"); }
    finally { setIndivPreviewing(false); }
  };

  const readyCategories = categories.filter((c) => templates[c.name]?.templateImage);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── How it works ── */}
      <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4 space-y-2">
        <p className="text-sm font-semibold text-teal-800 flex items-center gap-1.5">
          <Info className="h-4 w-4" /> How to send certificates
        </p>
        <ol className="text-xs text-teal-700 space-y-1 list-decimal list-inside">
          <li>Upload your certificate PNG (exported from PowerPoint with name area blank) for each role</li>
          <li>Set the name position slider + font style → Preview PDF to verify</li>
          <li><strong>Option A</strong> — Click <strong>Review &amp; Send</strong> on a role: review all participants, edit names if needed, send to all or selected ones</li>
          <li><strong>Option B</strong> — Click <strong>Send to Individual</strong>: search any participant, edit their name, send just to them</li>
        </ol>
      </div>

      {/* ── Top actions ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{readyCategories.length}</span> of{" "}
          <span className="font-semibold text-foreground">{categories.length}</span> roles ready
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => handleSaveAll()} disabled={saving}>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Save Settings
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setIndivOpen(true); setIndivSearch(""); setIndivResults([]); setIndivSelected(null); }}
            className="gap-1.5">
            <UserCheck className="h-3.5 w-3.5" /> Send to Individual
          </Button>
        </div>
      </div>

      {/* ── Send result ── */}
      {sendResult && (
        <div className={`rounded-lg border text-sm overflow-hidden ${sendResult.sent > 0 && sendResult.failed === 0 ? "border-green-200 bg-green-50 text-green-800" : sendResult.sent === 0 ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          <div className="flex items-start gap-3 p-3">
            {sendResult.sent > 0 && sendResult.failed === 0 ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
            <div>
              <p className="font-semibold">{sendResult.sent > 0 ? `${sendResult.sent} certificate${sendResult.sent > 1 ? "s" : ""} sent` : "No certificates sent"}</p>
              <p className="text-xs mt-0.5 opacity-80">{sendResult.sent} sent · {sendResult.failed} failed · {sendResult.skipped} skipped · {sendResult.total} total</p>
            </div>
          </div>
          {sendResult.failures.length > 0 && (
            <div className="border-t border-current/20 px-3 py-2 space-y-1">
              <p className="text-xs font-semibold">Failed:</p>
              {sendResult.failures.map((f, i) => <p key={i} className="text-xs"><span className="font-medium">{f.name}</span> — {f.reason}</p>)}
            </div>
          )}
          {sendResult.skippedDetails.length > 0 && (
            <div className="border-t border-current/20 px-3 py-2 space-y-1">
              <p className="text-xs font-semibold">Skipped (no template for their role):</p>
              {sendResult.skippedDetails.map((s, i) => <p key={i} className="text-xs"><span className="font-medium">{s.name}</span> — role: <span className="font-mono bg-current/10 px-1 rounded">{s.category || "No Category"}</span></p>)}
            </div>
          )}
        </div>
      )}

      {/* ── Category cards ── */}
      {categories.length === 0 && (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Award className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="font-medium text-muted-foreground">No roles added yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">Roles appear automatically from registrations, or add manually below.</p>
        </CardContent></Card>
      )}

      <div className="grid gap-4">
        {categories.map((cat) => {
          const tpl = templates[cat.name] ?? { nameY: 50, fontSize: 36, fontColor: "#000000", fontFamily: "Times-Italic" };
          const hasTemplate = !!tpl.templateImage;
          const isManual = cat.manual || cat.count === 0;
          const displayName = cat.name === "__no_category__" ? "No Category (unassigned)" : cat.name;

          return (
            <Card key={cat.name} className={`overflow-hidden transition-all ${hasTemplate ? "border-green-200" : "border-orange-200"}`}>
              <div className={`h-1 ${hasTemplate ? "bg-green-400" : "bg-orange-300"}`} />
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Image upload */}
                  <div className="relative w-full sm:w-44 shrink-0 bg-muted/20 border-b sm:border-b-0 sm:border-r flex items-center justify-center min-h-[130px]">
                    {hasTemplate ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={tpl.templateImage} alt={displayName} className="w-full h-full object-contain max-h-[130px] p-1" />
                        <button onClick={() => updateTemplate(cat.name, "templateImage", undefined)}
                          className="absolute top-1.5 right-1.5 rounded-full bg-black/50 text-white p-0.5 hover:bg-black/70">
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => fileInputRefs.current[cat.name]?.click()}
                        className="flex flex-col items-center gap-2 p-4 w-full h-full text-muted-foreground hover:text-teal-600 hover:bg-teal-50/50 transition-colors">
                        <ImageIcon className="h-7 w-7" />
                        <span className="text-xs font-semibold">Upload Template</span>
                        <span className="text-[10px] text-muted-foreground/70">PNG or JPG</span>
                      </button>
                    )}
                    <input type="file" accept="image/png,image/jpeg,image/jpg" className="hidden"
                      ref={(el) => { fileInputRefs.current[cat.name] = el; }}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(cat.name, f); e.target.value = ""; }} />
                  </div>

                  {/* Settings */}
                  <div className="flex-1 p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{displayName}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5">
                          {cat.count === 0 ? "No registrations yet" : `${cat.count} registrant${cat.count > 1 ? "s" : ""}`}
                        </Badge>
                        {hasTemplate
                          ? <Badge className="text-[10px] px-1.5 bg-green-100 text-green-700 border-green-200 gap-1"><CheckCircle2 className="h-2.5 w-2.5" /> Ready</Badge>
                          : <Badge className="text-[10px] px-1.5 bg-orange-100 text-orange-700 border-orange-200 gap-1"><AlertCircle className="h-2.5 w-2.5" /> Template needed</Badge>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {hasTemplate && (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => fileInputRefs.current[cat.name]?.click()}>
                            <Upload className="h-3 w-3" /> Replace
                          </Button>
                        )}
                        {isManual && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveCategory(cat.name)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Preview name + preview button */}
                    {hasTemplate && (
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide shrink-0">Preview name</Label>
                        <Input placeholder="Type a name (required to preview)" value={previewNames[cat.name] ?? ""}
                          onChange={(e) => setPreviewNames((p) => ({ ...p, [cat.name]: e.target.value }))}
                          className="h-7 text-xs flex-1" />
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 shrink-0" onClick={() => handlePreview(cat.name)}>
                          <Eye className="h-3 w-3" /> Preview
                        </Button>
                      </div>
                    )}

                    {/* Settings grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Name position (% top)</Label>
                        <div className="flex items-center gap-2">
                          <input type="range" min={0} max={100} step={1} value={tpl.nameY}
                            onChange={(e) => updateTemplate(cat.name, "nameY", parseInt(e.target.value))}
                            className="flex-1 h-1.5 accent-teal-600" />
                          <span className="text-xs font-mono w-9 text-right">{tpl.nameY}%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Font size (pt)</Label>
                        <Input type="number" min={12} max={96} value={tpl.fontSize}
                          onChange={(e) => updateTemplate(cat.name, "fontSize", parseInt(e.target.value) || 36)}
                          className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Font style</Label>
                        <select value={tpl.fontFamily || "Times-Italic"}
                          onChange={(e) => updateTemplate(cat.name, "fontFamily", e.target.value)}
                          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs">
                          {CERT_FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
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
                      </div>
                    </div>

                    {/* Option 1: Review & Send button */}
                    <div className="pt-1">
                      <Button
                        onClick={() => openReview(cat.name)}
                        disabled={!hasTemplate || cat.count === 0}
                        className="gap-2 bg-teal-600 hover:bg-teal-700 text-white h-8 text-xs"
                        size="sm"
                      >
                        <Users className="h-3.5 w-3.5" />
                        Review &amp; Send ({cat.count})
                      </Button>
                      {!hasTemplate && <span className="ml-2 text-[10px] text-muted-foreground">Upload template first</span>}
                      {hasTemplate && cat.count === 0 && <span className="ml-2 text-[10px] text-muted-foreground">No confirmed registrants yet</span>}
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
              <Input autoFocus placeholder="e.g. Faculty, Delegate, VIP…" value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); if (e.key === "Escape") { setAddingCategory(false); setNewCategoryName(""); } }}
                className="h-8 text-sm flex-1" />
              <Button size="sm" onClick={handleAddCategory} disabled={!newCategoryName.trim()} className="bg-teal-600 hover:bg-teal-700 text-white h-8">Add</Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => { setAddingCategory(false); setNewCategoryName(""); }}>Cancel</Button>
            </div>
          ) : (
            <button onClick={() => setAddingCategory(true)}
              className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-teal-600 transition-colors py-1">
              <Plus className="h-4 w-4" /> Add Role / Category manually
              <span className="text-xs text-muted-foreground/60">(before registrations open)</span>
            </button>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════
          OPTION 1: Review & Send Dialog
      ══════════════════════════════════════ */}
      <Dialog open={reviewOpen} onOpenChange={(o) => { if (!reviewSending) setReviewOpen(o); }}>
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-600" />
              Review &amp; Send — <span className="text-teal-700">{reviewCategory === "__no_category__" ? "No Category" : reviewCategory}</span>
            </DialogTitle>
            <DialogDescription>
              ✏ Click any name to edit it — only the certificate changes, not the registration.
              Tick the checkbox to include a person. Already-sent ones can be re-sent with a corrected name.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 py-2">
            {loadingParticipants ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : reviewParticipants.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No confirmed registrants in this role</div>
            ) : (
              <>
                {/* Quick stats + select controls */}
                <div className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-semibold text-teal-700">{selected.size}</span>
                    <span className="text-muted-foreground">selected of {reviewParticipants.length}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-green-700 text-xs">{reviewParticipants.filter(p => p.alreadySent).length} already sent</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setSelected(new Set(reviewParticipants.map(p => p.id)))}
                      className="text-xs text-teal-600 hover:underline font-medium">Select all</button>
                    <button onClick={() => {
                      const notSent = reviewParticipants.filter(p => !p.alreadySent).map(p => p.id);
                      setSelected(new Set(notSent));
                    }} className="text-xs text-muted-foreground hover:underline">Unsent only</button>
                    <button onClick={() => setSelected(new Set())} className="text-xs text-muted-foreground hover:underline">None</button>
                  </div>
                </div>

                {/* Participant rows */}
                <div className="border rounded-lg overflow-hidden divide-y">
                  {reviewParticipants.map((p) => {
                    const isEdited = nameOverrides[p.id] && nameOverrides[p.id] !== p.name;
                    return (
                      <div key={p.id} className={`flex items-start gap-3 px-3 py-2.5 transition-colors ${selected.has(p.id) ? "bg-teal-50/50" : "hover:bg-muted/20"}`}>
                        {/* Checkbox */}
                        <input type="checkbox" checked={selected.has(p.id)}
                          onChange={(e) => {
                            const s = new Set(selected);
                            e.target.checked ? s.add(p.id) : s.delete(p.id);
                            setSelected(s);
                          }}
                          className="mt-2.5 accent-teal-600 shrink-0" />

                        {/* Name (editable) + email */}
                        <div className="flex-1 min-w-0">
                          <Input
                            value={nameOverrides[p.id] ?? p.name}
                            onChange={(e) => setNameOverrides(prev => ({ ...prev, [p.id]: e.target.value }))}
                            className={`h-8 text-sm font-medium border-0 px-0 bg-transparent focus:bg-white focus:border focus:border-teal-300 focus:px-2 transition-all rounded ${isEdited ? "text-amber-700" : ""}`}
                          />
                          {isEdited && (
                            <p className="text-[10px] text-amber-600 flex items-center gap-1">
                              <Edit2 className="h-2.5 w-2.5" /> Original: {p.name}
                              <button onClick={() => setNameOverrides(prev => { const c = {...prev}; delete c[p.id]; return c; })}
                                className="text-muted-foreground hover:text-foreground ml-1 underline">Reset</button>
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">{p.email}</p>
                        </div>

                        {/* Status badge */}
                        <div className="shrink-0 pt-1">
                          {p.alreadySent
                            ? <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 gap-1">
                                <CheckCircle2 className="h-2.5 w-2.5" /> Sent
                                {selected.has(p.id) && <span className="text-amber-600 ml-0.5">· Resend</span>}
                              </Badge>
                            : <Badge variant="secondary" className="text-[10px]">Not sent</Badge>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {reviewResult && (
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 shrink-0 ${reviewResult.failed === 0 ? "bg-green-50 border border-green-200 text-green-800" : "bg-amber-50 border border-amber-200 text-amber-800"}`}>
              {reviewResult.failed === 0 ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span><strong>{reviewResult.sent}</strong> certificate{reviewResult.sent !== 1 ? "s" : ""} sent{reviewResult.failed > 0 ? `, ${reviewResult.failed} failed` : " successfully ✓"}</span>
            </div>
          )}

          <DialogFooter className="gap-2 shrink-0 pt-2 border-t">
            <Button variant="outline" onClick={() => setReviewOpen(false)} disabled={reviewSending}>Close</Button>
            <Button onClick={handleReviewSend} disabled={reviewSending || selected.size === 0 || loadingParticipants}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
              {reviewSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {reviewSending ? "Sending…" : `Send to ${selected.size} participant${selected.size !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════
          OPTION 2: Send to Individual Dialog
      ══════════════════════════════════════ */}
      <Dialog open={indivOpen} onOpenChange={(o) => { if (!indivSending && !indivPreviewing) setIndivOpen(o); }}>
        <DialogContent className="w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-teal-600" />
              Send to Individual
            </DialogTitle>
            <DialogDescription>
              Search a participant, edit their name if needed, preview the certificate, then send.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">

            {/* Step 1: Search */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center font-bold shrink-0">1</span>
                <Label className="text-sm font-semibold">Search &amp; select participant</Label>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Type name or email to search…" value={indivSearch}
                  onChange={(e) => handleIndivSearch(e.target.value)}
                  className="pl-9" />
                {indivSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              {indivResults.length > 0 && !indivSelected && (
                <div className="border rounded-lg bg-background shadow-md overflow-hidden">
                  {indivResults.map((p) => (
                    <button key={p.id} onClick={() => handleIndivSelect(p)}
                      className="w-full text-left px-4 py-3 hover:bg-teal-50 transition-colors border-b last:border-0 group">
                      <p className="text-sm font-semibold group-hover:text-teal-700">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.email}
                        {p.category && <span className="ml-2 px-1.5 py-0.5 bg-muted rounded text-[10px]">{p.category}</span>}
                        {p.alreadySent && <span className="ml-2 text-green-600 text-[10px]">✓ cert sent</span>}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              {indivSelected && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-teal-50 border border-teal-200">
                  <div>
                    <p className="text-sm font-semibold text-teal-800">{indivSelected.name}</p>
                    <p className="text-xs text-teal-600">{indivSelected.email}</p>
                  </div>
                  <button onClick={() => { setIndivSelected(null); setIndivSearch(""); setIndivName(""); setIndivCategory(""); }}
                    className="text-muted-foreground hover:text-foreground p-1">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {indivSelected && (
              <>
                {/* Step 2: Edit name */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center font-bold shrink-0">2</span>
                    <Label className="text-sm font-semibold">Name to print on certificate</Label>
                  </div>
                  <Input value={indivName} onChange={(e) => setIndivName(e.target.value)}
                    placeholder="Edit if needed (e.g. add Dr. / Prof.)" className="text-sm" />
                  {indivName.trim() && indivName !== indivSelected.name && (
                    <p className="text-[10px] text-amber-600 flex items-center gap-1">
                      <Edit2 className="h-2.5 w-2.5" /> Changed from original: &ldquo;{indivSelected.name}&rdquo;
                    </p>
                  )}
                  {indivSelected.alreadySent && (
                    <p className="text-[10px] text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-2.5 w-2.5" /> This person already received a certificate. Sending again will resend.
                    </p>
                  )}
                </div>

                {/* Step 3: Template */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center font-bold shrink-0">3</span>
                    <Label className="text-sm font-semibold">Certificate template</Label>
                  </div>
                  <select value={indivCategory} onChange={(e) => setIndivCategory(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">— Select which template to use —</option>
                    {categories.filter((c) => templates[c.name]?.templateImage).map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name === "__no_category__" ? "No Category" : c.name}
                      </option>
                    ))}
                  </select>
                  {/* Template thumbnail */}
                  {indivCategory && templates[indivCategory]?.templateImage && (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={templates[indivCategory].templateImage} alt="template"
                        className="h-14 w-24 object-contain rounded border bg-white" />
                      <p className="text-xs text-muted-foreground">This design will be used for the certificate</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 border-t pt-3">
            <Button variant="outline" onClick={() => setIndivOpen(false)} disabled={indivSending || indivPreviewing}>Cancel</Button>
            {indivSelected && indivCategory && indivName.trim() && (
              <Button variant="outline" onClick={handleIndivPreview} disabled={indivPreviewing || indivSending}
                className="gap-1.5">
                {indivPreviewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                Preview PDF
              </Button>
            )}
            <Button onClick={handleIndivSend}
              disabled={indivSending || indivPreviewing || !indivSelected || !indivCategory || !indivName.trim()}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
              {indivSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {indivSending ? "Sending…" : "Send Certificate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
