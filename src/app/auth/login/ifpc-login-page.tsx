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

    // Computed tenant gradient for buttons
    const tenantGradient = tenantBranding
        ? { background: `linear-gradient(135deg, ${tenantBranding.primaryColor}, ${tenantBranding.secondaryColor})` }
        : undefined;
    const btnClass = tenantBranding ? "w-full text-white" : "w-full gradient-medical text-white";

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

    return (
        <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden">
            {/* ===== LEFT PANEL: Animated Gradient Branding ===== */}
            <div
                className="hidden lg:flex lg:w-[55%] relative login-noise overflow-hidden"
                style={tenantBranding ? {
                    background: `radial-gradient(ellipse 80% 80% at 10% 20%, ${tenantBranding.primaryColor}59 0%, transparent 50%), radial-gradient(ellipse 60% 60% at 85% 80%, ${tenantBranding.secondaryColor}4d 0%, transparent 50%), radial-gradient(ellipse 50% 50% at 50% 50%, rgba(124,58,237,0.15) 0%, transparent 50%), linear-gradient(135deg, #0a0f1e 0%, #111827 40%, #0f172a 100%)`
                } : undefined}
            >
            {/* If no tenant branding loaded yet, use default mesh gradient */}
            {!tenantBranding && <div className="absolute inset-0 login-mesh-bg" />}
                {/* Animated orbs */}
                <div className="absolute top-[10%] left-[15%] w-72 h-72 rounded-full bg-teal-500/20 blur-[100px] animate-orb-1" />
                <div className="absolute bottom-[15%] right-[10%] w-96 h-96 rounded-full bg-blue-500/20 blur-[120px] animate-orb-2" />
                <div className="absolute top-[50%] left-[50%] w-64 h-64 rounded-full bg-purple-500/15 blur-[80px] animate-orb-3" />

                {/* Floating geometric shapes */}
                <div className="absolute top-[20%] right-[20%] w-20 h-20 border border-white/10 rounded-2xl rotate-12 animate-float-slow" />
                <div className="absolute bottom-[25%] left-[20%] w-16 h-16 border border-white/[0.07] rounded-full animate-float-delayed" />
                <div className="absolute top-[60%] right-[35%] w-12 h-12 border border-teal-400/10 rounded-lg rotate-45 animate-float" />
                <div className="absolute top-[15%] left-[40%] w-8 h-8 bg-teal-400/10 rounded-full animate-bubble-3" />
                <div className="absolute bottom-[40%] right-[15%] w-6 h-6 bg-blue-400/10 rounded-full animate-bubble-1" />

                {/* Grid pattern overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* Branding content */}
                <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full animate-brand-enter">
                    {/* Top: Logo & Nav */}
                    <div>
                        <Link
                            href={homeHref}
                            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white/90 transition-colors group"
                        >
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Home
                        </Link>
                    </div>

                    {/* Center: Main branding */}
                    <div className="space-y-8">
                        {/* Logo mark */}
                        <div className="flex items-center gap-4">
                            <div
                                className="w-14 h-14 rounded-full flex items-center justify-center shadow-premium-lg overflow-hidden bg-white"
                                style={!tenantBranding?.logo ? (tenantBranding
                                    ? { background: `linear-gradient(135deg, ${tenantBranding.primaryColor}, ${tenantBranding.secondaryColor})` }
                                    : { background: 'linear-gradient(135deg, #0d9488, #0891b2)' }) : undefined
                                }
                            >
                                {tenantBranding?.logo ? (
                                    <img src={tenantBranding.logo} alt={tenantBranding.name} className="w-[75%] h-[75%] object-contain" />
                                ) : (
                                    <Stethoscope className="w-7 h-7 text-white" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-white/90 text-lg font-semibold tracking-tight">
                                    {tenantBranding?.name || (isTenantLogin ? "" : "ICMS")}
                                </h2>
                                <p className="text-white/40 text-xs tracking-widest uppercase">
                                    {isTenantLogin ? "" : "Conference Management"}
                                </p>
                            </div>
                        </div>

                        {/* Headline — tenant-specific or ICMS platform */}
                        <div className="space-y-4 max-w-lg">
                            {isTenantLogin ? (
                                <>
                                    <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight" style={{ fontFamily: 'inherit' }}>
                                        Welcome to{" "}
                                        <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                                            {tenantBranding?.name || "Conference"}
                                        </span>
                                    </h1>
                                    <p className="text-white/50 text-lg leading-relaxed">
                                        Sign in to access your dashboard, registrations, certificates, and more.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight" style={{ fontFamily: 'inherit' }}>
                                        Where Medical{" "}
                                        <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                                            Excellence
                                        </span>{" "}
                                        Meets Innovation
                                    </h1>
                                    <p className="text-white/50 text-lg leading-relaxed">
                                        Streamlined conference management for healthcare professionals worldwide.
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Feature pills — tenant-specific or ICMS platform */}
                        <div className="flex flex-wrap gap-3">
                            {(isTenantLogin ? [
                                { icon: Shield, label: "Secure Login" },
                                { icon: Activity, label: "Dashboard" },
                                { icon: Heart, label: "Certificates" },
                                { icon: Sparkles, label: "Registrations" },
                            ] : [
                                { icon: Shield, label: "Secure Access" },
                                { icon: Activity, label: "Real-time Analytics" },
                                { icon: Heart, label: "Healthcare Focus" },
                                { icon: Sparkles, label: "AI-Powered" },
                            ]).map(({ icon: Icon, label }) => (
                                <div
                                    key={label}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.08] border border-white/[0.12] text-white/70 text-sm backdrop-blur-md hover:bg-white/[0.12] hover:text-white/90 transition-all duration-300"
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom: Stats — only for ICMS platform, hidden for tenant logins */}
                    {!isTenantLogin ? (
                        <div className="flex items-center gap-8">
                            <div>
                                <div className="text-2xl font-bold text-white">500+</div>
                                <div className="text-white/40 text-xs">Conferences</div>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div>
                                <div className="text-2xl font-bold text-white">50K+</div>
                                <div className="text-white/40 text-xs">Delegates</div>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div>
                                <div className="text-2xl font-bold text-white">98%</div>
                                <div className="text-white/40 text-xs">Satisfaction</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-white/30 text-xs">
                            &copy; {new Date().getFullYear()} {tenantBranding?.name || "Conference"}. All rights reserved.
                        </div>
                    )}
                </div>
            </div>

            {/* ===== RIGHT PANEL: Login Form ===== */}
            <div className="flex-1 flex flex-col min-h-screen relative bg-gradient-to-br from-slate-50/80 via-white to-teal-50/20">
                {/* Mobile-only gradient background */}
                <div className="absolute inset-0 lg:hidden login-mesh-bg login-noise opacity-[0.03]" />

                {/* Mobile header */}
                <header className="lg:hidden p-4">
                    <Link
                        href={homeHref}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Link>
                </header>

                {/* Form area */}
                <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
                    <div className="w-full max-w-[440px] animate-login-card-enter">
                        {/* Logo & Title */}
                        <div className="text-center mb-8">
                            {/* Mobile logo */}
                            <div className="lg:hidden mb-6">
                                <div
                                    className="inline-flex items-center justify-center w-16 h-16 rounded-full shadow-premium-lg mb-3 overflow-hidden bg-white"
                                    style={!tenantBranding?.logo ? (tenantBranding
                                        ? { background: `linear-gradient(135deg, ${tenantBranding.primaryColor}, ${tenantBranding.secondaryColor})` }
                                        : { background: 'linear-gradient(135deg, #0d9488, #0891b2)' }) : undefined
                                    }
                                >
                                    {tenantBranding?.logo ? (
                                        <img src={tenantBranding.logo} alt={tenantBranding.name} className="w-[75%] h-[75%] object-contain" />
                                    ) : (
                                        <Stethoscope className="w-8 h-8 text-white" />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground tracking-widest uppercase">
                                    {isTenantLogin ? (tenantBranding?.name || "") : "ICMS — Conference Management"}
                                </p>
                            </div>

                            {/* Mode indicator — only show on tenant login */}
                            {isTenantLogin && (
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-semibold mb-5 shadow-sm">
                                    <Shield className="w-3 h-3" /> {isIfpcLogin ? "Password Login" : "Admin Login"}
                                </div>
                            )}

                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                                {isIfpcLogin ? "Sign In" : "Admin Sign In"}
                            </h1>
                            <p className="text-muted-foreground mt-2 text-sm">
                                {isIfpcLogin ? "Sign in with your email and password." : "Sign in with your admin credentials."}
                            </p>
                        </div>

                        {/* Card */}
                        <div className="glass-card rounded-2xl shadow-premium-lg p-6 sm:p-8 animate-pulse-glow border border-white/60 backdrop-blur-2xl">
                            {/* Error Alert */}
                            {error && (
                                <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2.5 animate-fadeIn">
                                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-5">
                                <form onSubmit={handleSubmit(onAdminSubmit)} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                                        <div className="input-focus-glow rounded-xl">
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="you@example.com"
                                                icon={<Mail className="w-4 h-4" />}
                                                error={errors.email?.message}
                                                className="h-12 rounded-xl"
                                                {...register("email")}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                                            <Link href="/auth/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors">
                                                Forgot password?
                                            </Link>
                                        </div>
                                        <div className="input-focus-glow rounded-xl">
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
                                                className="h-12 rounded-xl"
                                                {...register("password")}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2.5">
                                        <Checkbox id="remember" {...register("rememberMe")} />
                                        <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
                                            Keep me signed in
                                        </label>
                                    </div>

                                    <Button
                                        type="submit"
                                        className={`${btnClass} h-12 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5`}
                                        style={tenantGradient}
                                        loading={isLoading}
                                    >
                                        Sign In
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </form>
                            </div>
                        </div>

                        {/* Footer Link */}
                        <p className="text-center text-sm text-muted-foreground mt-6">
                            New here?{" "}
                            <Link href={homeHref} className="text-primary font-medium hover:text-primary/80 transition-colors">
                                Explore conferences
                            </Link>
                        </p>
                    </div>
                </main>

                {/* Footer */}
                <footer className="p-4 sm:p-6 flex flex-col items-center gap-1.5 text-xs text-muted-foreground relative z-10">
                    <span>&copy; {new Date().getFullYear()} {tenantBranding?.name || (isTenantLogin ? "" : "ICMS")}. All rights reserved.</span>
                    <a href="https://summitsolutions.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity">
                        Powered by
                        <img src="/summit-logo.png" alt="Summit Solutions" className="h-10 inline-block" />
                    </a>
                </footer>
            </div>
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
