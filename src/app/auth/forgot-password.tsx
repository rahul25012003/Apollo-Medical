"use client";

import React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft, CheckCircle2, Brain } from "lucide-react";

const forgotPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSubmitted, setIsSubmitted] = React.useState(false);
    const [submittedEmail, setSubmittedEmail] = React.useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log("Forgot password data:", data);
        setIsLoading(false);
        setSubmittedEmail(data.email);
        setIsSubmitted(true);
    };

    if (isSubmitted) {
        return (
            <Card className="border-0 shadow-xl animate-fade-in">
                <CardContent className="pt-8 pb-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-[var(--success-light)]/20 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-[var(--success)]" />
                    </div>
                    <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                        Check your email
                    </h2>
                    <p className="text-[var(--muted-foreground)] mb-6">
                        We&apos;ve sent a password reset link to
                        <br />
                        <span className="font-medium text-[var(--foreground)]">{submittedEmail}</span>
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)] mb-6">
                        Didn&apos;t receive the email? Check your spam folder or
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => setIsSubmitted(false)}
                        className="mb-4"
                    >
                        Try another email
                    </Button>
                    <div className="mt-4">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to sign in
                        </Link>
                    </div>
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
                    Forgot password?
                </CardTitle>
                <CardDescription className="text-[var(--muted-foreground)]">
                    No worries, we&apos;ll send you reset instructions
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">
                            Email Address <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Enter your registered email"
                            icon={<Mail className="w-4 h-4" />}
                            error={errors.email?.message}
                            {...register("email")}
                        />
                    </div>

                    {/* Submit */}
                    <Button type="submit" className="w-full" size="lg" loading={isLoading}>
                        Send Reset Link
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