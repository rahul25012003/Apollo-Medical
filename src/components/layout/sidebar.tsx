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
    CreditCard,
    LogOut,
    ChevronLeft,
    Brain,
    Menu,
    X,
    User,
    BookOpen,
    Shield,
    QrCode,
    MessageSquare,
    ChevronDown,
    BarChart3,
    Mail,
    Eye,
} from "lucide-react";
import { eventsService, Event } from "@/services/events";

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
        group: "Main",
    },
    {
        title: "Events",
        href: "/dashboard/events",
        icon: Calendar,
        roles: ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER"] as UserRole[],
        group: "Main",
    },
    {
        title: "Registrations",
        href: "/dashboard/registrations",
        icon: Users,
        roles: ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER", "REGISTRATION_MANAGER"] as UserRole[],
        tenantModule: "moduleRegistrations" as keyof TenantSections,
        group: "Main",
    },
    {
        title: "Browse Events",
        href: "/dashboard/browse-events",
        icon: Calendar,
        roles: ["ATTENDEE"] as UserRole[],
        group: "Main",
    },
    {
        title: "My Registrations",
        href: "/dashboard/my-registrations",
        icon: Users,
        roles: ["ATTENDEE"] as UserRole[],
        group: "Main",
    },
    {
        title: "My Sessions",
        href: "/dashboard/my-sessions",
        icon: Mic2,
        roles: ["ATTENDEE"] as UserRole[],
        group: "Main",
    },
    {
        title: "Speakers",
        href: "/dashboard/speakers",
        icon: Mic2,
        roles: ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER"] as UserRole[],
        tenantModule: "moduleSpeakers" as keyof TenantSections,
        group: "Management",
    },
    {
        title: "Certificates",
        href: "/dashboard/certificates",
        icon: Award,
        roles: ["SUPER_ADMIN", "ADMIN", "CERTIFICATE_MANAGER"] as UserRole[],
        tenantModule: "moduleCertificates" as keyof TenantSections,
        group: "Management",
    },
    {
        title: "My Certificates",
        href: "/dashboard/my-certificates",
        icon: Award,
        roles: ["ATTENDEE"] as UserRole[],
        tenantModule: "moduleCertificates" as keyof TenantSections,
        group: "Management",
    },
    // Sponsors hidden from sidebar until explicitly needed
    // {
    //     title: "Sponsors",
    //     href: "/dashboard/sponsors",
    //     icon: Building2,
    //     roles: ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER"] as UserRole[],
    //     tenantModule: "moduleSponsors" as keyof TenantSections,
    //     group: "Management",
    // },
    {
        title: "Communications",
        href: "/dashboard/communications",
        icon: Mail,
        roles: ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER"] as UserRole[],
        group: "Management",
    },
    {
        title: "Reports",
        href: "/dashboard/reports",
        icon: BarChart3,
        roles: ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER"] as UserRole[],
        group: "Management",
    },
    {
        title: "User Management",
        href: "/dashboard/users",
        icon: UserCog,
        roles: ["SUPER_ADMIN", "ADMIN"] as UserRole[],
        group: "System",
    },
    {
        title: "Tenants",
        href: "/dashboard/tenants",
        icon: Landmark,
        roles: ["SUPER_ADMIN"] as UserRole[],
        group: "System",
    },
    {
        title: "Organization",
        href: "/dashboard/organization",
        icon: Building2,
        roles: ["ADMIN"] as UserRole[],
        group: "System",
    },
    {
        title: "Profile",
        href: "/dashboard/profile",
        icon: User,
        roles: ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER", "REGISTRATION_MANAGER", "CERTIFICATE_MANAGER", "ATTENDEE"] as UserRole[],
        group: "System",
    },
    {
        title: "Payment Settings",
        href: "/dashboard/settings/payment",
        icon: CreditCard,
        roles: ["SUPER_ADMIN", "ADMIN"] as UserRole[],
        group: "System",
    },
    {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        roles: ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER"] as UserRole[],
        group: "System",
    },
];

// Admin roles for event-specific menu items
const ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER"];

export function Sidebar() {
    const pathname = usePathname();
    const { sidebarCollapsed, toggleSidebarCollapse, sidebarOpen, setSidebarOpen, selectedEventId, setSelectedEventId } = useUIStore();
    const { data: session } = useSession();
    const [mounted, setMounted] = useState(false);
    const [tenantSections, setTenantSections] = useState<TenantSections | null>(null);
    const [eventsList, setEventsList] = useState<Event[]>([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [eventSelectorOpen, setEventSelectorOpen] = useState(false);

    // Get user role from session
    const userRole = (session?.user?.role as UserRole) || "ATTENDEE";
    const tenantId = (session?.user as any)?.tenantId as string | null | undefined;
    const isAdmin = ADMIN_ROLES.includes(userRole);

    // Role-based accent colors for sidebar
    // Role accent — using CSS color values for dynamic styling
    // Premium role accent colors — deep, rich tones
    const accentColors: Record<string, { color: string; colorLight: string }> = {
        ATTENDEE:             { color: "#0d9488", colorLight: "rgba(13,148,136,0.15)" },
        SUPER_ADMIN:          { color: "#a1a1aa", colorLight: "rgba(161,161,170,0.12)" },
        ADMIN:                { color: "#2563eb", colorLight: "rgba(37,99,235,0.15)" },
        EVENT_MANAGER:        { color: "#7c3aed", colorLight: "rgba(124,58,237,0.15)" },
        REGISTRATION_MANAGER: { color: "#3b82f6", colorLight: "rgba(59,130,246,0.15)" },
        CERTIFICATE_MANAGER:  { color: "#db2777", colorLight: "rgba(219,39,119,0.15)" },
    };
    const ac = accentColors[userRole] || accentColors.ATTENDEE;

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

    // Fetch events for admin event selector
    useEffect(() => {
        if (!isAdmin || !session) return;
        setEventsLoading(true);
        eventsService.getAll({ limit: 100, sortBy: "startDate", sortOrder: "desc" })
            .then((res) => {
                if (res.success && Array.isArray(res.data)) {
                    setEventsList(res.data);
                }
            })
            .catch(() => { /* silently fail */ })
            .finally(() => setEventsLoading(false));
    }, [isAdmin, session]);

    // Selected event name for display
    const selectedEventName = eventsList.find((e) => e.id === selectedEventId)?.title || null;

    // Event-specific menu items (only shown when an event is selected)
    const eventMenuItems = selectedEventId && isAdmin ? [
        {
            title: "ID Cards",
            href: "/dashboard/id-cards",
            icon: CreditCard,
            roles: ADMIN_ROLES,
            group: "Event",
        },
        {
            title: "Scientific Program",
            href: "/dashboard/scientific-program",
            icon: BookOpen,
            roles: ADMIN_ROLES,
            group: "Event",
        },
        {
            title: "Access Control",
            href: "/dashboard/access-control",
            icon: Shield,
            roles: ADMIN_ROLES,
            group: "Event",
        },
        {
            title: "Scanner",
            href: "/dashboard/scanner",
            icon: QrCode,
            roles: ADMIN_ROLES,
            group: "Event",
        },
        {
            title: "Engagement",
            href: "/dashboard/engagement",
            icon: MessageSquare,
            roles: ADMIN_ROLES,
            group: "Event",
        },
    ] : [];

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

    // Get tenant context — but SUPER_ADMIN without selected tenant should see ICMS, not any tenant
    const { tenant } = useTenant();
    const isSuperAdminNoTenant = userRole === "SUPER_ADMIN" && (!tenant?.slug || tenant.slug === "default");
    const sidebarBrandName = isSuperAdminNoTenant ? "ICMS" : (tenant?.branding?.shortName || tenant?.branding?.name || "");
    const sidebarBrandLogo = isSuperAdminNoTenant ? null : (tenant?.branding?.logo || null);
    const tenantSlug = userRole !== "SUPER_ADMIN" && tenant?.slug && tenant.slug !== "default"
        ? tenant.slug
        : null;

    // Handle logout — redirect to tenant login page (guaranteed to work on all environments)
    const handleLogout = () => {
        if (tenantSlug) {
            // Tenant user → go to that tenant's login page
            signOut({ callbackUrl: `/auth/login?tenant=${tenantSlug}` });
        } else {
            // Super admin / no tenant → go to ICMS login
            signOut({ callbackUrl: "/auth/login" });
        }
    };

    // Prevent hydration mismatch by only applying client state after mount
    useEffect(() => {
        setMounted(true);
    }, []);

    // Use default values during SSR, actual values after hydration
    const isCollapsed = mounted ? sidebarCollapsed : false;
    const isOpen = mounted ? sidebarOpen : false;

    // Combine all menu items (existing + event-specific)
    const allFilteredItems = [...filteredMenuItems, ...eventMenuItems];

    // Group filtered items by section
    const groupedItems = allFilteredItems.reduce<Record<string, typeof allFilteredItems>>((acc, item) => {
        const group = item.group || "Main";
        if (!acc[group]) acc[group] = [];
        acc[group].push(item);
        return acc;
    }, {});

    const groupOrder = ["Main", "Event", "Management", "System"];

    // Don't render dynamic parts until mounted to prevent hydration mismatch
    if (!mounted) {
        return (
            <aside className="fixed top-0 left-0 z-50 h-full bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 flex flex-col transition-all duration-300 ease-in-out lg:w-64 w-[280px] -translate-x-full lg:translate-x-0">
                {/* Right edge accent line */}
                <div className="absolute top-0 right-0 w-[1px] h-full" style={{ background: `linear-gradient(to bottom, ${ac.color}66, transparent)` }} />
                <div className="flex items-center h-16 border-b border-white/[0.06] px-4 justify-between">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        {sidebarBrandLogo ? (
                            <div className="relative w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-lg overflow-hidden">
                                <img src={sidebarBrandLogo} alt={sidebarBrandName || "Logo"} className="w-[80%] h-[80%] object-contain" />
                            </div>
                        ) : (
                            <div className="relative w-9 h-9 rounded-full flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${ac.color}, ${ac.color}cc)` }}>
                                <span className="text-white font-bold text-sm">{sidebarBrandName.slice(0, 2)}</span>
                            </div>
                        )}
                        <span className="text-xs font-bold text-white tracking-tight truncate max-w-[160px]">{sidebarBrandName}</span>
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
                    "fixed inset-0 bg-black/70 backdrop-blur-md z-40 lg:hidden transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-full bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 flex flex-col transition-all duration-300 ease-in-out",
                    // Desktop width based on collapse state
                    isCollapsed ? "lg:w-[72px]" : "lg:w-64",
                    // Mobile: full width drawer
                    "w-[280px]",
                    // Transform for mobile
                    isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                    // Shadow for mobile
                    isOpen && "shadow-2xl shadow-black/50 lg:shadow-none"
                )}
            >
                {/* Right edge accent line */}
                <div className="absolute top-0 right-0 w-[1px] h-full pointer-events-none z-10" style={{ background: `linear-gradient(to bottom, ${ac.color}66, transparent)` }} />

                {/* Logo Header */}
                <div className={cn(
                    "flex items-center h-16 border-b border-white/[0.06] px-4",
                    isCollapsed ? "lg:justify-center lg:px-0" : "justify-between"
                )}>
                    <Link href="/dashboard" className={cn(
                        "flex items-center gap-3",
                        isCollapsed && "lg:justify-center"
                    )}>
                        {sidebarBrandLogo ? (
                            <div className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                                <img src={sidebarBrandLogo} alt={sidebarBrandName || "Logo"} className="w-[80%] h-[80%] object-contain" />
                            </div>
                        ) : (
                            <div className="relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg" style={{ background: `linear-gradient(135deg, ${ac.color}, ${ac.color}cc)` }}>
                                <span className="text-white font-bold">{sidebarBrandName.slice(0, 2)}</span>
                            </div>
                        )}
                        <div className={cn(
                            "transition-all duration-200",
                            isCollapsed ? "lg:hidden" : "block"
                        )}>
                            <h1 className="text-white font-bold text-sm leading-tight tracking-tight truncate max-w-[180px]">{sidebarBrandName}</h1>
                            <p className="text-white/40 text-[10px] leading-tight font-medium tracking-wider uppercase">
                                {isSuperAdminNoTenant ? "Platform Administration" : "Conference Management"}
                            </p>
                        </div>
                    </Link>

                    {/* Mobile close button */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {/* Event Selector - only for admins */}
                    {isAdmin && !isCollapsed && (
                        <div className="mb-2 mt-1 px-2">
                            <div className={cn(
                                "h-[1px] mb-3",
                                "bg-gradient-to-r from-white/10 via-white/[0.06] to-transparent"
                            )} />
                            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25 px-1 mb-1.5 block">
                                Active Event
                            </span>
                            <div className="relative">
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setEventSelectorOpen(!eventSelectorOpen)}
                                        className="flex-1 flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-sm transition-all duration-200 min-w-0"
                                    >
                                        <span className={cn(
                                            "truncate text-left",
                                            selectedEventName ? "text-white font-medium" : "text-white/40"
                                        )}>
                                            {eventsLoading ? "Loading..." : selectedEventName || "Select event..."}
                                        </span>
                                        <ChevronDown className={cn(
                                            "w-3.5 h-3.5 text-white/40 flex-shrink-0 transition-transform duration-200",
                                            eventSelectorOpen && "rotate-180"
                                        )} />
                                    </button>
                                    {selectedEventId && (
                                        <Link
                                            href={`/dashboard/events/${selectedEventId}`}
                                            className="flex-shrink-0 p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] transition-all duration-200 group"
                                            title="View event details"
                                        >
                                            <Eye className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                        </Link>
                                    )}
                                </div>
                                {eventSelectorOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg bg-slate-800 border border-white/10 shadow-xl shadow-black/30 z-50">
                                        {selectedEventId && (
                                            <button
                                                onClick={() => { setSelectedEventId(null); setEventSelectorOpen(false); }}
                                                className="w-full px-3 py-2 text-left text-xs text-white/40 hover:bg-white/[0.06] hover:text-white/60 transition-colors border-b border-white/[0.06]"
                                            >
                                                Clear selection
                                            </button>
                                        )}
                                        {eventsList.map((evt) => (
                                            <button
                                                key={evt.id}
                                                onClick={() => { setSelectedEventId(evt.id); setEventSelectorOpen(false); }}
                                                className={cn(
                                                    "w-full px-3 py-2 text-left text-sm hover:bg-white/[0.06] transition-colors truncate",
                                                    evt.id === selectedEventId
                                                        ? "text-white bg-white/10"
                                                        : "text-white/70"
                                                )}
                                            >
                                                {evt.title}
                                            </button>
                                        ))}
                                        {eventsList.length === 0 && !eventsLoading && (
                                            <div className="px-3 py-2 text-xs text-white/30">No events found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {/* Collapsed event selector indicator */}
                    {isAdmin && isCollapsed && (
                        <div className="mb-2 mt-1 px-2 hidden lg:block">
                            <div className="h-[1px] mb-2 mx-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <div
                                className={cn(
                                    "flex items-center justify-center p-2 rounded-lg cursor-pointer group relative",
                                    selectedEventId ? "bg-white/10" : "bg-white/[0.04]"
                                )}
                                title={selectedEventName || "No event selected"}
                            >
                                <Calendar className={cn(
                                    "w-5 h-5",
                                    selectedEventId ? "text-white" : "text-white/30"
                                )} />
                                {selectedEventId && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: ac.color, boxShadow: `0 0 6px ${ac.color}99` }} />
                                )}
                                <span className="hidden lg:group-hover:flex absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium whitespace-nowrap shadow-xl shadow-black/30 border border-white/10 z-50 pointer-events-none">
                                    {selectedEventName || "No event selected"}
                                    <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45 border-l border-b border-white/10" />
                                </span>
                            </div>
                        </div>
                    )}

                    {groupOrder.map((groupName) => {
                        const items = groupedItems[groupName];
                        if (!items || items.length === 0) return null;
                        return (
                            <div key={groupName} className="mb-2">
                                {/* Section label */}
                                {groupName !== "Main" && (
                                    <div className={cn(
                                        "mb-2 mt-3",
                                        isCollapsed ? "lg:px-0" : "px-3"
                                    )}>
                                        {/* Divider line */}
                                        <div className={cn(
                                            "h-[1px] mb-3",
                                            isCollapsed
                                                ? "lg:mx-2 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                                : "bg-gradient-to-r from-white/10 via-white/[0.06] to-transparent"
                                        )} />
                                        <span className={cn(
                                            "text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25",
                                            isCollapsed && "lg:hidden"
                                        )}>
                                            {groupName}
                                        </span>
                                    </div>
                                )}
                                <ul className="space-y-0.5">
                                    {items.map((item) => {
                                        const isActive = pathname === item.href ||
                                            (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
                                        return (
                                            <li key={item.href}>
                                                <Link
                                                    href={item.href}
                                                    onClick={() => setSidebarOpen(false)}
                                                    className={cn(
                                                        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                                                        isCollapsed && "lg:justify-center lg:px-0",
                                                        isActive
                                                            ? "text-white"
                                                            : "text-white/50 hover:text-white hover:bg-white/[0.06] hover:translate-x-0.5"
                                                    )}
                                                    style={isActive ? { background: `linear-gradient(to right, ${ac.colorLight}, transparent)` } : undefined}
                                                    title={isCollapsed ? item.title : undefined}
                                                >
                                                    {/* Active indicator bar */}
                                                    {isActive && (
                                                        <span className="absolute left-0 top-[6px] bottom-[6px] w-[3px] rounded-r-full" style={{ background: ac.color, boxShadow: `0 0 8px ${ac.color}88` }} />
                                                    )}
                                                    <item.icon
                                                        className={cn(
                                                            "w-5 h-5 flex-shrink-0 transition-all duration-200",
                                                            !isActive && "group-hover:text-white/80 group-hover:scale-110"
                                                        )}
                                                        style={isActive ? { color: ac.color, filter: `drop-shadow(0 0 6px ${ac.color}80)` } : undefined}
                                                    />
                                                    <span className={cn(
                                                        "font-medium text-sm whitespace-nowrap transition-all duration-200",
                                                        isCollapsed ? "lg:hidden" : "block"
                                                    )}>
                                                        {item.title}
                                                    </span>

                                                    {/* Collapsed tooltip */}
                                                    {isCollapsed && (
                                                        <span className="hidden lg:group-hover:flex absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium whitespace-nowrap shadow-xl shadow-black/30 border border-white/10 z-50 pointer-events-none">
                                                            {item.title}
                                                            <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45 border-l border-b border-white/10" />
                                                        </span>
                                                    )}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        );
                    })}
                </nav>

                {/* Footer Actions */}
                <div className="p-3 border-t border-white/[0.06] space-y-0.5">
                    {/* Collapse toggle - desktop only */}
                    <button
                        onClick={toggleSidebarCollapse}
                        className={cn(
                            "hidden lg:flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] transition-all duration-200 group",
                            isCollapsed && "justify-center px-0"
                        )}
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <ChevronLeft
                            className={cn(
                                "w-5 h-5 transition-all duration-300 group-hover:text-white/80",
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
                            "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:text-red-300 hover:bg-red-500/10 hover:shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)] transition-all duration-200 w-full",
                            isCollapsed && "lg:justify-center lg:px-0"
                        )}
                        title={isCollapsed ? "Logout" : undefined}
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0 transition-all duration-200 group-hover:scale-110" />
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
