"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Send,
  FileText,
  History,
  Mail,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Search,
  Filter,
  Eye,
  X,
  Copy,
  MessageSquare,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { eventsService, Event } from "@/services/events";
import {
  communicationsService,
  MessageTemplate,
  MessageLog,
} from "@/services/communications";

// ============================================================================
// SEND MESSAGE TAB
// ============================================================================

function SendMessageTab() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await eventsService.getAll();
        if (res.success && res.data) {
          setEvents(res.data);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingEvents(false);
      }
    }
    fetchEvents();
  }, []);

  const handleSend = async () => {
    if (!selectedEventId || !subject || !body) return;

    setSending(true);
    setResult(null);

    try {
      const recipientFilter: Record<string, string> = {};
      if (filterStatus !== "all") recipientFilter.status = filterStatus;
      if (filterRole !== "all") recipientFilter.role = filterRole;

      const res = await communicationsService.send({
        eventId: selectedEventId,
        subject,
        body,
        recipientFilter: Object.keys(recipientFilter).length > 0 ? recipientFilter : undefined,
      });

      if (res.success && res.data) {
        setResult(res.data);
      }
    } catch {
      // handled by api client
    } finally {
      setSending(false);
    }
  };

  const previewHtml = body
    .replace(/\{\{name\}\}/g, "John Doe")
    .replace(/\{\{email\}\}/g, "john@example.com")
    .replace(/\{\{eventTitle\}\}/g, events.find((e) => e.id === selectedEventId)?.title || "Event Title")
    .replace(/\n/g, "<br/>");

  return (
    <div className="space-y-6">
      {/* Event Selection */}
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20">
              <Send className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Compose Message</h3>
              <p className="text-sm text-muted-foreground">Send emails to event registrants</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Event Selector */}
          <div className="space-y-2">
            <Label>Select Event</Label>
            {loadingEvents ? (
              <div className="h-10 bg-muted animate-pulse rounded-md" />
            ) : (
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an event..." />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Recipient Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="WAITLIST">Waitlist</SelectItem>
                  <SelectItem value="ATTENDED">Attended</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Filter by Role</Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="DELEGATE">Delegate</SelectItem>
                  <SelectItem value="SPEAKER">Speaker</SelectItem>
                  <SelectItem value="ORGANIZER">Organizer</SelectItem>
                  <SelectItem value="VOLUNTEER">Volunteer</SelectItem>
                  <SelectItem value="CHAIRPERSON">Chairperson</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject... (use {{eventTitle}} for event name)"
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Message Body</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Placeholders: {"{{name}}"}, {"{{email}}"}, {"{{eventTitle}}"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  {showPreview ? "Hide" : "Show"} Preview
                </Button>
              </div>
            </div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here..."
              rows={8}
              className="resize-none"
            />
          </div>

          {/* Preview */}
          {showPreview && body && (
            <div className="rounded-xl border bg-white dark:bg-slate-800 p-6">
              <div className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Preview</div>
              <div className="text-sm font-semibold mb-2">{subject.replace(/\{\{eventTitle\}\}/g, events.find((e) => e.id === selectedEventId)?.title || "Event Title")}</div>
              <div
                className="text-sm leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={cn(
              "rounded-xl p-4 flex items-center gap-3",
              result.failed === 0
                ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                : "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
            )}>
              {result.failed === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <XCircle className="w-5 h-5 text-amber-600" />
              )}
              <span className="text-sm font-medium">
                Sent {result.sent} of {result.total} emails
                {result.failed > 0 && ` (${result.failed} failed)`}
              </span>
            </div>
          )}

          {/* Send Button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSend}
              disabled={!selectedEventId || !subject || !body || sending}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-8"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send to All Recipients
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// TEMPLATES TAB
// ============================================================================

function TemplatesTab() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [form, setForm] = useState({ name: "", subject: "", body: "", type: "EMAIL" });
  const [saving, setSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await communicationsService.getTemplates();
      if (res.success && res.data) {
        setTemplates(res.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const openCreate = () => {
    setEditingTemplate(null);
    setForm({ name: "", subject: "", body: "", type: "EMAIL" });
    setDialogOpen(true);
  };

  const openEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
      type: template.type,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.subject || !form.body) return;
    setSaving(true);
    try {
      if (editingTemplate) {
        await communicationsService.updateTemplate(editingTemplate.id, form);
      } else {
        await communicationsService.createTemplate(form);
      }
      setDialogOpen(false);
      fetchTemplates();
    } catch {
      // handled by api client
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    try {
      await communicationsService.deleteTemplate(id);
      fetchTemplates();
    } catch {
      // handled by api client
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <AiimsLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Message Templates</h3>
                <p className="text-sm text-muted-foreground">{templates.length} templates</p>
              </div>
            </div>
            <Button onClick={openCreate} className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-muted-foreground mb-1">No templates yet</h4>
              <p className="text-sm text-muted-foreground/70">Create reusable message templates to speed up your communications.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="group flex items-center justify-between p-4 rounded-xl border bg-white/50 dark:bg-slate-800/50 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{template.name}</h4>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {template.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{template.subject}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(template)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
            <DialogDescription>
              {editingTemplate ? "Update your message template." : "Create a reusable message template."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Registration Confirmation"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Email subject line"
              />
            </div>
            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Message body..."
                rows={6}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || !form.subject || !form.body || saving}
              className="bg-gradient-to-r from-violet-600 to-purple-600 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingTemplate ? (
                "Update Template"
              ) : (
                "Create Template"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// HISTORY TAB
// ============================================================================

function HistoryTab() {
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const filters: Record<string, string | number | boolean> = { page, limit: 20 };
      if (filterStatus !== "all") filters.status = filterStatus;

      const res = await communicationsService.getHistory(filters as any);
      if (res.success && res.data) {
        setLogs(res.data);
        if ((res as any).pagination) {
          setTotalPages((res as any).pagination.totalPages);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const statusBadge = (status: string) => {
    switch (status) {
      case "SENT":
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0"><CheckCircle2 className="w-3 h-3 mr-1" />Sent</Badge>;
      case "FAILED":
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <History className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Message History</h3>
                <p className="text-sm text-muted-foreground">View all sent communications</p>
              </div>
            </div>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <AiimsLoader size="lg" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-muted-foreground mb-1">No messages sent yet</h4>
              <p className="text-sm text-muted-foreground/70">Messages you send will appear here.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{log.recipientName || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">{log.recipientEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">{log.subject}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{log.event?.title || "-"}</TableCell>
                        <TableCell>{statusBadge(log.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(log.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-3">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState("send");

  return (
    <DashboardLayout title="Communications" subtitle="Send messages and manage notification templates">
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-700 p-8 text-white">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold">Communications</h1>
            </div>
            <p className="text-white/80 max-w-xl">
              Send emails to event registrants, manage message templates, and track your communication history.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border shadow-sm">
            <TabsTrigger value="send" className="gap-2">
              <Send className="w-4 h-4" />
              Send Message
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tab Content */}
        {activeTab === "send" && <SendMessageTab />}
        {activeTab === "templates" && <TemplatesTab />}
        {activeTab === "history" && <HistoryTab />}
      </div>
    </DashboardLayout>
  );
}
