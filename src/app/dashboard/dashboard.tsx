"use client";

import React from "react";
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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const stats = [
    {
        title: "Total Events",
        value: "24",
        change: "+12%",
        trend: "up",
        icon: Calendar,
        color: "bg-blue-500",
    },
    {
        title: "Registrations",
        value: "1,248",
        change: "+23%",
        trend: "up",
        icon: Users,
        color: "bg-green-500",
    },
    {
        title: "Revenue",
        value: "₹12.4L",
        change: "+18%",
        trend: "up",
        icon: IndianRupee,
        color: "bg-purple-500",
    },
    {
        title: "Certificates Issued",
        value: "856",
        change: "+8%",
        trend: "up",
        icon: Award,
        color: "bg-orange-500",
    },
];

const recentRegistrations = [
    { name: "Dr. Priya Sharma", event: "Epilepsy Management CME", amount: "₹1,500", time: "2 mins ago", status: "paid" },
    { name: "Dr. Rajesh Kumar", event: "Neurostimulation Summit 2026", amount: "₹5,000", time: "15 mins ago", status: "pending" },
    { name: "Dr. Ananya Patel", event: "DBS Workshop", amount: "₹3,800", time: "1 hour ago", status: "paid" },
    { name: "Dr. Vikram Singh", event: "Neurostimulation Summit 2026", amount: "₹5,000", time: "2 hours ago", status: "paid" },
    { name: "Dr. Meera Krishnan", event: "Neural Engineering Symposium", amount: "₹1,500", time: "3 hours ago", status: "paid" },
];

const upcomingEvents = [
    { name: "Epilepsy Management CME Session", date: "Dec 29, 2025", slots: "72/80", status: "open" },
    { name: "Deep Brain Stimulation Workshop", date: "Jan 5, 2026", slots: "27/30", status: "open" },
    { name: "National Neurostimulation Summit 2026", date: "Jan 10-11, 2026", slots: "156/200", status: "open" },
    { name: "Neural Engineering Research Symposium", date: "Jan 18, 2026", slots: "89/200", status: "upcoming" },
];

export default function DashboardPage() {
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
                                        <p className="font-semibold text-sm">{reg.amount}</p>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {reg.time}
                                        </div>
                                    </div>
                                    <Badge variant={reg.status === "paid" ? "success" : "warning"}>
                                        {reg.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
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