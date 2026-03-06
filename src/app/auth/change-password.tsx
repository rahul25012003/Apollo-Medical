"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ArrowLeft, CheckCircle2, Brain, ShieldCheck } from "lucide-react";

const changePasswordSchema = z.object({
    newPassword: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ChangePasswordFormData>({
        resolver: zodResolver(changePasswordSchema),
    });

    const password = watch("newPassword", "");

    const passwordRequirements = [
        { label: "At least 8 characters", met: password.length >= 8 },
        { label: "One uppercase letter", met: /[A-Z]/.test(password) },
        { label: "One lowercase letter", met: /[a-z]/.test(password) },
        { label: "One number", met: /[0-9]/.test(password) },
        { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
    ];

    const onSubmit = async (data: ChangePasswordFormData) => {
        setIsLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log("Change password data:", data);
        setIsLoading(false);
        setIsSuccess(true);
    };

    if (isSuccess) {
        return (
            <Card className="border-0 shadow-xl animate-fade-in">
                <CardContent className="pt-8 pb-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-[var(--success-light)]/20 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-[var(--success)]" />
                    </div>
                    <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                        Password reset successful
                    </h2>
                    <p className="text-[var(--muted-foreground)] mb-6">
                        Your password has been successfully changed.
                        <br />
                        You can now sign in with your new password.
                    </p>
                    <Button onClick={() => router.push("/login")} className="w-full" size="lg">
                        Continue to Sign In
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-xl animate-fade-in">
            <CardHeader className="text-center pb-2">
                {/* Mobile logo */}
                <div className="lg:hidden flex justify-center mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--secondary)] flex items-center justify-center">
                        <Brain className="w-8 h-8 text-white" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold text-[var(--foreground)]">
                    Set new password
                </CardTitle>
                <CardDescription className="text-[var(--muted-foreground)]">
                    Your new password must be different from previous passwords
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* New Password */}
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">
                            New Password <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="newPassword"
                            type="password"
                            placeholder="Enter new password"
                            icon={<Lock className="w-4 h-4" />}
                            error={errors.newPassword?.message}
                            {...register("newPassword")}
                        />
                    </div>

                    {/* Password Requirements */}
                    <div className="p-3 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-4 h-4 text-[var(--muted-foreground)]" />
                            <span className="text-xs font-medium text-[var(--muted-foreground)]">
                                Password Requirements
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                            {passwordRequirements.map((req, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-1.5 text-xs"
                                >
                                    <div
                                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${req.met
                                            ? "bg-[var(--success)] text-white"
                                            : "bg-[var(--border)]"
                                            }`}
                                    >
                                        {req.met && (
                                            <svg className="w-2 h-2" viewBox="0 0 12 12" fill="none">
                                                <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                        )}
                                    </div>
                                    <span
                                        className={
                                            req.met
                                                ? "text-[var(--success)]"
                                                : "text-[var(--muted-foreground)]"
                                        }
                                    >
                                        {req.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                            Confirm Password <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm new password"
                            icon={<Lock className="w-4 h-4" />}
                            error={errors.confirmPassword?.message}
                            {...register("confirmPassword")}
                        />
                    </div>

                    {/* Submit */}
                    <Button type="submit" className="w-full" size="lg" loading={isLoading}>
                        Reset Password
                    </Button>

                    {/* Back to login */}
                    <div className="text-center mt-4">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to sign in
                        </Link>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}