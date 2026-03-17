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
import {
    Mail,
    Lock,
    ArrowRight,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    Info,
    Stethoscope,
    Shield,
    Sparkles,
    Heart,
    Activity,
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
    const tenantSlug = searchParams.get("tenant");

    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [loginMode, setLoginMode] = React.useState<"delegate" | "admin">("delegate");
    const [tenantBranding, setTenantBranding] = React.useState<TenantBranding | null>(null);

    // Compute the "home" URL based on tenant context
    // On custom domain, middleware rewrites / to /t/{slug} internally, so just use /
    const isCustomDomain = typeof window !== 'undefined' &&
        !window.location.hostname.includes('localhost') &&
        !window.location.hostname.includes('127.0.0.1');
    const homeHref = isCustomDomain ? "/" : (tenantSlug ? `/t/${tenantSlug}` : "/");

    // Fetch tenant branding from query param or hostname (domain-based lookup)
    React.useEffect(() => {
        const identifier = tenantSlug || window.location.hostname;
        if (!identifier || identifier === "localhost") return;

        async function fetchTenant() {
            try {
                const response = await fetch(`/api/tenants/${identifier}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        const t = data.data;
                        setTenantBranding({
                            name: t.branding?.name || t.name || "ICMS",
                            logo: t.branding?.logo || t.logo || null,
                            primaryColor: t.theme?.primaryColor || t.primaryColor || "#0d9488",
                            secondaryColor: t.theme?.secondaryColor || t.secondaryColor || "#0891b2",
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to fetch tenant branding:", err);
            }
        }

        fetchTenant();
    }, [tenantSlug]);

    // Computed tenant gradient for buttons
    const tenantGradient = tenantBranding
        ? { background: `linear-gradient(135deg, ${tenantBranding.primaryColor}, ${tenantBranding.secondaryColor})` }
        : undefined;
    const btnClass = tenantBranding ? "w-full text-white" : "w-full gradient-medical text-white";

    // OTP states
    const [delegateEmail, setDelegateEmail] = React.useState("");
    const [otp, setOtp] = React.useState("");
    const [otpSent, setOtpSent] = React.useState(false);
    const [emailWarning, setEmailWarning] = React.useState<string | null>(null);

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
                redirect: false,
            });

            if (result?.error) {
                setError(result.error === "CredentialsSignin"
                    ? "Invalid email or password"
                    : result.error);
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

    const handleSendOtp = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!delegateEmail || !emailRegex.test(delegateEmail)) {
            setError("Please enter a valid email address");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/auth/otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: delegateEmail, purpose: "LOGIN" }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || data.message || "Failed to send OTP");
                setIsLoading(false);
                return;
            }
            setOtpSent(true);
            // Check if the email was actually delivered
            if (data.data?.emailSent === false) {
                setEmailWarning("OTP was created but the email may not have been delivered. Please check your spam folder or try again.");
            } else {
                setEmailWarning(null);
            }
        } catch (err) {
            console.error("Send OTP error:", err);
            setError("An error occurred while sending OTP. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 6) {
            setError("Please enter a valid 6-digit OTP");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const result = await signIn("otp-login", {
                email: delegateEmail,
                code: otp,
                redirect: false,
            });

            if (result?.error) {
                if (result.error.includes("OTP_EXPIRED")) {
                    setError("Your code has expired. Please request a new one.");
                } else if (result.error.includes("INVALID_OTP")) {
                    setError("Invalid verification code. Please try again.");
                } else if (result.error === "CredentialsSignin") {
                    setError("Invalid verification code. Please try again.");
                } else {
                    setError(result.error);
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
            console.error("Verify OTP error:", err);
            setError("An error occurred. Please try again.");
            setIsLoading(false);
        }
    };

    const resetOtpState = () => {
        setDelegateEmail("");
        setOtp("");
        setOtpSent(false);
        setError(null);
        setEmailWarning(null);
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden">
            {/* ===== LEFT PANEL: Animated Gradient Branding ===== */}
            <div className="hidden lg:flex lg:w-[55%] relative login-mesh-bg login-noise overflow-hidden">
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
                                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-premium-lg"
                                style={tenantBranding
                                    ? { background: `linear-gradient(135deg, ${tenantBranding.primaryColor}, ${tenantBranding.secondaryColor})` }
                                    : { background: 'linear-gradient(135deg, #0d9488, #0891b2)' }
                                }
                            >
                                {tenantBranding?.logo ? (
                                    <img src={tenantBranding.logo} alt={tenantBranding.name} className="w-10 h-10 object-contain rounded-lg" />
                                ) : (
                                    <Stethoscope className="w-7 h-7 text-white" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-white/90 text-lg font-semibold tracking-tight">
                                    {tenantBranding?.name || "CARENS"}
                                </h2>
                                <p className="text-white/40 text-xs tracking-widest uppercase">
                                    Conference Management
                                </p>
                            </div>
                        </div>

                        {/* Headline */}
                        <div className="space-y-4 max-w-lg">
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
                        </div>

                        {/* Feature pills */}
                        <div className="flex flex-wrap gap-3">
                            {[
                                { icon: Shield, label: "Secure Access" },
                                { icon: Activity, label: "Real-time Analytics" },
                                { icon: Heart, label: "Healthcare Focus" },
                                { icon: Sparkles, label: "AI-Powered" },
                            ].map(({ icon: Icon, label }) => (
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

                    {/* Bottom: Stats or social proof */}
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
                                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-premium-lg mb-3"
                                    style={tenantBranding
                                        ? { background: `linear-gradient(135deg, ${tenantBranding.primaryColor}, ${tenantBranding.secondaryColor})` }
                                        : { background: 'linear-gradient(135deg, #0d9488, #0891b2)' }
                                    }
                                >
                                    {tenantBranding?.logo ? (
                                        <img src={tenantBranding.logo} alt={tenantBranding.name} className="w-10 h-10 object-contain rounded-lg" />
                                    ) : (
                                        <Stethoscope className="w-8 h-8 text-white" />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground tracking-widest uppercase">
                                    {tenantBranding?.name || "CARENS"} Conference Management
                                </p>
                            </div>

                            {/* Mode indicator */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-semibold mb-5 shadow-sm">
                                {loginMode === "delegate" ? (
                                    <><Mail className="w-3 h-3" /> Delegate / Speaker / Organizer</>
                                ) : (
                                    <><Shield className="w-3 h-3" /> Admin Access</>
                                )}
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                                {loginMode === "delegate" ? "Welcome back" : "Admin Sign In"}
                            </h1>
                            <p className="text-muted-foreground mt-2 text-sm">
                                {loginMode === "delegate"
                                    ? "Delegates, speakers & organizers — enter your registered email to receive a login code."
                                    : "Sign in with your admin credentials."}
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

                            {loginMode === "delegate" ? (
                                /* Delegate OTP Login */
                                <div className="space-y-5">
                                    {!otpSent ? (
                                        <>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Email Address</Label>
                                                <div className="input-focus-glow rounded-xl">
                                                    <Input
                                                        type="email"
                                                        placeholder="you@example.com"
                                                        value={delegateEmail}
                                                        onChange={(e) => setDelegateEmail(e.target.value)}
                                                        icon={<Mail className="w-4 h-4" />}
                                                        className="h-12 rounded-xl"
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                className={`${btnClass} h-12 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5`}
                                                style={tenantGradient}
                                                onClick={handleSendOtp}
                                                disabled={!delegateEmail || isLoading}
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                ) : (
                                                    <Sparkles className="w-4 h-4 mr-2" />
                                                )}
                                                Send Login Code
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 animate-fadeIn">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <div className="text-sm">
                                                    <p className="font-medium text-emerald-700">Code sent successfully</p>
                                                    <p className="text-emerald-600/80 text-xs">{delegateEmail}</p>
                                                </div>
                                            </div>
                                            {emailWarning && (
                                                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-100 animate-fadeIn">
                                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                                        <Info className="w-4 h-4 text-amber-600" />
                                                    </div>
                                                    <div className="text-sm">
                                                        <p className="font-medium text-amber-700">Email delivery warning</p>
                                                        <p className="text-amber-600/80 text-xs">{emailWarning}</p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Enter Verification Code</Label>
                                                <div className="input-focus-glow rounded-xl">
                                                    <Input
                                                        type="text"
                                                        placeholder="------"
                                                        value={otp}
                                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                        className="text-center text-xl tracking-[0.3em] font-mono h-14 rounded-xl"
                                                        maxLength={6}
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                className={`${btnClass} h-12 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5`}
                                                style={tenantGradient}
                                                onClick={handleVerifyOtp}
                                                disabled={otp.length < 6 || isLoading}
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                ) : (
                                                    <ArrowRight className="w-4 h-4 mr-2" />
                                                )}
                                                Verify & Login
                                            </Button>
                                            <div className="flex items-center justify-center gap-4">
                                                <button
                                                    type="button"
                                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                                                    onClick={resetOtpState}
                                                >
                                                    <span className="flex items-center gap-1.5">
                                                        <ArrowLeft className="w-3 h-3" />
                                                        Change email
                                                    </span>
                                                </button>
                                                <span className="text-muted-foreground/40">|</span>
                                                <button
                                                    type="button"
                                                    className="text-sm text-primary hover:text-primary/80 font-medium transition-colors py-1"
                                                    onClick={handleSendOtp}
                                                    disabled={isLoading}
                                                >
                                                    Resend Code
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {/* Divider */}
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-border/60" />
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="bg-white px-3 text-xs text-muted-foreground">or</span>
                                        </div>
                                    </div>

                                    {/* Admin link */}
                                    <button
                                        type="button"
                                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border/60 text-sm text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/30 transition-all duration-200"
                                        onClick={() => { setLoginMode("admin"); setError(null); resetOtpState(); }}
                                    >
                                        <Shield className="w-3.5 h-3.5" />
                                        Sign in as Admin (password)
                                    </button>
                                </div>
                            ) : (
                                /* Admin Email Login */
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
                                                    type="password"
                                                    placeholder="Enter your password"
                                                    icon={<Lock className="w-4 h-4" />}
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

                                    {/* Divider */}
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-border/60" />
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="bg-white px-3 text-xs text-muted-foreground">or</span>
                                        </div>
                                    </div>

                                    {/* Back to delegate login */}
                                    <button
                                        type="button"
                                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border/60 text-sm text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/30 transition-all duration-200"
                                        onClick={() => { setLoginMode("delegate"); setError(null); }}
                                    >
                                        <Mail className="w-3.5 h-3.5" />
                                        Sign in with OTP (Delegate / Speaker / Organizer)
                                    </button>
                                </div>
                            )}
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
                    <span>&copy; {new Date().getFullYear()} {tenantBranding?.name || "ICMS"}. All rights reserved.</span>
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
