"use client";

import { useUIStore } from "@/store";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AlertTriangle, MessageSquare, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { eventsService, EventEngagement } from "@/services/events";

export default function EngagementPage() {
    const { selectedEventId } = useUIStore();
    const [engagements, setEngagements] = useState<EventEngagement[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedEventId) return;
        setLoading(true);
        eventsService.getEngagements(selectedEventId)
            .then((res) => {
                if (res.success && Array.isArray(res.data)) {
                    setEngagements(res.data);
                }
            })
            .catch(() => { /* silently fail */ })
            .finally(() => setLoading(false));
    }, [selectedEventId]);

    if (!selectedEventId) {
        return (
            <DashboardLayout title="Engagement" subtitle="Select an event first">
                <div className="flex flex-col items-center justify-center py-20 text-center p-8">
                    <AlertTriangle className="h-12 w-12 text-amber-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Event Selected</h3>
                    <p className="text-muted-foreground mb-4">
                        Select an event from the sidebar to manage engagements.
                    </p>
                    <Link href="/dashboard/events" className="text-primary hover:underline">
                        Go to Events
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Engagement" subtitle="Manage polls, Q&A, and interactive content">
            <div className="space-y-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <p className="text-muted-foreground">Loading engagements...</p>
                    </div>
                ) : engagements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground/40 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Engagements Yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Create polls, Q&A sessions, and other interactive content for your event.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {engagements.map((engagement) => (
                            <div
                                key={engagement.id}
                                className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-sm">{engagement.title}</h3>
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                        engagement.isActive
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-600"
                                    }`}>
                                        {engagement.isActive ? "Active" : "Inactive"}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2 capitalize">{engagement.type}</p>
                                {engagement.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">{engagement.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
