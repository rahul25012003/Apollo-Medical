"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Search,
    Plus,
    Filter,
    MoreHorizontal,
    Mail,
    Shield,
    UserCheck,
    UserX,
    Edit,
    Trash2,
    Eye,
    Key,
    Settings,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Users,
    Lock,
    Unlock,
    Send,
    Copy,
    Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { usersService, User } from "@/services/users";
import { useTenantFilter } from "@/hooks/use-tenant-filter";
import { getPermissions, type UserRole, type Permission } from "@/lib/permissions";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAlertDialog } from "@/components/ui/confirm-dialog";

// System roles (fixed in Prisma schema)
const SYSTEM_ROLES: { id: UserRole; name: string; description: string; color: string }[] = [
    {
        id: "SUPER_ADMIN",
        name: "Super Admin",
        description: "Full access to all features and settings",
        color: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
        id: "ADMIN",
        name: "Administrator",
        description: "Full access to all features within the organization",
        color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    {
        id: "EVENT_MANAGER",
        name: "Event Manager",
        description: "Manage events, speakers, and sponsors",
        color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
        id: "REGISTRATION_MANAGER",
        name: "Registration Manager",
        description: "Handle registrations and attendee management",
        color: "bg-green-50 text-green-700 border-green-200",
    },
    {
        id: "CERTIFICATE_MANAGER",
        name: "Certificate Manager",
        description: "Generate and distribute certificates",
        color: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
        id: "ATTENDEE",
        name: "Attendee",
        description: "View-only access to dashboard and own data",
        color: "bg-gray-100 text-gray-700 border-gray-200",
    },
];

const permissionGroups = [
    {
        name: "Events",
        permissions: [
            { id: "events.view", label: "View Events" },
            { id: "events.create", label: "Create Events" },
            { id: "events.edit", label: "Edit Events" },
            { id: "events.delete", label: "Delete Events" },
        ],
    },
    {
        name: "Speakers",
        permissions: [
            { id: "speakers.view", label: "View Speakers" },
            { id: "speakers.create", label: "Add Speakers" },
            { id: "speakers.edit", label: "Edit Speakers" },
            { id: "speakers.delete", label: "Delete Speakers" },
        ],
    },
    {
        name: "Sponsors",
        permissions: [
            { id: "sponsors.view", label: "View Sponsors" },
            { id: "sponsors.create", label: "Add Sponsors" },
            { id: "sponsors.edit", label: "Edit Sponsors" },
            { id: "sponsors.delete", label: "Delete Sponsors" },
        ],
    },
    {
        name: "Registrations",
        permissions: [
            { id: "registrations.view", label: "View Registrations" },
            { id: "registrations.create", label: "Create Registrations" },
            { id: "registrations.edit", label: "Manage Registrations" },
            { id: "registrations.delete", label: "Delete Registrations" },
            { id: "registrations.approve", label: "Approve Registrations" },
        ],
    },
    {
        name: "Certificates",
        permissions: [
            { id: "certificates.view", label: "View Certificates" },
            { id: "certificates.create", label: "Generate Certificates" },
            { id: "certificates.edit", label: "Edit Certificates" },
            { id: "certificates.delete", label: "Delete Certificates" },
            { id: "certificates.issue", label: "Issue Certificates" },
        ],
    },
    {
        name: "Users",
        permissions: [
            { id: "users.view", label: "View Users" },
            { id: "users.create", label: "Create Users" },
            { id: "users.edit", label: "Edit Users" },
            { id: "users.delete", label: "Delete Users" },
        ],
    },
    {
        name: "Dashboard",
        permissions: [
            { id: "dashboard.view", label: "View Dashboard" },
            { id: "dashboard.analytics", label: "View Analytics" },
        ],
    },
];

const roleColorMap: Record<string, string> = {
    SUPER_ADMIN: "bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 text-purple-700 border-purple-300/50",
    ADMIN: "bg-gradient-to-r from-indigo-500/10 to-blue-500/10 text-indigo-700 border-indigo-300/50",
    EVENT_MANAGER: "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-700 border-blue-300/50",
    REGISTRATION_MANAGER: "bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 border-green-300/50",
    CERTIFICATE_MANAGER: "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 border-amber-300/50",
    ATTENDEE: "bg-gradient-to-r from-gray-500/10 to-slate-500/10 text-gray-700 border-gray-300/50",
};

interface DisplayUser {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: UserRole;
    roleDisplay: string;
    status: string;
    lastActive: string;
    createdAt: string;
    isActive: boolean;
}

function formatRole(role: string): string {
    return role
        .split("_")
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(" ");
}

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
}

export default function UsersPage() {
    const { tenantFilterParams, effectiveTenantId, sessionLoading } = useTenantFilter();
    const [users, setUsers] = useState<DisplayUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState("users");

    // Manage permissions dialog state
    const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<DisplayUser | null>(null);
    const [permRole, setPermRole] = useState<UserRole>("ATTENDEE");
    const [savingRole, setSavingRole] = useState(false);

    // Role permissions view dialog state
    const [isRoleViewOpen, setIsRoleViewOpen] = useState(false);
    const [viewingRole, setViewingRole] = useState<UserRole | null>(null);

    const { confirm, ConfirmDialog } = useConfirmDialog();
    const { alert, AlertDialog } = useAlertDialog();

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const params: { tenantId?: string } = effectiveTenantId
                ? { tenantId: effectiveTenantId }
                : {};
            const response = await usersService.getAll(params);

            if (response.success && response.data) {
                const usersList = Array.isArray(response.data) ? response.data : [];
                const mapped: DisplayUser[] = usersList.map((u: User) => ({
                    id: u.id,
                    name: u.name || u.email.split("@")[0],
                    email: u.email,
                    phone: u.phone,
                    role: u.role as UserRole,
                    roleDisplay: formatRole(u.role),
                    status: u.isActive ? "active" : "inactive",
                    lastActive: formatTimeAgo(new Date(u.updatedAt)),
                    createdAt: new Date(u.createdAt).toLocaleDateString("en-IN"),
                    isActive: u.isActive,
                }));
                setUsers(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    }, [effectiveTenantId]);

    useEffect(() => {
        if (sessionLoading) return;
        fetchUsers();
    }, [sessionLoading, effectiveTenantId, fetchUsers]);

    const getInitials = (name: string) => {
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const activeUsers = users.filter((u) => u.status === "active").length;
    const inactiveUsers = users.filter((u) => u.status === "inactive").length;

    // --- Action handlers ---
    const openManagePermissions = (user: DisplayUser) => {
        setSelectedUser(user);
        setPermRole(user.role);
        setIsPermissionsOpen(true);
    };

    const handleSaveRole = async () => {
        if (!selectedUser) return;
        try {
            setSavingRole(true);
            const res = await usersService.updateRole(selectedUser.id, permRole);
            if (res.success) {
                setIsPermissionsOpen(false);
                await fetchUsers();
                alert({ title: "Role updated", description: `${selectedUser.name} is now ${formatRole(permRole)}`, variant: "success" });
            } else {
                alert({ title: "Error", description: res.error?.message || "Failed to update role", variant: "error" });
            }
        } catch {
            alert({ title: "Error", description: "An unexpected error occurred", variant: "error" });
        } finally {
            setSavingRole(false);
        }
    };

    const handleToggleActive = async (user: DisplayUser) => {
        const action = user.isActive ? "deactivate" : "activate";
        const confirmed = await confirm({
            title: `${user.isActive ? "Deactivate" : "Activate"} User`,
            description: `Are you sure you want to ${action} ${user.name}? ${user.isActive ? "They will no longer be able to log in." : "They will be able to log in again."}`,
            confirmText: user.isActive ? "Deactivate" : "Activate",
            variant: user.isActive ? "danger" : "success",
        });
        if (!confirmed) return;
        try {
            const res = user.isActive
                ? await usersService.update(user.id, { isActive: false })
                : await usersService.activate(user.id);
            if (res.success) {
                await fetchUsers();
                alert({ title: "Success", description: `${user.name} has been ${action}d`, variant: "success" });
            } else {
                alert({ title: "Error", description: res.error?.message || `Failed to ${action} user`, variant: "error" });
            }
        } catch {
            alert({ title: "Error", description: "An unexpected error occurred", variant: "error" });
        }
    };

    const handleDeleteUser = async (user: DisplayUser) => {
        const confirmed = await confirm({
            title: "Delete User",
            description: `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
            confirmText: "Delete",
            variant: "danger",
        });
        if (!confirmed) return;
        try {
            const res = await usersService.deactivate(user.id);
            if (res.success) {
                await fetchUsers();
                alert({ title: "User deleted", description: `${user.name} has been deleted`, variant: "success" });
            } else {
                alert({ title: "Error", description: res.error?.message || "Failed to delete user", variant: "error" });
            }
        } catch {
            alert({ title: "Error", description: "An unexpected error occurred", variant: "error" });
        }
    };

    const openRoleView = (roleId: UserRole) => {
        setViewingRole(roleId);
        setIsRoleViewOpen(true);
    };

    // Compute role user counts from actual data
    const roleCounts: Record<string, number> = {};
    users.forEach((u) => {
        roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
    });

    // Current permissions for the selected role in dialog
    const currentPermissions = getPermissions(permRole);

    if (loading) {
        return (
            <DashboardLayout title="User Management" subtitle="Manage system users, roles, and permissions">
                <AiimsLoader />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="User Management" subtitle="Manage system users, roles, and permissions">
            <ConfirmDialog />
            <AlertDialog />

            <div className="space-y-6 animate-fadeIn">
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="card-premium overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-teal-500 to-cyan-500" />
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/10">
                                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold animate-count">{users.length}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-premium overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
                                    <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold animate-count">{activeUsers}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Active</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-premium overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10">
                                    <UserX className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold animate-count">{inactiveUsers}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Inactive</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-premium overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10">
                                    <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold animate-count">{SYSTEM_ROLES.length}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Roles</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="flex flex-1 gap-3">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search users..." className="pl-10 search-premium rounded-xl" />
                        </div>
                        <Button variant="outline" size="icon" className="rounded-xl border-dashed">
                            <Filter className="w-4 h-4" />
                        </Button>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/25">
                                <Plus className="w-4 h-4" />
                                Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Create New User</DialogTitle>
                                <DialogDescription>
                                    Add a new user and assign their role and permissions
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Full Name *</Label>
                                        <Input placeholder="Dr. John Smith" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email Address *</Label>
                                        <Input type="email" placeholder="john.smith@icms.com" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Phone Number</Label>
                                        <Input type="tel" placeholder="+91 98765 43210" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Department</Label>
                                        <Input placeholder="Events" />
                                    </div>
                                </div>

                                <div className="section-divider-gradient my-2" />

                                <div className="space-y-2">
                                    <Label>Role *</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SYSTEM_ROLES.map((role) => (
                                                <SelectItem key={role.id} value={role.id}>
                                                    <div className="flex items-center gap-2">
                                                        <Shield className="h-4 w-4" />
                                                        {role.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Role determines the default permissions for this user
                                    </p>
                                </div>

                                <div className="section-divider-gradient my-2" />

                                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                    <div className="space-y-0.5">
                                        <Label>Send Welcome Email</Label>
                                        <p className="text-xs text-muted-foreground">
                                            User will receive login credentials via email
                                        </p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                    <div className="space-y-0.5">
                                        <Label>Activate Account</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Allow user to login immediately
                                        </p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    Cancel
                                </Button>
                                <Button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/25" onClick={() => setIsCreateOpen(false)}>Create User</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Manage Permissions Dialog */}
                <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
                    <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedUser ? `Manage Role & Permissions — ${selectedUser.name}` : "Manage Permissions"}
                            </DialogTitle>
                            <DialogDescription>
                                Change the user&apos;s role to update their permissions. Permissions are determined by the assigned role.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-6">
                            {selectedUser && (
                                <div className="p-4 rounded-xl bg-gradient-to-r from-muted/60 to-muted/30 border border-border/50">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {getInitials(selectedUser.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="font-medium">{selectedUser.name}</p>
                                            <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                        </div>
                                        <Badge variant="outline" className={cn("font-medium", roleColorMap[selectedUser.role])}>
                                            {selectedUser.roleDisplay}
                                        </Badge>
                                    </div>
                                </div>
                            )}

                            {/* Role selector */}
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Assign Role</Label>
                                <Select value={permRole} onValueChange={(v) => setPermRole(v as UserRole)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SYSTEM_ROLES.map((r) => (
                                            <SelectItem key={r.id} value={r.id}>
                                                <div className="flex items-center gap-2">
                                                    <Shield className="h-4 w-4" />
                                                    {r.name}
                                                    <span className="text-xs text-muted-foreground ml-1">— {r.description}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Permissions grid (read-only, driven by role) */}
                            <div>
                                <Label className="text-base font-semibold mb-3 block">
                                    Permissions for {formatRole(permRole)}
                                </Label>
                                <div className="space-y-5">
                                    {permissionGroups.map((group) => (
                                        <div key={group.name} className="space-y-2">
                                            <h4 className="font-medium text-sm flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
                                                <Key className="h-3.5 w-3.5" />
                                                {group.name}
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2 ml-5">
                                                {group.permissions.map((permission) => {
                                                    const hasIt = currentPermissions.includes(permission.id as Permission);
                                                    return (
                                                        <div
                                                            key={permission.id}
                                                            className={cn(
                                                                "flex items-center gap-3 p-2.5 rounded-lg border transition-colors",
                                                                hasIt ? "bg-green-50/50 border-green-200/60" : "bg-muted/30 border-transparent"
                                                            )}
                                                        >
                                                            <Checkbox
                                                                id={permission.id}
                                                                checked={hasIt}
                                                                disabled
                                                            />
                                                            <Label htmlFor={permission.id} className={cn("cursor-default text-sm", !hasIt && "text-muted-foreground")}>
                                                                {permission.label}
                                                            </Label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPermissionsOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/25"
                                onClick={handleSaveRole}
                                disabled={savingRole || (selectedUser?.role === permRole)}
                            >
                                {savingRole ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {savingRole ? "Saving..." : "Save Role"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Role Permissions View Dialog */}
                <Dialog open={isRoleViewOpen} onOpenChange={setIsRoleViewOpen}>
                    <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {viewingRole ? `${formatRole(viewingRole)} — Permissions` : "Role Permissions"}
                            </DialogTitle>
                            <DialogDescription>
                                {SYSTEM_ROLES.find((r) => r.id === viewingRole)?.description}
                            </DialogDescription>
                        </DialogHeader>
                        {viewingRole && (
                            <div className="py-4 space-y-5">
                                {permissionGroups.map((group) => {
                                    const rolePerms = getPermissions(viewingRole);
                                    return (
                                        <div key={group.name} className="space-y-2">
                                            <h4 className="font-medium text-sm flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
                                                <Key className="h-3.5 w-3.5" />
                                                {group.name}
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2 ml-5">
                                                {group.permissions.map((permission) => {
                                                    const hasIt = rolePerms.includes(permission.id as Permission);
                                                    return (
                                                        <div
                                                            key={permission.id}
                                                            className={cn(
                                                                "flex items-center gap-3 p-2.5 rounded-lg border",
                                                                hasIt ? "bg-green-50/50 border-green-200/60" : "bg-muted/30 border-transparent"
                                                            )}
                                                        >
                                                            {hasIt ? (
                                                                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                            ) : (
                                                                <XCircle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                                                            )}
                                                            <span className={cn("text-sm", !hasIt && "text-muted-foreground")}>
                                                                {permission.label}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsRoleViewOpen(false)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Main Content */}
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                    <TabsList className="w-full sm:w-auto h-auto flex-wrap sm:flex-nowrap gap-1 p-1 bg-muted/50 rounded-xl">
                        <TabsTrigger value="users" className="flex-1 sm:flex-none gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-lg">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                            Users
                        </TabsTrigger>
                        <TabsTrigger value="roles" className="flex-1 sm:flex-none gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-lg">
                            <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                            Roles
                        </TabsTrigger>
                    </TabsList>

                    {/* Users Tab */}
                    <TabsContent value="users" className="mt-6">
                        <Card className="card-premium overflow-hidden">
                            <CardContent className="p-0">
                                <div className="rounded-lg border-0">
                                    <Table className="table-premium">
                                        <TableHeader>
                                            <TableRow className="bg-gradient-to-r from-muted/80 via-muted/50 to-muted/80 border-b">
                                                <TableHead className="font-semibold">User</TableHead>
                                                <TableHead className="hidden md:table-cell font-semibold">Role</TableHead>
                                                <TableHead className="font-semibold">Status</TableHead>
                                                <TableHead className="hidden sm:table-cell font-semibold">Last Active</TableHead>
                                                <TableHead className="text-right font-semibold">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-40 text-center">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 mb-5">
                                                                <Users className="h-10 w-10 text-teal-500/60" />
                                                            </div>
                                                            <p className="text-muted-foreground font-medium">No users found</p>
                                                            <p className="text-sm text-muted-foreground/70 mt-1">Get started by adding your first user</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                users.map((user, index) => (
                                                <TableRow
                                                    key={user.id}
                                                    className="animate-fadeIn hover:bg-muted/30 transition-colors"
                                                    style={{ animationDelay: `${index * 0.05}s` }}
                                                >
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                                                                <AvatarFallback className="bg-gradient-to-br from-primary/15 to-primary/5 text-primary font-semibold">
                                                                    {getInitials(user.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="min-w-0">
                                                                <p className="font-medium truncate">{user.name}</p>
                                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    <Mail className="w-3 h-3" />
                                                                    {user.email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn("font-medium", roleColorMap[user.role])}
                                                        >
                                                            {user.roleDisplay}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "border-0",
                                                                user.status === "active"
                                                                    ? "status-active"
                                                                    : "bg-red-50 text-red-700"
                                                            )}
                                                        >
                                                            {user.status === "active" ? (
                                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            ) : (
                                                                <XCircle className="h-3 w-3 mr-1" />
                                                            )}
                                                            {user.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="hidden sm:table-cell">
                                                        <p className="text-sm text-muted-foreground">{user.lastActive}</p>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted/80">
                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => openManagePermissions(user)}>
                                                                    <Key className="mr-2 h-4 w-4" />
                                                                    Manage Role & Permissions
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                                                                    {user.status === "active" ? (
                                                                        <>
                                                                            <Lock className="mr-2 h-4 w-4" />
                                                                            Deactivate
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Unlock className="mr-2 h-4 w-4" />
                                                                            Activate
                                                                        </>
                                                                    )}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user)}>
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete User
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Roles Tab */}
                    <TabsContent value="roles" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {SYSTEM_ROLES.map((role, index) => (
                                <Card
                                    key={role.id}
                                    className="card-premium overflow-hidden animate-fadeIn"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <div className={cn(
                                        "h-1 bg-gradient-to-r",
                                        role.id === "SUPER_ADMIN" && "from-purple-500 to-fuchsia-500",
                                        role.id === "ADMIN" && "from-indigo-500 to-blue-500",
                                        role.id === "EVENT_MANAGER" && "from-blue-500 to-cyan-500",
                                        role.id === "REGISTRATION_MANAGER" && "from-green-500 to-emerald-500",
                                        role.id === "CERTIFICATE_MANAGER" && "from-amber-500 to-orange-500",
                                        role.id === "ATTENDEE" && "from-gray-400 to-slate-400",
                                    )} />
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2.5 rounded-xl",
                                                    role.id === "SUPER_ADMIN" && "bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10",
                                                    role.id === "ADMIN" && "bg-gradient-to-br from-indigo-500/20 to-blue-500/10",
                                                    role.id === "EVENT_MANAGER" && "bg-gradient-to-br from-blue-500/20 to-cyan-500/10",
                                                    role.id === "REGISTRATION_MANAGER" && "bg-gradient-to-br from-green-500/20 to-emerald-500/10",
                                                    role.id === "CERTIFICATE_MANAGER" && "bg-gradient-to-br from-amber-500/20 to-orange-500/10",
                                                    role.id === "ATTENDEE" && "bg-gradient-to-br from-gray-500/20 to-slate-500/10",
                                                )}>
                                                    <Shield className={cn("h-5 w-5", role.color.split(" ")[1])} />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base">{role.name}</CardTitle>
                                                    <CardDescription className="text-xs">
                                                        {roleCounts[role.id] || 0} users
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {role.description}
                                        </p>
                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {getPermissions(role.id).slice(0, 5).map((p) => (
                                                <Badge key={p} variant="secondary" className="text-[10px] px-1.5 py-0">
                                                    {p}
                                                </Badge>
                                            ))}
                                            {getPermissions(role.id).length > 5 && (
                                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-muted to-muted/80">
                                                    +{getPermissions(role.id).length - 5} more
                                                </Badge>
                                            )}
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2 rounded-xl hover:bg-muted/50"
                                            size="sm"
                                            onClick={() => openRoleView(role.id)}
                                        >
                                            <Eye className="h-4 w-4" />
                                            View Permissions
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
