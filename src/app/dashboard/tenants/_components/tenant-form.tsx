"use client";

import React, { useState, useEffect } from "react";
import {
    Palette,
    Info,
    LayoutGrid,
    FileText,
    Phone,
    Settings2,
    Check,
    Loader2,
    ArrowLeft,
    ExternalLink,
    Plus,
    Pencil,
    Trash2,
    Star,
    Image as ImageIcon,
    Video,
    Upload,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { COLOR_PRESETS, findPresetByColors } from "@/lib/tenant/color-presets";
import { generateSlug, TenantFormData } from "@/lib/tenant/validation";
import type { Testimonial, GalleryImage, GalleryVideo } from "@/lib/tenant/types";
import { useAlertDialog } from "@/components/ui/confirm-dialog";
import { uploadFile } from "@/services";

interface TenantFormProps {
    initialData?: Partial<TenantFormData> | null;
    onSubmit: (data: TenantFormData) => Promise<void>;
    isEditing?: boolean;
    slug?: string;
    restrictedMode?: boolean;
}

const CURRENCIES = [
    { value: "INR", label: "INR - Indian Rupee" },
    { value: "USD", label: "USD - US Dollar" },
    { value: "EUR", label: "EUR - Euro" },
    { value: "GBP", label: "GBP - British Pound" },
    { value: "AUD", label: "AUD - Australian Dollar" },
    { value: "CAD", label: "CAD - Canadian Dollar" },
    { value: "SGD", label: "SGD - Singapore Dollar" },
    { value: "AED", label: "AED - UAE Dirham" },
];

const TIMEZONES = [
    { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
    { value: "America/New_York", label: "America/New_York (EST)" },
    { value: "America/Chicago", label: "America/Chicago (CST)" },
    { value: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
    { value: "Europe/London", label: "Europe/London (GMT)" },
    { value: "Europe/Berlin", label: "Europe/Berlin (CET)" },
    { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
    { value: "Asia/Singapore", label: "Asia/Singapore (SGT)" },
    { value: "Australia/Sydney", label: "Australia/Sydney (AEST)" },
    { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
];

const defaultFormData: TenantFormData = {
    slug: "",
    name: "",
    tagline: "",
    logo: "",
    favicon: "",
    isActive: true,
    primaryColor: "#0d9488",
    secondaryColor: "#0891b2",
    accentColor: "#10b981",
    sections: {
        hero: true,
        events: true,
        gallery: true,
        sponsors: true,
        testimonials: true,
        about: true,
        contact: true,
        moduleSpeakers: true,
        moduleSponsors: true,
        moduleCertificates: true,
        moduleRegistrations: true,
        notifyRegistrations: true,
        notifyPayments: true,
    },
    heroTitle: "",
    heroSubtitle: "",
    heroBgImage: "",
    aboutTitle: "",
    aboutDescription: "",
    aboutFeatures: null,
    galleryImages: null,
    galleryVideos: null,
    testimonials: null,
    footerText: "",
    copyrightText: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    website: "",
    facebook: "",
    twitter: "",
    linkedin: "",
    instagram: "",
    youtube: "",
    domain: "",
    defaultCurrency: "INR",
    defaultTimezone: "Asia/Kolkata",
};

function extractYoutubeId(input: string): string {
    if (!input) return "";
    // Match youtube.com/watch?v=ID
    const watchMatch = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];
    // Match youtu.be/ID
    const shortMatch = input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];
    // Match youtube.com/embed/ID
    const embedMatch = input.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];
    // If it looks like a raw ID (11 chars, alphanumeric + _ -)
    if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();
    return input;
}

export function TenantForm({ initialData, onSubmit, isEditing, slug, restrictedMode }: TenantFormProps) {
    const [formData, setFormData] = useState<TenantFormData>({
        ...defaultFormData,
        ...initialData,
    });
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    // Testimonial dialog state
    const [testimonialDialogOpen, setTestimonialDialogOpen] = useState(false);
    const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
    const [testimonialForm, setTestimonialForm] = useState({ name: "", role: "", avatar: "", content: "", rating: 5 });
    const [avatarUploading, setAvatarUploading] = useState(false);

    // Gallery image dialog state
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
    const [imageForm, setImageForm] = useState({ src: "", alt: "", category: "", event: "" });
    const [imageUploading, setImageUploading] = useState(false);

    // Gallery video dialog state
    const [videoDialogOpen, setVideoDialogOpen] = useState(false);
    const [editingVideo, setEditingVideo] = useState<GalleryVideo | null>(null);
    const [videoForm, setVideoForm] = useState({ youtubeUrl: "", title: "", category: "", duration: "", thumbnail: "", event: "" });

    const { alert, AlertDialog } = useAlertDialog();

    const updateField = <K extends keyof TenantFormData>(key: K, value: TenantFormData[K]) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const updateSection = (section: string, value: boolean) => {
        setFormData((prev) => ({
            ...prev,
            sections: { ...prev.sections, [section]: value },
        }));
    };

    // --- Testimonial handlers ---
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setAvatarUploading(true);
            const res = await uploadFile(file, "avatars");
            if (res.success && res.data) {
                setTestimonialForm((p) => ({ ...p, avatar: res.data!.url }));
            } else {
                alert({ title: "Upload failed", description: res.error?.message || "Could not upload avatar", variant: "error" });
            }
        } catch {
            alert({ title: "Upload failed", description: "An unexpected error occurred", variant: "error" });
        } finally {
            setAvatarUploading(false);
            e.target.value = "";
        }
    };
    const openAddTestimonial = () => {
        setEditingTestimonial(null);
        setTestimonialForm({ name: "", role: "", avatar: "", content: "", rating: 5 });
        setTestimonialDialogOpen(true);
    };
    const openEditTestimonial = (t: Testimonial) => {
        setEditingTestimonial(t);
        setTestimonialForm({ name: t.name, role: t.role, avatar: t.avatar, content: t.content, rating: t.rating });
        setTestimonialDialogOpen(true);
    };
    const saveTestimonial = () => {
        const list = (formData.testimonials as Testimonial[] | null) || [];
        if (editingTestimonial) {
            updateField("testimonials", list.map((t) => t.id === editingTestimonial.id ? { ...t, ...testimonialForm } : t));
        } else {
            const newId = list.length > 0 ? Math.max(...list.map((t) => t.id)) + 1 : 1;
            updateField("testimonials", [...list, { id: newId, ...testimonialForm }]);
        }
        setTestimonialDialogOpen(false);
    };
    const deleteTestimonial = (id: number) => {
        const list = (formData.testimonials as Testimonial[] | null) || [];
        updateField("testimonials", list.filter((t) => t.id !== id));
    };

    // --- Gallery Image handlers ---
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setImageUploading(true);
            const res = await uploadFile(file, "gallery");
            if (res.success && res.data) {
                setImageForm((p) => ({ ...p, src: res.data!.url }));
            } else {
                alert({ title: "Upload failed", description: res.error?.message || "Could not upload image", variant: "error" });
            }
        } catch {
            alert({ title: "Upload failed", description: "An unexpected error occurred", variant: "error" });
        } finally {
            setImageUploading(false);
            // Reset the input so the same file can be re-selected
            e.target.value = "";
        }
    };
    const openAddImage = () => {
        setEditingImage(null);
        setImageForm({ src: "", alt: "", category: "", event: "" });
        setImageDialogOpen(true);
    };
    const openEditImage = (img: GalleryImage) => {
        setEditingImage(img);
        setImageForm({ src: img.src, alt: img.alt, category: img.category, event: img.event || "" });
        setImageDialogOpen(true);
    };
    const saveImage = () => {
        const list = (formData.galleryImages as GalleryImage[] | null) || [];
        if (editingImage) {
            updateField("galleryImages", list.map((i) => i.id === editingImage.id ? { ...i, src: imageForm.src, alt: imageForm.alt, category: imageForm.category, event: imageForm.event || undefined } : i));
        } else {
            const newId = list.length > 0 ? Math.max(...list.map((i) => i.id)) + 1 : 1;
            updateField("galleryImages", [...list, { id: newId, src: imageForm.src, alt: imageForm.alt, category: imageForm.category, event: imageForm.event || undefined }]);
        }
        setImageDialogOpen(false);
    };
    const deleteImage = (id: number) => {
        const list = (formData.galleryImages as GalleryImage[] | null) || [];
        updateField("galleryImages", list.filter((i) => i.id !== id));
    };

    // --- Gallery Video handlers ---
    const openAddVideo = () => {
        setEditingVideo(null);
        setVideoForm({ youtubeUrl: "", title: "", category: "", duration: "", thumbnail: "", event: "" });
        setVideoDialogOpen(true);
    };
    const openEditVideo = (v: GalleryVideo) => {
        setEditingVideo(v);
        setVideoForm({
            youtubeUrl: v.youtubeId,
            title: v.title,
            category: v.category,
            duration: v.duration,
            thumbnail: v.thumbnail,
            event: v.event || "",
        });
        setVideoDialogOpen(true);
    };
    const saveVideo = () => {
        const list = (formData.galleryVideos as GalleryVideo[] | null) || [];
        const youtubeId = extractYoutubeId(videoForm.youtubeUrl);
        const thumbnail = videoForm.thumbnail || `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
        if (editingVideo) {
            updateField("galleryVideos", list.map((v) => v.id === editingVideo.id ? { ...v, youtubeId, title: videoForm.title, category: videoForm.category, duration: videoForm.duration, thumbnail, event: videoForm.event || undefined } : v));
        } else {
            const newId = list.length > 0 ? Math.max(...list.map((v) => v.id)) + 1 : 1;
            updateField("galleryVideos", [...list, { id: newId, youtubeId, title: videoForm.title, category: videoForm.category, duration: videoForm.duration, thumbnail, event: videoForm.event || undefined }]);
        }
        setVideoDialogOpen(false);
    };
    const deleteVideo = (id: number) => {
        const list = (formData.galleryVideos as GalleryVideo[] | null) || [];
        updateField("galleryVideos", list.filter((v) => v.id !== id));
    };

    // Auto-generate slug from name
    useEffect(() => {
        if (!isEditing && !slugManuallyEdited && formData.name) {
            updateField("slug", generateSlug(formData.name));
        }
    }, [formData.name, isEditing, slugManuallyEdited]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);

            // Clean empty strings to null for optional URL fields
            const cleanedData = { ...formData };
            const urlFields = ["website", "facebook", "twitter", "linkedin", "instagram", "youtube", "logo", "favicon", "heroBgImage"] as const;
            for (const field of urlFields) {
                if (cleanedData[field] === "") {
                    (cleanedData as any)[field] = null;
                }
            }
            const optionalStringFields = ["email", "tagline", "phone", "address", "city", "state", "country", "domain", "heroTitle", "heroSubtitle", "aboutTitle", "aboutDescription", "footerText", "copyrightText"] as const;
            for (const field of optionalStringFields) {
                if (cleanedData[field] === "") {
                    (cleanedData as any)[field] = null;
                }
            }

            await onSubmit(cleanedData);
        } catch (error: any) {
            alert({
                title: "Error",
                description: error.message || "An unexpected error occurred",
                variant: "error",
            });
        } finally {
            setSaving(false);
        }
    };

    const activePreset = findPresetByColors(
        formData.primaryColor || "#0d9488",
        formData.secondaryColor || "#0891b2",
        formData.accentColor || "#10b981"
    );

    const tabItems = [
        { id: "basic", label: "Basic Info", icon: Info },
        { id: "theme", label: "Theme & Colors", icon: Palette },
        { id: "sections", label: "Sections", icon: LayoutGrid },
        { id: "content", label: "Content", icon: FileText },
        { id: "contact", label: "Contact & Social", icon: Phone },
        ...(!restrictedMode ? [{ id: "settings", label: "Settings", icon: Settings2 }] : []),
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <AlertDialog />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href={restrictedMode ? "/dashboard" : "/dashboard/tenants"}>
                        <Button variant="ghost" size="icon" type="button">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">
                            {restrictedMode
                                ? "Organization Settings"
                                : isEditing
                                    ? `Edit: ${formData.name || "Tenant"}`
                                    : "Create Tenant"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {restrictedMode
                                ? "Customize your organization's branding and content"
                                : isEditing
                                    ? "Update tenant configuration and branding"
                                    : "Set up a new client organization"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing && slug && (
                        <a href={`/t/${slug}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" type="button" className="gap-2">
                                <ExternalLink className="w-4 h-4" />
                                Preview
                            </Button>
                        </a>
                    )}
                    <Button type="submit" disabled={saving} className="gap-2 gradient-medical text-white hover:opacity-90">
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Check className="w-4 h-4" />
                        )}
                        {saving ? "Saving..." : restrictedMode ? "Save Changes" : isEditing ? "Update Tenant" : "Create Tenant"}
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full justify-start h-auto flex-wrap gap-1 p-1">
                    {tabItems.map((tab) => (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className="gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5"
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Organization Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="Apollo Medical Center"
                                        value={formData.name}
                                        onChange={(e) => updateField("name", e.target.value)}
                                        required
                                    />
                                </div>
                                {!restrictedMode && (
                                <div className="space-y-2">
                                    <Label htmlFor="slug">URL Slug *</Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground whitespace-nowrap">/t/</span>
                                        <Input
                                            id="slug"
                                            placeholder="apollo-medical"
                                            value={formData.slug}
                                            onChange={(e) => {
                                                setSlugManuallyEdited(true);
                                                updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                                            }}
                                            required
                                            disabled={isEditing}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Accessible at /t/{formData.slug || "slug"}
                                    </p>
                                </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tagline">Tagline</Label>
                                <Input
                                    id="tagline"
                                    placeholder="Leading medical education provider"
                                    value={formData.tagline || ""}
                                    onChange={(e) => updateField("tagline", e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="logo">Logo URL</Label>
                                    <Input
                                        id="logo"
                                        placeholder="https://example.com/logo.png"
                                        value={formData.logo || ""}
                                        onChange={(e) => updateField("logo", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="favicon">Favicon URL</Label>
                                    <Input
                                        id="favicon"
                                        placeholder="https://example.com/favicon.ico"
                                        value={formData.favicon || ""}
                                        onChange={(e) => updateField("favicon", e.target.value)}
                                    />
                                </div>
                            </div>
                            {!restrictedMode && (
                            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                <div className="space-y-0.5">
                                    <Label>Active</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Active tenants are visible to the public
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.isActive ?? true}
                                    onCheckedChange={(checked) => updateField("isActive", checked)}
                                />
                            </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Theme & Colors Tab */}
                <TabsContent value="theme" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Color Palette Presets</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {COLOR_PRESETS.map((preset) => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => {
                                            updateField("primaryColor", preset.primaryColor);
                                            updateField("secondaryColor", preset.secondaryColor);
                                            updateField("accentColor", preset.accentColor);
                                        }}
                                        className={cn(
                                            "p-3 rounded-xl border-2 text-left transition-all hover:scale-105",
                                            activePreset?.id === preset.id
                                                ? "border-foreground ring-2 ring-foreground/20"
                                                : "border-border hover:border-foreground/30"
                                        )}
                                    >
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <div
                                                className="w-5 h-5 rounded-full"
                                                style={{ backgroundColor: preset.primaryColor }}
                                            />
                                            <div
                                                className="w-5 h-5 rounded-full"
                                                style={{ backgroundColor: preset.secondaryColor }}
                                            />
                                            <div
                                                className="w-5 h-5 rounded-full"
                                                style={{ backgroundColor: preset.accentColor }}
                                            />
                                        </div>
                                        <p className="text-sm font-medium">{preset.name}</p>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Custom Colors</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Primary Color</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={formData.primaryColor || "#0d9488"}
                                            onChange={(e) => updateField("primaryColor", e.target.value)}
                                            className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                                        />
                                        <Input
                                            value={formData.primaryColor || "#0d9488"}
                                            onChange={(e) => updateField("primaryColor", e.target.value)}
                                            placeholder="#0d9488"
                                            className="font-mono"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Secondary Color</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={formData.secondaryColor || "#0891b2"}
                                            onChange={(e) => updateField("secondaryColor", e.target.value)}
                                            className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                                        />
                                        <Input
                                            value={formData.secondaryColor || "#0891b2"}
                                            onChange={(e) => updateField("secondaryColor", e.target.value)}
                                            placeholder="#0891b2"
                                            className="font-mono"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Accent Color</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={formData.accentColor || "#10b981"}
                                            onChange={(e) => updateField("accentColor", e.target.value)}
                                            className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                                        />
                                        <Input
                                            value={formData.accentColor || "#10b981"}
                                            onChange={(e) => updateField("accentColor", e.target.value)}
                                            placeholder="#10b981"
                                            className="font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview */}
                            <div className="section-divider-gradient my-4" />
                            <div>
                                <Label className="mb-3 block">Live Preview</Label>
                                <div className="p-6 rounded-xl border border-border bg-muted/30 space-y-4">
                                    {/* Gradient banner */}
                                    <div
                                        className="h-16 rounded-lg"
                                        style={{
                                            background: `linear-gradient(135deg, ${formData.primaryColor || "#0d9488"}, ${formData.secondaryColor || "#0891b2"})`,
                                        }}
                                    />
                                    {/* Sample buttons */}
                                    <div className="flex gap-2 flex-wrap">
                                        <button
                                            type="button"
                                            className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                                            style={{ backgroundColor: formData.primaryColor || "#0d9488" }}
                                        >
                                            Primary Button
                                        </button>
                                        <button
                                            type="button"
                                            className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                                            style={{ backgroundColor: formData.secondaryColor || "#0891b2" }}
                                        >
                                            Secondary Button
                                        </button>
                                        <button
                                            type="button"
                                            className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                                            style={{ backgroundColor: formData.accentColor || "#10b981" }}
                                        >
                                            Accent Button
                                        </button>
                                    </div>
                                    {/* Sample card */}
                                    <div className="p-4 rounded-lg bg-card border-2" style={{ borderColor: formData.primaryColor || "#0d9488" }}>
                                        <h4 className="font-semibold" style={{ color: formData.primaryColor || "#0d9488" }}>
                                            Sample Card Title
                                        </h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            This is how content will look with your color palette.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Sections Tab */}
                <TabsContent value="sections" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Frontpage Sections</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { key: "hero", label: "Hero Banner", desc: "Main hero section with title and subtitle" },
                                { key: "events", label: "Events", desc: "Upcoming events carousel" },
                                { key: "gallery", label: "Gallery", desc: "Photo and video gallery" },
                                { key: "sponsors", label: "Sponsors", desc: "Sponsor logos and partnerships" },
                                { key: "testimonials", label: "Testimonials", desc: "Client testimonials and reviews" },
                                { key: "about", label: "About", desc: "About the organization" },
                                { key: "contact", label: "Contact", desc: "Contact information and form" },
                            ].map((section) => (
                                <div
                                    key={section.key}
                                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                                >
                                    <div className="space-y-0.5">
                                        <Label>{section.label}</Label>
                                        <p className="text-xs text-muted-foreground">{section.desc}</p>
                                    </div>
                                    <Switch
                                        checked={formData.sections?.[section.key as keyof typeof formData.sections] ?? true}
                                        onCheckedChange={(checked) => updateSection(section.key, checked)}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {!restrictedMode && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Dashboard Modules</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Control which modules are visible in the sidebar for this tenant&apos;s users.
                                Disabling a module hides it from the menu but does not delete existing data.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { key: "moduleSpeakers", label: "Speakers", desc: "Manage speakers for events. Disable if speakers are fixed." },
                                { key: "moduleSponsors", label: "Sponsors", desc: "Manage sponsors and partnerships. Disable if sponsors are fixed." },
                                { key: "moduleCertificates", label: "Certificates", desc: "Issue and manage certificates for attendees." },
                                { key: "moduleRegistrations", label: "Registrations", desc: "Manage event registrations and attendees." },
                            ].map((mod) => (
                                <div
                                    key={mod.key}
                                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                                >
                                    <div className="space-y-0.5">
                                        <Label>{mod.label}</Label>
                                        <p className="text-xs text-muted-foreground">{mod.desc}</p>
                                    </div>
                                    <Switch
                                        checked={formData.sections?.[mod.key as keyof typeof formData.sections] ?? true}
                                        onCheckedChange={(checked) => updateSection(mod.key, checked)}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    )}

                    {!restrictedMode && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Settings</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Control which notification types are available for this tenant&apos;s users.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { key: "notifyRegistrations", label: "Registration Alerts", desc: "Allow users to receive new registration notifications." },
                                { key: "notifyPayments", label: "Payment Notifications", desc: "Allow users to receive payment confirmation notifications." },
                            ].map((notify) => (
                                <div
                                    key={notify.key}
                                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                                >
                                    <div className="space-y-0.5">
                                        <Label>{notify.label}</Label>
                                        <p className="text-xs text-muted-foreground">{notify.desc}</p>
                                    </div>
                                    <Switch
                                        checked={formData.sections?.[notify.key as keyof typeof formData.sections] ?? true}
                                        onCheckedChange={(checked) => updateSection(notify.key, checked)}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    )}
                </TabsContent>

                {/* Content Tab */}
                <TabsContent value="content" className="space-y-4 mt-4">
                    {/* Hero Content */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Hero Section</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="heroTitle">Hero Title</Label>
                                <Input
                                    id="heroTitle"
                                    placeholder="Advance Your Medical Career"
                                    value={formData.heroTitle || ""}
                                    onChange={(e) => updateField("heroTitle", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                                <Textarea
                                    id="heroSubtitle"
                                    placeholder="Register for upcoming conferences..."
                                    value={formData.heroSubtitle || ""}
                                    onChange={(e) => updateField("heroSubtitle", e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="heroBgImage">Background Image URL</Label>
                                <Input
                                    id="heroBgImage"
                                    placeholder="https://example.com/hero-bg.jpg"
                                    value={formData.heroBgImage || ""}
                                    onChange={(e) => updateField("heroBgImage", e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* About Content */}
                    <Card>
                        <CardHeader>
                            <CardTitle>About Section</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="aboutTitle">About Title</Label>
                                <Input
                                    id="aboutTitle"
                                    placeholder="Why Choose Us?"
                                    value={formData.aboutTitle || ""}
                                    onChange={(e) => updateField("aboutTitle", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="aboutDescription">About Description</Label>
                                <Textarea
                                    id="aboutDescription"
                                    placeholder="We are dedicated to advancing medical education..."
                                    value={formData.aboutDescription || ""}
                                    onChange={(e) => updateField("aboutDescription", e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Footer Content */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Footer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="footerText">Footer Text</Label>
                                <Input
                                    id="footerText"
                                    placeholder="Empowering medical professionals..."
                                    value={formData.footerText || ""}
                                    onChange={(e) => updateField("footerText", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="copyrightText">Copyright Text</Label>
                                <Input
                                    id="copyrightText"
                                    placeholder="MedConf. All rights reserved."
                                    value={formData.copyrightText || ""}
                                    onChange={(e) => updateField("copyrightText", e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* ===================== Testimonials Manager ===================== */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle>Testimonials</CardTitle>
                            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={openAddTestimonial}>
                                <Plus className="w-4 h-4" /> Add Testimonial
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {(!formData.testimonials || (formData.testimonials as Testimonial[]).length === 0) ? (
                                <p className="text-sm text-muted-foreground text-center py-6">No testimonials added yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {(formData.testimonials as Testimonial[]).map((t) => (
                                        <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group">
                                            {t.avatar ? (
                                                <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-sm font-medium">
                                                    {t.name.charAt(0)}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">{t.name}</span>
                                                    {t.role && <span className="text-xs text-muted-foreground">- {t.role}</span>}
                                                </div>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star key={i} className={cn("w-3 h-3", i < t.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
                                                    ))}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 truncate">{t.content}</p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditTestimonial(t)}>
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteTestimonial(t.id)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Testimonial Dialog */}
                    <Dialog open={testimonialDialogOpen} onOpenChange={setTestimonialDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
                                <DialogDescription>
                                    {editingTestimonial ? "Update the testimonial details below." : "Fill in the details for the new testimonial."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label>Name *</Label>
                                    <Input placeholder="Dr. Priya Sharma" value={testimonialForm.name} onChange={(e) => setTestimonialForm((p) => ({ ...p, name: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Input placeholder="Cardiologist" value={testimonialForm.role} onChange={(e) => setTestimonialForm((p) => ({ ...p, role: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Avatar</Label>
                                    {testimonialForm.avatar ? (
                                        <div className="flex items-center gap-3">
                                            <img src={testimonialForm.avatar} alt="Avatar" className="w-14 h-14 rounded-full object-cover bg-muted" />
                                            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setTestimonialForm((p) => ({ ...p, avatar: "" }))}>
                                                <Trash2 className="w-3.5 h-3.5" /> Remove
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <label className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors text-sm",
                                                avatarUploading ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/50"
                                            )}>
                                                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
                                                {avatarUploading ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                                                ) : (
                                                    <><Upload className="w-4 h-4" /> Upload photo</>
                                                )}
                                            </label>
                                            <span className="text-xs text-muted-foreground">or</span>
                                            <Input placeholder="Paste URL" className="flex-1" onChange={(e) => setTestimonialForm((p) => ({ ...p, avatar: e.target.value }))} />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Content *</Label>
                                    <Textarea placeholder="The conferences organized here are world-class..." value={testimonialForm.content} onChange={(e) => setTestimonialForm((p) => ({ ...p, content: e.target.value }))} rows={3} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Rating</Label>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setTestimonialForm((p) => ({ ...p, rating: i + 1 }))}
                                                className="p-0.5"
                                            >
                                                <Star className={cn("w-6 h-6 transition-colors", i < testimonialForm.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30 hover:text-yellow-300")} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setTestimonialDialogOpen(false)}>Cancel</Button>
                                <Button type="button" onClick={saveTestimonial} disabled={!testimonialForm.name || !testimonialForm.content}>
                                    {editingTestimonial ? "Update" : "Add"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* ===================== Gallery Images Manager ===================== */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle>Gallery Images</CardTitle>
                            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={openAddImage}>
                                <Plus className="w-4 h-4" /> Add Image
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {(!formData.galleryImages || (formData.galleryImages as GalleryImage[]).length === 0) ? (
                                <p className="text-sm text-muted-foreground text-center py-6">No gallery images added yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {(formData.galleryImages as GalleryImage[]).map((img) => (
                                        <div key={img.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group">
                                            <img src={img.src} alt={img.alt} className="w-14 h-10 rounded object-cover flex-shrink-0 bg-muted" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{img.alt}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{img.category}</span>
                                                    {img.event && <span className="text-xs text-muted-foreground">{img.event}</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditImage(img)}>
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteImage(img.id)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Gallery Image Dialog */}
                    <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingImage ? "Edit Image" : "Add Image"}</DialogTitle>
                                <DialogDescription>
                                    {editingImage ? "Update the gallery image details below." : "Upload an image or provide a URL."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                {/* Upload area */}
                                <div className="space-y-2">
                                    <Label>Image *</Label>
                                    {imageForm.src ? (
                                        <div className="relative">
                                            <img src={imageForm.src} alt={imageForm.alt || "Preview"} className="w-full h-40 rounded-lg object-cover bg-muted" />
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                className="absolute top-2 right-2 gap-1.5"
                                                onClick={() => setImageForm((p) => ({ ...p, src: "" }))}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> Remove
                                            </Button>
                                        </div>
                                    ) : (
                                        <label className={cn(
                                            "flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
                                            imageUploading ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/50"
                                        )}>
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp,image/gif"
                                                className="hidden"
                                                onChange={handleImageUpload}
                                                disabled={imageUploading}
                                            />
                                            {imageUploading ? (
                                                <>
                                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                                    <span className="text-sm text-muted-foreground">Uploading...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                                    <span className="text-sm font-medium">Click to upload image</span>
                                                    <span className="text-xs text-muted-foreground">JPEG, PNG, WebP, or GIF (max 10MB)</span>
                                                </>
                                            )}
                                        </label>
                                    )}
                                    {/* URL fallback */}
                                    {!imageForm.src && !imageUploading && (
                                        <div className="flex items-center gap-2 pt-1">
                                            <div className="h-px flex-1 bg-border" />
                                            <span className="text-xs text-muted-foreground">or paste URL</span>
                                            <div className="h-px flex-1 bg-border" />
                                        </div>
                                    )}
                                    {!imageForm.src && !imageUploading && (
                                        <Input placeholder="https://example.com/photo.jpg" value="" onChange={(e) => setImageForm((p) => ({ ...p, src: e.target.value }))} />
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Alt Text *</Label>
                                    <Input placeholder="Medical Conference Keynote" value={imageForm.alt} onChange={(e) => setImageForm((p) => ({ ...p, alt: e.target.value }))} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Input placeholder="Conference" value={imageForm.category} onChange={(e) => setImageForm((p) => ({ ...p, category: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Event</Label>
                                        <Input placeholder="Annual Summit" value={imageForm.event} onChange={(e) => setImageForm((p) => ({ ...p, event: e.target.value }))} />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setImageDialogOpen(false)}>Cancel</Button>
                                <Button type="button" onClick={saveImage} disabled={!imageForm.src || !imageForm.alt || imageUploading}>
                                    {editingImage ? "Update" : "Add"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* ===================== Gallery Videos Manager ===================== */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle>Gallery Videos</CardTitle>
                            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={openAddVideo}>
                                <Plus className="w-4 h-4" /> Add Video
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {(!formData.galleryVideos || (formData.galleryVideos as GalleryVideo[]).length === 0) ? (
                                <p className="text-sm text-muted-foreground text-center py-6">No gallery videos added yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {(formData.galleryVideos as GalleryVideo[]).map((v) => (
                                        <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group">
                                            <div className="relative flex-shrink-0">
                                                <img src={v.thumbnail} alt={v.title} className="w-20 h-12 rounded object-cover bg-muted" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                                                        <Video className="w-3 h-3 text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{v.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{v.category}</span>
                                                    <span className="text-xs text-muted-foreground">{v.duration}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditVideo(v)}>
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteVideo(v.id)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Gallery Video Dialog */}
                    <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingVideo ? "Edit Video" : "Add Video"}</DialogTitle>
                                <DialogDescription>
                                    {editingVideo ? "Update the gallery video details below." : "Add a new YouTube video to the gallery."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label>YouTube URL or ID *</Label>
                                    <Input
                                        placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                        value={videoForm.youtubeUrl}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const id = extractYoutubeId(val);
                                            setVideoForm((p) => ({
                                                ...p,
                                                youtubeUrl: val,
                                                thumbnail: p.thumbnail || (id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : ""),
                                            }));
                                        }}
                                    />
                                    {videoForm.youtubeUrl && (
                                        <p className="text-xs text-muted-foreground">
                                            Extracted ID: <code className="px-1 py-0.5 bg-muted rounded">{extractYoutubeId(videoForm.youtubeUrl)}</code>
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Title *</Label>
                                    <Input placeholder="Annual Conference Highlights" value={videoForm.title} onChange={(e) => setVideoForm((p) => ({ ...p, title: e.target.value }))} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Input placeholder="Conference" value={videoForm.category} onChange={(e) => setVideoForm((p) => ({ ...p, category: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Duration</Label>
                                        <Input placeholder="12:45" value={videoForm.duration} onChange={(e) => setVideoForm((p) => ({ ...p, duration: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Thumbnail URL</Label>
                                    <Input
                                        placeholder="Auto-generated from YouTube ID"
                                        value={videoForm.thumbnail}
                                        onChange={(e) => setVideoForm((p) => ({ ...p, thumbnail: e.target.value }))}
                                    />
                                    <p className="text-xs text-muted-foreground">Leave blank to auto-generate from YouTube ID.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Event</Label>
                                    <Input placeholder="Annual Summit" value={videoForm.event} onChange={(e) => setVideoForm((p) => ({ ...p, event: e.target.value }))} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setVideoDialogOpen(false)}>Cancel</Button>
                                <Button type="button" onClick={saveVideo} disabled={!videoForm.youtubeUrl || !videoForm.title}>
                                    {editingVideo ? "Update" : "Add"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                {/* Contact & Social Tab */}
                <TabsContent value="contact" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="contact@organization.com"
                                        value={formData.email || ""}
                                        onChange={(e) => updateField("email", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        placeholder="+91 98765 43210"
                                        value={formData.phone || ""}
                                        onChange={(e) => updateField("phone", e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    placeholder="123 Medical Center"
                                    value={formData.address || ""}
                                    onChange={(e) => updateField("address", e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        placeholder="Mumbai"
                                        value={formData.city || ""}
                                        onChange={(e) => updateField("city", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input
                                        id="state"
                                        placeholder="Maharashtra"
                                        value={formData.state || ""}
                                        onChange={(e) => updateField("state", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Input
                                        id="country"
                                        placeholder="India"
                                        value={formData.country || ""}
                                        onChange={(e) => updateField("country", e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    placeholder="https://www.organization.com"
                                    value={formData.website || ""}
                                    onChange={(e) => updateField("website", e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Social Links</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="facebook">Facebook</Label>
                                    <Input
                                        id="facebook"
                                        placeholder="https://facebook.com/organization"
                                        value={formData.facebook || ""}
                                        onChange={(e) => updateField("facebook", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="twitter">Twitter / X</Label>
                                    <Input
                                        id="twitter"
                                        placeholder="https://twitter.com/organization"
                                        value={formData.twitter || ""}
                                        onChange={(e) => updateField("twitter", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="linkedin">LinkedIn</Label>
                                    <Input
                                        id="linkedin"
                                        placeholder="https://linkedin.com/company/organization"
                                        value={formData.linkedin || ""}
                                        onChange={(e) => updateField("linkedin", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="instagram">Instagram</Label>
                                    <Input
                                        id="instagram"
                                        placeholder="https://instagram.com/organization"
                                        value={formData.instagram || ""}
                                        onChange={(e) => updateField("instagram", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="youtube">YouTube</Label>
                                    <Input
                                        id="youtube"
                                        placeholder="https://youtube.com/@organization"
                                        value={formData.youtube || ""}
                                        onChange={(e) => updateField("youtube", e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Default Currency</Label>
                                    <Select
                                        value={formData.defaultCurrency || "INR"}
                                        onValueChange={(val) => updateField("defaultCurrency", val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select currency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CURRENCIES.map((c) => (
                                                <SelectItem key={c.value} value={c.value}>
                                                    {c.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Default Timezone</Label>
                                    <Select
                                        value={formData.defaultTimezone || "Asia/Kolkata"}
                                        onValueChange={(val) => updateField("defaultTimezone", val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select timezone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIMEZONES.map((t) => (
                                                <SelectItem key={t.value} value={t.value}>
                                                    {t.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="domain">Custom Domain</Label>
                                <Input
                                    id="domain"
                                    placeholder="events.organization.com"
                                    value={formData.domain || ""}
                                    onChange={(e) => updateField("domain", e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Optional. Point a CNAME record to this application to use a custom domain.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </form>
    );
}
