"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  IndianRupee,
  Award,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  CalendarDays,
  UserCheck,
  Zap,
  PieChart,
  FileDown,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { eventsService, Event } from "@/services/events";
import {
  reportsService,
  RegistrationReport,
  RevenueReport,
  AttendanceReport,
  CertificateReport,
} from "@/services/reports";

// ============================================================================
// PURE CSS CHART COMPONENTS
// ============================================================================

function BarChart({ data, maxValue, color = "teal", height = 160 }: {
  data: { label: string; value: number }[];
  maxValue: number;
  color?: string;
  height?: number;
}) {
  const colorMap: Record<string, string> = {
    teal: "from-teal-500 to-cyan-500",
    violet: "from-violet-500 to-purple-500",
    amber: "from-amber-500 to-orange-500",
    emerald: "from-emerald-500 to-green-500",
    blue: "from-blue-500 to-indigo-500",
    rose: "from-rose-500 to-pink-500",
  };

  return (
    <div className="flex items-end gap-[2px]" style={{ height }}>
      {data.map((item, i) => {
        const pct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center group relative min-w-0">
            <div
              className={cn(
                "w-full rounded-t-sm bg-gradient-to-t transition-all duration-500 ease-out",
                colorMap[color] || colorMap.teal,
                "opacity-80 hover:opacity-100 cursor-default"
              )}
              style={{ height: `${Math.max(pct, 1)}%`, minHeight: 2 }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
              <div className="bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                {item.label}: {item.value.toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ segments, size = 140, strokeWidth = 20 }: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {total === 0 ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />
        ) : (
          segments.map((segment, i) => {
            const pct = segment.value / total;
            const dashLength = pct * circumference;
            const dashOffset = -offset;
            offset += dashLength;
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={dashOffset}
                className="transition-all duration-700 ease-out"
                strokeLinecap="round"
              />
            );
          })
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{total.toLocaleString()}</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtext, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    teal: "from-teal-500/20 to-cyan-500/20 text-teal-600 dark:text-teal-400",
    violet: "from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-400",
    amber: "from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400",
    emerald: "from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400",
    blue: "from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400",
    rose: "from-rose-500/20 to-pink-500/20 text-rose-600 dark:text-rose-400",
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border bg-white/50 dark:bg-slate-800/50">
      <div className={cn("p-3 rounded-xl bg-gradient-to-br", colorMap[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</div>
        {subtext && <div className="text-xs text-muted-foreground">{subtext}</div>}
      </div>
    </div>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-muted-foreground truncate">{label}</span>
      <span className="font-medium ml-auto">{value.toLocaleString()}</span>
    </div>
  );
}

// ============================================================================
// CSV EXPORT UTILITY
// ============================================================================

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// STATUS COLORS
// ============================================================================

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "#10b981",
  PENDING: "#f59e0b",
  WAITLIST: "#8b5cf6",
  ATTENDED: "#06b6d4",
  CANCELLED: "#ef4444",
  ISSUED: "#10b981",
  REVOKED: "#ef4444",
  PAID: "#10b981",
  FREE: "#8b5cf6",
  FAILED: "#ef4444",
  REFUNDED: "#f59e0b",
};

const ROLE_COLORS: Record<string, string> = {
  DELEGATE: "#0d9488",
  SPEAKER: "#8b5cf6",
  ORGANIZER: "#f59e0b",
  VOLUNTEER: "#06b6d4",
  CHAIRPERSON: "#ec4899",
  UNSPECIFIED: "#94a3b8",
};

const CERT_TYPE_COLORS: Record<string, string> = {
  ATTENDANCE: "#10b981",
  SPEAKER_SESSION: "#8b5cf6",
  ORGANIZATION: "#f59e0b",
  JUDGE: "#ec4899",
  QUIZ_WINNER: "#ef4444",
  QUIZ_FINALIST: "#06b6d4",
  QUIZ_PARTICIPATION: "#94a3b8",
  VOLUNTEER: "#3b82f6",
  CHAIRPERSON: "#f97316",
};

// ============================================================================
// REGISTRATION ANALYTICS
// ============================================================================

function RegistrationAnalytics({ data }: { data: RegistrationReport | null }) {
  if (!data) return null;

  const maxDaily = Math.max(...data.dailyRegistrations.map((d) => d.count), 1);

  const donutSegments = data.statusBreakdown.map((s) => ({
    label: s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || "#94a3b8",
  }));

  const maxRole = Math.max(...data.roleBreakdown.map((r) => r.count), 1);

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20">
              <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Registration Analytics</h3>
              <p className="text-sm text-muted-foreground">{data.total.toLocaleString()} total registrations</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              downloadCsv(
                "registrations-report.csv",
                ["Date", "Count"],
                data.dailyRegistrations.map((d) => [d.date, d.count])
              );
            }}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Registrations Bar Chart */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Last 30 Days</h4>
            <BarChart
              data={data.dailyRegistrations.map((d) => ({
                label: new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
                value: d.count,
              }))}
              maxValue={maxDaily}
              color="teal"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{new Date(data.dailyRegistrations[0]?.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
              <span>{new Date(data.dailyRegistrations[data.dailyRegistrations.length - 1]?.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            </div>
          </div>

          {/* Status Donut */}
          <div className="flex items-center gap-6">
            <DonutChart segments={donutSegments} />
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">By Status</h4>
              {donutSegments.map((s) => (
                <LegendItem key={s.label} color={s.color} label={s.label} value={s.value} />
              ))}
            </div>
          </div>

          {/* Role Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">By Role</h4>
            <div className="space-y-3">
              {data.roleBreakdown.map((r) => (
                <div key={r.role}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{r.role}</span>
                    <span className="text-sm font-medium">{r.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${(r.count / maxRole) * 100}%`,
                        backgroundColor: ROLE_COLORS[r.role] || "#94a3b8",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">By Category</h4>
            <div className="space-y-2">
              {data.categoryBreakdown.map((c, i) => (
                <div key={c.category} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                  <span className="text-sm">{c.category}</span>
                  <Badge variant="outline" className="font-mono">{c.count}</Badge>
                </div>
              ))}
              {data.categoryBreakdown.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No category data</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// REVENUE ANALYTICS
// ============================================================================

function RevenueAnalytics({ data }: { data: RevenueReport | null }) {
  if (!data) return null;

  const maxDaily = Math.max(...data.dailyRevenue.map((d) => d.amount), 1);

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20">
              <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Revenue Analytics</h3>
              <p className="text-sm text-muted-foreground">Financial overview</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              downloadCsv(
                "revenue-report.csv",
                ["Date", "Amount"],
                data.dailyRevenue.map((d) => [d.date, d.amount])
              );
            }}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={IndianRupee} label="Total Revenue" value={`₹${data.totalRevenue.toLocaleString()}`} color="emerald" />
          <StatCard icon={CheckCircle2} label="Paid" value={`₹${data.totalPaid.toLocaleString()}`} color="teal" />
          <StatCard icon={Clock} label="Pending" value={`₹${data.totalPending.toLocaleString()}`} color="amber" />
          <StatCard icon={Users} label="Free Registrations" value={data.totalFree} color="violet" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Revenue Chart */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Revenue (Last 30 Days)</h4>
            <BarChart
              data={data.dailyRevenue.map((d) => ({
                label: new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
                value: d.amount,
              }))}
              maxValue={maxDaily}
              color="emerald"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{new Date(data.dailyRevenue[0]?.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
              <span>{new Date(data.dailyRevenue[data.dailyRevenue.length - 1]?.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            </div>
          </div>

          {/* Event Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Revenue by Event</h4>
            <div className="space-y-3">
              {data.eventBreakdown.slice(0, 8).map((e) => (
                <div key={e.eventTitle} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm truncate mr-3 flex-1">{e.eventTitle}</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    ₹{Number(e.amount).toLocaleString()}
                  </span>
                </div>
              ))}
              {data.eventBreakdown.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No revenue data</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ATTENDANCE ANALYTICS
// ============================================================================

function AttendanceAnalytics({ data }: { data: AttendanceReport | null }) {
  if (!data) return null;

  const maxHourly = Math.max(...data.hourlyData.map((d) => d.count), 1);

  const donutSegments = [
    { label: "Checked In", value: data.checkedIn, color: "#10b981" },
    { label: "Not Checked In", value: data.totalRegistrations - data.checkedIn, color: "#e5e7eb" },
  ];

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
              <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Attendance Analytics</h3>
              <p className="text-sm text-muted-foreground">Check-in metrics and patterns</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              downloadCsv(
                "attendance-report.csv",
                ["Hour", "Check-ins"],
                data.hourlyData.map((d) => [`${d.hour}:00`, d.count])
              );
            }}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Check-in Rate Donut */}
          <div className="flex flex-col items-center gap-4">
            <DonutChart segments={donutSegments} size={180} strokeWidth={24} />
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{data.checkInRate}%</div>
              <div className="text-sm text-muted-foreground">Check-in Rate</div>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <div className="font-bold">{data.checkedIn.toLocaleString()}</div>
                <div className="text-muted-foreground">Checked In</div>
              </div>
              <div className="text-center">
                <div className="font-bold">{data.totalRegistrations.toLocaleString()}</div>
                <div className="text-muted-foreground">Total</div>
              </div>
            </div>
          </div>

          {/* Hourly Check-ins */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-muted-foreground">Hourly Check-ins</h4>
              {data.peakCount > 0 && (
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
                  <Zap className="w-3 h-3 mr-1" />
                  Peak: {data.peakHour}:00 ({data.peakCount})
                </Badge>
              )}
            </div>
            <BarChart
              data={data.hourlyData.filter((d) => d.hour >= 6 && d.hour <= 22).map((d) => ({
                label: `${d.hour}:00`,
                value: d.count,
              }))}
              maxValue={maxHourly}
              color="blue"
              height={200}
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>6:00</span>
              <span>14:00</span>
              <span>22:00</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// CERTIFICATE ANALYTICS
// ============================================================================

function CertificateAnalytics({ data }: { data: CertificateReport | null }) {
  if (!data) return null;

  const statusSegments = data.statusBreakdown.map((s) => ({
    label: s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || "#94a3b8",
  }));

  const maxType = Math.max(...data.typeBreakdown.map((t) => t.count), 1);

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
              <Award className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Certificate Analytics</h3>
              <p className="text-sm text-muted-foreground">{data.total.toLocaleString()} total certificates</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              downloadCsv(
                "certificates-report.csv",
                ["Type", "Count"],
                data.typeBreakdown.map((t) => [t.type, t.count])
              );
            }}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Donut */}
          <div className="flex items-center gap-6">
            <DonutChart segments={statusSegments} />
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">By Status</h4>
              {statusSegments.map((s) => (
                <LegendItem key={s.label} color={s.color} label={s.label} value={s.value} />
              ))}
              {statusSegments.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No certificate data</p>
              )}
            </div>
          </div>

          {/* Type Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">By Type</h4>
            <div className="space-y-3">
              {data.typeBreakdown.map((t) => (
                <div key={t.type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{t.type.replace(/_/g, " ")}</span>
                    <span className="text-sm font-medium">{t.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${(t.count / maxType) * 100}%`,
                        backgroundColor: CERT_TYPE_COLORS[t.type] || "#94a3b8",
                      }}
                    />
                  </div>
                </div>
              ))}
              {data.typeBreakdown.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No certificate data</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ReportsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("all");
  const [loading, setLoading] = useState(true);

  const [registrationData, setRegistrationData] = useState<RegistrationReport | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueReport | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceReport | null>(null);
  const [certificateData, setCertificateData] = useState<CertificateReport | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await eventsService.getAll();
        if (res.success && res.data) {
          setEvents(res.data);
        }
      } catch {
        // silently fail
      }
    }
    fetchEvents();
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const eventId = selectedEventId === "all" ? undefined : selectedEventId;

    try {
      const [regRes, revRes, attRes, certRes] = await Promise.all([
        reportsService.getRegistrations(eventId),
        reportsService.getRevenue(eventId),
        reportsService.getAttendance(eventId),
        reportsService.getCertificates(eventId),
      ]);

      if (regRes.success && regRes.data) setRegistrationData(regRes.data);
      if (revRes.success && revRes.data) setRevenueData(revRes.data);
      if (attRes.success && attRes.data) setAttendanceData(attRes.data);
      if (certRes.success && certRes.data) setCertificateData(certRes.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <DashboardLayout title="Reports" subtitle="Analytics and insights across all events">
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 text-white">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold">Reports & Analytics</h1>
              </div>
              <p className="text-white/80 max-w-xl">
                Comprehensive insights into registrations, revenue, attendance, and certificates.
              </p>
            </div>
            <div className="shrink-0">
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger className="w-[220px] bg-white/20 border-white/30 text-white backdrop-blur-sm">
                  <SelectValue placeholder="Filter by event..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <AiimsLoader size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            <RegistrationAnalytics data={registrationData} />
            <RevenueAnalytics data={revenueData} />
            <AttendanceAnalytics data={attendanceData} />
            <CertificateAnalytics data={certificateData} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
