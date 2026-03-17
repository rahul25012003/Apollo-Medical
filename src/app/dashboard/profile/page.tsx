"use client";

import { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Camera,
    Mail,
    Phone,
    Calendar,
    Edit,
    Loader2,
    Shield,
} from "lucide-react";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { usersService, User } from "@/services/users";
import { uploadFile } from "@/services";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        phone: "",
    });

    // Fetch user profile on mount
    useEffect(() => {
        async function fetchProfile() {
            try {
                setLoading(true);
                const response = await usersService.getProfile();
                if (response.success && response.data) {
                    setUser(response.data);
                    setForm({
                        firstName: response.data.firstName || "",
                        lastName: response.data.lastName || "",
                        phone: response.data.phone || "",
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

    // Handle save
    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await usersService.updateProfile(form);
            if (response.success && response.data) {
                setUser(response.data);
                setIsEditing(false);
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

    // Handle cancel
    const handleCancel = () => {
        // Reset form to current user values
        if (user) {
            setForm({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                phone: user.phone || "",
            });
        }
        setIsEditing(false);
    };

    // Handle avatar upload
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setAvatarUploading(true);
            const uploadRes = await uploadFile(file, "avatars");
            if (uploadRes.success && uploadRes.data) {
                const url = uploadRes.data.url;
                const profileRes = await usersService.updateProfile({ avatar: url });
                if (profileRes.success && profileRes.data) {
                    setUser(profileRes.data);
                    toast.success("Profile photo updated");
                } else {
                    toast.error("Failed to save profile photo");
                }
            } else {
                toast.error(uploadRes.error?.message || "Failed to upload photo");
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setAvatarUploading(false);
            e.target.value = "";
        }
    };

    // Get initials for avatar
    const getInitials = () => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
        }
        if (user?.name) {
            const parts = user.name.split(" ");
            if (parts.length >= 2) {
                return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
            }
            return user.name.substring(0, 2).toUpperCase();
        }
        return "U";
    };

    // Get display name
    const getDisplayName = () => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        return user?.name || "User";
    };

    // Get role display
    const getRoleDisplay = (role: string) => {
        const roleMap: Record<string, string> = {
            SUPER_ADMIN: "Super Administrator",
            EVENT_MANAGER: "Event Manager",
            REGISTRATION_MANAGER: "Registration Manager",
            CERTIFICATE_MANAGER: "Certificate Manager",
            ATTENDEE: "Attendee",
        };
        return roleMap[role] || role;
    };

    if (loading) {
        return (
            <DashboardLayout title="Profile" subtitle="View and edit your profile">
                <AiimsLoader />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Profile" subtitle="View and edit your profile">
            <div className="max-w-4xl space-y-6">

                {/* ===== Profile Hero Card ===== */}
                <div className="relative rounded-2xl overflow-hidden shadow-lg">
                    {/* Gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/85 to-primary/60" />

                    {/* Decorative shapes */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/[0.07]" />
                        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/[0.05]" />
                        <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-white/[0.04]" />
                        {/* Subtle dot grid */}
                        <div
                            className="absolute inset-0 opacity-[0.06]"
                            style={{
                                backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                                backgroundSize: "24px 24px",
                            }}
                        />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 px-6 sm:px-8 pt-8 pb-6">
                        {/* Top row: avatar + info + edit */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                <div className="w-[104px] h-[104px] rounded-2xl bg-white/15 backdrop-blur-sm border-2 border-white/25 p-1 shadow-xl">
                                    <div className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center">
                                        {avatarUploading ? (
                                            <div className="w-full h-full bg-white/20 flex items-center justify-center">
                                                <Loader2 className="w-7 h-7 animate-spin text-white" />
                                            </div>
                                        ) : user?.avatar ? (
                                            <img
                                                src={user.avatar}
                                                alt={getDisplayName()}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-white/20 flex items-center justify-center">
                                                <span className="text-3xl font-bold text-white">{getInitials()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarUpload}
                                    disabled={avatarUploading}
                                />
                                <button
                                    type="button"
                                    onClick={() => avatarInputRef.current?.click()}
                                    disabled={avatarUploading}
                                    className="absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-full bg-white text-primary flex items-center justify-center shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Name + role + contact */}
                            <div className="flex-1 text-center sm:text-left min-w-0">
                                <h1 className="text-2xl font-bold text-white tracking-tight">
                                    {getDisplayName()}
                                </h1>
                                <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-white/90 text-xs font-medium backdrop-blur-sm">
                                        <Shield className="w-3 h-3" />
                                        {getRoleDisplay(user?.role || "")}
                                    </span>
                                </div>

                                {/* Contact chips */}
                                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 text-sm text-white/75 justify-center sm:justify-start">
                                    {user?.email && (
                                        <span className="flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5 text-white/50" />
                                            <span className="truncate max-w-[200px]">{user.email}</span>
                                        </span>
                                    )}
                                    {user?.phone && (
                                        <span className="flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5 text-white/50" />
                                            {user.phone}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-white/50" />
                                        Joined {user?.createdAt ? format(new Date(user.createdAt), "MMM yyyy") : "-"}
                                    </span>
                                </div>
                            </div>

                            {/* Edit button */}
                            {!isEditing && (
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditing(true)}
                                    className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm shrink-0"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Profile
                                </Button>
                            )}
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7">
                            {[
                                { label: "Registrations", value: user?._count?.registrations || 0 },
                                { label: "Events Attended", value: "-" },
                                { label: "Certificates", value: "-" },
                                { label: "CME Credits", value: "-" },
                            ].map((stat) => (
                                <div
                                    key={stat.label}
                                    className="text-center px-3 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10"
                                >
                                    <p className="text-xl font-bold text-white">{stat.value}</p>
                                    <p className="text-xs text-white/60 mt-0.5">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ===== Personal Information Form ===== */}
                <div className="bg-background rounded-xl border border-border p-6">
                    <h2 className="font-semibold text-foreground mb-4">Personal Information</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                value={form.firstName}
                                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                                disabled={!isEditing}
                                className={!isEditing ? "bg-muted" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                value={form.lastName}
                                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                                disabled={!isEditing}
                                className={!isEditing ? "bg-muted" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={user?.email || ""}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                                disabled={!isEditing}
                                className={!isEditing ? "bg-muted" : ""}
                            />
                        </div>
                    </div>
                    {isEditing && (
                        <div className="mt-6 pt-6 border-t border-border flex justify-end gap-3">
                            <Button variant="outline" onClick={handleCancel} disabled={saving}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
