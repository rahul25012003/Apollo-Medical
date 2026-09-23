"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useUIStore } from "@/store";
import { cn } from "@/lib/utils";
import { useTenant } from "@/lib/tenant/context";
import { useIfpcEvent } from "@/components/ifpc/useIfpcEvent";
import { ExpressInterestButton } from "@/components/ifpc/ExpressInterestButton";
import { CampusPhotoSlideshow } from "@/components/ifpc/CampusPhotoSlideshow";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { Card, CardContent } from "@/components/ui/card";
import { Landmark, Clock } from "lucide-react";
import { HIGHLIGHTS } from "@/content/ifpc-2026";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import { notFound } from "next/navigation";
import { useIsIfpcDashboard } from "@/components/ifpc/guard";

export default function CampusTourPage() {
    // IFPC (apollo-medical) only — this page doesn't exist for other tenants.
    const ifpcCheck = useIsIfpcDashboard();
    if (!ifpcCheck.loading && !ifpcCheck.isIfpc) notFound();
    const { sidebarCollapsed } = useUIStore();
    const { tenant, isLoading: tenantLoading } = useTenant();
    const isIfpc = tenant?.slug === IFPC_TENANT_SLUG;
    const { event, loading: eventLoading } = useIfpcEvent();

    const loading = tenantLoading || (isIfpc && eventLoading);
    const tourItem = HIGHLIGHTS.delegateExperience.items.find((it) => it.title.toLowerCase().includes("campus tour"));
    const tourSession = event?.eventSessions?.find((s) => s.title.toLowerCase().includes("campus tour"));

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
            <Sidebar />
            <Header title="Campus Tour" subtitle="NIMHANS guided campus tour sign-up" />
            <main
                className={cn(
                    "pt-16 min-h-screen transition-all duration-300",
                    sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
                )}
            >
                <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
                    {loading ? (
                        <div className="flex justify-center py-20"><AiimsLoader /></div>
                    ) : (
                    <div className="space-y-6">
                    <CampusPhotoSlideshow />
                    {!isIfpc || !tourSession ? (
                        <Card className="border-0 shadow-sm">
                            <CardContent className="py-16 text-center text-muted-foreground">
                                <Landmark className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p>The campus tour isn&apos;t open for sign-up yet.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-6 sm:p-8">
                                <div className="flex items-start gap-4">
                                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                                        <Landmark className="h-6 w-6" />
                                    </span>
                                    <div className="flex-1">
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{tourItem?.title || tourSession.title}</h2>
                                        <p className="text-muted-foreground mt-2 leading-relaxed">{tourItem?.text}</p>
                                        {tourSession.startTime && (
                                            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-3">
                                                <Clock className="h-3.5 w-3.5" />
                                                {tourSession.startTime}{tourSession.endTime ? `–${tourSession.endTime}` : ""}
                                            </p>
                                        )}
                                        <div className="mt-5">
                                            <ExpressInterestButton sessionId={tourSession.id} />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    </div>
                    )}
                </div>
            </main>
        </div>
    );
}
