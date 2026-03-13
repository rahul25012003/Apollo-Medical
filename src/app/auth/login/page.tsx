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
    GraduationCap,
    ArrowRight,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    Info
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

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tenantSlug = searchParams.get("tenant");

    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [loginMode, setLoginMode] = React.useState<"delegate" | "admin">("delegate");
    const [tenantBranding, setTenantBranding] = React.useState<TenantBranding | null>(null);

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
                setError(result.error === "CredentialsSignin"
                    ? "Invalid or expired OTP"
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
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex flex-col">
            {/* Header */}
            <header className="p-4 lg:p-6">
                <Link
                    href={tenantSlug ? `/t/${tenantSlug}` : "/"}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                </Link>
            </header>

            {/* Main */}
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-[420px]">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        {tenantBranding?.logo ? (
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl overflow-hidden shadow-lg mb-4">
                                <img src={tenantBranding.logo} alt={tenantBranding.name} className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div
                                className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg shadow-primary/25 mb-4 ${!tenantBranding ? "gradient-medical" : ""}`}
                                style={tenantBranding ? { background: `linear-gradient(135deg, ${tenantBranding.primaryColor}, ${tenantBranding.secondaryColor})` } : undefined}
                            >
                                <GraduationCap className="w-8 h-8 text-white" />
                            </div>
                        )}
                        <h1 className="text-2xl font-bold">
                            {loginMode === "delegate" ? "Delegate Login" : "Admin Login"}
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {loginMode === "delegate"
                                ? "Enter your email address to continue."
                                : "Sign in with your admin credentials."}
                        </p>
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border p-6">
                        {/* Error Alert */}
                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2">
                                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {loginMode === "delegate" ? (
                            /* Delegate OTP Login */
                            <div className="space-y-4">
                                {!otpSent ? (
                                    <>
                                        <div className="space-y-1.5">
                                            <Label className="text-sm">Email Address</Label>
                                            <Input
                                                type="email"
                                                placeholder="you@example.com"
                                                value={delegateEmail}
                                                onChange={(e) => setDelegateEmail(e.target.value)}
                                                icon={<Mail className="w-4 h-4" />}
                                            />
                                        </div>
                                        <Button
                                            className={btnClass}
                                            style={tenantGradient}
                                            onClick={handleSendOtp}
                                            disabled={!delegateEmail || isLoading}
                                        >
                                            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                            Send OTP
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                            <div className="text-sm">
                                                <p className="font-medium text-green-700">OTP Sent</p>
                                                <p className="text-green-600">{delegateEmail}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-sm">Enter OTP</Label>
                                            <Input
                                                type="text"
                                                placeholder="------"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                className="text-center text-xl tracking-[0.3em] font-mono"
                                                maxLength={6}
                                            />
                                        </div>
                                        <Button
                                            className={btnClass}
                                            style={tenantGradient}
                                            onClick={handleVerifyOtp}
                                            disabled={otp.length < 6 || isLoading}
                                        >
                                            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                            Verify & Login
                                        </Button>
                                        <button
                                            type="button"
                                            className="w-full text-sm text-muted-foreground hover:text-foreground"
                                            onClick={resetOtpState}
                                        >
                                            ← Change email
                                        </button>
                                    </>
                                )}

                                {/* Admin link - small, below */}
                                <div className="pt-2 text-center">
                                    <button
                                        type="button"
                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => { setLoginMode("admin"); setError(null); resetOtpState(); }}
                                    >
                                        Admin Login →
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Admin Email Login */
                            <div className="space-y-4">
                                <form onSubmit={handleSubmit(onAdminSubmit)} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-sm">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            icon={<Mail className="w-4 h-4" />}
                                            error={errors.email?.message}
                                            {...register("email")}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between">
                                            <Label htmlFor="password" className="text-sm">Password</Label>
                                            <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                                                Forgot?
                                            </Link>
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            icon={<Lock className="w-4 h-4" />}
                                            error={errors.password?.message}
                                            {...register("password")}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Checkbox id="remember" {...register("rememberMe")} />
                                        <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                                            Remember me
                                        </label>
                                    </div>

                                    <Button type="submit" className={btnClass} style={tenantGradient} loading={isLoading}>
                                        Sign In
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </form>

                                {/* Back to delegate login - small, below */}
                                <div className="pt-2 text-center">
                                    <button
                                        type="button"
                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => { setLoginMode("delegate"); setError(null); }}
                                    >
                                        ← Delegate Login
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Link */}
                    <p className="text-center text-sm text-muted-foreground mt-6">
                        New here?{" "}
                        <Link href={tenantSlug ? `/t/${tenantSlug}` : "/"} className="text-primary font-medium hover:underline">
                            Back to Home
                        </Link>
                    </p>
                </div>
            </main>

            {/* Footer */}
            <footer className="p-4 flex flex-col items-center gap-1 text-xs text-muted-foreground">
                <span>© {new Date().getFullYear()} {tenantBranding?.name || "ICMS"}</span>
                <a href="https://summitsolutions.co.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity">
                    Powered by
                    <img src="/summit-logo.png" alt="Summit Solutions" className="h-10 inline-block" />
                </a>
            </footer>
        </div>
    );
}
