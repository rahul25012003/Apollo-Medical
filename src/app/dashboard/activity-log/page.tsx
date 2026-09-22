"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { useIsIfpcDashboard } from "@/components/ifpc/guard";

interface LogEntry {
  id: string;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  summary: string;
  entityType: string | null;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  update: "bg-blue-50 text-blue-700 border-blue-200",
  create: "bg-emerald-50 text-emerald-700 border-emerald-200",
  delete: "bg-red-50 text-red-700 border-red-200",
  deactivate: "bg-amber-50 text-amber-700 border-amber-200",
  send: "bg-violet-50 text-violet-700 border-violet-200",
  export: "bg-slate-50 text-slate-700 border-slate-200",
};
const colorFor = (action: string) => ACTION_COLORS[action.split(".")[1] || ""] || "bg-slate-50 text-slate-700 border-slate-200";

export default function ActivityLogPage() {
  // IFPC (apollo-medical) only — this page doesn't exist for other tenants.
  const ifpcCheck = useIsIfpcDashboard();
  if (!ifpcCheck.loading && !ifpcCheck.isIfpc) notFound();

  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ifpcCheck.isIfpc) return;
    setLoading(true);
    fetch(`/api/tenants/my/activity-log?page=${page}&limit=50`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setEntries(json.data);
          setTotalPages(json.pagination?.totalPages ?? 1);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, ifpcCheck.isIfpc]);

  return (
    <DashboardLayout title="Activity Log" subtitle="Who changed what, and when">
      {ifpcCheck.loading || loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No activity recorded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 max-w-4xl">
          <div className="space-y-2">
            {entries.map((e) => (
              <Card key={e.id}>
                <CardContent className="py-3 px-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm">{e.summary}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {e.actorEmail || "System"}{e.actorRole ? ` · ${e.actorRole}` : ""} · {new Date(e.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <Badge variant="outline" className={colorFor(e.action)}>{e.action}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
