"use client";

import { useIsIfpcDashboard } from "@/components/ifpc/guard";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import IfpcPage from "./ifpc-page";
import LegacyPage from "./legacy-page";

// IFPC (apollo-medical) gets the current page. Every other tenant keeps the
// original pre-IFPC page, unchanged, in ./legacy-page.tsx.
export default function Page() {
    const { isIfpc, loading } = useIsIfpcDashboard();
    if (loading) {
        return (
            <DashboardLayout title="Registrations" subtitle="Loading...">
                <div className="min-h-[50vh] flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full" /></div>
            </DashboardLayout>
        );
    }
    return isIfpc ? <IfpcPage /> : <LegacyPage />;
}
