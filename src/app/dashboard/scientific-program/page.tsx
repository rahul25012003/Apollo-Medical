"use client";

import { useUIStore } from "@/store";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ScientificProgramTab } from "@/components/events/scientific-program-tab";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ScientificProgramPage() {
    const { selectedEventId } = useUIStore();

    if (!selectedEventId) {
        return (
            <DashboardLayout title="Scientific Program" subtitle="Select an event first">
                <div className="flex flex-col items-center justify-center py-20 text-center p-8">
                    <AlertTriangle className="h-12 w-12 text-amber-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Event Selected</h3>
                    <p className="text-muted-foreground mb-4">
                        Select an event from the sidebar to manage the scientific program.
                    </p>
                    <Link href="/dashboard/events" className="text-primary hover:underline">
                        Go to Events
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Scientific Program" subtitle="Manage sessions, halls, and speakers">
            <ScientificProgramTab eventId={selectedEventId} />
        </DashboardLayout>
    );
}
