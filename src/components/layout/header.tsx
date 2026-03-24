"use client";

import React, { useCallback } from "react";
import { Bell, Search, ChevronDown, Settings, User, LogOut, HelpCircle, Loader2, Ticket, Award, Calendar, Users, CheckCircle2 } from "lucide-react";
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

interface NotificationItem {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    link: string | null;
    createdAt: string;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

function notificationIcon(type: string) {
    switch (type) {
        case "NEW_REGISTRATION": return <Users className="w-4 h-4 text-blue-500" />;
        case "NEW_EVENT": return <Calendar className="w-4 h-4 text-green-500" />;
        case "PAYMENT_RECEIVED": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
        default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
}

// Role accent colors
// Premium role accent colors
const headerAccentMap: Record<string, string> = {
    ATTENDEE: "#0d9488", SUPER_ADMIN: "#a1a1aa", ADMIN: "#2563eb",
    EVENT_MANAGER: "#7c3aed", REGISTRATION_MANAGER: "#3b82f6", CERTIFICATE_MANAGER: "#db2777",
};

export function Header({ title, subtitle }: HeaderProps) {
    const { sidebarCollapsed } = useUIStore();
    const [searchOpen, setSearchOpen] = React.useState(false);
    const { data: session, status } = useSession();

    const user = session?.user;
    const displayName = user?.name || user?.email?.split("@")[0] || "User";
    const displayRole = user?.role ? formatRole(user.role) : "User";
    const initials = getInitials(user?.name, user?.email);
    const acColor = headerAccentMap[user?.role || "ATTENDEE"] || headerAccentMap.ATTENDEE;

    // Notifications
    const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch("/api/notifications?limit=20");
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    setNotifications(data.data.notifications || []);
                    setUnreadCount(data.data.unreadCount || 0);
                }
            }
        } catch { /* silently fail */ }
    }, []);

    // Fetch on mount + poll every 30 seconds
    React.useEffect(() => {
        if (status !== "authenticated") return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [status, fetchNotifications]);

    const markAllAsRead = async () => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAll: true }),
            });
            setUnreadCount(0);
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch { /* silently fail */ }
    };

    // Get tenant slug for logout redirect (only for actual tenant users, not SUPER_ADMIN)
    const { tenant } = useTenant();
    const userRole = user?.role;
    const tenantSlug = userRole !== "SUPER_ADMIN" && tenant?.slug && tenant.slug !== "default"
        ? tenant.slug
        : null;

    const handleSignOut = () => {
        if (tenantSlug) {
            signOut({ callbackUrl: `/auth/login?tenant=${tenantSlug}` });
        } else {
            signOut({ callbackUrl: "/auth/login" });
        }
    };

    return (
        <header className={cn(
            "fixed top-0 right-0 z-30 h-16 transition-all duration-300",
            // Frosted glass effect
            "bg-background/60 backdrop-blur-xl backdrop-saturate-150",
            // Border replaced by gradient line at bottom
            "border-b border-white/[0.08]",
            // Adjust left margin based on sidebar state
            sidebarCollapsed ? "lg:left-[72px]" : "lg:left-64",
            "left-0"
        )}>
            {/* Role-colored accent line at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(to right, ${acColor}80, ${acColor}30, transparent)` }} />

            <div className="flex items-center justify-between h-full px-4 lg:px-6">
                {/* Left side */}
                <div className="flex items-center gap-3 min-w-0">
                    <MobileMenuButton />
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Search - Desktop */}
                    <div className="hidden md:flex items-center">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-teal-500" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="h-9 w-44 lg:w-56 pl-9 pr-4 bg-muted/50 backdrop-blur-sm rounded-xl border border-white/[0.08] outline-none text-sm placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/30 focus:bg-muted/80 transition-all duration-300"
                            />
                        </div>
                    </div>

                    {/* Search - Mobile toggle */}
                    <button
                        onClick={() => setSearchOpen(!searchOpen)}
                        className="md:hidden p-2 rounded-xl hover:bg-muted/80 transition-all duration-200"
                        aria-label="Search"
                    >
                        <Search className="w-5 h-5 text-muted-foreground" />
                    </button>

                    {/* Tenant Selector (SUPER_ADMIN only) */}
                    <TenantSelector />

                    {/* Notifications */}
                    <DropdownMenu onOpenChange={(open) => { if (open) fetchNotifications(); }}>
                        <DropdownMenuTrigger asChild>
                            <button className="relative p-2 rounded-xl hover:bg-muted/80 transition-all duration-200 group">
                                <Bell className={cn(
                                    "w-5 h-5 text-muted-foreground transition-all duration-200 group-hover:text-foreground",
                                    unreadCount > 0 && "text-foreground"
                                )} />
                                {unreadCount > 0 && (
                                    <>
                                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-white text-[10px] font-bold rounded-full ring-2 ring-background px-1 shadow-lg" style={{ background: acColor, boxShadow: `0 4px 12px ${acColor}50` }}>
                                            {unreadCount > 99 ? "99+" : unreadCount}
                                        </span>
                                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full animate-ping" style={{ background: `${acColor}40` }} />
                                    </>
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80 rounded-xl shadow-xl shadow-black/10 border border-border/50 backdrop-blur-xl">
                            <DropdownMenuLabel className="flex items-center justify-between py-3">
                                <span className="text-sm font-semibold">Notifications</span>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs font-medium text-teal-600 cursor-pointer hover:text-teal-700 hover:underline bg-transparent border-0 p-0 transition-colors"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="max-h-[350px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                                            <Bell className="w-6 h-6 opacity-30" />
                                        </div>
                                        <p className="text-sm font-medium">No notifications yet</p>
                                        <p className="text-xs text-muted-foreground/60 mt-1">We will notify you when something arrives</p>
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <DropdownMenuItem
                                            key={n.id}
                                            className={cn(
                                                "flex flex-col items-start gap-1 p-3 cursor-pointer rounded-lg mx-1 my-0.5 transition-all duration-200",
                                                !n.isRead && "bg-teal-500/[0.04] border-l-2 border-teal-500/50"
                                            )}
                                            asChild={!!n.link}
                                        >
                                            {n.link ? (
                                                <Link href={n.link}>
                                                    <div className="flex items-center gap-2 w-full">
                                                        {notificationIcon(n.type)}
                                                        <span className={cn("text-sm", !n.isRead && "font-medium")}>
                                                            {n.title}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                                                            {timeAgo(n.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground pl-6 line-clamp-2">
                                                        {n.message}
                                                    </p>
                                                </Link>
                                            ) : (
                                                <div>
                                                    <div className="flex items-center gap-2 w-full">
                                                        {notificationIcon(n.type)}
                                                        <span className={cn("text-sm", !n.isRead && "font-medium")}>
                                                            {n.title}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                                                            {timeAgo(n.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground pl-6 line-clamp-2">
                                                        {n.message}
                                                    </p>
                                                </div>
                                            )}
                                        </DropdownMenuItem>
                                    ))
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Help - desktop only */}
                    <button className="hidden lg:flex p-2 rounded-xl hover:bg-muted/80 transition-all duration-200" aria-label="Help">
                        <HelpCircle className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                    </button>

                    {/* Divider */}
                    <div className="hidden sm:block w-px h-6 bg-gradient-to-b from-transparent via-border to-transparent mx-1" />

                    {/* Profile */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 p-1 sm:p-1.5 sm:pr-3 rounded-xl hover:bg-muted/80 transition-all duration-200 group">
                                {status === "loading" ? (
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative">
                                            <Avatar className="w-8 h-8 ring-2 transition-all duration-200" style={{ boxShadow: `0 0 0 2px ${acColor}33` }}>
                                                <AvatarImage src={user?.image || undefined} alt={displayName} />
                                                <AvatarFallback className="text-white text-sm font-bold" style={{ background: acColor }}>
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            {/* Online status indicator */}
                                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-background shadow-sm" />
                                        </div>
                                        <div className="hidden sm:block text-left max-w-[120px]">
                                            <p className="text-sm font-medium leading-tight truncate">{displayName}</p>
                                            <p className="text-xs text-muted-foreground truncate">{displayRole}</p>
                                        </div>
                                        <ChevronDown className="hidden sm:block w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                    </>
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl shadow-black/10 border border-border/50">
                            <DropdownMenuLabel>
                                <div className="flex flex-col">
                                    <span className="font-semibold">{displayName}</span>
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
                <div className="md:hidden absolute top-full left-0 right-0 p-3 bg-background/80 backdrop-blur-xl border-b border-border/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search events, registrations..."
                            autoFocus
                            className="w-full h-10 pl-10 pr-4 bg-muted/50 rounded-xl border border-white/[0.08] outline-none text-sm placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/30"
                            onBlur={() => setSearchOpen(false)}
                        />
                    </div>
                </div>
            )}
        </header>
    );
}
