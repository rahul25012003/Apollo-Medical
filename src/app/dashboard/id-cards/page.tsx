"use client";

import { useUIStore } from "@/store";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { BadgesTab } from "@/components/events/badges-tab";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { eventsService } from "@/services/events";

export default function IdCardsPage() {
    const { selectedEventId } = useUIStore();
    const [eventTitle, setEventTitle] = useState("");

    useEffect(() => {
        if (!selectedEventId) return;
        eventsService.getById(selectedEventId).then((res) => {
            if (res.success && res.data) {
                setEventTitle(res.data.title);
            }
        });
    }, [selectedEventId]);

    if (!selectedEventId) {
        return (
            <DashboardLayout title="ID Cards" subtitle="Select an event first">
                <div className="flex flex-col items-center justify-center py-20 text-center p-8">
                    <AlertTriangle className="h-12 w-12 text-amber-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Event Selected</h3>
                    <p className="text-muted-foreground mb-4">
                        Select an event from the sidebar to manage ID cards.
                    </p>
                    <Link href="/dashboard/events" className="text-primary hover:underline">
                        Go to Events
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="ID Cards" subtitle="Generate and manage delegate badges">
            <BadgesTab eventId={selectedEventId} eventTitle={eventTitle} />
        </DashboardLayout>
    );
}
