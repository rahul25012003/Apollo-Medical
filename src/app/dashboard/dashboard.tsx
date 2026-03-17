"use client";

import React, { useEffect, useState } from "react";
import {
    Calendar,
    Users,
    IndianRupee,
    Award,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Mic2,
    Inbox,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { dashboardService } from "@/services/dashboard";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { useTenantFilter } from "@/hooks/use-tenant-filter";

interface StatItem {
    title: string;
    value: string;
    change: string;
    trend: "up" | "down";
    icon: React.ElementType;
    color: string;
}

interface RegistrationItem {
    name: string;
    event: string;
    amount: string;
    time: string;
    status: string;
}

interface EventItem {
    name: string;
    date: string;
    slots: string;
    status: string;
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    );
}

export default function DashboardPage() {
    const { tenantFilterParams, effectiveTenantId, sessionLoading } = useTenantFilter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<StatItem[]>([]);
    const [recentRegistrations, setRecentRegistrations] = useState<RegistrationItem[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);

    useEffect(() => {
        if (sessionLoading) return;

        async function fetchDashboardData() {
            try {
                setLoading(true);
                const tenantId = tenantFilterParams.tenantId;
                const response = await dashboardService.getStats(tenantId);

                if (response.success && response.data) {
                    const data = response.data;

                    setStats([
                        {
                            title: "Total Events",
                            value: data.overview.totalEvents.toString(),
                            change: data.overview.totalEvents > 0 ? "+12%" : "0%",
                            trend: "up",
                            icon: Calendar,
                            color: "bg-blue-500",
                        },
                        {
                            title: "Registrations",
                            value: data.overview.totalRegistrations.toLocaleString(),
                            change: `+${data.overview.monthlyRegistrations}`,
                            trend: "up",
                            icon: Users,
                            color: "bg-green-500",
                        },
                        {
                            title: "Revenue",
                            value: `₹${data.overview.totalRevenue.toLocaleString()}`,
                            change: "0%",
                            trend: "up",
                            icon: IndianRupee,
                            color: "bg-purple-500",
                        },
                        {
                            title: "Certificates Issued",
                            value: data.overview.totalCertificates.toLocaleString(),
                            change: "0%",
                            trend: "up",
                            icon: Award,
                            color: "bg-orange-500",
                        },
                    ]);

                    setUpcomingEvents(data.upcomingEvents.map((e) => ({
                        name: e.title,
                        date: new Date(e.startDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                        }),
                        slots: `${e.registeredCount}/${e.capacity}`,
                        status: new Date(e.startDate) > new Date() ? "open" : "upcoming",
                    })));

                    setRecentRegistrations(data.recentRegistrations.map((r) => ({
                        name: r.name,
                        event: r.event.title,
                        amount: "",
                        time: formatTimeAgo(new Date(r.createdAt)),
                        status: r.status.toLowerCase(),
                    })));
                } else {
                    setDefaultEmptyState();
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
                setDefaultEmptyState();
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, [sessionLoading, effectiveTenantId]);

    function setDefaultEmptyState() {
        setStats([
            { title: "Total Events", value: "0", change: "0%", trend: "up", icon: Calendar, color: "bg-blue-500" },
            { title: "Registrations", value: "0", change: "0%", trend: "up", icon: Users, color: "bg-green-500" },
            { title: "Revenue", value: "₹0", change: "0%", trend: "up", icon: IndianRupee, color: "bg-purple-500" },
            { title: "Certificates Issued", value: "0", change: "0%", trend: "up", icon: Award, color: "bg-orange-500" },
        ]);
        setRecentRegistrations([]);
        setUpcomingEvents([]);
    }

    function formatTimeAgo(date: Date) {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${diffDays} days ago`;
    }

    if (loading) {
        return (
            <div className="space-y-6 animate-fadeIn">
                <AiimsLoader />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome back! Here&apos;s what&apos;s happening with your events.
                    </p>
                </div>
                <Button>
                    <Calendar className="mr-2 h-4 w-4" />
                    Create Event
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <div className={`rounded-lg p-2 ${stat.color}`}>
                                <stat.icon className="h-4 w-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <div className="flex items-center gap-1 text-xs">
                                {stat.trend === "up" ? (
                                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                                ) : (
                                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                                )}
                                <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>
                                    {stat.change}
                                </span>
                                <span className="text-muted-foreground">from last month</span>
                            </div>
                        </CardContent>
                        <div className={`absolute bottom-0 left-0 right-0 h-1 ${stat.color}`} />
                    </Card>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-7">
                {/* Recent Registrations */}
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Recent Registrations</CardTitle>
                                <CardDescription>Latest conference registrations</CardDescription>
                            </div>
                            <Button variant="outline" size="sm">View All</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recentRegistrations.length === 0 ? (
                            <EmptyState message="No registrations yet. Registrations will appear here as attendees sign up for your events." />
                        ) : (
                            <div className="space-y-4">
                                {recentRegistrations.map((reg, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    {reg.name.split(" ").map(n => n[0]).join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm">{reg.name}</p>
                                                <p className="text-xs text-muted-foreground">{reg.event}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {reg.amount && <p className="font-semibold text-sm">{reg.amount}</p>}
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {reg.time}
                                            </div>
                                        </div>
                                        <Badge variant={reg.status === "paid" || reg.status === "confirmed" ? "success" : "warning"}>
                                            {reg.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Upcoming Events */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Upcoming Events</CardTitle>
                                <CardDescription>Events scheduled for this quarter</CardDescription>
                            </div>
                            <Button variant="outline" size="sm">View All</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {upcomingEvents.length === 0 ? (
                            <EmptyState message="No upcoming events. Create an event to get started." />
                        ) : (
                            <div className="space-y-4">
                                {upcomingEvents.map((event, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Calendar className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{event.name}</p>
                                                <p className="text-xs text-muted-foreground">{event.date}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant={event.status === "open" ? "default" : "secondary"}>
                                                {event.status}
                                            </Badge>
                                            <p className="text-xs text-muted-foreground mt-1">{event.slots} slots</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks you can perform</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Button variant="outline" className="h-24 flex-col gap-2">
                            <Calendar className="h-6 w-6" />
                            <span>Create Event</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex-col gap-2">
                            <Mic2 className="h-6 w-6" />
                            <span>Add Speaker</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex-col gap-2">
                            <Award className="h-6 w-6" />
                            <span>Generate Certificates</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex-col gap-2">
                            <Users className="h-6 w-6" />
                            <span>Manage Users</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
