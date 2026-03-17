"use client";

import { useUIStore } from "@/store";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AccessControlDashboard } from "@/components/events/access-control-dashboard";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AccessControlPage() {
    const { selectedEventId } = useUIStore();

    if (!selectedEventId) {
        return (
            <DashboardLayout title="Access Control" subtitle="Select an event first">
                <div className="flex flex-col items-center justify-center py-20 text-center p-8">
                    <AlertTriangle className="h-12 w-12 text-amber-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Event Selected</h3>
                    <p className="text-muted-foreground mb-4">
                        Select an event from the sidebar to manage access control.
                    </p>
                    <Link href="/dashboard/events" className="text-primary hover:underline">
                        Go to Events
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Access Control" subtitle="Manage zones, scan points, and access">
            <AccessControlDashboard eventId={selectedEventId} />
        </DashboardLayout>
    );
}
