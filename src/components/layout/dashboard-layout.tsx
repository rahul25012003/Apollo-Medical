"use client";

import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useUIStore } from "@/store";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
    const { sidebarCollapsed } = useUIStore();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-white to-teal-50/30 relative">
            {/* Ambient floating orbs - light, visionary background */}
            <div className="ambient-bg">
                <div className="orb orb-1" />
                <div className="orb orb-2" />
                <div className="orb orb-3" />
                <div className="orb orb-4" />
            </div>

            {/* Mesh gradient overlay */}
            <div className="fixed inset-0 pointer-events-none z-0 mesh-gradient-bg" />

            <Sidebar />
            <Header title={title} subtitle={subtitle} />

            <main className={cn(
                "relative z-10 pt-16 min-h-screen transition-all duration-300 ease-in-out",
                sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64",
                "pl-0"
            )}>
                <div className="p-4 sm:p-6 lg:p-8">
                    {/* Premium Page Header */}
                    <div className="page-header-premium mb-8">
                        <div className="relative z-10">
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-sm sm:text-base text-slate-500 mt-1.5 max-w-2xl">
                                    {subtitle}
                                </p>
                            )}
                            <div className="h-1 w-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full mt-3" />
                        </div>
                    </div>

                    {/* Page content with stagger animation */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
