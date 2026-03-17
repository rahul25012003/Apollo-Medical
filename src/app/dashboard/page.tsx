"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useUIStore } from "@/store";
import { cn } from "@/lib/utils";
import {
    Calendar,
    Users,
    Award,
    DollarSign,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    CalendarDays,
    AlertTriangle,
    Plus,
    Mic2,
    FileCheck,
    BarChart3,
    Activity,
    Sparkles,
    CheckCircle2,
    CircleDot,
    CreditCard,
} from "lucide-react";
import { dashboardService, DashboardStats } from "@/services/dashboard";
import { useTenantFilter } from "@/hooks/use-tenant-filter";
import { TenantProvider } from "@/lib/tenant/context";
import { useSession } from "next-auth/react";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import Link from "next/link";

interface StatCard {
    title: string;
    value: string;
    change: string;
    trend: "up" | "down";
    icon: React.ElementType;
    color: string;
    bgColor: string;
}

interface UpcomingEvent {
    id: string;
    title: string;
    date: string;
    time: string;
    registrations: number;
    capacity: number;
}

interface RecentRegistration {
    id: string;
    name: string;
    event: string;
    date: string;
    status: string;
}

export default function DashboardPage() {
    const { sidebarCollapsed } = useUIStore();
    const { data: session } = useSession();
    const { tenantFilterParams, effectiveTenantId, sessionLoading } = useTenantFilter();
    const userRole = session?.user?.role || "ATTENDEE";
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER", "REGISTRATION_MANAGER", "CERTIFICATE_MANAGER"].includes(userRole);
    const userName = session?.user?.name || (isAdmin ? "Admin" : "there");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<StatCard[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
    const [recentRegistrations, setRecentRegistrations] = useState<RecentRegistration[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Delegate-specific state
    const [delegateRegistrationCount, setDelegateRegistrationCount] = useState(0);
    const [delegateCertificateCount, setDelegateCertificateCount] = useState(0);
    const [delegateUpcomingEvents, setDelegateUpcomingEvents] = useState<UpcomingEvent[]>([]);

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            const tenantId = tenantFilterParams.tenantId;
            const response = await dashboardService.getStats(tenantId);

            if (response.success && response.data) {
                const data = response.data;

                // Set stats from live database
                setStats([
                    {
                        title: "Total Events",
                        value: data.overview.totalEvents.toString(),
                        change: `+${data.overview.totalEvents > 0 ? "12" : "0"}%`,
                        trend: "up",
                        icon: Calendar,
                        color: "text-blue-600",
                        bgColor: "bg-blue-50",
                    },
                    {
                        title: "Registrations",
                        value: data.overview.totalRegistrations.toLocaleString(),
                        change: `+${data.overview.monthlyRegistrations}`,
                        trend: "up",
                        icon: Users,
                        color: "text-green-600",
                        bgColor: "bg-green-50",
                    },
                    {
                        title: "Certificates Issued",
                        value: data.overview.totalCertificates.toLocaleString(),
                        change: "+0%",
                        trend: "up",
                        icon: Award,
                        color: "text-purple-600",
                        bgColor: "bg-purple-50",
                    },
                    {
                        title: "Revenue",
                        value: `₹${data.overview.totalRevenue.toLocaleString()}`,
                        change: "+0%",
                        trend: "up",
                        icon: DollarSign,
                        color: "text-amber-600",
                        bgColor: "bg-amber-50",
                    },
                ]);

                // Set upcoming events from live database
                setUpcomingEvents(data.upcomingEvents.map((e) => ({
                    id: e.id,
                    title: e.title,
                    date: new Date(e.startDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                    }),
                    time: e.startDate
                        ? new Date(e.startDate).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                        })
                        : "TBD",
                    registrations: e.registeredCount,
                    capacity: e.capacity,
                })));

                // Set recent registrations from live database
                setRecentRegistrations(data.recentRegistrations.map((r) => ({
                    id: r.id,
                    name: r.name,
                    event: r.event.title,
                    date: formatTimeAgo(new Date(r.createdAt)),
                    status: r.status.toLowerCase(),
                })));
            } else {
                setError("Failed to load dashboard data. Please try refreshing the page.");
            }
        } catch {
            setError("Something went wrong while loading the dashboard. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const fetchDelegateData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [regsRes, certsRes] = await Promise.all([
                fetch("/api/users/me/registrations"),
                fetch("/api/users/me/certificates"),
            ]);

            if (regsRes.ok) {
                const regsData = await regsRes.json();
                if (regsData.success && Array.isArray(regsData.data)) {
                    setDelegateRegistrationCount(regsData.data.length);

                    // Extract upcoming events from registrations
                    const now = new Date();
                    const upcoming = regsData.data
                        .filter((r: { event?: { startDate?: string } }) => r.event?.startDate && new Date(r.event.startDate) > now)
                        .map((r: { event: { id: string; title: string; startDate: string; city?: string | null } }) => ({
                            id: r.event.id,
                            title: r.event.title,
                            date: new Date(r.event.startDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                            }),
                            time: new Date(r.event.startDate).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                            }),
                            registrations: 0,
                            capacity: 0,
                        }));
                    setDelegateUpcomingEvents(upcoming);
                }
            }

            if (certsRes.ok) {
                const certsData = await certsRes.json();
                if (certsData.success && Array.isArray(certsData.data)) {
                    setDelegateCertificateCount(certsData.data.length);
                }
            }
        } catch {
            setError("Something went wrong while loading your dashboard. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (sessionLoading) return;
        if (!isAdmin) {
            // Fetch delegate-specific data only
            fetchDelegateData();
        } else {
            fetchDashboardData(); // Admin stats
        }
    }, [sessionLoading, effectiveTenantId, isAdmin]);

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${diffDays} days ago`;
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const pendingRegistrations = recentRegistrations.filter(r => r.status === "pending").length;

    // Gradient configs for stat cards
    const statGradients = [
        { gradient: "from-blue-500 to-cyan-500", ring: "ring-blue-500/20", shadow: "shadow-blue-500/10" },
        { gradient: "from-emerald-500 to-teal-500", ring: "ring-emerald-500/20", shadow: "shadow-emerald-500/10" },
        { gradient: "from-violet-500 to-purple-500", ring: "ring-violet-500/20", shadow: "shadow-violet-500/10" },
        { gradient: "from-amber-500 to-orange-500", ring: "ring-amber-500/20", shadow: "shadow-amber-500/10" },
    ];

    const getProgressColor = (ratio: number) => {
        if (ratio >= 0.9) return "from-red-500 to-rose-500";
        if (ratio >= 0.7) return "from-amber-500 to-orange-500";
        return "from-teal-500 to-cyan-500";
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "confirmed":
                return {
                    bg: "bg-emerald-50 dark:bg-emerald-950/30",
                    text: "text-emerald-700 dark:text-emerald-400",
                    dot: "bg-emerald-500",
                    ring: "ring-emerald-500/20",
                };
            case "pending":
                return {
                    bg: "bg-amber-50 dark:bg-amber-950/30",
                    text: "text-amber-700 dark:text-amber-400",
                    dot: "bg-amber-500",
                    ring: "ring-amber-500/20",
                };
            case "cancelled":
                return {
                    bg: "bg-red-50 dark:bg-red-950/30",
                    text: "text-red-700 dark:text-red-400",
                    dot: "bg-red-500",
                    ring: "ring-red-500/20",
                };
            default:
                return {
                    bg: "bg-slate-50 dark:bg-slate-950/30",
                    text: "text-slate-700 dark:text-slate-400",
                    dot: "bg-slate-500",
                    ring: "ring-slate-500/20",
                };
        }
    };

    if (error) {
        return (
            <TenantProvider tenantId={effectiveTenantId}>
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                    <Sidebar />
                    <Header title="Dashboard" subtitle="Welcome back" />
                    <main className={cn(
                        "pt-16 min-h-screen transition-all duration-300",
                        sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64",
                        "pl-0"
                    )}>
                        <div className="flex items-center justify-center h-[50vh]">
                            <div className="text-center space-y-4 max-w-sm">
                                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                                    <AlertTriangle className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground mb-1">Something went wrong</h3>
                                    <p className="text-sm text-muted-foreground">{error}</p>
                                </div>
                                <button
                                    onClick={() => fetchDashboardData()}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-teal-500/25 transition-all duration-300 hover:-translate-y-0.5"
                                    aria-label="Retry loading dashboard data"
                                >
                                    <Activity className="w-4 h-4" />
                                    Try again
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </TenantProvider>
        );
    }

    if (loading) {
        return (
            <TenantProvider tenantId={effectiveTenantId}>
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                    <Sidebar />
                    <Header title="Dashboard" subtitle="Welcome back" />
                    <main className={cn(
                        "pt-16 min-h-screen transition-all duration-300",
                        sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64",
                        "pl-0"
                    )}>
                        <AiimsLoader />
                    </main>
                </div>
            </TenantProvider>
        );
    }

    // ========== DELEGATE / ATTENDEE DASHBOARD ==========
    if (!isAdmin) {
        return (
            <TenantProvider tenantId={effectiveTenantId}>
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                    <Sidebar />
                    <Header title="Dashboard" subtitle={`Welcome back, ${userName}`} />
                    <main className={cn(
                        "pt-16 min-h-screen transition-all duration-300",
                        sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64",
                        "pl-0"
                    )}>
                        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                            {/* Welcome banner */}
                            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-6 sm:p-8 lg:p-10 shadow-2xl shadow-teal-900/15">
                                <div className="absolute inset-0 opacity-[0.07]"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                                    }}
                                />
                                <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Sparkles className="w-5 h-5 text-cyan-200" />
                                        <span className="text-cyan-100 text-sm font-medium tracking-wide uppercase">{getGreeting()}</span>
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome, {userName}</h1>
                                    <p className="text-cyan-100 text-sm sm:text-base">Access your registrations, certificates, and upcoming events.</p>
                                </div>
                            </div>

                            {/* Delegate stats cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <Link
                                    href="/dashboard/browse-events"
                                    className="group relative flex items-center gap-4 p-6 rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1.5 hover:border-blue-200/50 transition-all duration-400"
                                >
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25 group-hover:scale-110 group-hover:shadow-blue-500/40 transition-all duration-300">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-semibold text-foreground block">Browse Events</span>
                                        <span className="text-xs text-muted-foreground">Discover upcoming conferences</span>
                                    </div>
                                </Link>

                                <Link
                                    href="/dashboard/my-registrations"
                                    className="group relative flex items-center gap-4 p-6 rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1.5 hover:border-emerald-200/50 transition-all duration-400"
                                >
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 group-hover:scale-110 group-hover:shadow-emerald-500/40 transition-all duration-300">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <span className="text-3xl font-bold text-foreground block tracking-tight">{delegateRegistrationCount}</span>
                                        <span className="text-sm font-semibold text-foreground block">My Registrations</span>
                                    </div>
                                </Link>

                                <Link
                                    href="/dashboard/my-certificates"
                                    className="group relative flex items-center gap-4 p-6 rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm hover:shadow-2xl hover:shadow-violet-500/10 hover:-translate-y-1.5 hover:border-violet-200/50 transition-all duration-400"
                                >
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25 group-hover:scale-110 group-hover:shadow-violet-500/40 transition-all duration-300">
                                        <Award className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <span className="text-3xl font-bold text-foreground block tracking-tight">{delegateCertificateCount}</span>
                                        <span className="text-sm font-semibold text-foreground block">My Certificates</span>
                                    </div>
                                </Link>
                            </div>

                            {/* Upcoming events the delegate is registered for */}
                            {delegateUpcomingEvents.length > 0 && (
                                <div className="rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-xl shadow-sm">
                                    <div className="p-5 sm:p-6 border-b border-slate-200/80 flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-500/20">
                                            <CalendarDays className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-foreground">Your Upcoming Events</h2>
                                            <p className="text-xs text-muted-foreground">Events you are registered for</p>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {delegateUpcomingEvents.slice(0, 5).map((event) => (
                                            <Link
                                                key={event.id}
                                                href={`/dashboard/browse-events/${event.id}`}
                                                className="flex items-center gap-4 p-5 hover:bg-slate-50/80 transition-all duration-200"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200/50 flex items-center justify-center flex-shrink-0">
                                                    <CalendarDays className="w-5 h-5 text-teal-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-foreground truncate">{event.title}</h3>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Calendar className="w-3 h-3" /> {event.date}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </TenantProvider>
        );
    }

    // ========== ADMIN DASHBOARD ==========
    return (
        <TenantProvider tenantId={effectiveTenantId}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <Sidebar />
                <Header title="Dashboard" subtitle={`Welcome back, ${userName}`} />

            {/* Main content */}
            <main className={cn(
                "pt-16 min-h-screen transition-all duration-300",
                sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64",
                "pl-0"
            )}>
                <div className="p-4 sm:p-6 lg:p-8 space-y-6">

                    {/* ========== WELCOME BANNER ========== */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-6 sm:p-8 shadow-xl shadow-teal-900/10">
                        {/* Geometric pattern overlay */}
                        <div className="absolute inset-0 opacity-[0.07]"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            }}
                        />
                        {/* Decorative gradient orbs */}
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
                        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-blue-400/10 rounded-full blur-3xl" />

                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles className="w-5 h-5 text-cyan-200" />
                                    <span className="text-cyan-100 text-sm font-medium tracking-wide uppercase">
                                        {getGreeting()}
                                    </span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                                    Welcome back, {userName}
                                </h1>
                                <p className="text-cyan-100 text-sm sm:text-base">
                                    You have <span className="text-white font-semibold">{upcomingEvents.length} upcoming event{upcomingEvents.length !== 1 ? "s" : ""}</span>
                                    {pendingRegistrations > 0 && (
                                        <> and <span className="text-white font-semibold">{pendingRegistrations} pending registration{pendingRegistrations !== 1 ? "s" : ""}</span></>
                                    )}
                                </p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
                                    <Clock className="w-4 h-4 text-cyan-200" />
                                    <div>
                                        <p className="text-white text-sm font-semibold">
                                            {currentTime.toLocaleDateString("en-IN", {
                                                weekday: "short",
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </p>
                                        <p className="text-cyan-200 text-xs">
                                            {currentTime.toLocaleTimeString("en-IN", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                hour12: true,
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ========== STATS GRID ========== */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.map((stat, index) => {
                            const g = statGradients[index] || statGradients[0];
                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        "group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5",
                                        "hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
                                        `hover:${g.shadow}`,
                                    )}
                                >
                                    {/* Top gradient line */}
                                    <div className={cn("absolute top-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300", g.gradient)} />

                                    <div className="flex items-start justify-between">
                                        <div className={cn(
                                            "p-2.5 rounded-xl bg-gradient-to-br text-white shadow-lg",
                                            g.gradient,
                                            g.shadow,
                                        )}>
                                            <stat.icon className="w-5 h-5" />
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
                                            stat.trend === "up"
                                                ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40"
                                                : "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/40"
                                        )}>
                                            {stat.trend === "up" ? (
                                                <ArrowUpRight className="w-3 h-3" />
                                            ) : (
                                                <ArrowDownRight className="w-3 h-3" />
                                            )}
                                            {stat.change}
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-2xl font-bold text-foreground tracking-tight"
                                           style={{ transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
                                        >
                                            {stat.value}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-0.5 font-medium">{stat.title}</p>
                                    </div>
                                    {/* Mini sparkline bar */}
                                    <div className="mt-3 flex items-end gap-[3px] h-6">
                                        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "flex-1 rounded-sm bg-gradient-to-t opacity-30 group-hover:opacity-60 transition-opacity duration-300",
                                                    g.gradient,
                                                )}
                                                style={{ height: `${h}%` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ========== TWO COLUMN LAYOUT ========== */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                        {/* ===== Upcoming Events ===== */}
                        <div className="lg:col-span-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm">
                            <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-500/20">
                                        <CalendarDays className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-foreground">Upcoming Events</h2>
                                        <p className="text-xs text-muted-foreground">Next scheduled conferences & sessions</p>
                                    </div>
                                </div>
                                <Link
                                    href="/dashboard/events"
                                    className="text-sm text-teal-600 dark:text-teal-400 font-medium hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                                    aria-label="View all upcoming events"
                                >
                                    View all
                                </Link>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {upcomingEvents.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-14 text-center px-4">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-4">
                                            <CalendarDays className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground">No upcoming events</p>
                                        <p className="text-xs text-muted-foreground/70 mt-1">Create an event to get started</p>
                                    </div>
                                ) : upcomingEvents.map((event, idx) => {
                                    const ratio = event.capacity > 0 ? event.registrations / event.capacity : 0;
                                    const progressColor = getProgressColor(ratio);
                                    const fillPct = Math.min(ratio * 100, 100);

                                    return (
                                        <div
                                            key={event.id}
                                            className="group relative p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all duration-200"
                                            style={{ animationDelay: `${idx * 60}ms` }}
                                        >
                                            {/* Color left border accent */}
                                            <div className={cn(
                                                "absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                                                progressColor,
                                            )} />

                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40 border border-teal-200/50 dark:border-teal-800/30 flex items-center justify-center flex-shrink-0">
                                                    <CalendarDays className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-foreground truncate group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                                                        {event.title}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                            <Calendar className="w-3 h-3" />
                                                            {event.date}
                                                        </span>
                                                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                            <Clock className="w-3 h-3" />
                                                            {event.time}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0 min-w-[80px]">
                                                    <p className="text-sm font-bold text-foreground">
                                                        {event.registrations}
                                                        <span className="text-muted-foreground font-normal">/{event.capacity}</span>
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide font-medium">Registered</p>
                                                    {/* Premium progress bar */}
                                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                                                        <div
                                                            className={cn(
                                                                "h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out",
                                                                progressColor,
                                                            )}
                                                            style={{ width: `${fillPct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ===== Recent Registrations ===== */}
                        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm">
                            <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/20">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-foreground">Recent Registrations</h2>
                                        <p className="text-xs text-muted-foreground">Latest participant sign-ups</p>
                                    </div>
                                </div>
                                <Link
                                    href="/dashboard/registrations"
                                    className="text-sm text-violet-600 dark:text-violet-400 font-medium hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                                    aria-label="View all recent registrations"
                                >
                                    View all
                                </Link>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {recentRegistrations.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-14 text-center px-4">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-4">
                                            <Users className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground">No registrations yet</p>
                                        <p className="text-xs text-muted-foreground/70 mt-1">Registrations will appear here</p>
                                    </div>
                                ) : recentRegistrations.map((registration, idx) => {
                                    const statusCfg = getStatusConfig(registration.status);
                                    const initials = registration.name.split(" ").map(n => n[0]).join("").toUpperCase();
                                    return (
                                        <div
                                            key={registration.id}
                                            className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all duration-200"
                                            style={{ animationDelay: `${idx * 60}ms` }}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Avatar with gradient ring */}
                                                <div className="relative flex-shrink-0">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 p-[2px]">
                                                        <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                                                            <span className="text-xs font-bold bg-gradient-to-br from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                                                {initials}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {/* Status dot */}
                                                    <div className={cn(
                                                        "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900",
                                                        statusCfg.dot,
                                                    )} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-foreground truncate">
                                                        {registration.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                        {registration.event}
                                                    </p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize",
                                                        statusCfg.bg,
                                                        statusCfg.text,
                                                    )}>
                                                        <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />
                                                        {registration.status}
                                                    </span>
                                                    <div className="flex items-center justify-end gap-1 mt-1.5">
                                                        <Clock className="w-3 h-3 text-muted-foreground/50" />
                                                        <p className="text-[11px] text-muted-foreground">
                                                            {registration.date}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ========== QUICK ACTIONS ========== */}
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm p-5 sm:p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-200 dark:to-white text-white dark:text-slate-900 shadow-md">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-foreground">Quick Actions</h2>
                                <p className="text-xs text-muted-foreground">Common tasks at your fingertips</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            {[
                                {
                                    label: "Create Event",
                                    description: "Set up a new conference or session",
                                    icon: Plus,
                                    gradient: "from-blue-500 to-cyan-500",
                                    shadow: "shadow-blue-500/20",
                                    href: "/dashboard/events/new",
                                },
                                {
                                    label: "Add Speaker",
                                    description: "Invite faculty & speakers",
                                    icon: Mic2,
                                    gradient: "from-emerald-500 to-teal-500",
                                    shadow: "shadow-emerald-500/20",
                                    href: "/dashboard/speakers/new",
                                },
                                {
                                    label: "Issue Certificate",
                                    description: "Generate & send certificates",
                                    icon: FileCheck,
                                    gradient: "from-violet-500 to-purple-500",
                                    shadow: "shadow-violet-500/20",
                                    href: "/dashboard/certificates",
                                },
                                {
                                    label: "View Reports",
                                    description: "Analytics & insights",
                                    icon: BarChart3,
                                    gradient: "from-amber-500 to-orange-500",
                                    shadow: "shadow-amber-500/20",
                                    href: "/dashboard/reports",
                                },
                            ].map((action, index) => (
                                <Link
                                    key={index}
                                    href={action.href}
                                    className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center"
                                    aria-label={action.label}
                                >
                                    <div className={cn(
                                        "p-3.5 rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110",
                                        action.gradient,
                                        action.shadow,
                                    )}>
                                        <action.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-semibold text-foreground group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-teal-600 group-hover:to-cyan-600 transition-colors block">
                                            {action.label}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground mt-0.5 block leading-tight">
                                            {action.description}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
        </TenantProvider>
    );
}
