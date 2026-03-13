"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store";
import { useSession, signOut } from "next-auth/react";
import { useTenant } from "@/lib/tenant/context";
import {
    LayoutDashboard,
    Calendar,
    Users,
    UserCog,
    Award,
    Mic2,
    Building2,
    Landmark,
    Settings,
    LogOut,
    ChevronLeft,
    Brain,
    Menu,
    X,
    User,
} from "lucide-react";

// Define user roles
type UserRole = "SUPER_ADMIN" | "ADMIN" | "EVENT_MANAGER" | "REGISTRATION_MANAGER" | "CERTIFICATE_MANAGER" | "ATTENDEE";

// Tenant sections/modules config shape
interface TenantSections {
    hero?: boolean;
    events?: boolean;
    gallery?: boolean;
    sponsors?: boolean;
    about?: boolean;
    contact?: boolean;
    moduleSpeakers?: boolean;
    moduleSponsors?: boolean;
    moduleCertificates?: boolean;
    moduleRegistrations?: boolean;
}

// Menu items with role-based access and optional tenant module key
const menuItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER", "REGISTRATION_MANAGER", "CERTIFICATE_MANAGER", "ATTENDEE"] as UserRole[],
    },
    {
        title: "Events",
        href: "/dashboard/events",
        icon: Calendar,
        roles: ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER"] as UserRole[],
    },
    {
        title: "Registrations",
        href: "/dashboard/registrations",
        icon: Users,
        roles: ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER", "REGISTRATION_MANAGER"] as UserRole[],
        tenantModule: "moduleRegistrations" as keyof TenantSections,
    },
    {
        title: "Browse Events",
        href: "/dashboard/browse-events",
        icon: Calendar,
        roles: ["ATTENDEE"] as UserRole[],
    },
    {
        title: "My Registrations",
        href: "/dashboard/my-registrations",
        icon: Users,
        roles: ["ATTENDEE"] as UserRole[],
    },
    {
        title: "Speakers",
        href: "/dashboard/speakers",
        icon: Mic2,
        roles: ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER"] as UserRole[],
        tenantModule: "moduleSpeakers" as keyof TenantSections,
    },
    {
        title: "Certificates",
        href: "/dashboard/certificates",
        icon: Award,
        roles: ["SUPER_ADMIN", "ADMIN", "CERTIFICATE_MANAGER"] as UserRole[],
        tenantModule: "moduleCertificates" as keyof TenantSections,
    },
    {
        title: "My Certificates",
        href: "/dashboard/my-certificates",
        icon: Award,
        roles: ["ATTENDEE"] as UserRole[],
        tenantModule: "moduleCertificates" as keyof TenantSections,
    },
    {
        title: "Sponsors",
        href: "/dashboard/sponsors",
        icon: Building2,
        roles: ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER"] as UserRole[],
        tenantModule: "moduleSponsors" as keyof TenantSections,
    },
    {
        title: "User Management",
        href: "/dashboard/users",
        icon: UserCog,
        roles: ["SUPER_ADMIN", "ADMIN"] as UserRole[],
    },
    {
        title: "Tenants",
        href: "/dashboard/tenants",
        icon: Landmark,
        roles: ["SUPER_ADMIN"] as UserRole[],
    },
    {
        title: "Organization",
        href: "/dashboard/organization",
        icon: Building2,
        roles: ["ADMIN"] as UserRole[],
    },
    {
        title: "Profile",
        href: "/dashboard/profile",
        icon: User,
        roles: ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER", "REGISTRATION_MANAGER", "CERTIFICATE_MANAGER", "ATTENDEE"] as UserRole[],
    },
    {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        roles: ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER"] as UserRole[],
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { sidebarCollapsed, toggleSidebarCollapse, sidebarOpen, setSidebarOpen } = useUIStore();
    const { data: session } = useSession();
    const [mounted, setMounted] = useState(false);
    const [tenantSections, setTenantSections] = useState<TenantSections | null>(null);

    // Get user role from session
    const userRole = (session?.user?.role as UserRole) || "ATTENDEE";
    const tenantId = (session?.user as any)?.tenantId as string | null | undefined;

    // Fetch tenant sections config for non-super-admin users
    useEffect(() => {
        if (!tenantId || userRole === "SUPER_ADMIN") {
            setTenantSections(null);
            return;
        }

        async function fetchTenantSections() {
            try {
                const res = await fetch(`/api/tenants/by-id/${tenantId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data?.sections) {
                        setTenantSections(data.data.sections);
                    }
                }
            } catch {
                // Silently fail — show all modules if fetch fails
            }
        }

        fetchTenantSections();
    }, [tenantId, userRole]);

    // Filter menu items based on user role + tenant module config
    const filteredMenuItems = menuItems.filter((item) => {
        // Role check first
        if (!item.roles.includes(userRole)) return false;

        // SUPER_ADMIN always sees everything
        if (userRole === "SUPER_ADMIN") return true;

        // If item has a tenant module requirement and tenant config is loaded
        if (item.tenantModule && tenantSections) {
            const moduleEnabled = tenantSections[item.tenantModule];
            // If explicitly set to false, hide it
            if (moduleEnabled === false) return false;
        }

        return true;
    });

    // Get tenant slug for logout redirect (only for actual tenant users, not SUPER_ADMIN)
    const { tenant } = useTenant();
    const tenantSlug = userRole !== "SUPER_ADMIN" && tenant?.slug && tenant.slug !== "default"
        ? tenant.slug
        : null;

    // Handle logout — redirect to tenant homepage if tenant user, otherwise main home
    const handleLogout = () => {
        signOut({ callbackUrl: tenantSlug ? `/t/${tenantSlug}` : "/" });
    };

    // Prevent hydration mismatch by only applying client state after mount
    useEffect(() => {
        setMounted(true);
    }, []);

    // Use default values during SSR, actual values after hydration
    const isCollapsed = mounted ? sidebarCollapsed : false;
    const isOpen = mounted ? sidebarOpen : false;

    // Don't render dynamic parts until mounted to prevent hydration mismatch
    if (!mounted) {
        return (
            <aside className="fixed top-0 left-0 z-50 h-full bg-[var(--sidebar-bg,#0f172a)] flex flex-col transition-all duration-300 ease-in-out lg:w-64 w-[280px] -translate-x-full lg:translate-x-0">
                <div className="flex items-center h-16 border-b border-white/10 px-4 justify-between">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl gradient-medical flex items-center justify-center">
                            <Award className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-white">ICMS</span>
                    </Link>
                </div>
            </aside>
        );
    }

    return (
        <>
            {/* Mobile overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-full bg-[var(--sidebar-bg,#0f172a)] flex flex-col transition-all duration-300 ease-in-out",
                    // Desktop width based on collapse state
                    isCollapsed ? "lg:w-[72px]" : "lg:w-64",
                    // Mobile: full width drawer
                    "w-[280px]",
                    // Transform for mobile
                    isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                    // Shadow for mobile
                    isOpen && "shadow-2xl lg:shadow-none"
                )}
            >
                {/* Logo Header */}
                <div className={cn(
                    "flex items-center h-16 border-b border-white/10 px-4",
                    isCollapsed ? "lg:justify-center lg:px-0" : "justify-between"
                )}>
                    <Link href="/dashboard" className={cn(
                        "flex items-center gap-3",
                        isCollapsed && "lg:justify-center"
                    )}>
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/10">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div className={cn(
                            "transition-all duration-200",
                            isCollapsed ? "lg:hidden" : "block"
                        )}>
                            <h1 className="text-white font-bold text-lg leading-tight">ICMS</h1>
                            <p className="text-white/50 text-[10px] leading-tight">
                                Conference Management
                            </p>
                        </div>
                    </Link>

                    {/* Mobile close button */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <ul className="space-y-1">
                        {filteredMenuItems.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                                            isCollapsed && "lg:justify-center lg:px-0",
                                            isActive
                                                ? "bg-white/15 text-white shadow-lg"
                                                : "text-white/60 hover:text-white hover:bg-white/10"
                                        )}
                                        title={isCollapsed ? item.title : undefined}
                                    >
                                        {/* Active indicator */}
                                        {isActive && (
                                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                                        )}
                                        <item.icon
                                            className={cn(
                                                "w-5 h-5 flex-shrink-0 transition-all",
                                                isActive && "text-white"
                                            )}
                                        />
                                        <span className={cn(
                                            "font-medium text-sm whitespace-nowrap transition-all duration-200",
                                            isCollapsed ? "lg:hidden" : "block"
                                        )}>
                                            {item.title}
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Footer Actions */}
                <div className="p-3 border-t border-white/10 space-y-1">
                    {/* Collapse toggle - desktop only */}
                    <button
                        onClick={toggleSidebarCollapse}
                        className={cn(
                            "hidden lg:flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all",
                            isCollapsed && "justify-center px-0"
                        )}
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <ChevronLeft
                            className={cn(
                                "w-5 h-5 transition-transform duration-300",
                                isCollapsed && "rotate-180"
                            )}
                        />
                        <span className={cn(
                            "font-medium text-sm",
                            isCollapsed ? "hidden" : "block"
                        )}>
                            Collapse
                        </span>
                    </button>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-red-300 hover:bg-red-500/10 transition-all w-full",
                            isCollapsed && "lg:justify-center lg:px-0"
                        )}
                        title={isCollapsed ? "Logout" : undefined}
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        <span className={cn(
                            "font-medium text-sm",
                            isCollapsed ? "lg:hidden" : "block"
                        )}>
                            Logout
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export function MobileMenuButton() {
    const { setSidebarOpen } = useUIStore();

    return (
        <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
            aria-label="Open menu"
        >
            <Menu className="w-6 h-6 text-foreground" />
        </button>
    );
}
