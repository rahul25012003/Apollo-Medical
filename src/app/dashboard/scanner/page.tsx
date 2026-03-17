"use client";

import { useUIStore } from "@/store";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ScannerPage() {
    const { selectedEventId } = useUIStore();
    const router = useRouter();

    useEffect(() => {
        if (selectedEventId) {
            router.replace(`/dashboard/events/${selectedEventId}/scan`);
        }
    }, [selectedEventId, router]);

    if (!selectedEventId) {
        return (
            <DashboardLayout title="Scanner" subtitle="Select an event first">
                <div className="flex flex-col items-center justify-center py-20 text-center p-8">
                    <AlertTriangle className="h-12 w-12 text-amber-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Event Selected</h3>
                    <p className="text-muted-foreground mb-4">
                        Select an event from the sidebar to open the scanner.
                    </p>
                    <Link href="/dashboard/events" className="text-primary hover:underline">
                        Go to Events
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Scanner" subtitle="Redirecting to scanner...">
            <div className="flex items-center justify-center py-20">
                <p className="text-muted-foreground">Redirecting to event scanner...</p>
            </div>
        </DashboardLayout>
    );
}
