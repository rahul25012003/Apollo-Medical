"use client";

import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useUIStore } from "@/store";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
}

// Role accent colors
// Premium role accent colors
const roleColors: Record<string, string> = {
    ATTENDEE: "#0d9488",
    SUPER_ADMIN: "#a1a1aa",
    ADMIN: "#2563eb",
    EVENT_MANAGER: "#7c3aed",
    REGISTRATION_MANAGER: "#3b82f6",
    CERTIFICATE_MANAGER: "#db2777",
};

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
    const { sidebarCollapsed } = useUIStore();
    const { data: session } = useSession();
    const accentColor = roleColors[session?.user?.role || "ATTENDEE"] || roleColors.ATTENDEE;

    return (
        <div className="min-h-screen bg-slate-50/50">
            <Sidebar />
            <Header title={title} subtitle={subtitle} />

            <main className={cn(
                "relative pt-16 min-h-screen transition-all duration-300 ease-in-out",
                sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64",
                "pl-0"
            )}>
                <div className="p-4 sm:p-6 lg:p-8">
                    {/* Premium Page Header */}
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <h1 className="section-heading">{title}</h1>
                            {subtitle && (
                                <p className="text-sm text-slate-500 mt-1.5 max-w-2xl">{subtitle}</p>
                            )}
                            <div
                                className="h-1 w-16 rounded-full mt-3"
                                style={{ background: `linear-gradient(to right, ${accentColor}, ${accentColor}60)` }}
                            />
                        </div>
                    </div>

                    {/* Page content */}
                    {children}
                </div>
            </main>
        </div>
    );
}
