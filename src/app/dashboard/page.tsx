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
    CreditCard,
    Mail,
    Eye,
    ArrowRight,
    Presentation,
    Timer,
    Shield,
} from "lucide-react";
import { dashboardService } from "@/services/dashboard";
import { useTenantFilter } from "@/hooks/use-tenant-filter";
import { useSession } from "next-auth/react";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import Link from "next/link";

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

// Premium role accent — deep, rich, sophisticated colors
const roleAccent = {
    ATTENDEE:   { color1: "#0f766e", color2: "#0d9488", label: "Attendee" },
    SPEAKER:    { color1: "#4338ca", color2: "#6366f1", label: "Speaker" },
    ADMIN:      { color1: "#1e3a5f", color2: "#2563eb", label: "Administrator" },
    SUPER_ADMIN: { color1: "#18181b", color2: "#3f3f46", label: "Super Admin" },
    EVENT_MANAGER: { color1: "#5b21b6", color2: "#7c3aed", label: "Event Manager" },
    REGISTRATION_MANAGER: { color1: "#1e40af", color2: "#3b82f6", label: "Registration Manager" },
    CERTIFICATE_MANAGER: { color1: "#9d174d", color2: "#db2777", label: "Certificate Manager" },
};

type RoleKey = keyof typeof roleAccent;

export default function DashboardPage() {
    const { sidebarCollapsed } = useUIStore();
    const { data: session } = useSession();
    const { tenantFilterParams, effectiveTenantId, sessionLoading } = useTenantFilter();
    const userRole = (session?.user?.role || "ATTENDEE") as RoleKey;
    const accent = roleAccent[userRole] || roleAccent.ATTENDEE;
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER", "REGISTRATION_MANAGER", "CERTIFICATE_MANAGER"].includes(userRole);
    const userName = session?.user?.name || (isAdmin ? "Admin" : "there");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [overview, setOverview] = useState({ totalEvents: 0, totalRegistrations: 0, totalCertificates: 0, totalRevenue: 0, monthlyRegistrations: 0 });
    const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
    const [recentRegistrations, setRecentRegistrations] = useState<RecentRegistration[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Delegate-specific state
    const [delegateRegistrationCount, setDelegateRegistrationCount] = useState(0);
    const [delegateCertificateCount, setDelegateCertificateCount] = useState(0);
    const [delegateUpcomingEvents, setDelegateUpcomingEvents] = useState<UpcomingEvent[]>([]);
    const [speakerSessionCount, setSpeakerSessionCount] = useState(0);

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
                setOverview({
                    totalEvents: data.overview.totalEvents,
                    totalRegistrations: data.overview.totalRegistrations,
                    totalCertificates: data.overview.totalCertificates,
                    totalRevenue: data.overview.totalRevenue,
                    monthlyRegistrations: data.overview.monthlyRegistrations,
                });
                setUpcomingEvents(data.upcomingEvents.map((e) => ({
                    id: e.id,
                    title: e.title,
                    date: new Date(e.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
                    time: e.startDate ? new Date(e.startDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "TBD",
                    registrations: e.registeredCount,
                    capacity: e.capacity,
                })));
                setRecentRegistrations(data.recentRegistrations.map((r) => ({
                    id: r.id,
                    name: r.name,
                    event: r.event.title,
                    date: formatTimeAgo(new Date(r.createdAt)),
                    status: r.status.toLowerCase(),
                })));
            } else {
                setError("Failed to load dashboard data.");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchDelegateData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [regsRes, certsRes, sessionsRes] = await Promise.all([
                fetch("/api/users/me/registrations"),
                fetch("/api/users/me/certificates"),
                fetch("/api/users/me/speaker-sessions").catch(() => null),
            ]);
            if (regsRes.ok) {
                const regsData = await regsRes.json();
                if (regsData.success && Array.isArray(regsData.data)) {
                    setDelegateRegistrationCount(regsData.data.length);
                    const now = new Date();
                    const upcoming = regsData.data
                        .filter((r: { event?: { startDate?: string } }) => r.event?.startDate && new Date(r.event.startDate) > now)
                        .map((r: { event: { id: string; title: string; startDate: string } }) => ({
                            id: r.event.id, title: r.event.title,
                            date: new Date(r.event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
                            time: new Date(r.event.startDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
                            registrations: 0, capacity: 0,
                        }));
                    setDelegateUpcomingEvents(upcoming);
                }
            }
            if (certsRes.ok) {
                const certsData = await certsRes.json();
                if (certsData.success && Array.isArray(certsData.data)) setDelegateCertificateCount(certsData.data.length);
            }
            if (sessionsRes?.ok) {
                const sessData = await sessionsRes.json();
                if (sessData.success && Array.isArray(sessData.data)) setSpeakerSessionCount(sessData.data.length);
            }
        } catch {
            setError("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (sessionLoading) return;
        if (!isAdmin) { fetchDelegateData(); } else { fetchDashboardData(); }
    }, [sessionLoading, effectiveTenantId, isAdmin]);

    const formatTimeAgo = (date: Date) => {
        const diffMs = Date.now() - date.getTime();
        const mins = Math.floor(diffMs / 60000);
        const hrs = Math.floor(mins / 60);
        const days = Math.floor(hrs / 24);
        if (mins < 60) return `${mins}m ago`;
        if (hrs < 24) return `${hrs}h ago`;
        return `${days}d ago`;
    };

    const getGreeting = () => {
        const h = currentTime.getHours();
        return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
    };

    const mainCn = cn(
        "pt-16 min-h-screen transition-all duration-300",
        sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64",
        "pl-0"
    );

    const pendingRegistrations = recentRegistrations.filter(r => r.status === "pending").length;

    // ========== SHARED WRAPPER ==========
    const Shell = ({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) => (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
            <Sidebar />
            <Header title="Dashboard" subtitle={subtitle || `Welcome back, ${userName}`} />
            <main className={mainCn}>{children}</main>
        </div>
    );

    // ========== ERROR STATE ==========
    if (error) {
        return (
            <Shell>
                <div className="flex items-center justify-center h-[50vh]">
                    <div className="text-center space-y-4 max-w-sm">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                            <AlertTriangle className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold">Something went wrong</h3>
                        <p className="text-sm text-muted-foreground">{error}</p>
                        <button onClick={() => isAdmin ? fetchDashboardData() : fetchDelegateData()}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all">
                            <Activity className="w-4 h-4" /> Try again
                        </button>
                    </div>
                </div>
            </Shell>
        );
    }

    // ========== LOADING ==========
    if (loading) {
        return <Shell><AiimsLoader /></Shell>;
    }

    // ========== HERO GREETING (shared between all roles) ==========
    const HeroGreeting = () => (
        <div
            className="relative overflow-hidden rounded-2xl p-6 sm:p-8 lg:p-10 mb-6"
            style={{ background: `linear-gradient(135deg, ${accent.color1}, ${accent.color2})` }}
        >
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider">
                            {accent.label}
                        </div>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.15)" }}>
                        {getGreeting()}, <br className="sm:hidden" />{userName}
                    </h1>
                    <p className="text-white/80 text-sm sm:text-base mt-2 max-w-lg font-medium">
                        {isAdmin
                            ? <>You have <span className="text-white font-bold">{upcomingEvents.length} upcoming event{upcomingEvents.length !== 1 ? "s" : ""}</span>{pendingRegistrations > 0 && <> and <span className="text-white font-bold">{pendingRegistrations} pending</span></>}</>
                            : "Access your registrations, certificates, and upcoming events."
                        }
                    </p>
                </div>
                <div className="flex-shrink-0">
                    <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm border border-white/25 shadow-lg">
                        <Clock className="w-4 h-4 text-white" />
                        <div>
                            <p className="text-white text-sm font-bold">
                                {currentTime.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                            </p>
                            <p className="text-white/70 text-xs font-medium">
                                {currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // ========== ATTENDEE / SPEAKER DASHBOARD ==========
    if (!isAdmin) {
        const isSpeaker = speakerSessionCount > 0;

        return (
            <Shell>
                <div className="p-4 sm:p-6 lg:p-8 page-transition">
                    <HeroGreeting />

                    {/* Quick Stats Row */}
                    <div className={cn("grid gap-4 mb-6", isSpeaker ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3")}>
                        {/* Browse Events */}
                        <Link href="/dashboard/browse-events" className="group relative flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800/80 border-2 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="p-3.5 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)", boxShadow: "0 8px 20px rgba(59,130,246,0.3)" }}>
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <span className="text-base font-bold text-slate-800 dark:text-slate-100 block">Browse Events</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Discover conferences</span>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </Link>

                        {/* My Registrations */}
                        <Link href="/dashboard/my-registrations" className="group relative flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800/80 border-2 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="p-3.5 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: "linear-gradient(135deg, #10b981, #14b8a6)", boxShadow: "0 8px 20px rgba(16,185,129,0.3)" }}>
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-4xl font-black text-slate-900 dark:text-white block tracking-tighter leading-none animate-number-pop">{delegateRegistrationCount}</span>
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1 block">Registrations</span>
                            </div>
                        </Link>

                        {/* My Certificates */}
                        <Link href="/dashboard/my-certificates" className="group relative flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800/80 border-2 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="p-3.5 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: "linear-gradient(135deg, #8b5cf6, #a855f7)", boxShadow: "0 8px 20px rgba(139,92,246,0.3)" }}>
                                <Award className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-4xl font-black text-slate-900 dark:text-white block tracking-tighter leading-none animate-number-pop">{delegateCertificateCount}</span>
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1 block">Certificates</span>
                            </div>
                        </Link>

                        {/* Speaker Sessions */}
                        {isSpeaker && (
                            <Link href="/dashboard/my-sessions" className="group relative flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800/80 border-2 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="p-3.5 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", boxShadow: "0 8px 20px rgba(59,130,246,0.3)" }}>
                                    <Presentation className="w-6 h-6" />
                                </div>
                                <div>
                                    <span className="text-4xl font-black text-slate-900 dark:text-white block tracking-tighter leading-none animate-number-pop">{speakerSessionCount}</span>
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1 block">My Sessions</span>
                                </div>
                            </Link>
                        )}
                    </div>

                    {/* Speaker Info Banner */}
                    {isSpeaker && (
                        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-100 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500 text-white shadow-lg">
                                <Mic2 className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-blue-900">Speaker Dashboard</h3>
                                <p className="text-sm text-blue-700/70">You have {speakerSessionCount} session{speakerSessionCount !== 1 ? "s" : ""} assigned. View your schedule and presentation details.</p>
                            </div>
                            <Link href="/dashboard/my-sessions" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors shadow-md">
                                View Sessions <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}

                    {/* Upcoming Events */}
                    <div className="rounded-2xl bg-white dark:bg-slate-800/80 border-2 border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                            <div className="p-2 rounded-lg text-white shadow-md" style={{ background: "linear-gradient(135deg, #10b981, #14b8a6)" }}>
                                <CalendarDays className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-800">Your Upcoming Events</h2>
                                <p className="text-xs text-slate-500">Events you are registered for</p>
                            </div>
                        </div>
                        {delegateUpcomingEvents.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {delegateUpcomingEvents.slice(0, 5).map((event) => (
                                    <Link key={event.id} href={`/dashboard/browse-events/${event.id}`}
                                        className="flex items-center gap-4 p-5 hover:bg-slate-50/80 transition-all group">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200/50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                                            <CalendarDays className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-700 transition-colors">{event.title}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="flex items-center gap-1.5 text-xs text-slate-500"><Calendar className="w-3 h-3" /> {event.date}</span>
                                                <span className="flex items-center gap-1.5 text-xs text-slate-500"><Clock className="w-3 h-3" /> {event.time}</span>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                    <CalendarDays className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="font-semibold text-slate-700 mb-1">No upcoming events yet</h3>
                                <p className="text-sm text-slate-500 mb-4">Browse available events and register to see them here.</p>
                                <Link href="/dashboard/browse-events">
                                    <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all shadow-md">
                                        <Calendar className="w-4 h-4" /> Browse Events
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Quick Help — always visible for attendees */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                        <div className="rounded-2xl bg-white border-2 border-slate-100 p-5 flex items-start gap-4">
                            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 flex-shrink-0">
                                <Eye className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm mb-1">How to Register</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">Browse events, select one, fill the registration form, and complete payment if required. Your registration will be confirmed by the admin.</p>
                            </div>
                        </div>
                        <div className="rounded-2xl bg-white border-2 border-slate-100 p-5 flex items-start gap-4">
                            <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 flex-shrink-0">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm mb-1">Getting Certificates</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">After attending an event, certificates will be issued by the organizer. You can download them from the My Certificates section.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Shell>
        );
    }

    // ========== ADMIN / MANAGER DASHBOARD ==========
    const statCards = [
        { title: "Total Events", value: overview.totalEvents.toString(), icon: Calendar, color1: "#3b82f6", color2: "#06b6d4" },
        { title: "Registrations", value: overview.totalRegistrations.toLocaleString(), sub: `+${overview.monthlyRegistrations} this month`, icon: Users, color1: "#10b981", color2: "#14b8a6" },
        { title: "Certificates", value: overview.totalCertificates.toLocaleString(), icon: Award, color1: "#8b5cf6", color2: "#a855f7" },
        { title: "Revenue", value: `₹${overview.totalRevenue.toLocaleString()}`, icon: DollarSign, color1: "#f59e0b", color2: "#f97316" },
    ];

    const getStatusDot = (status: string) => {
        if (status === "confirmed") return "bg-emerald-500";
        if (status === "pending") return "bg-amber-500";
        return "bg-red-500";
    };

    const getProgressGradient = (ratio: number) => {
        if (ratio >= 0.9) return "linear-gradient(to right, #ef4444, #f43f5e)";
        if (ratio >= 0.7) return "linear-gradient(to right, #f59e0b, #f97316)";
        return "linear-gradient(to right, #0d9488, #14b8a6)";
    };

    return (
        <Shell>
            <div className="p-4 sm:p-6 lg:p-8 page-transition">
                <HeroGreeting />

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {statCards.map((stat, i) => (
                        <div key={i} className="group relative bg-white rounded-2xl border-2 border-slate-100 hover:border-slate-200 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(to right, ${stat.color1}, ${stat.color2})` }} />
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-2.5 rounded-xl text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${stat.color1}, ${stat.color2})`, boxShadow: `0 8px 16px ${stat.color1}30` }}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
                            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{stat.title}</p>
                            {stat.sub && <p className="text-[11px] font-bold mt-1" style={{ color: stat.color1 }}>↑ {stat.sub}</p>}
                            <div className="mt-3 flex items-end gap-[3px] h-5">
                                {[40, 65, 45, 80, 55, 90, 70].map((h, j) => (
                                    <div key={j} className="flex-1 rounded-sm opacity-20 group-hover:opacity-50 transition-opacity" style={{ height: `${h}%`, background: `linear-gradient(to top, ${stat.color1}, ${stat.color2})` }} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Two-column: Events + Registrations */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
                    {/* Upcoming Events */}
                    <div className="lg:col-span-3 rounded-2xl bg-white dark:bg-slate-800/80 border-2 border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg text-white shadow-md" style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
                                    <CalendarDays className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-800">Upcoming Events</h2>
                                    <p className="text-xs text-slate-500">Next scheduled conferences</p>
                                </div>
                            </div>
                            <Link href="/dashboard/events" className="text-sm text-blue-600 font-semibold hover:text-blue-700 transition-colors">View all</Link>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {upcomingEvents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-14 text-center">
                                    <CalendarDays className="w-10 h-10 text-slate-300 mb-3" />
                                    <p className="text-sm text-slate-500">No upcoming events</p>
                                </div>
                            ) : upcomingEvents.map((event) => {
                                const ratio = event.capacity > 0 ? event.registrations / event.capacity : 0;
                                return (
                                    <div key={event.id} className="group flex items-start gap-4 p-5 hover:bg-slate-50/50 transition-all">
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200/50 flex items-center justify-center flex-shrink-0">
                                            <CalendarDays className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{event.title}</h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{event.date}</span>
                                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{event.time}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0 min-w-[70px]">
                                            <p className="text-sm font-extrabold text-slate-900">{event.registrations}<span className="text-slate-400 font-normal">/{event.capacity}</span></p>
                                            <div className="w-full h-2 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(ratio * 100, 100)}%`, background: getProgressGradient(ratio) }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Recent Registrations */}
                    <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-800/80 border-2 border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg text-white shadow-md" style={{ background: "linear-gradient(135deg, #8b5cf6, #a855f7)" }}>
                                    <Users className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-800">Recent Registrations</h2>
                                    <p className="text-xs text-slate-500">Latest sign-ups</p>
                                </div>
                            </div>
                            <Link href="/dashboard/registrations" className="text-sm text-violet-600 font-semibold hover:text-violet-700 transition-colors">View all</Link>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {recentRegistrations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-14 text-center">
                                    <Users className="w-10 h-10 text-slate-300 mb-3" />
                                    <p className="text-sm text-slate-500">No registrations yet</p>
                                </div>
                            ) : recentRegistrations.map((reg) => {
                                const initials = reg.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                                return (
                                    <div key={reg.id} className="flex items-center gap-3 p-4 hover:bg-slate-50/50 transition-all">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, #8b5cf6, #a855f7)" }}>
                                            {initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{reg.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{reg.event}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <span className={cn("inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full capitalize",
                                                reg.status === "confirmed" ? "bg-emerald-50 text-emerald-700" : reg.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                                            )}>
                                                <span className={cn("w-1.5 h-1.5 rounded-full", getStatusDot(reg.status))} />
                                                {reg.status}
                                            </span>
                                            <p className="text-[11px] text-slate-400 mt-1">{reg.date}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-2xl bg-white border-2 border-slate-100 p-5">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 rounded-lg bg-slate-900 text-white shadow-md">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <h2 className="font-bold text-slate-800">Quick Actions</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                        {[
                            { label: "Create Event", icon: Plus, c1: "#3b82f6", c2: "#06b6d4", href: "/dashboard/events/create" },
                            { label: "Registrations", icon: Users, c1: "#10b981", c2: "#14b8a6", href: "/dashboard/registrations" },
                            { label: "Speakers", icon: Mic2, c1: "#6366f1", c2: "#3b82f6", href: "/dashboard/speakers" },
                            { label: "Certificates", icon: FileCheck, c1: "#8b5cf6", c2: "#a855f7", href: "/dashboard/certificates" },
                            { label: "Communications", icon: Mail, c1: "#ec4899", c2: "#f43f5e", href: "/dashboard/communications" },
                            { label: "Reports", icon: BarChart3, c1: "#f59e0b", c2: "#f97316", href: "/dashboard/reports" },
                        ].map((a, i) => (
                            <Link key={i} href={a.href}
                                className="group flex flex-col items-center gap-2.5 p-4 rounded-xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-center">
                                <div className="p-3 rounded-xl text-white shadow-md group-hover:scale-110 transition-transform" style={{ background: `linear-gradient(135deg, ${a.c1}, ${a.c2})` }}>
                                    <a.icon className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold text-slate-700">{a.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </Shell>
    );
}
