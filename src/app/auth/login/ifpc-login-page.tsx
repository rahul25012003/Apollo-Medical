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
import { passwordSchema } from "@/lib/validations/auth";
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
    KeyRound,
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

const resetEmailSchema = z.object({ email: z.string().email("Please enter a valid email address") });
const resetCodeSchema = z.object({
    code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code from the email"),
    password: passwordSchema,
});

async function postJson(url: string, body: unknown) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
        throw new Error(json?.error?.details?.[0]?.message || json?.error?.message || "Something went wrong. Please try again.");
    }
    return json.data;
}

/**
 * Forgot password, inside the sign-in card: the email gets a 6-digit code,
 * the code plus a new password resets it (/api/auth/otp/verify turns the
 * code into the one-time token /api/auth/reset-password needs).
 */
function PasswordReset({ initialEmail, onBack }: { initialEmail: string; onBack: (email: string) => void }) {
    const [step, setStep] = React.useState<"email" | "code" | "done">("email");
    const [email, setEmail] = React.useState(initialEmail);
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [showPassword, setShowPassword] = React.useState(false);
    // Kept once the code checks out, so a rejected password can be retried
    // without asking for a new code (the code itself is single-use).
    const [token, setToken] = React.useState<string | null>(null);

    const emailForm = useForm<z.infer<typeof resetEmailSchema>>({ resolver: zodResolver(resetEmailSchema), defaultValues: { email: initialEmail } });
    const codeForm = useForm<z.infer<typeof resetCodeSchema>>({ resolver: zodResolver(resetCodeSchema), defaultValues: { code: "", password: "" } });
    const codeField = codeForm.register("code");

    const run = async (work: () => Promise<void>) => {
        setBusy(true);
        setError(null);
        try { await work(); } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong. Please try again."); }
        setBusy(false);
    };

    const sendCode = (to: string) => run(async () => {
        await postJson("/api/auth/forgot-password", { email: to });
        setEmail(to);
        setToken(null);
        codeForm.reset({ code: "", password: codeForm.getValues("password") });
        setStep("code");
    });

    const resetPassword = ({ code, password }: z.infer<typeof resetCodeSchema>) => run(async () => {
        let t = token;
        if (!t) {
            t = (await postJson("/api/auth/otp/verify", { email, code, purpose: "PASSWORD_RESET" })).token as string;
            setToken(t);
        }
        await postJson("/api/auth/reset-password", { token: t, password, confirmPassword: password });
        setStep("done");
    });

    const back = () => onBack(email);

    return (
        <>
            <p className="ifpc-lg-chip"><KeyRound aria-hidden="true" /> Reset Password</p>
            <h2 className="ifpc-lg-h">{step === "email" ? "Forgot Password?" : step === "code" ? "Check Your Email" : "Password Updated"}</h2>
            <p className="ifpc-lg-sub">
                {/* U+2011: "6‑digit" never splits across lines. */}
                {step === "email" && "Enter your registered email and we’ll send you a 6‑digit code."}
                {step === "code" && <>If <strong>{email}</strong> is registered, a 6&#8209;digit code is on its way. Enter it with your new password.</>}
                {step === "done" && "You can now sign in with your new password."}
            </p>

            {error && (
                <div className="ifpc-lg-error" role="alert">
                    <Info aria-hidden="true" />
                    <span>{error}</span>
                </div>
            )}

            {step === "email" && (
                <form onSubmit={emailForm.handleSubmit(({ email: to }) => sendCode(to))} className="ifpc-lg-form">
                    <div>
                        <Label htmlFor="reset-email" className="ifpc-lg-label"><Mail aria-hidden="true" /> Email</Label>
                        <Input
                            id="reset-email"
                            type="email"
                            autoComplete="email"
                            autoFocus
                            placeholder="you@example.com"
                            icon={<Mail className="w-4 h-4" />}
                            error={emailForm.formState.errors.email?.message}
                            className="ifpc-lg-input"
                            {...emailForm.register("email")}
                        />
                    </div>
                    <Button type="submit" className="ifpc-lg-submit" loading={busy}>
                        Send Code <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </form>
            )}

            {step === "code" && (
                <form onSubmit={codeForm.handleSubmit(resetPassword)} className="ifpc-lg-form">
                    <div>
                        <Label htmlFor="reset-code" className="ifpc-lg-label"><KeyRound aria-hidden="true" /> 6-digit code</Label>
                        <Input
                            id="reset-code"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            autoFocus
                            placeholder="••••••"
                            icon={<KeyRound className="w-4 h-4" />}
                            error={codeForm.formState.errors.code?.message}
                            className="ifpc-lg-input"
                            {...codeField}
                            // Digits only, so a pasted "123 456" still works.
                            onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6); codeField.onChange(e); }}
                        />
                    </div>
                    <div>
                        <Label htmlFor="reset-password" className="ifpc-lg-label"><Lock aria-hidden="true" /> New password</Label>
                        <Input
                            id="reset-password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="At least 8 characters"
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
                            error={codeForm.formState.errors.password?.message}
                            className="ifpc-lg-input"
                            {...codeForm.register("password")}
                        />
                    </div>
                    <Button type="submit" className="ifpc-lg-submit" loading={busy}>
                        Reset Password <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </form>
            )}

            {step === "done" ? (
                <div className="ifpc-lg-form">
                    <Button type="button" className="ifpc-lg-submit" onClick={back}>
                        Back to Sign In <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            ) : (
                <p className="ifpc-lg-new">
                    {step === "code" && (
                        <><button type="button" onClick={() => sendCode(email)} disabled={busy}>Resend code</button><span aria-hidden="true">·</span></>
                    )}
                    <button type="button" onClick={back}><ArrowLeft aria-hidden="true" /> Back to sign in</button>
                </p>
            )}
        </>
    );
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
    // "Forgot password?" swaps the card over to the reset steps.
    const [resetting, setResetting] = React.useState(false);

    const { register, handleSubmit, getValues, setValue, formState: { errors } } = useForm<LoginFormData>({
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
                    {resetting ? (
                        <PasswordReset
                            initialEmail={getValues("email")}
                            onBack={(email) => { setValue("email", email); setError(null); setResetting(false); }}
                        />
                    ) : (<>
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
                                <button type="button" className="ifpc-lg-forgot" onClick={() => { setError(null); setResetting(true); }}>Forgot password?</button>
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
                    </>)}
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
