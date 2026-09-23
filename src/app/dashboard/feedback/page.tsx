"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useUIStore } from "@/store";
import { cn } from "@/lib/utils";
import { useIfpcEvent } from "@/components/ifpc/useIfpcEvent";
import { IfpcFeedbackForms } from "@/components/ifpc/IfpcFeedbackForms";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { Card, CardContent } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { useIsIfpcDashboard } from "@/components/ifpc/guard";

export default function FeedbackPage() {
    // IFPC (apollo-medical) only — this page doesn't exist for other tenants.
    const ifpcCheck = useIsIfpcDashboard();
    if (!ifpcCheck.loading && !ifpcCheck.isIfpc) notFound();
    const { sidebarCollapsed } = useUIStore();
    const { event, loading } = useIfpcEvent();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
            <Sidebar />
            <Header title="Feedback" subtitle="Share feedback on sessions, workshops and the conference" />
            <main className={cn("pt-16 min-h-screen transition-all duration-300", sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64")}>
                <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
                    {ifpcCheck.loading || loading ? (
                        <div className="flex justify-center py-20"><AiimsLoader /></div>
                    ) : (
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-5 sm:p-8">
                                {event ? (
                                    <IfpcFeedbackForms event={event} />
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center">Feedback isn&apos;t open yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
