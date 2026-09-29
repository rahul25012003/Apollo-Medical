"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import "./ifpc-login.css";
import {
    Mail,
    Lock,
    ArrowRight,
    ArrowLeft,
    Info,
    Stethoscope,
    Shield,
    Sparkles,
    Heart,
    Activity,
    Eye,
    EyeOff,
    CalendarDays,
} from "lucide-react";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface TenantBranding {
    name: string;
    logo: string | null;
    primaryColor: string;
    secondaryColor: string;
}

function LoginPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tenantSlugFromParam = searchParams.get("tenant");

    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [tenantBranding, setTenantBranding] = React.useState<TenantBranding | null>(null);
    // Resolved tenant slug — from query param OR hostname detection
    const [resolvedTenantSlug, setResolvedTenantSlug] = React.useState<string | null>(tenantSlugFromParam);
    const [isTenantLogin, setIsTenantLogin] = React.useState(!!tenantSlugFromParam);
    // Scoped strictly to apollo-medical — other tenants keep the original
    // "Admin Login" wording; only this tenant's delegates now have a real
    // password, so only here does the toggle need less admin-sounding text.
    const isIfpcLogin = resolvedTenantSlug === IFPC_TENANT_SLUG;

    // After mount: detect if this is a tenant login from hostname (production)
    React.useEffect(() => {
        const local = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (tenantSlugFromParam) {
            // Has explicit param — definitely tenant login
            setIsTenantLogin(true);
        } else if (!local) {
            // Production domain — tenant login (will be resolved by hostname fetch)
            setIsTenantLogin(true);
        } else {
            // Localhost with no param — ICMS admin login
            setIsTenantLogin(false);
        }
    }, [tenantSlugFromParam]);

    // Compute the "home" URL
    const [homeHref, setHomeHref] = React.useState("/");
    React.useEffect(() => {
        const local = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        setHomeHref(local && resolvedTenantSlug ? `/t/${resolvedTenantSlug}` : "/");
    }, [resolvedTenantSlug]);

    // Fetch tenant branding — detect from param OR hostname
    React.useEffect(() => {
        async function fetchTenant() {
            try {
                let response: Response | null = null;
                let detectedSlug: string | null = tenantSlugFromParam;

                // Try 1: query param tenant slug
                if (tenantSlugFromParam) {
                    response = await fetch(`/api/tenants/${tenantSlugFromParam}`);
                }

                // Try 2: hostname as domain (production — no query param needed)
                if (!response?.ok && typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                    const hostname = window.location.hostname.replace(/^www\./, '');
                    response = await fetch(`/api/tenants/${hostname}`);
                }

                // No tenant found — ICMS defaults
                if (!response?.ok) {
                    document.title = "ICMS — Login";
                    setResolvedTenantSlug(null);
                    setIsTenantLogin(false);
                    return;
                }

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        const t = data.data;
                        const name = t.branding?.name || t.name || "";
                        const slug = t.slug || detectedSlug;
                        const favicon = t.branding?.favicon || t.favicon || null;
                        setTenantBranding({
                            name,
                            logo: t.branding?.logo || t.logo || null,
                            primaryColor: t.theme?.primaryColor || t.primaryColor || "#0d9488",
                            secondaryColor: t.theme?.secondaryColor || t.secondaryColor || "#0891b2",
                        });
                        if (slug) setResolvedTenantSlug(slug);
                        document.title = `Login — ${name}`;
                        if (favicon) {
                            let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
                            if (link) { link.href = favicon; } else { link = document.createElement("link"); link.rel = "icon"; link.href = favicon; document.head.appendChild(link); }
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch tenant branding:", err);
            }
        }

        fetchTenant();
    }, [tenantSlugFromParam]);

    // Password visibility toggle
    const [showPassword, setShowPassword] = React.useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "", rememberMe: false },
    });

    const onAdminSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await signIn("credentials", {
                email: data.email,
                password: data.password,
                tenantSlug: resolvedTenantSlug || "",
                redirect: false,
            });

            if (result?.error) {
                if (result.error.includes("WRONG_TENANT")) {
                    setError("No account found for this email on this platform. Please make sure you're logging into the correct conference portal.");
                } else if (result.error.includes("ICMS_SUPER_ADMIN_ONLY")) {
                    setError("This login is for platform administrators only. Please login through your conference portal.");
                } else if (result.error.includes("Account is deactivated")) {
                    setError("Your account has been deactivated. Please contact the administrator.");
                } else {
                    setError(result.error === "CredentialsSignin"
                        ? "Invalid email or password"
                        : result.error);
                }
                setIsLoading(false);
                return;
            }

            if (result?.ok) {
                router.push("/dashboard");
                router.refresh();
            } else {
                setError("Login failed. Please try again.");
                setIsLoading(false);
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("An error occurred. Please try again.");
            setIsLoading(false);
        }
    };

    const brandName = tenantBranding?.name || "";
    const nameWords = brandName.split(" ");
    // "International Forensic Psychiatry Conference 2026": the year becomes a badge.
    const year = /^\d{4}$/.test(nameWords[nameWords.length - 1] || "") ? nameWords.pop() : null;

    return (
        <div className="ifpc-lg">
            {/* ===== LEFT: welcome over the venue ===== */}
            <aside className="ifpc-lg-left">
                <img src="/ifpc/convention-centre.jpg" alt="" className="ifpc-lg-photo" aria-hidden="true" />
                <div className="ifpc-lg-veil" aria-hidden="true" />
                <div className="ifpc-lg-left-inner">
                    <Link href={homeHref} className="ifpc-lg-back">
                        <ArrowLeft aria-hidden="true" /> Back to Home
                    </Link>

                    <div className="ifpc-lg-brand">
                        <span className="ifpc-lg-logo">
                            {tenantBranding?.logo ? <img src={tenantBranding.logo} alt={brandName} /> : <Stethoscope aria-hidden="true" />}
                        </span>
                        <p>{brandName}</p>
                    </div>

                    <h1 className="ifpc-lg-title">
                        Welcome to <span>{nameWords.join(" ") || "Conference"}</span>
                    </h1>
                    {year && <span className="ifpc-lg-year"><CalendarDays aria-hidden="true" /> {year}</span>}
                    <p className="ifpc-lg-lead">Sign in to access your dashboard, registrations, certificates, and more.</p>

                    <div className="ifpc-lg-feats">
                        {[
                            { icon: Shield, label: "Secure Login", tone: "#2563eb" },
                            { icon: Activity, label: "Dashboard", tone: "#4f46e5" },
                            { icon: Heart, label: "Certificates", tone: "#0d9488" },
                            { icon: Sparkles, label: "Registrations", tone: "#db2777" },
                        ].map(({ icon: Icon, label, tone }) => (
                            <div key={label} style={{ "--tone": tone } as React.CSSProperties}>
                                <span aria-hidden="true"><Icon /></span>
                                <p>{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            {/* ===== RIGHT: the form ===== */}
            <main className="ifpc-lg-right">
                <Link href={homeHref} className="ifpc-lg-back ifpc-lg-back--m lg:hidden">
                    <ArrowLeft aria-hidden="true" /> Back to Home
                </Link>
                <div className="ifpc-lg-card">
                    <p className="ifpc-lg-chip"><Lock aria-hidden="true" /> Password Login</p>
                    <h2 className="ifpc-lg-h">Sign In</h2>
                    <p className="ifpc-lg-sub">Sign in with your email and password.</p>

                    {error && (
                        <div className="ifpc-lg-error">
                            <Info aria-hidden="true" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onAdminSubmit)} className="ifpc-lg-form">
                        <div>
                            <Label htmlFor="email" className="ifpc-lg-label"><Mail aria-hidden="true" /> Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                icon={<Mail className="w-4 h-4" />}
                                error={errors.email?.message}
                                className="ifpc-lg-input"
                                {...register("email")}
                            />
                        </div>

                        <div>
                            <div className="ifpc-lg-row">
                                <Label htmlFor="password" className="ifpc-lg-label"><Lock aria-hidden="true" /> Password</Label>
                                <Link href="/auth/forgot-password" className="ifpc-lg-forgot">Forgot password?</Link>
                            </div>
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                icon={<Lock className="w-4 h-4" />}
                                rightIcon={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="hover:text-foreground transition-colors"
                                        tabIndex={-1}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                }
                                error={errors.password?.message}
                                className="ifpc-lg-input"
                                {...register("password")}
                            />
                        </div>

                        <div className="flex items-center gap-2.5">
                            <Checkbox id="remember" {...register("rememberMe")} />
                            <label htmlFor="remember" className="text-sm text-slate-500 cursor-pointer select-none">Keep me signed in</label>
                        </div>

                        <Button type="submit" className="ifpc-lg-submit" loading={isLoading}>
                            Sign In <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </form>

                    <p className="ifpc-lg-new">
                        New here?{" "}
                        <Link href={homeHref}>Explore conferences <ArrowRight aria-hidden="true" /></Link>
                    </p>
                </div>

                <footer className="ifpc-lg-foot">
                    <span>&copy; {new Date().getFullYear()} {brandName}. All rights reserved.</span>
                    <a href="https://summitsolutions.in" target="_blank" rel="noopener noreferrer">
                        Powered by <img src="/summit-logo.png" alt="Summit Solutions" />
                    </a>
                </footer>
            </main>
        </div>
    );
}

export default function LoginPage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full" /></div>}>
            <LoginPageInner />
        </React.Suspense>
    );
}
