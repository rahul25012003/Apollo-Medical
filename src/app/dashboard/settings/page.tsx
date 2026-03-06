"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Bell,
    Lock,
    User,
    Loader2,
    Eye,
    EyeOff,
    Monitor,
    Smartphone,
    Tablet,
    Globe,
    Trash2,
    LogOut,
    Clock,
    MapPin,
    Building2,
    Mail,
    Phone,
    Link,
    LayoutGrid,
    DollarSign,
    Plus,
    Pencil,
    MessageSquare,
    Star,
    TestTube,
    Check,
    X,
    AlertCircle,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { usersService, User as UserType, UserSession } from "@/services/users";
import { tenantsService, Tenant } from "@/services/tenants";
import { useTenantFilter } from "@/hooks/use-tenant-filter";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function SettingsPage() {
    const { effectiveTenantId, isSuperAdmin, sessionLoading } = useTenantFilter();

    const [user, setUser] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Tenant settings state (for SUPER_ADMIN with a tenant selected)
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [tenantLoading, setTenantLoading] = useState(false);
    const [savingTenant, setSavingTenant] = useState(false);
    const [tenantForm, setTenantForm] = useState({
        name: "",
        email: "",
        phone: "",
        website: "",
        defaultCurrency: "INR",
        defaultTimezone: "Asia/Kolkata",
    });
    const [tenantModules, setTenantModules] = useState({
        moduleSpeakers: true,
        moduleSponsors: true,
        moduleCertificates: true,
        moduleRegistrations: true,
    });
    const [tenantNotifications, setTenantNotifications] = useState({
        notifyRegistrations: true,
        notifyPayments: true,
    });

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        firstName: "",
        lastName: "",
        phone: "",
    });

    // Notification preferences state
    const [notifications, setNotifications] = useState({
        notifyEmail: true,
        notifyRegistrations: true,
        notifyPayments: true,
    });
    const [savingNotifications, setSavingNotifications] = useState(false);

    // Tenant notification config for non-SUPER_ADMIN users
    const [userTenantNotifyConfig, setUserTenantNotifyConfig] = useState<{
        notifyRegistrations: boolean;
        notifyPayments: boolean;
    } | null>(null);

    // Password dialog state
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // Sessions dialog state
    const [isSessionsDialogOpen, setIsSessionsDialogOpen] = useState(false);
    const [sessions, setSessions] = useState<UserSession[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [revokingSession, setRevokingSession] = useState<string | null>(null);
    const [revokingAll, setRevokingAll] = useState(false);

    // Notification channels state
    const [notifChannels, setNotifChannels] = useState<NotifChannel[]>([]);
    const [notifLoading, setNotifLoading] = useState(false);
    const [notifDialogOpen, setNotifDialogOpen] = useState(false);
    const [editingNotifChannel, setEditingNotifChannel] = useState<NotifChannel | null>(null);
    const [testingChannel, setTestingChannel] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ id: string; ok: boolean; msg: string } | null>(null);

    const showTenantSettings = isSuperAdmin && effectiveTenantId !== null;

    // Determine which personal notification types are available based on tenant config
    const canShowRegistrationNotify = isSuperAdmin || !userTenantNotifyConfig || userTenantNotifyConfig.notifyRegistrations;
    const canShowPaymentNotify = isSuperAdmin || !userTenantNotifyConfig || userTenantNotifyConfig.notifyPayments;

    // Fetch user profile on mount
    useEffect(() => {
        async function fetchProfile() {
            try {
                setLoading(true);
                const response = await usersService.getProfile();
                if (response.success && response.data) {
                    setUser(response.data);
                    setProfileForm({
                        firstName: response.data.firstName || "",
                        lastName: response.data.lastName || "",
                        phone: response.data.phone || "",
                    });
                    setNotifications({
                        notifyEmail: response.data.notifyEmail ?? true,
                        notifyRegistrations: response.data.notifyRegistrations ?? true,
                        notifyPayments: response.data.notifyPayments ?? true,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch profile:", error);
                toast.error("Failed to load profile");
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, []);

    // Fetch tenant settings when a tenant is selected
    useEffect(() => {
        if (sessionLoading) return;
        if (!showTenantSettings || !effectiveTenantId) {
            setTenant(null);
            return;
        }

        async function fetchTenant() {
            try {
                setTenantLoading(true);
                const response = await tenantsService.getById(effectiveTenantId!);
                if (response.success && response.data) {
                    const t = response.data;
                    setTenant(t);
                    setTenantForm({
                        name: t.name || "",
                        email: t.email || "",
                        phone: t.phone || "",
                        website: t.website || "",
                        defaultCurrency: t.defaultCurrency || "INR",
                        defaultTimezone: t.defaultTimezone || "Asia/Kolkata",
                    });
                    const sections = t.sections as Record<string, boolean> | null;
                    setTenantModules({
                        moduleSpeakers: sections?.moduleSpeakers !== false,
                        moduleSponsors: sections?.moduleSponsors !== false,
                        moduleCertificates: sections?.moduleCertificates !== false,
                        moduleRegistrations: sections?.moduleRegistrations !== false,
                    });
                    setTenantNotifications({
                        notifyRegistrations: sections?.notifyRegistrations !== false,
                        notifyPayments: sections?.notifyPayments !== false,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch tenant:", error);
                toast.error("Failed to load tenant settings");
            } finally {
                setTenantLoading(false);
            }
        }

        fetchTenant();
    }, [sessionLoading, showTenantSettings, effectiveTenantId]);

    // Fetch user's own tenant notification config (for non-SUPER_ADMIN)
    useEffect(() => {
        if (sessionLoading || isSuperAdmin) return;
        if (!effectiveTenantId) {
            setUserTenantNotifyConfig(null);
            return;
        }

        async function fetchUserTenantConfig() {
            try {
                const response = await tenantsService.getById(effectiveTenantId!);
                if (response.success && response.data) {
                    const sections = response.data.sections as Record<string, boolean> | null;
                    setUserTenantNotifyConfig({
                        notifyRegistrations: sections?.notifyRegistrations !== false,
                        notifyPayments: sections?.notifyPayments !== false,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch tenant config:", error);
            }
        }

        fetchUserTenantConfig();
    }, [sessionLoading, isSuperAdmin, effectiveTenantId]);

    // Handle save tenant settings
    const handleSaveTenantSettings = async () => {
        if (!tenant) return;

        try {
            setSavingTenant(true);
            const currentSections = (tenant.sections as Record<string, boolean>) || {};
            const response = await tenantsService.updateById(tenant.id, {
                name: tenantForm.name,
                email: tenantForm.email || null,
                phone: tenantForm.phone || null,
                website: tenantForm.website || null,
                defaultCurrency: tenantForm.defaultCurrency,
                defaultTimezone: tenantForm.defaultTimezone,
                sections: {
                    ...currentSections,
                    ...tenantModules,
                    ...tenantNotifications,
                },
            });
            if (response.success && response.data) {
                setTenant(response.data);
                toast.success("Tenant settings updated");
            } else {
                toast.error("Failed to update tenant settings");
            }
        } catch (error) {
            console.error("Failed to update tenant settings:", error);
            toast.error("Failed to update tenant settings");
        } finally {
            setSavingTenant(false);
        }
    };

    // Fetch sessions when dialog opens
    const handleOpenSessionsDialog = async () => {
        setIsSessionsDialogOpen(true);
        await fetchSessions();
    };

    const fetchSessions = async () => {
        try {
            setLoadingSessions(true);
            const response = await usersService.getSessions();
            if (response.success && response.data) {
                setSessions(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
            toast.error("Failed to load sessions");
        } finally {
            setLoadingSessions(false);
        }
    };

    // Handle notification toggle
    const handleNotificationToggle = async (key: keyof typeof notifications) => {
        const newValue = !notifications[key];
        const prevValue = notifications[key];

        // Optimistic update
        setNotifications((prev) => ({ ...prev, [key]: newValue }));

        try {
            setSavingNotifications(true);
            const response = await usersService.updateProfile({ [key]: newValue });
            if (response.success) {
                toast.success("Notification preference updated");
            } else {
                setNotifications((prev) => ({ ...prev, [key]: prevValue }));
                toast.error("Failed to update preference");
            }
        } catch (error) {
            console.error("Failed to update notification:", error);
            setNotifications((prev) => ({ ...prev, [key]: prevValue }));
            toast.error("Failed to update preference");
        } finally {
            setSavingNotifications(false);
        }
    };

    // Handle profile save
    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            const response = await usersService.updateProfile(profileForm);
            if (response.success && response.data) {
                setUser(response.data);
                toast.success("Profile updated successfully");
            } else {
                toast.error("Failed to update profile");
            }
        } catch (error) {
            console.error("Failed to update profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    // Handle password change
    const handleChangePassword = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        try {
            setChangingPassword(true);
            const response = await usersService.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
                confirmPassword: passwordForm.confirmPassword,
            });
            if (response.success) {
                toast.success("Password changed successfully");
                setIsPasswordDialogOpen(false);
                setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
            } else {
                toast.error(response.error?.message || "Failed to change password");
            }
        } catch (error) {
            console.error("Failed to change password:", error);
            toast.error("Failed to change password");
        } finally {
            setChangingPassword(false);
        }
    };

    // Revoke a single session
    const handleRevokeSession = async (sessionId: string) => {
        try {
            setRevokingSession(sessionId);
            const response = await usersService.revokeSession(sessionId);
            if (response.success) {
                toast.success("Session revoked");
                setSessions((prev) => prev.filter((s) => s.id !== sessionId));
            } else {
                toast.error(response.error?.message || "Failed to revoke session");
            }
        } catch (error) {
            console.error("Failed to revoke session:", error);
            toast.error("Failed to revoke session");
        } finally {
            setRevokingSession(null);
        }
    };

    // Revoke all other sessions
    const handleRevokeAllSessions = async () => {
        try {
            setRevokingAll(true);
            const response = await usersService.revokeAllSessions();
            if (response.success) {
                toast.success(`Logged out from ${response.data?.revokedCount || 0} device(s)`);
                await fetchSessions();
            } else {
                toast.error("Failed to revoke sessions");
            }
        } catch (error) {
            console.error("Failed to revoke sessions:", error);
            toast.error("Failed to revoke sessions");
        } finally {
            setRevokingAll(false);
        }
    };

    // ── Notification Channels ──
    const { data: sessionData } = useSession();
    const sessionRole = sessionData?.user?.role;
    const isAdmin = sessionRole === "SUPER_ADMIN" || sessionRole === "ADMIN";

    useEffect(() => {
        if (!isAdmin) return;
        async function fetchChannels() {
            setNotifLoading(true);
            try {
                const res = await fetch("/api/notification-channels");
                const d = await res.json();
                if (d.success) setNotifChannels(d.data);
            } catch { /* ignore */ }
            finally { setNotifLoading(false); }
        }
        fetchChannels();
    }, [isAdmin]);

    const refreshNotifChannels = async () => {
        try {
            const res = await fetch("/api/notification-channels");
            const d = await res.json();
            if (d.success) setNotifChannels(d.data);
        } catch { /* ignore */ }
    };

    const handleDeleteNotifChannel = async (id: string) => {
        if (!confirm("Delete this notification channel?")) return;
        await fetch(`/api/notification-channels/${id}`, { method: "DELETE" });
        setNotifChannels((p) => p.filter((c) => c.id !== id));
    };

    const handleToggleNotifChannel = async (ch: NotifChannel) => {
        await fetch(`/api/notification-channels/${ch.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !ch.isActive }),
        });
        setNotifChannels((p) => p.map((c) => c.id === ch.id ? { ...c, isActive: !c.isActive } : c));
    };

    const handleSetDefaultNotifChannel = async (ch: NotifChannel) => {
        await fetch(`/api/notification-channels/${ch.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isDefault: true }),
        });
        setNotifChannels((p) => p.map((c) =>
            c.channel === ch.channel ? { ...c, isDefault: c.id === ch.id } : c
        ));
    };

    const handleTestNotifChannel = async (id: string) => {
        setTestingChannel(id);
        setTestResult(null);
        try {
            const res = await fetch("/api/notification-channels/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ channelId: id }),
            });
            const d = await res.json();
            setTestResult({ id, ok: d.success, msg: d.success ? "Test sent!" : (d.error?.message || "Failed") });
        } catch {
            setTestResult({ id, ok: false, msg: "Failed to send test" });
        } finally {
            setTestingChannel(null);
        }
    };

    // Get device icon
    const getDeviceIcon = (deviceType: string | null) => {
        switch (deviceType?.toLowerCase()) {
            case "mobile":
                return <Smartphone className="h-5 w-5" />;
            case "tablet":
                return <Tablet className="h-5 w-5" />;
            default:
                return <Monitor className="h-5 w-5" />;
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="Settings" subtitle="Manage your account settings">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    const subtitle = showTenantSettings && tenant
        ? `Tenant settings for ${tenant.name}`
        : "Manage your account settings";

    return (
        <DashboardLayout title="Settings" subtitle={subtitle}>
            <div className="max-w-4xl space-y-6">

                {/* Tenant Settings Section (SUPER_ADMIN with tenant selected) */}
                {showTenantSettings && (
                    <>
                        {tenantLoading ? (
                            <div className="flex items-center justify-center min-h-[200px]">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : tenant ? (
                            <>
                                {/* Tenant Contact */}
                                <div className="bg-background rounded-xl border border-border p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <Building2 className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-foreground">Tenant Information</h2>
                                            <p className="text-sm text-muted-foreground">Basic details and contact for this tenant</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label htmlFor="tenantName">Tenant Name</Label>
                                            <Input
                                                id="tenantName"
                                                value={tenantForm.name}
                                                onChange={(e) => setTenantForm((prev) => ({ ...prev, name: e.target.value }))}
                                                icon={<Building2 className="w-4 h-4" />}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="tenantEmail">Contact Email</Label>
                                            <Input
                                                id="tenantEmail"
                                                type="email"
                                                value={tenantForm.email}
                                                onChange={(e) => setTenantForm((prev) => ({ ...prev, email: e.target.value }))}
                                                icon={<Mail className="w-4 h-4" />}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="tenantPhone">Contact Phone</Label>
                                            <Input
                                                id="tenantPhone"
                                                type="tel"
                                                value={tenantForm.phone}
                                                onChange={(e) => setTenantForm((prev) => ({ ...prev, phone: e.target.value }))}
                                                icon={<Phone className="w-4 h-4" />}
                                            />
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label htmlFor="tenantWebsite">Website</Label>
                                            <Input
                                                id="tenantWebsite"
                                                type="url"
                                                value={tenantForm.website}
                                                onChange={(e) => setTenantForm((prev) => ({ ...prev, website: e.target.value }))}
                                                icon={<Link className="w-4 h-4" />}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Tenant Modules */}
                                <div className="bg-background rounded-xl border border-border p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <LayoutGrid className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-foreground">Enabled Modules</h2>
                                            <p className="text-sm text-muted-foreground">Choose which features are available for this tenant</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                                            <div>
                                                <p className="font-medium text-foreground">Speakers</p>
                                                <p className="text-sm text-muted-foreground">Manage event speakers and sessions</p>
                                            </div>
                                            <Switch
                                                checked={tenantModules.moduleSpeakers}
                                                onCheckedChange={(val) => setTenantModules((prev) => ({ ...prev, moduleSpeakers: val }))}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                                            <div>
                                                <p className="font-medium text-foreground">Sponsors</p>
                                                <p className="text-sm text-muted-foreground">Manage event sponsors and partnerships</p>
                                            </div>
                                            <Switch
                                                checked={tenantModules.moduleSponsors}
                                                onCheckedChange={(val) => setTenantModules((prev) => ({ ...prev, moduleSponsors: val }))}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                                            <div>
                                                <p className="font-medium text-foreground">Certificates</p>
                                                <p className="text-sm text-muted-foreground">Generate and issue certificates</p>
                                            </div>
                                            <Switch
                                                checked={tenantModules.moduleCertificates}
                                                onCheckedChange={(val) => setTenantModules((prev) => ({ ...prev, moduleCertificates: val }))}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                                            <div>
                                                <p className="font-medium text-foreground">Registrations</p>
                                                <p className="text-sm text-muted-foreground">Handle event registrations and attendees</p>
                                            </div>
                                            <Switch
                                                checked={tenantModules.moduleRegistrations}
                                                onCheckedChange={(val) => setTenantModules((prev) => ({ ...prev, moduleRegistrations: val }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Tenant Defaults */}
                                <div className="bg-background rounded-xl border border-border p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <DollarSign className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-foreground">Defaults</h2>
                                            <p className="text-sm text-muted-foreground">Default currency and timezone for this tenant</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Default Currency</Label>
                                            <Select
                                                value={tenantForm.defaultCurrency}
                                                onValueChange={(val) => setTenantForm((prev) => ({ ...prev, defaultCurrency: val }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                                                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                                                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                                                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Default Timezone</Label>
                                            <Select
                                                value={tenantForm.defaultTimezone}
                                                onValueChange={(val) => setTenantForm((prev) => ({ ...prev, defaultTimezone: val }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                                                    <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                                                    <SelectItem value="America/Chicago">America/Chicago (CST)</SelectItem>
                                                    <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
                                                    <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                                                    <SelectItem value="Europe/Berlin">Europe/Berlin (CET)</SelectItem>
                                                    <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                                                    <SelectItem value="Asia/Singapore">Asia/Singapore (SGT)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Tenant Notification Settings */}
                                <div className="bg-background rounded-xl border border-border p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <Bell className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-foreground">Notification Settings</h2>
                                            <p className="text-sm text-muted-foreground">Control which notification types are available for this tenant&apos;s users</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                                            <div>
                                                <p className="font-medium text-foreground">Registration Alerts</p>
                                                <p className="text-sm text-muted-foreground">Allow users to receive new registration notifications</p>
                                            </div>
                                            <Switch
                                                checked={tenantNotifications.notifyRegistrations}
                                                onCheckedChange={(val) => setTenantNotifications((prev) => ({ ...prev, notifyRegistrations: val }))}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                                            <div>
                                                <p className="font-medium text-foreground">Payment Notifications</p>
                                                <p className="text-sm text-muted-foreground">Allow users to receive payment confirmation notifications</p>
                                            </div>
                                            <Switch
                                                checked={tenantNotifications.notifyPayments}
                                                onCheckedChange={(val) => setTenantNotifications((prev) => ({ ...prev, notifyPayments: val }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Save Tenant Settings */}
                                <div className="flex justify-end">
                                    <Button onClick={handleSaveTenantSettings} disabled={savingTenant}>
                                        {savingTenant && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Tenant Settings
                                    </Button>
                                </div>
                            </>
                        ) : null}

                        {/* Divider between tenant and personal settings */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-muted/30 px-3 text-muted-foreground">Personal Settings</span>
                            </div>
                        </div>
                    </>
                )}

                {/* Profile Section */}
                <div className="bg-background rounded-xl border border-border p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-foreground">Profile Settings</h2>
                            <p className="text-sm text-muted-foreground">Manage your personal information</p>
                        </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                value={profileForm.firstName}
                                onChange={(e) => setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                value={profileForm.lastName}
                                onChange={(e) => setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={user?.email || ""}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={profileForm.phone}
                                onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-border flex justify-end">
                        <Button onClick={handleSaveProfile} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </div>

                {/* Security Section */}
                <div className="bg-background rounded-xl border border-border p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Lock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-foreground">Security</h2>
                            <p className="text-sm text-muted-foreground">Password and authentication settings</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                            <div>
                                <p className="font-medium text-foreground">Change Password</p>
                                <p className="text-sm text-muted-foreground">Update your password regularly</p>
                            </div>
                            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)}>
                                Change
                            </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                            <div>
                                <p className="font-medium text-foreground">Active Sessions</p>
                                <p className="text-sm text-muted-foreground">Manage your logged in devices</p>
                            </div>
                            <Button variant="outline" onClick={handleOpenSessionsDialog}>
                                Manage
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="bg-background rounded-xl border border-border p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Bell className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-foreground">Notifications</h2>
                            <p className="text-sm text-muted-foreground">Configure how you receive notifications</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                            <div>
                                <p className="font-medium text-foreground">Email Notifications</p>
                                <p className="text-sm text-muted-foreground">Receive updates via email</p>
                            </div>
                            <Switch
                                checked={notifications.notifyEmail}
                                onCheckedChange={() => handleNotificationToggle("notifyEmail")}
                                disabled={savingNotifications}
                            />
                        </div>

                        {canShowRegistrationNotify && (
                            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                                <div>
                                    <p className="font-medium text-foreground">New Registration Alerts</p>
                                    <p className="text-sm text-muted-foreground">Get notified for new registrations</p>
                                </div>
                                <Switch
                                    checked={notifications.notifyRegistrations}
                                    onCheckedChange={() => handleNotificationToggle("notifyRegistrations")}
                                    disabled={savingNotifications}
                                />
                            </div>
                        )}

                        {canShowPaymentNotify && (
                            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                                <div>
                                    <p className="font-medium text-foreground">Payment Notifications</p>
                                    <p className="text-sm text-muted-foreground">Receive payment confirmations</p>
                                </div>
                                <Switch
                                    checked={notifications.notifyPayments}
                                    onCheckedChange={() => handleNotificationToggle("notifyPayments")}
                                    disabled={savingNotifications}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Notification Channels Section (Admin only) */}
                {isAdmin && (
                    <div className="bg-background rounded-xl border border-border p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-teal-500/10">
                                    <Mail className="w-5 h-5 text-teal-600" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-foreground">Notification Channels</h2>
                                    <p className="text-sm text-muted-foreground">Configure Email, SMS & WhatsApp providers</p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => { setEditingNotifChannel(null); setNotifDialogOpen(true); }}
                                className="bg-teal-600 hover:bg-teal-700"
                            >
                                <Plus className="w-4 h-4 mr-1" /> Add Channel
                            </Button>
                        </div>

                        {notifLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : notifChannels.length === 0 ? (
                            <p className="text-center text-muted-foreground text-sm py-8">
                                No notification channels configured. Add one to start sending emails, SMS or WhatsApp messages.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {(["EMAIL", "SMS", "WHATSAPP"] as const).map((type) => {
                                    const items = notifChannels.filter((c) => c.channel === type);
                                    if (items.length === 0) return null;
                                    const icon = type === "EMAIL" ? <Mail className="w-4 h-4 text-teal-600" />
                                        : type === "SMS" ? <Phone className="w-4 h-4 text-blue-600" />
                                        : <MessageSquare className="w-4 h-4 text-green-600" />;
                                    return (
                                        <div key={type} className="border rounded-lg overflow-hidden">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b text-sm font-medium">
                                                {icon} {type === "WHATSAPP" ? "WhatsApp" : type.charAt(0) + type.slice(1).toLowerCase()} <span className="text-muted-foreground ml-auto text-xs">{items.length}</span>
                                            </div>
                                            <div className="divide-y">
                                                {items.map((ch) => (
                                                    <div key={ch.id} className="px-4 py-3 flex items-center gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium truncate">{ch.name}</span>
                                                                {ch.isDefault && <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200"><Star className="w-3 h-3 mr-0.5" />Default</Badge>}
                                                                {!ch.isActive && <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">Disabled</Badge>}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">{NOTIF_PROVIDERS[ch.channel]?.find((p) => p.id === ch.provider)?.name || ch.provider}</p>
                                                            {testResult?.id === ch.id && (
                                                                <p className={`text-xs mt-0.5 ${testResult.ok ? "text-green-600" : "text-red-600"}`}>{testResult.msg}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-0.5">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Test" disabled={testingChannel === ch.id || !ch.isActive} onClick={() => handleTestNotifChannel(ch.id)}>
                                                                {testingChannel === ch.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TestTube className="w-3.5 h-3.5" />}
                                                            </Button>
                                                            {!ch.isDefault && ch.isActive && (
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Set default" onClick={() => handleSetDefaultNotifChannel(ch)}>
                                                                    <Star className="w-3.5 h-3.5" />
                                                                </Button>
                                                            )}
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" title={ch.isActive ? "Disable" : "Enable"} onClick={() => handleToggleNotifChannel(ch)}>
                                                                {ch.isActive ? <Check className="w-3.5 h-3.5 text-green-600" /> : <X className="w-3.5 h-3.5" />}
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => { setEditingNotifChannel(ch); setNotifDialogOpen(true); }}>
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete" onClick={() => handleDeleteNotifChannel(ch.id)}>
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* Add/Edit Notification Channel Dialog */}
            {notifDialogOpen && (
                <NotifChannelDialog
                    editing={editingNotifChannel}
                    onClose={() => { setNotifDialogOpen(false); setEditingNotifChannel(null); }}
                    onSaved={() => { setNotifDialogOpen(false); setEditingNotifChannel(null); refreshNotifChannels(); }}
                />
            )}

            {/* Change Password Dialog */}
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                            Enter your current password and choose a new password.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showNewPassword ? "text" : "password"}
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsPasswordDialogOpen(false)}
                            disabled={changingPassword}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleChangePassword}
                            disabled={changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                        >
                            {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Change Password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Active Sessions Dialog */}
            <Dialog open={isSessionsDialogOpen} onOpenChange={setIsSessionsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Active Sessions</DialogTitle>
                        <DialogDescription>
                            Manage your logged in devices. You can log out from other devices here.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {loadingSessions ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No active sessions found
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className={`p-4 rounded-lg border ${session.isCurrent ? "border-primary bg-primary/5" : "border-border"}`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-lg bg-muted">
                                                    {getDeviceIcon(session.deviceType)}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-foreground">
                                                            {session.deviceName || `${session.browser || "Unknown"} on ${session.os || "Unknown"}`}
                                                        </p>
                                                        {session.isCurrent && (
                                                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                                                                Current
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                        {session.ipAddress && (
                                                            <span className="flex items-center gap-1">
                                                                <Globe className="h-3 w-3" />
                                                                {session.ipAddress}
                                                            </span>
                                                        )}
                                                        {session.location && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                {session.location}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {formatDistanceToNow(new Date(session.lastActiveAt), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {!session.isCurrent && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleRevokeSession(session.id)}
                                                    disabled={revokingSession === session.id}
                                                >
                                                    {revokingSession === session.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        {sessions.filter((s) => !s.isCurrent).length > 0 && (
                            <Button
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={handleRevokeAllSessions}
                                disabled={revokingAll}
                            >
                                {revokingAll ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <LogOut className="mr-2 h-4 w-4" />
                                )}
                                Log out all other devices
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setIsSessionsDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

// ============================================================================
// Notification Channel Types & Constants
// ============================================================================

type NotifChannelType = "EMAIL" | "SMS" | "WHATSAPP";

interface NotifChannel {
    id: string;
    channel: NotifChannelType;
    provider: string;
    name: string;
    config: Record<string, unknown>;
    isActive: boolean;
    isDefault: boolean;
    tenantId: string | null;
}

const NOTIF_PROVIDERS: Record<NotifChannelType, { id: string; name: string; fields: string[] }[]> = {
    EMAIL: [
        { id: "gmail_smtp", name: "Gmail SMTP", fields: ["smtpHost", "smtpPort", "email", "password"] },
        { id: "custom_smtp", name: "Custom SMTP", fields: ["smtpHost", "smtpPort", "email", "password", "fromName"] },
        { id: "sendgrid", name: "SendGrid", fields: ["apiKey", "fromEmail", "fromName"] },
        { id: "mailgun", name: "Mailgun", fields: ["apiKey", "domain", "fromEmail", "fromName"] },
    ],
    SMS: [
        { id: "twilio", name: "Twilio", fields: ["accountSid", "authToken", "fromNumber"] },
        { id: "msg91", name: "MSG91", fields: ["authKey", "senderId", "templateId"] },
    ],
    WHATSAPP: [
        { id: "whatsapp_business", name: "WhatsApp Business API", fields: ["apiToken", "phoneNumberId", "businessAccountId"] },
        { id: "twilio_whatsapp", name: "Twilio WhatsApp", fields: ["accountSid", "authToken", "fromNumber"] },
    ],
};

const NOTIF_FIELD_META: Record<string, { label: string; type: string; placeholder: string }> = {
    smtpHost: { label: "SMTP Host", type: "text", placeholder: "smtp.gmail.com" },
    smtpPort: { label: "Port", type: "number", placeholder: "587" },
    email: { label: "Email", type: "email", placeholder: "admin@example.com" },
    password: { label: "App Password", type: "password", placeholder: "" },
    fromName: { label: "From Name", type: "text", placeholder: "ICMS Notifications" },
    apiKey: { label: "API Key", type: "password", placeholder: "" },
    fromEmail: { label: "From Email", type: "email", placeholder: "noreply@example.com" },
    domain: { label: "Domain", type: "text", placeholder: "mg.example.com" },
    accountSid: { label: "Account SID", type: "text", placeholder: "" },
    authToken: { label: "Auth Token", type: "password", placeholder: "" },
    fromNumber: { label: "From Number", type: "text", placeholder: "+1234567890" },
    authKey: { label: "Auth Key", type: "password", placeholder: "" },
    senderId: { label: "Sender ID", type: "text", placeholder: "" },
    templateId: { label: "Template ID", type: "text", placeholder: "" },
    apiToken: { label: "API Token", type: "password", placeholder: "" },
    phoneNumberId: { label: "Phone Number ID", type: "text", placeholder: "" },
    businessAccountId: { label: "Business Account ID", type: "text", placeholder: "" },
};

// ============================================================================
// Notification Channel Dialog Component
// ============================================================================

function NotifChannelDialog({
    editing,
    onClose,
    onSaved,
}: {
    editing: NotifChannel | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [channel, setChannel] = useState<NotifChannelType>(editing?.channel || "EMAIL");
    const [provider, setProvider] = useState(editing?.provider || NOTIF_PROVIDERS.EMAIL[0].id);
    const [config, setConfig] = useState<Record<string, string>>({});
    const [name, setName] = useState(editing?.name || "");
    const [isDefault, setIsDefault] = useState(editing?.isDefault || false);
    const [dlgSaving, setDlgSaving] = useState(false);
    const [dlgError, setDlgError] = useState("");
    const [showPw, setShowPw] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (editing) {
            setConfig(editing.config as Record<string, string>);
            setChannel(editing.channel);
            setProvider(editing.provider);
            setName(editing.name);
            setIsDefault(editing.isDefault);
        }
    }, [editing]);

    const handleChannelSwitch = (ch: NotifChannelType) => {
        setChannel(ch);
        setProvider(NOTIF_PROVIDERS[ch][0].id);
        setConfig({});
        setName("");
    };

    // Auto-set Gmail defaults
    useEffect(() => {
        if (!editing && provider === "gmail_smtp" && !config.smtpHost) {
            setConfig((p) => ({ ...p, smtpHost: "smtp.gmail.com", smtpPort: "587" }));
        }
    }, [provider, editing, config.smtpHost]);

    // Auto-name
    useEffect(() => {
        if (editing) return;
        const pDef = NOTIF_PROVIDERS[channel].find((p) => p.id === provider);
        const ident = config.email || config.fromEmail || config.fromNumber || config.businessAccountId || "";
        if (pDef && ident) setName(`${pDef.name} — ${ident}`);
    }, [channel, provider, config, editing]);

    const pDef = NOTIF_PROVIDERS[channel].find((p) => p.id === provider);

    const handleSave = async () => {
        setDlgError("");
        if (!pDef) return;
        for (const f of pDef.fields) {
            const v = config[f];
            if (editing && v === "••••••••") continue;
            if (!v && f !== "fromName" && f !== "templateId") {
                setDlgError(`${NOTIF_FIELD_META[f]?.label || f} is required`);
                return;
            }
        }
        setDlgSaving(true);
        try {
            const url = editing ? `/api/notification-channels/${editing.id}` : "/api/notification-channels";
            const res = await fetch(url, {
                method: editing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ channel, provider, name: name || pDef.name, config, isDefault, isActive: true }),
            });
            const d = await res.json();
            if (!d.success) { setDlgError(d.error?.message || "Failed"); setDlgSaving(false); return; }
            onSaved();
        } catch { setDlgError("Failed to save"); }
        finally { setDlgSaving(false); }
    };

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editing ? "Edit Notification Channel" : "Add Notification Channel"}</DialogTitle>
                    <DialogDescription>Choose a channel and provider, then enter the configuration details</DialogDescription>
                </DialogHeader>

                {/* Channel selector */}
                <div className="space-y-2">
                    <Label>Channel</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {(["EMAIL", "SMS", "WHATSAPP"] as NotifChannelType[]).map((ch) => (
                            <button
                                key={ch}
                                onClick={() => !editing && handleChannelSwitch(ch)}
                                disabled={!!editing}
                                className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                                    channel === ch ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400" : "border-border hover:border-muted-foreground/30"
                                } ${editing ? "opacity-70 cursor-not-allowed" : ""}`}
                            >
                                {ch === "EMAIL" ? <Mail className="w-5 h-5" /> : ch === "SMS" ? <Phone className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                                {ch === "WHATSAPP" ? "WhatsApp" : ch.charAt(0) + ch.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Provider */}
                <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select value={provider} onValueChange={(v) => { setProvider(v); if (!editing) setConfig({}); }} disabled={!!editing}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {NOTIF_PROVIDERS[channel].map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Config fields */}
                {pDef && pDef.fields.map((field) => {
                    const meta = NOTIF_FIELD_META[field];
                    const isPw = meta.type === "password";
                    return (
                        <div key={field} className="space-y-2">
                            <Label>{meta.label}</Label>
                            <div className="relative">
                                <Input
                                    type={isPw && !showPw[field] ? "password" : (meta.type === "password" ? "text" : meta.type)}
                                    value={(config[field] as string) || ""}
                                    onChange={(e) => setConfig((p) => ({ ...p, [field]: e.target.value }))}
                                    placeholder={meta.placeholder}
                                />
                                {isPw && (
                                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPw((p) => ({ ...p, [field]: !p[field] }))}>
                                        {showPw[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Name */}
                <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Auto-generated" />
                </div>

                {/* Default checkbox */}
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="rounded" />
                    Set as default for {channel === "WHATSAPP" ? "WhatsApp" : channel.charAt(0) + channel.slice(1).toLowerCase()}
                </label>

                {dlgError && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />{dlgError}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={dlgSaving} className="bg-teal-600 hover:bg-teal-700">
                        {dlgSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editing ? "Update Configuration" : "Save Configuration"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
