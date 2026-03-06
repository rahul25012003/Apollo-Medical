"use client";

import React from "react";
import { Bell, Search, ChevronDown, Settings, User, LogOut, HelpCircle, Loader2, Ticket, Award, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileMenuButton } from "./sidebar";
import { TenantSelector } from "./tenant-selector";
import { useUIStore } from "@/store";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTenant } from "@/lib/tenant/context";

interface HeaderProps {
    title: string;
    subtitle?: string;
}

// Format role for display
function formatRole(role: string): string {
    return role
        .split("_")
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(" ");
}

// Get user initials
function getInitials(name: string | null | undefined, email: string | null | undefined): string {
    if (name) {
        const parts = name.trim().split(" ");
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }
    if (email) {
        return email.slice(0, 2).toUpperCase();
    }
    return "U";
}

export function Header({ title, subtitle }: HeaderProps) {
    const { sidebarCollapsed } = useUIStore();
    const [searchOpen, setSearchOpen] = React.useState(false);
    const { data: session, status } = useSession();

    const user = session?.user;
    const displayName = user?.name || user?.email?.split("@")[0] || "User";
    const displayRole = user?.role ? formatRole(user.role) : "User";
    const initials = getInitials(user?.name, user?.email);

    // Get tenant slug for logout redirect (only for actual tenant users, not SUPER_ADMIN)
    const { tenant } = useTenant();
    const userRole = user?.role;
    const tenantSlug = userRole !== "SUPER_ADMIN" && tenant?.slug && tenant.slug !== "default"
        ? tenant.slug
        : null;

    const handleSignOut = () => {
        const callbackUrl = tenantSlug
            ? `/auth/login?tenant=${tenantSlug}`
            : "/";
        signOut({ callbackUrl });
    };

    return (
        <header className={cn(
            "fixed top-0 right-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300",
            // Adjust left margin based on sidebar state
            sidebarCollapsed ? "lg:left-[72px]" : "lg:left-64",
            "left-0"
        )}>
            <div className="flex items-center justify-between h-full px-4 lg:px-6">
                {/* Left side */}
                <div className="flex items-center gap-3 min-w-0">
                    <MobileMenuButton />
                    <div className="min-w-0">
                        <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
                        {subtitle && (
                            <p className="text-sm text-muted-foreground truncate hidden sm:block">{subtitle}</p>
                        )}
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Search - Desktop */}
                    <div className="hidden md:flex items-center">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="h-9 w-44 lg:w-56 pl-9 pr-4 bg-muted rounded-lg border-0 outline-none text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition-all"
                            />
                        </div>
                    </div>

                    {/* Search - Mobile toggle */}
                    <button
                        onClick={() => setSearchOpen(!searchOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
                        aria-label="Search"
                    >
                        <Search className="w-5 h-5 text-muted-foreground" />
                    </button>

                    {/* Tenant Selector (SUPER_ADMIN only) */}
                    <TenantSelector />

                    {/* Notifications */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                                <Bell className="w-5 h-5 text-muted-foreground" />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-background" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <DropdownMenuLabel className="flex items-center justify-between">
                                Notifications
                                <span className="text-xs font-normal text-primary cursor-pointer hover:underline">
                                    Mark all as read
                                </span>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="max-h-[300px] overflow-y-auto">
                                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                                    <div className="flex items-center gap-2 w-full">
                                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                                        <span className="font-medium text-sm">New registration</span>
                                        <span className="text-xs text-muted-foreground ml-auto">2m ago</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground pl-4">
                                        Dr. Smith registered for the Neurology Conference
                                    </p>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                                    <div className="flex items-center gap-2 w-full">
                                        <span className="w-2 h-2 bg-muted rounded-full flex-shrink-0" />
                                        <span className="font-medium text-sm">Payment received</span>
                                        <span className="text-xs text-muted-foreground ml-auto">1h ago</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground pl-4">
                                        Payment of $299 received for CME Workshop
                                    </p>
                                </DropdownMenuItem>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="justify-center text-primary text-sm">
                                View all notifications
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Help - desktop only */}
                    <button className="hidden lg:flex p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Help">
                        <HelpCircle className="w-5 h-5 text-muted-foreground" />
                    </button>

                    {/* Divider */}
                    <div className="hidden sm:block w-px h-6 bg-border mx-1" />

                    {/* Profile */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 p-1 sm:p-1.5 sm:pr-2 rounded-lg hover:bg-muted transition-colors">
                                {status === "loading" ? (
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <>
                                        <Avatar className="w-8 h-8 ring-2 ring-background">
                                            <AvatarImage src={user?.image || undefined} alt={displayName} />
                                            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="hidden sm:block text-left max-w-[120px]">
                                            <p className="text-sm font-medium leading-tight truncate">{displayName}</p>
                                            <p className="text-xs text-muted-foreground truncate">{displayRole}</p>
                                        </div>
                                        <ChevronDown className="hidden sm:block w-4 h-4 text-muted-foreground" />
                                    </>
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col">
                                    <span>{displayName}</span>
                                    <span className="text-xs font-normal text-muted-foreground">{user?.email || ""}</span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/profile" className="flex items-center gap-2 cursor-pointer">
                                    <User className="w-4 h-4" />
                                    My Profile
                                </Link>
                            </DropdownMenuItem>
                            {/* Attendee specific links */}
                            {user?.role === "ATTENDEE" && (
                                <>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/browse-events" className="flex items-center gap-2 cursor-pointer">
                                            <Calendar className="w-4 h-4" />
                                            Browse Events
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/my-registrations" className="flex items-center gap-2 cursor-pointer">
                                            <Ticket className="w-4 h-4" />
                                            My Registrations
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/my-certificates" className="flex items-center gap-2 cursor-pointer">
                                            <Award className="w-4 h-4" />
                                            My Certificates
                                        </Link>
                                    </DropdownMenuItem>
                                </>
                            )}
                            {/* Settings - only for Admin roles and Event Manager */}
                            {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "EVENT_MANAGER") && (
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/settings" className="flex items-center gap-2 cursor-pointer">
                                        <Settings className="w-4 h-4" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer lg:hidden">
                                <HelpCircle className="w-4 h-4" />
                                Help & Support
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                                onClick={handleSignOut}
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Mobile Search Expanded */}
            {searchOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 p-3 bg-background border-b border-border">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search events, registrations..."
                            autoFocus
                            className="w-full h-10 pl-10 pr-4 bg-muted rounded-lg border-0 outline-none text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                            onBlur={() => setSearchOpen(false)}
                        />
                    </div>
                </div>
            )}
        </header>
    );
}
