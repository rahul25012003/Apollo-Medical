"use client";

import { useUIStore } from "@/store";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  AlertTriangle, MessageSquare, Plus, Trash2, Edit, ToggleLeft, ToggleRight,
  Megaphone, BarChart2, HelpCircle, ClipboardList, Loader2, BarChart,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { eventsService, EventEngagement, CreateEngagementData } from "@/services/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  POLL:         { label: "Poll",         icon: BarChart2,    color: "text-blue-600",   bg: "bg-blue-100 dark:bg-blue-900/30"   },
  QA:           { label: "Q&A",          icon: HelpCircle,   color: "text-violet-600", bg: "bg-violet-100 dark:bg-violet-900/30" },
  FEEDBACK:     { label: "Feedback",     icon: ClipboardList, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30"  },
  ANNOUNCEMENT: { label: "Announcement", icon: Megaphone,    color: "text-teal-600",   bg: "bg-teal-100 dark:bg-teal-900/30"   },
};

interface PollOption { id: string; label: string }

function PollOptionsEditor({
  options, onChange,
}: { options: PollOption[]; onChange: (opts: PollOption[]) => void }) {
  const add = () => onChange([...options, { id: String(options.length + 1), label: "" }]);
  const remove = (idx: number) => onChange(options.filter((_, i) => i !== idx));
  const update = (idx: number, label: string) => {
    const next = [...options];
    next[idx] = { ...next[idx], label };
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {options.map((opt, i) => (
        <div key={opt.id} className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
            {String.fromCharCode(65 + i)}
          </div>
          <Input
            value={opt.label}
            onChange={(e) => update(i, e.target.value)}
            placeholder={`Option ${String.fromCharCode(65 + i)}`}
            className="flex-1"
          />
          {options.length > 2 && (
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive" onClick={() => remove(i)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ))}
      {options.length < 6 && (
        <Button type="button" variant="outline" size="sm" onClick={add} className="w-full">
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Option
        </Button>
      )}
    </div>
  );
}

function EngagementDialog({
  open, onClose, onSave, eventId, editing,
}: {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  eventId: string;
  editing: EventEngagement | null;
}) {
  const [form, setForm] = useState({ title: "", type: "ANNOUNCEMENT", description: "", isActive: false });
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: "a", label: "" }, { id: "b", label: "" },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({ title: editing.title, type: editing.type, description: editing.description || "", isActive: editing.isActive });
      const content = editing.content as any;
      if (editing.type === "POLL" && content?.options) {
        setPollOptions(content.options);
      } else {
        setPollOptions([{ id: "a", label: "" }, { id: "b", label: "" }]);
      }
    } else {
      setForm({ title: "", type: "ANNOUNCEMENT", description: "", isActive: false });
      setPollOptions([{ id: "a", label: "" }, { id: "b", label: "" }]);
    }
  }, [editing, open]);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const data: CreateEngagementData = {
        title: form.title.trim(),
        type: form.type,
        description: form.description.trim() || null,
        isActive: form.isActive,
        content: form.type === "POLL" ? { options: pollOptions.filter((o) => o.label.trim()) } : undefined,
      };
      if (editing) {
        await eventsService.updateEngagement(eventId, editing.id, data);
        toast.success("Engagement updated");
      } else {
        await eventsService.createEngagement(eventId, data);
        toast.success("Engagement created");
      }
      onSave();
      onClose();
    } catch {
      toast.error("Failed to save engagement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Engagement" : "Create Engagement"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update this engagement item." : "Add a new poll, Q&A, announcement, or feedback form to your event."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <cfg.icon className={cn("w-4 h-4", cfg.color)} />
                      {cfg.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={
                form.type === "POLL" ? "e.g., Which topic interests you most?"
                : form.type === "QA" ? "e.g., Live Q&A with Speaker"
                : form.type === "FEEDBACK" ? "e.g., Post-Session Feedback"
                : "e.g., Welcome message / schedule update"
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Description {form.type === "ANNOUNCEMENT" ? "*" : "(optional)"}</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={
                form.type === "ANNOUNCEMENT"
                  ? "Your announcement text goes here..."
                  : "Optional description or instructions for participants"
              }
              rows={4}
              className="resize-none"
            />
          </div>

          {form.type === "POLL" && (
            <div className="space-y-2">
              <Label>Poll Options</Label>
              <PollOptionsEditor options={pollOptions} onChange={setPollOptions} />
            </div>
          )}

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
            <div>
              <p className="text-sm font-medium">Make Active</p>
              <p className="text-xs text-muted-foreground">
                Active engagements are visible to attendees immediately
              </p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) => setForm({ ...form, isActive: v })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={!form.title.trim() || saving}
            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
          >
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : editing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function EngagementPage() {
  const { selectedEventId } = useUIStore();
  const [engagements, setEngagements] = useState<EventEngagement[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EventEngagement | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEngagements = useCallback(async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const res = await eventsService.getEngagements(selectedEventId);
      if (res.success && Array.isArray(res.data)) setEngagements(res.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => { fetchEngagements(); }, [fetchEngagements]);

  const openCreate = () => { setEditingItem(null); setDialogOpen(true); };
  const openEdit = (eng: EventEngagement) => { setEditingItem(eng); setDialogOpen(true); };

  const handleToggleActive = async (eng: EventEngagement) => {
    setTogglingId(eng.id);
    try {
      await eventsService.updateEngagement(selectedEventId!, eng.id, { isActive: !eng.isActive });
      await fetchEngagements();
      toast.success(eng.isActive ? "Deactivated" : "Activated");
    } catch {
      toast.error("Failed to toggle engagement");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (eng: EventEngagement) => {
    if (!confirm(`Delete "${eng.title}"?`)) return;
    setDeletingId(eng.id);
    try {
      await eventsService.deleteEngagement(selectedEventId!, eng.id);
      await fetchEngagements();
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete engagement");
    } finally {
      setDeletingId(null);
    }
  };

  if (!selectedEventId) {
    return (
      <DashboardLayout title="Engagement" subtitle="Select an event first">
        <div className="flex flex-col items-center justify-center py-20 text-center p-8">
          <AlertTriangle className="h-12 w-12 text-amber-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Event Selected</h3>
          <p className="text-muted-foreground mb-4">Select an event from the sidebar to manage engagements.</p>
          <Link href="/dashboard/events" className="text-primary hover:underline">Go to Events</Link>
        </div>
      </DashboardLayout>
    );
  }

  const activeCount = engagements.filter((e) => e.isActive).length;

  return (
    <DashboardLayout title="Engagement" subtitle="Manage polls, Q&A, announcements, and feedback">
      <EngagementDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={fetchEngagements}
        eventId={selectedEventId}
        editing={editingItem}
      />

      <div className="space-y-6">
        {/* Header banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-blue-700 p-6 text-white">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Event Engagement</h1>
                <p className="text-white/70 text-sm">{engagements.length} items · {activeCount} active</p>
              </div>
            </div>
            <Button onClick={openCreate} className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm">
              <Plus className="w-4 h-4 mr-2" />
              New Engagement
            </Button>
          </div>
        </div>

        {/* Type quick-stats */}
        {engagements.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
              const count = engagements.filter((e) => e.type === type).length;
              return (
                <div key={type} className="rounded-xl border bg-white/80 dark:bg-slate-900/80 p-3 flex items-center gap-3 shadow-sm">
                  <div className={cn("p-2 rounded-lg", cfg.bg)}>
                    <cfg.icon className={cn("w-4 h-4", cfg.color)} />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{cfg.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : engagements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border rounded-2xl bg-white/50 dark:bg-slate-900/50">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Engagements Yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm text-sm">
              Add polls, Q&amp;A sessions, announcements, or feedback forms to make your event interactive.
            </p>
            <Button onClick={openCreate} className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
              <Plus className="w-4 h-4 mr-2" /> Create First Engagement
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {engagements.map((eng) => {
              const cfg = TYPE_CONFIG[eng.type] ?? TYPE_CONFIG["ANNOUNCEMENT"];
              const Icon = cfg.icon;
              return (
                <Card key={eng.id} className="border shadow-sm hover:shadow-md transition-shadow bg-white/80 dark:bg-slate-900/80">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg shrink-0 mt-0.5", cfg.bg)}>
                        <Icon className={cn("w-4 h-4", cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm line-clamp-2 leading-snug">{eng.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{cfg.label}</p>
                      </div>
                    </div>

                    {eng.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{eng.description}</p>
                    )}

                    {eng.type === "POLL" && (eng.content as any)?.options && (
                      <div className="space-y-1">
                        {((eng.content as any).options as PollOption[]).map((opt, i) => (
                          <div key={opt.id} className="flex items-center gap-2 text-xs">
                            <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center font-medium shrink-0">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="text-muted-foreground">{opt.label}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          eng.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400"
                            : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400"
                        )}
                      >
                        {eng.isActive ? "Active" : "Inactive"}
                      </Badge>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleToggleActive(eng)}
                          disabled={togglingId === eng.id}
                        >
                          {togglingId === eng.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : eng.isActive ? (
                            <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => openEdit(eng)}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(eng)}
                          disabled={deletingId === eng.id}
                        >
                          {deletingId === eng.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
