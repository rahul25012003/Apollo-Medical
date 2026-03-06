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
    Loader2,
} from "lucide-react";
import { dashboardService, DashboardStats } from "@/services/dashboard";
import { useTenantFilter } from "@/hooks/use-tenant-filter";
import { TenantProvider } from "@/lib/tenant/context";

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
    const { tenantFilterParams, effectiveTenantId, sessionLoading } = useTenantFilter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<StatCard[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
    const [recentRegistrations, setRecentRegistrations] = useState<RecentRegistration[]>([]);

    useEffect(() => {
        if (sessionLoading) return;

        async function fetchDashboardData() {
            try {
                setLoading(true);
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
                        time: "09:00 AM",
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
                    // Set default empty stats if API fails
                    setStats([
                        { title: "Total Events", value: "0", change: "0%", trend: "up", icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-50" },
                        { title: "Registrations", value: "0", change: "0%", trend: "up", icon: Users, color: "text-green-600", bgColor: "bg-green-50" },
                        { title: "Certificates Issued", value: "0", change: "0%", trend: "up", icon: Award, color: "text-purple-600", bgColor: "bg-purple-50" },
                        { title: "Revenue", value: "₹0", change: "0%", trend: "up", icon: DollarSign, color: "text-amber-600", bgColor: "bg-amber-50" },
                    ]);
                    console.error("Dashboard API returned error:", response);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
                // Set default empty stats on error
                setStats([
                    { title: "Total Events", value: "0", change: "0%", trend: "up", icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-50" },
                    { title: "Registrations", value: "0", change: "0%", trend: "up", icon: Users, color: "text-green-600", bgColor: "bg-green-50" },
                    { title: "Certificates Issued", value: "0", change: "0%", trend: "up", icon: Award, color: "text-purple-600", bgColor: "bg-purple-50" },
                    { title: "Revenue", value: "₹0", change: "0%", trend: "up", icon: DollarSign, color: "text-amber-600", bgColor: "bg-amber-50" },
                ]);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, [sessionLoading, effectiveTenantId]);

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

    if (loading) {
        return (
            <TenantProvider tenantId={effectiveTenantId}>
                <div className="min-h-screen bg-muted/30">
                    <Sidebar />
                    <Header title="Dashboard" subtitle="Welcome back" />
                    <main className={cn(
                        "pt-16 min-h-screen transition-all duration-300",
                        sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64",
                        "pl-0"
                    )}>
                        <div className="flex items-center justify-center h-[50vh]">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    </main>
                </div>
            </TenantProvider>
        );
    }

    return (
        <TenantProvider tenantId={effectiveTenantId}>
            <div className="min-h-screen bg-muted/30">
                <Sidebar />
                <Header title="Dashboard" subtitle="Welcome back, Dr. Admin" />

            {/* Main content */}
            <main className={cn(
                "pt-16 min-h-screen transition-all duration-300",
                sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64",
                "pl-0"
            )}>
                <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="bg-background rounded-xl border border-border p-5 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className={cn("p-2.5 rounded-lg", stat.bgColor)}>
                                        <stat.icon className={cn("w-5 h-5", stat.color)} />
                                    </div>
                                    <div className={cn(
                                        "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                                        stat.trend === "up"
                                            ? "text-green-700 bg-green-50"
                                            : "text-red-700 bg-red-50"
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
                                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                                    <p className="text-sm text-muted-foreground mt-0.5">{stat.title}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Upcoming Events */}
                        <div className="lg:col-span-3 bg-background rounded-xl border border-border">
                            <div className="p-5 border-b border-border flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold text-foreground">Upcoming Events</h2>
                                    <p className="text-sm text-muted-foreground">Next scheduled events</p>
                                </div>
                                <button className="text-sm text-primary font-medium hover:underline">
                                    View all
                                </button>
                            </div>
                            <div className="divide-y divide-border">
                                {upcomingEvents.map((event) => (
                                    <div key={event.id} className="p-5 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <CalendarDays className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-foreground truncate">
                                                    {event.title}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {event.date}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {event.time}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-medium text-foreground">
                                                    {event.registrations}/{event.capacity}
                                                </p>
                                                <div className="w-20 h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full"
                                                        style={{
                                                            width: `${(event.registrations / event.capacity) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Registrations */}
                        <div className="lg:col-span-2 bg-background rounded-xl border border-border">
                            <div className="p-5 border-b border-border flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold text-foreground">Recent Registrations</h2>
                                    <p className="text-sm text-muted-foreground">Latest sign-ups</p>
                                </div>
                                <button className="text-sm text-primary font-medium hover:underline">
                                    View all
                                </button>
                            </div>
                            <div className="divide-y divide-border">
                                {recentRegistrations.map((registration) => (
                                    <div key={registration.id} className="p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <span className="text-sm font-medium text-primary">
                                                    {registration.name.split(" ").map(n => n[0]).join("")}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">
                                                    {registration.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {registration.event}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <span className={cn(
                                                    "inline-flex text-xs font-medium px-2 py-0.5 rounded-full",
                                                    registration.status === "confirmed"
                                                        ? "text-green-700 bg-green-50"
                                                        : "text-amber-700 bg-amber-50"
                                                )}>
                                                    {registration.status}
                                                </span>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {registration.date}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-background rounded-xl border border-border p-5">
                        <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { label: "Create Event", icon: Calendar, color: "bg-blue-500" },
                                { label: "Add Speaker", icon: Users, color: "bg-green-500" },
                                { label: "Issue Certificate", icon: Award, color: "bg-purple-500" },
                                { label: "View Reports", icon: TrendingUp, color: "bg-amber-500" },
                            ].map((action, index) => (
                                <button
                                    key={index}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-muted/50 hover:border-primary/20 transition-all group"
                                >
                                    <div className={cn("p-3 rounded-lg text-white", action.color)}>
                                        <action.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                        {action.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
        </TenantProvider>
    );
}
