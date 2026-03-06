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
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Brain, ArrowRight, Sparkles } from "lucide-react";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
            rememberMe: false,
        },
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log("Login data:", data);
        setIsLoading(false);
        router.push("/dashboard");
    };

    return (
        <div className="w-full">
            {/* Logo for mobile */}
            <div className="lg:hidden flex justify-center mb-8">
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25">
                        <Brain className="w-9 h-9 text-primary-foreground" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Welcome back
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Enter your credentials to access your account
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                        Email Address
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        icon={<Mail className="w-4 h-4" />}
                        error={errors.email?.message}
                        autoComplete="email"
                        {...register("email")}
                    />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-medium">
                            Password
                        </Label>
                        <Link
                            href="/forgot-password"
                            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        icon={<Lock className="w-4 h-4" />}
                        error={errors.password?.message}
                        autoComplete="current-password"
                        {...register("password")}
                    />
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-3">
                    <Checkbox
                        id="rememberMe"
                        {...register("rememberMe")}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label
                        htmlFor="rememberMe"
                        className="text-sm text-muted-foreground cursor-pointer select-none"
                    >
                        Keep me signed in for 30 days
                    </label>
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold group"
                    size="lg"
                    loading={isLoading}
                >
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-3 text-muted-foreground font-medium">
                        Demo Access
                    </span>
                </div>
            </div>

            {/* Demo Credentials Card */}
            <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-muted/50 to-muted p-4">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                            Test Credentials
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="text-sm font-mono font-medium text-foreground bg-background/60 px-2 py-1 rounded border border-border/50">
                                admin@icms.com
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Password</p>
                            <p className="text-sm font-mono font-medium text-foreground bg-background/60 px-2 py-1 rounded border border-border/50">
                                admin123
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <p className="mt-8 text-center text-sm text-muted-foreground">
                Need help?{" "}
                <Link href="/support" className="font-medium text-primary hover:text-primary/80 transition-colors">
                    Contact support
                </Link>
            </p>
        </div>
    );
}
