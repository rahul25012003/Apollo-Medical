"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Brain, Calendar, CreditCard, Award, Mail, Shield, Zap } from "lucide-react";

interface TenantBranding {
    name: string;
    tagline: string | null;
    logo: string | null;
    primaryColor: string;
    secondaryColor: string;
}

const features = [
    { icon: Calendar, text: "Event & Session Management" },
    { icon: CreditCard, text: "Secure Payment Processing" },
    { icon: Award, text: "Certificate Generation" },
    { icon: Mail, text: "Automated Communications" },
];

function AuthLayoutInner({ children }: { children: React.ReactNode }) {
    const searchParams = useSearchParams();
    const tenantSlug = searchParams.get("tenant");
    const [branding, setBranding] = React.useState<TenantBranding | null>(null);

    React.useEffect(() => {
        if (!tenantSlug) return;

        fetch(`/api/tenants/${tenantSlug}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.success && data.data) {
                    const t = data.data;
                    setBranding({
                        name: t.branding?.name || t.name || "ICMS",
                        tagline: t.branding?.tagline || t.tagline || null,
                        logo: t.branding?.logo || t.logo || null,
                        primaryColor: t.theme?.primaryColor || t.primaryColor || "#0d9488",
                        secondaryColor: t.theme?.secondaryColor || t.secondaryColor || "#0891b2",
                    });
                }
            })
            .catch(console.error);
    }, [tenantSlug]);

    // Use inline styles when tenant branding is present to override CSS --primary variable
    const panelBg = branding
        ? { background: branding.primaryColor }
        : undefined;
    const gradientBg = branding
        ? { background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})` }
        : undefined;

    const displayName = branding?.name || "ICMS";
    const displayTagline = branding?.tagline || "Conference Management";

    return (
        <div className="min-h-screen flex">
            {/* Left side - Branding */}
            <div
                className={`hidden lg:flex lg:w-1/2 relative overflow-hidden ${!branding ? "bg-primary" : ""}`}
                style={panelBg}
            >
                {/* Background decorations */}
                <div className="absolute inset-0">
                    {/* Gradient overlay */}
                    <div
                        className={`absolute inset-0 ${!branding ? "bg-gradient-to-br from-primary via-primary to-primary/80" : ""}`}
                        style={gradientBg}
                    />

                    {/* Grid pattern */}
                    <div className="absolute inset-0 opacity-[0.03]">
                        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                    </div>

                    {/* Floating orbs */}
                    <div className="absolute top-1/4 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
                    {/* Top - Logo */}
                    <div>
                        <div className="flex items-center gap-3">
                            {branding?.logo ? (
                                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10 overflow-hidden">
                                    <img src={branding.logo} alt={displayName} className="w-full h-full object-contain" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                                    <Brain className="w-7 h-7 text-white" />
                                </div>
                            )}
                            <div>
                                <h2 className="text-white font-bold text-xl">{displayName}</h2>
                                <p className="text-white/50 text-xs">{displayTagline}</p>
                            </div>
                        </div>
                    </div>

                    {/* Middle - Hero */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            {branding?.tagline ? (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm">
                                    <Zap className="w-3.5 h-3.5 text-yellow-300" />
                                    <span className="text-white/80 text-xs font-medium">{branding.tagline}</span>
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm">
                                    <Zap className="w-3.5 h-3.5 text-yellow-300" />
                                    <span className="text-white/80 text-xs font-medium">Conference Management System</span>
                                </div>
                            )}
                            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.1] tracking-tight">
                                Streamline Your
                                <br />
                                <span className="text-white/70">
                                    {branding ? branding.name : "Medical Conferences"}
                                </span>
                            </h1>
                            <p className="text-white/60 text-lg max-w-md leading-relaxed">
                                A comprehensive platform for managing CME sessions, workshops, and professional development events.
                            </p>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-2 gap-3">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm group hover:bg-white/10 transition-colors"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                        <feature.icon className="w-4.5 h-4.5 text-white/80" />
                                    </div>
                                    <span className="text-white/80 text-sm font-medium">{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom - Stats or Trust */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-white/50">
                            <Shield className="w-4 h-4" />
                            <span className="text-xs">Enterprise Security</span>
                        </div>
                        <div className="w-px h-4 bg-white/20" />
                        <div className="text-white/50 text-xs">
                            HIPAA Compliant
                        </div>
                        <div className="w-px h-4 bg-white/20" />
                        <div className="text-white/50 text-xs">
                            256-bit Encryption
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Auth form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background">
                {/* Subtle background pattern */}
                <div className="absolute inset-0 lg:left-1/2 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/[0.02] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/[0.02] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                </div>

                <div className="w-full max-w-[420px] relative">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense>
            <AuthLayoutInner>{children}</AuthLayoutInner>
        </Suspense>
    );
}
