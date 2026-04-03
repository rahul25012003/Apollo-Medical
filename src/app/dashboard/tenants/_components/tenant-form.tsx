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
    Link2,
    CreditCard,
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
import type { Testimonial, GalleryImage, GalleryVideo, FAQItem, ResearchItem } from "@/lib/tenant/types";
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
    shortName: "",
    tagline: "",
    logo: "",
    favicon: "",
    secondaryLogo: "",
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
    aboutImages: null as string[] | null,
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
    paymentMode: "NONE" as "NONE" | "RAZORPAY" | "QR_CODE",
    razorpayKeyId: "",
    razorpayKeySecret: "",
    paymentQrCode: "",
    paymentUpiId: "",
    paymentInstructions: "",
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

    // Logo & Favicon upload state
    const [logoUploading, setLogoUploading] = useState(false);
    const [faviconUploading, setFaviconUploading] = useState(false);
    const [logoInputMode, setLogoInputMode] = useState<"upload" | "url">("upload");
    const [faviconInputMode, setFaviconInputMode] = useState<"upload" | "url">("upload");
    const [secondaryLogoUploading, setSecondaryLogoUploading] = useState(false);
    const [secondaryLogoInputMode, setSecondaryLogoInputMode] = useState<"upload" | "url">("upload");

    // Hero BG & About Images upload state
    const [heroBgUploading, setHeroBgUploading] = useState(false);
    const [heroBgInputMode, setHeroBgInputMode] = useState<"upload" | "url">("upload");
    const [aboutImageUploading, setAboutImageUploading] = useState(false);

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
            const res = await uploadFile(file, `${tenantFolder}/avatars`);
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
            const res = await uploadFile(file, `${tenantFolder}/gallery`);
            if (res.success && res.data) {
                setImageForm((p) => ({ ...p, src: res.data!.url }));
            } else {
                alert({ title: "Upload failed", description: res.error?.message || "Could not upload image", variant: "error" });
            }
        } catch {
            alert({ title: "Upload failed", description: "An unexpected error occurred", variant: "error" });
        } finally {
            setImageUploading(false);
            e.target.value = "";
        }
    };

    // Bulk gallery image upload (multiple files at once)
    const [bulkImageUploading, setBulkImageUploading] = useState(false);
    const handleBulkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        try {
            setBulkImageUploading(true);
            const list = (formData.galleryImages as GalleryImage[] | null) || [];
            let maxId = list.length > 0 ? Math.max(...list.map((i) => i.id)) : 0;
            const newImages: GalleryImage[] = [];
            for (const file of Array.from(files)) {
                const res = await uploadFile(file, `${tenantFolder}/gallery`);
                if (res.success && res.data) {
                    maxId++;
                    newImages.push({
                        id: maxId,
                        src: res.data.url,
                        alt: file.name.replace(/\.[^/.]+$/, ""),
                        category: "General",
                    });
                }
            }
            if (newImages.length > 0) {
                updateField("galleryImages", [...list, ...newImages]);
                alert({ title: "Uploaded", description: `${newImages.length} image(s) added to gallery`, variant: "success" });
            }
        } catch {
            alert({ title: "Upload failed", description: "An unexpected error occurred", variant: "error" });
        } finally {
            setBulkImageUploading(false);
            e.target.value = "";
        }
    };
    // --- Logo & Favicon upload handlers ---
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setLogoUploading(true);
            const res = await uploadFile(file, `${tenantFolder}/logos`);
            if (res.success && res.data) {
                updateField("logo", res.data.url);
            } else {
                alert({ title: "Upload failed", description: res.error?.message || "Could not upload logo", variant: "error" });
            }
        } catch {
            alert({ title: "Upload failed", description: "An unexpected error occurred", variant: "error" });
        } finally {
            setLogoUploading(false);
            e.target.value = "";
        }
    };
    const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setFaviconUploading(true);
            const res = await uploadFile(file, `${tenantFolder}/logos`);
            if (res.success && res.data) {
                updateField("favicon", res.data.url);
            } else {
                alert({ title: "Upload failed", description: res.error?.message || "Could not upload favicon", variant: "error" });
            }
        } catch {
            alert({ title: "Upload failed", description: "An unexpected error occurred", variant: "error" });
        } finally {
            setFaviconUploading(false);
            e.target.value = "";
        }
    };

    const handleSecondaryLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setSecondaryLogoUploading(true);
            const res = await uploadFile(file, `${tenantFolder}/logos`);
            if (res.success && res.data) {
                updateField("secondaryLogo", res.data.url);
            } else {
                alert({ title: "Upload failed", description: res.error?.message || "Could not upload secondary logo", variant: "error" });
            }
        } catch {
            alert({ title: "Upload failed", description: "An unexpected error occurred", variant: "error" });
        } finally {
            setSecondaryLogoUploading(false);
            e.target.value = "";
        }
    };

    // Tenant-specific folder for uploads
    const tenantFolder = `tenants/${formData.slug}`;

    const handleHeroBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setHeroBgUploading(true);
            const res = await uploadFile(file, `${tenantFolder}/hero`);
            if (res.success && res.data) {
                updateField("heroBgImage", res.data.url);
            } else {
                alert({ title: "Upload failed", description: res.error?.message || "Could not upload background image", variant: "error" });
            }
        } catch {
            alert({ title: "Upload failed", description: "An unexpected error occurred", variant: "error" });
        } finally {
            setHeroBgUploading(false);
            e.target.value = "";
        }
    };

    const handleAboutImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        try {
            setAboutImageUploading(true);
            const current = (formData.aboutImages as string[]) || [];
            const newUrls: string[] = [];
            for (const file of Array.from(files)) {
                const res = await uploadFile(file, `${tenantFolder}/about`);
                if (res.success && res.data) {
                    newUrls.push(res.data.url);
                }
            }
            if (newUrls.length > 0) {
                updateField("aboutImages", [...current, ...newUrls] as any);
            }
        } catch {
            alert({ title: "Upload failed", description: "An unexpected error occurred", variant: "error" });
        } finally {
            setAboutImageUploading(false);
            e.target.value = "";
        }
    };

    const removeAboutImage = (index: number) => {
        const current = (formData.aboutImages as string[]) || [];
        updateField("aboutImages", current.filter((_, i) => i !== index) as any);
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

    // --- FAQ handlers ---
    const [faqDialogOpen, setFaqDialogOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
    const [faqForm, setFaqForm] = useState({ question: "", answer: "" });

    const openAddFaq = () => {
        setEditingFaq(null);
        setFaqForm({ question: "", answer: "" });
        setFaqDialogOpen(true);
    };
    const openEditFaq = (faq: FAQItem) => {
        setEditingFaq(faq);
        setFaqForm({ question: faq.question, answer: faq.answer });
        setFaqDialogOpen(true);
    };
    const saveFaq = () => {
        const list = (formData.faqs as FAQItem[] | null) || [];
        if (editingFaq) {
            updateField("faqs", list.map((f) => f.id === editingFaq.id ? { ...f, ...faqForm } : f));
        } else {
            const newId = list.length > 0 ? Math.max(...list.map((f) => f.id)) + 1 : 1;
            updateField("faqs", [...list, { id: newId, ...faqForm }]);
        }
        setFaqDialogOpen(false);
    };
    const deleteFaq = (id: number) => {
        const list = (formData.faqs as FAQItem[] | null) || [];
        updateField("faqs", list.filter((f) => f.id !== id));
    };

    // --- Research handlers ---
    const [researchDialogOpen, setResearchDialogOpen] = useState(false);
    const [editingResearch, setEditingResearch] = useState<ResearchItem | null>(null);
    const [researchForm, setResearchForm] = useState({ icon: "BrainCircuit", title: "", description: "", status: "Active" });

    const openAddResearch = () => {
        setEditingResearch(null);
        setResearchForm({ icon: "BrainCircuit", title: "", description: "", status: "Active" });
        setResearchDialogOpen(true);
    };
    const openEditResearch = (item: ResearchItem) => {
        setEditingResearch(item);
        setResearchForm({ icon: item.icon, title: item.title, description: item.description, status: item.status });
        setResearchDialogOpen(true);
    };
    const saveResearch = () => {
        const list = (formData.researchItems as ResearchItem[] | null) || [];
        if (editingResearch) {
            updateField("researchItems", list.map((r) => r.id === editingResearch.id ? { ...r, ...researchForm } : r));
        } else {
            const newId = list.length > 0 ? Math.max(...list.map((r) => r.id)) + 1 : 1;
            updateField("researchItems", [...list, { id: newId, ...researchForm }]);
        }
        setResearchDialogOpen(false);
    };
    const deleteResearch = (id: number) => {
        const list = (formData.researchItems as ResearchItem[] | null) || [];
        updateField("researchItems", list.filter((r) => r.id !== id));
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
            const urlFields = ["website", "facebook", "twitter", "linkedin", "instagram", "youtube", "logo", "favicon", "secondaryLogo", "heroBgImage"] as const;
            for (const field of urlFields) {
                if (cleanedData[field] === "") {
                    (cleanedData as any)[field] = null;
                }
            }
            const optionalStringFields = ["email", "tagline", "phone", "address", "city", "state", "country", "domain", "heroTitle", "heroSubtitle", "aboutTitle", "aboutDescription", "footerText", "copyrightText", "razorpayKeyId", "razorpayKeySecret", "paymentQrCode", "paymentUpiId", "paymentInstructions"] as const;
            for (const field of optionalStringFields) {
                if (cleanedData[field] === "") {
                    (cleanedData as any)[field] = null;
                }
            }

            await onSubmit(cleanedData);
            alert({
                title: "Saved",
                description: "Changes saved successfully!",
                variant: "success",
            });
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
        ...(!restrictedMode ? [
            { id: "payment", label: "Payment", icon: CreditCard },
            { id: "settings", label: "Settings", icon: Settings2 },
        ] : []),
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
                        <a href={formData.domain ? `https://${formData.domain}` : `/t/${slug}`} target="_blank" rel="noopener noreferrer">
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
                                <div className="space-y-2">
                                    <Label htmlFor="shortName">Sidebar Display Name</Label>
                                    <Input
                                        id="shortName"
                                        placeholder="Apollo"
                                        value={formData.shortName || ""}
                                        onChange={(e) => updateField("shortName", e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">Short name shown beside logo in dashboard sidebar. Leave empty to use full name.</p>
                                </div>
                                {!restrictedMode && (
                                <div className="space-y-2">
                                    <Label htmlFor="slug">URL Slug *</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="slug"
                                            placeholder="my-conference"
                                            value={formData.slug}
                                            onChange={(e) => {
                                                setSlugManuallyEdited(true);
                                                updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                                            }}
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Used internally for tenant identification
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
                                {/* Logo */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Logo</Label>
                                        <div className="flex items-center gap-1 rounded-md border p-0.5 bg-muted/50">
                                            <button
                                                type="button"
                                                onClick={() => setLogoInputMode("upload")}
                                                className={cn(
                                                    "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors",
                                                    logoInputMode === "upload" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <Upload className="h-3 w-3" /> Upload
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setLogoInputMode("url")}
                                                className={cn(
                                                    "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors",
                                                    logoInputMode === "url" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <Link2 className="h-3 w-3" /> URL
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {formData.logo ? (
                                            <div className="relative h-16 w-16 rounded-md border overflow-hidden bg-muted flex-shrink-0">
                                                <img src={formData.logo} alt="Logo" className="h-full w-full object-contain" />
                                            </div>
                                        ) : (
                                            <div className="h-16 w-16 rounded-md border border-dashed flex items-center justify-center bg-muted/50 flex-shrink-0">
                                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-1.5 flex-1">
                                            {logoInputMode === "upload" ? (
                                                <>
                                                    <label
                                                        htmlFor="logo-upload"
                                                        className={cn(
                                                            "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-3 cursor-pointer",
                                                            "bg-primary text-primary-foreground hover:bg-primary/90",
                                                            logoUploading && "opacity-50 pointer-events-none"
                                                        )}
                                                    >
                                                        {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                                        {logoUploading ? "Uploading..." : "Upload Logo"}
                                                    </label>
                                                    <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
                                                </>
                                            ) : (
                                                <Input
                                                    placeholder="https://example.com/logo.png"
                                                    value={formData.logo || ""}
                                                    onChange={(e) => updateField("logo", e.target.value)}
                                                />
                                            )}
                                            {formData.logo && (
                                                <button type="button" className="text-xs text-destructive hover:underline text-left" onClick={() => updateField("logo", "")}>
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Favicon */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Favicon</Label>
                                        <div className="flex items-center gap-1 rounded-md border p-0.5 bg-muted/50">
                                            <button
                                                type="button"
                                                onClick={() => setFaviconInputMode("upload")}
                                                className={cn(
                                                    "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors",
                                                    faviconInputMode === "upload" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <Upload className="h-3 w-3" /> Upload
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFaviconInputMode("url")}
                                                className={cn(
                                                    "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors",
                                                    faviconInputMode === "url" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <Link2 className="h-3 w-3" /> URL
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {formData.favicon ? (
                                            <div className="relative h-16 w-16 rounded-md border overflow-hidden bg-muted flex-shrink-0">
                                                <img src={formData.favicon} alt="Favicon" className="h-full w-full object-contain" />
                                            </div>
                                        ) : (
                                            <div className="h-16 w-16 rounded-md border border-dashed flex items-center justify-center bg-muted/50 flex-shrink-0">
                                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-1.5 flex-1">
                                            {faviconInputMode === "upload" ? (
                                                <>
                                                    <label
                                                        htmlFor="favicon-upload"
                                                        className={cn(
                                                            "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-3 cursor-pointer",
                                                            "bg-primary text-primary-foreground hover:bg-primary/90",
                                                            faviconUploading && "opacity-50 pointer-events-none"
                                                        )}
                                                    >
                                                        {faviconUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                                        {faviconUploading ? "Uploading..." : "Upload Favicon"}
                                                    </label>
                                                    <input id="favicon-upload" type="file" accept="image/*" className="hidden" onChange={handleFaviconUpload} disabled={faviconUploading} />
                                                </>
                                            ) : (
                                                <Input
                                                    placeholder="https://example.com/favicon.ico"
                                                    value={formData.favicon || ""}
                                                    onChange={(e) => updateField("favicon", e.target.value)}
                                                />
                                            )}
                                            {formData.favicon && (
                                                <button type="button" className="text-xs text-destructive hover:underline text-left" onClick={() => updateField("favicon", "")}>
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Secondary Logo */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Secondary Logo</Label>
                                        <p className="text-xs text-muted-foreground">Displayed above the login button on the home page</p>
                                    </div>
                                    <div className="flex items-center gap-1 rounded-md border p-0.5 bg-muted/50">
                                        <button
                                            type="button"
                                            onClick={() => setSecondaryLogoInputMode("upload")}
                                            className={cn(
                                                "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors",
                                                secondaryLogoInputMode === "upload" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <Upload className="h-3 w-3" /> Upload
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSecondaryLogoInputMode("url")}
                                            className={cn(
                                                "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors",
                                                secondaryLogoInputMode === "url" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <Link2 className="h-3 w-3" /> URL
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {formData.secondaryLogo ? (
                                        <div className="relative h-16 w-16 rounded-md border overflow-hidden bg-muted flex-shrink-0">
                                            <img src={formData.secondaryLogo} alt="Secondary Logo" className="h-full w-full object-contain" />
                                        </div>
                                    ) : (
                                        <div className="h-16 w-16 rounded-md border border-dashed flex items-center justify-center bg-muted/50 flex-shrink-0">
                                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-1.5 flex-1">
                                        {secondaryLogoInputMode === "upload" ? (
                                            <>
                                                <label
                                                    htmlFor="secondary-logo-upload"
                                                    className={cn(
                                                        "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-3 cursor-pointer",
                                                        "bg-primary text-primary-foreground hover:bg-primary/90",
                                                        secondaryLogoUploading && "opacity-50 pointer-events-none"
                                                    )}
                                                >
                                                    {secondaryLogoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                                    {secondaryLogoUploading ? "Uploading..." : "Upload Secondary Logo"}
                                                </label>
                                                <input id="secondary-logo-upload" type="file" accept="image/*" className="hidden" onChange={handleSecondaryLogoUpload} disabled={secondaryLogoUploading} />
                                            </>
                                        ) : (
                                            <Input
                                                placeholder="https://example.com/secondary-logo.png"
                                                value={formData.secondaryLogo || ""}
                                                onChange={(e) => updateField("secondaryLogo", e.target.value)}
                                            />
                                        )}
                                        {formData.secondaryLogo && (
                                            <button type="button" className="text-xs text-destructive hover:underline text-left" onClick={() => updateField("secondaryLogo", "")}>
                                                Remove
                                            </button>
                                        )}
                                    </div>
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
                                <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
                                    {/* Mini Header */}
                                    <div className="flex items-center justify-between px-4 py-2.5 border-b bg-white">
                                        <div className="flex items-center gap-2">
                                            {formData.logo ? (
                                                <img src={formData.logo} alt="Logo" className="h-7 w-7 rounded-md object-contain" />
                                            ) : (
                                                <div className="h-7 w-7 rounded-md flex items-center justify-center text-white text-xs"
                                                    style={{ background: `linear-gradient(135deg, ${formData.primaryColor || "#0d9488"}, ${formData.secondaryColor || "#0891b2"})` }}>
                                                    {formData.name?.charAt(0) || "T"}
                                                </div>
                                            )}
                                            <span className="text-xs font-semibold truncate max-w-[120px]">{formData.name || "Organization"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {formData.secondaryLogo && (
                                                <img src={formData.secondaryLogo} alt="Secondary" className="h-6 w-6 rounded-md object-contain" />
                                            )}
                                            <span className="text-[10px] px-2 py-0.5 rounded-full text-white"
                                                style={{ background: `linear-gradient(135deg, ${formData.primaryColor || "#0d9488"}, ${formData.secondaryColor || "#0891b2"})` }}>
                                                Login
                                            </span>
                                        </div>
                                    </div>
                                    {/* Mini Hero */}
                                    {formData.sections?.hero !== false && (
                                        <div className="px-4 py-6 text-center"
                                            style={{ background: `linear-gradient(135deg, ${formData.primaryColor || "#0d9488"}10, ${formData.secondaryColor || "#0891b2"}10)` }}>
                                            <p className="text-[10px] font-medium mb-1" style={{ color: formData.primaryColor || "#0d9488" }}>
                                                {formData.tagline || "Welcome to"}
                                            </p>
                                            <p className="text-sm font-bold leading-tight mb-1">
                                                {formData.heroTitle || formData.name || "Organization Name"}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {formData.heroSubtitle || "Register for upcoming events"}
                                            </p>
                                        </div>
                                    )}
                                    {/* Mini Sections */}
                                    <div className="px-4 py-2 space-y-1.5">
                                        {formData.sections?.events !== false && (
                                            <div className="flex items-center gap-2 px-2 py-1 rounded bg-muted/50">
                                                <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: formData.primaryColor || "#0d9488" }} />
                                                <span className="text-[10px] text-muted-foreground">Events</span>
                                            </div>
                                        )}
                                        {formData.sections?.ongoingResearch !== false && (
                                            <div className="flex items-center gap-2 px-2 py-1 rounded bg-muted/50">
                                                <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: formData.secondaryColor || "#0891b2" }} />
                                                <span className="text-[10px] text-muted-foreground">Ongoing Research</span>
                                            </div>
                                        )}
                                        {formData.sections?.gallery !== false && (
                                            <div className="flex items-center gap-2 px-2 py-1 rounded bg-muted/50">
                                                <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: formData.accentColor || "#10b981" }} />
                                                <span className="text-[10px] text-muted-foreground">Gallery</span>
                                            </div>
                                        )}
                                        {formData.sections?.testimonials !== false && (
                                            <div className="flex items-center gap-2 px-2 py-1 rounded bg-muted/50">
                                                <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: formData.primaryColor || "#0d9488" }} />
                                                <span className="text-[10px] text-muted-foreground">Testimonials</span>
                                            </div>
                                        )}
                                        {formData.sections?.about !== false && (
                                            <div className="flex items-center gap-2 px-2 py-1 rounded bg-muted/50">
                                                <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: formData.secondaryColor || "#0891b2" }} />
                                                <span className="text-[10px] text-muted-foreground">About</span>
                                            </div>
                                        )}
                                        {formData.sections?.contact !== false && (
                                            <div className="flex items-center gap-2 px-2 py-1 rounded bg-muted/50">
                                                <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: formData.accentColor || "#10b981" }} />
                                                <span className="text-[10px] text-muted-foreground">Contact</span>
                                            </div>
                                        )}
                                        {formData.sections?.faq !== false && (
                                            <div className="flex items-center gap-2 px-2 py-1 rounded bg-muted/50">
                                                <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: formData.primaryColor || "#0d9488" }} />
                                                <span className="text-[10px] text-muted-foreground">FAQ</span>
                                            </div>
                                        )}
                                    </div>
                                    {/* Mini Footer */}
                                    <div className="px-4 py-2 text-center text-white text-[10px]"
                                        style={{ background: `linear-gradient(135deg, ${formData.primaryColor || "#0d9488"}, ${formData.secondaryColor || "#0891b2"})` }}>
                                        {formData.copyrightText || `© ${formData.name || "Organization"}`}
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
                                { key: "faq", label: "FAQ", desc: "Frequently asked questions section" },
                                { key: "ongoingResearch", label: "Ongoing Research", desc: "Research initiatives and projects" },
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
                                <div className="flex items-center justify-between">
                                    <Label>Hero Background Image</Label>
                                    <div className="flex items-center gap-1 text-xs">
                                        <button type="button" onClick={() => setHeroBgInputMode("upload")} className={`px-2 py-1 rounded ${heroBgInputMode === "upload" ? "bg-primary text-white" : "bg-muted"}`}>Upload</button>
                                        <button type="button" onClick={() => setHeroBgInputMode("url")} className={`px-2 py-1 rounded ${heroBgInputMode === "url" ? "bg-primary text-white" : "bg-muted"}`}>URL</button>
                                    </div>
                                </div>
                                {formData.heroBgImage && (
                                    <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                                        <img src={formData.heroBgImage} alt="Hero BG" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => updateField("heroBgImage", "")} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">×</button>
                                    </div>
                                )}
                                {heroBgInputMode === "upload" ? (
                                    <div>
                                        <input id="herobg-upload" type="file" accept="image/*" className="hidden" onChange={handleHeroBgUpload} disabled={heroBgUploading} />
                                        <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("herobg-upload")?.click()} disabled={heroBgUploading}>
                                            {heroBgUploading ? "Uploading..." : "Upload Background Image"}
                                        </Button>
                                    </div>
                                ) : (
                                    <Input
                                        placeholder="https://example.com/hero-bg.jpg"
                                        value={formData.heroBgImage || ""}
                                        onChange={(e) => updateField("heroBgImage", e.target.value)}
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Yearly Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Yearly Highlights</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Showcase stats below the events section on the homepage (e.g. &quot;Events in 2025&quot;)
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Year</Label>
                                    <Input
                                        placeholder="2025"
                                        value={(formData.yearlyStats as any)?.year || ""}
                                        onChange={(e) => updateField("yearlyStats", { ...(formData.yearlyStats as any || {}), year: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Events</Label>
                                    <Input
                                        placeholder="12"
                                        value={(formData.yearlyStats as any)?.events || ""}
                                        onChange={(e) => updateField("yearlyStats", { ...(formData.yearlyStats as any || {}), events: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Attendees</Label>
                                    <Input
                                        placeholder="500+"
                                        value={(formData.yearlyStats as any)?.attendees || ""}
                                        onChange={(e) => updateField("yearlyStats", { ...(formData.yearlyStats as any || {}), attendees: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Speakers</Label>
                                    <Input
                                        placeholder="30+"
                                        value={(formData.yearlyStats as any)?.speakers || ""}
                                        onChange={(e) => updateField("yearlyStats", { ...(formData.yearlyStats as any || {}), speakers: e.target.value })}
                                    />
                                </div>
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
                                <p className="text-xs text-muted-foreground">Separate paragraphs with a blank line. Use &quot;Heading: text&quot; format for sub-sections.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>About Slideshow Images</Label>
                                <p className="text-xs text-muted-foreground">Images shown in the slideshow beside the about text on the homepage.</p>
                                {((formData.aboutImages as string[]) || []).length > 0 && (
                                    <div className="flex flex-wrap gap-3">
                                        {((formData.aboutImages as string[]) || []).map((img, idx) => (
                                            <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                                                <img src={img} alt={`About ${idx + 1}`} className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => removeAboutImage(idx)} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600">×</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div>
                                    <input id="about-img-upload" type="file" accept="image/*" multiple className="hidden" onChange={handleAboutImageUpload} disabled={aboutImageUploading} />
                                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("about-img-upload")?.click()} disabled={aboutImageUploading}>
                                        {aboutImageUploading ? "Uploading..." : "Add Image"}
                                    </Button>
                                </div>
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
                                                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
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
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => document.getElementById("bulk-gallery-upload")?.click()} disabled={bulkImageUploading}>
                                    <Upload className="w-4 h-4" /> {bulkImageUploading ? "Uploading..." : "Upload Multiple"}
                                </Button>
                                <input id="bulk-gallery-upload" type="file" accept="image/*" multiple className="hidden" onChange={handleBulkImageUpload} disabled={bulkImageUploading} />
                                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={openAddImage}>
                                    <Plus className="w-4 h-4" /> Add Image
                                </Button>
                            </div>
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
                                                accept="image/*"
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

                    {/* ===================== FAQ Manager ===================== */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle>FAQs</CardTitle>
                            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={openAddFaq}>
                                <Plus className="w-4 h-4" /> Add FAQ
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {(!formData.faqs || (formData.faqs as FAQItem[]).length === 0) ? (
                                <p className="text-sm text-muted-foreground text-center py-6">No FAQs added yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {(formData.faqs as FAQItem[]).map((faq) => (
                                        <div key={faq.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 group">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm">{faq.question}</p>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditFaq(faq)}>
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteFaq(faq.id)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* FAQ Dialog */}
                    <Dialog open={faqDialogOpen} onOpenChange={setFaqDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingFaq ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
                                <DialogDescription>
                                    {editingFaq ? "Update the question and answer." : "Add a new frequently asked question."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label>Question *</Label>
                                    <Input placeholder="What is this conference?" value={faqForm.question} onChange={(e) => setFaqForm((p) => ({ ...p, question: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Answer *</Label>
                                    <Textarea placeholder="A professional organization dedicated to..." value={faqForm.answer} onChange={(e) => setFaqForm((p) => ({ ...p, answer: e.target.value }))} rows={4} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setFaqDialogOpen(false)}>Cancel</Button>
                                <Button type="button" onClick={saveFaq} disabled={!faqForm.question || !faqForm.answer}>
                                    {editingFaq ? "Update" : "Add"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* ===================== Ongoing Research Manager ===================== */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle>Ongoing Research</CardTitle>
                            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={openAddResearch}>
                                <Plus className="w-4 h-4" /> Add Research
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {(!formData.researchItems || (formData.researchItems as ResearchItem[]).length === 0) ? (
                                <p className="text-sm text-muted-foreground text-center py-6">No research items added yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {(formData.researchItems as ResearchItem[]).map((item) => (
                                        <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 group">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">{item.title}</span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{item.status}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditResearch(item)}>
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteResearch(item.id)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Research Dialog */}
                    <Dialog open={researchDialogOpen} onOpenChange={setResearchDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingResearch ? "Edit Research" : "Add Research"}</DialogTitle>
                                <DialogDescription>
                                    {editingResearch ? "Update the research item details." : "Add a new ongoing research item."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label>Title *</Label>
                                    <Input placeholder="e.g., Research Topic" value={researchForm.title} onChange={(e) => setResearchForm((p) => ({ ...p, title: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description *</Label>
                                    <Textarea placeholder="Investigating novel non-invasive brain stimulation approaches..." value={researchForm.description} onChange={(e) => setResearchForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select value={researchForm.status} onValueChange={(v) => setResearchForm((p) => ({ ...p, status: v }))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Active">Active</SelectItem>
                                                <SelectItem value="Recruiting">Recruiting</SelectItem>
                                                <SelectItem value="Ongoing">Ongoing</SelectItem>
                                                <SelectItem value="Pilot Phase">Pilot Phase</SelectItem>
                                                <SelectItem value="Completed">Completed</SelectItem>
                                                <SelectItem value="Published">Published</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Icon</Label>
                                        <Select value={researchForm.icon} onValueChange={(v) => setResearchForm((p) => ({ ...p, icon: v }))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="BrainCircuit">Brain Circuit</SelectItem>
                                                <SelectItem value="Microscope">Microscope</SelectItem>
                                                <SelectItem value="Activity">Activity</SelectItem>
                                                <SelectItem value="BookOpen">Book</SelectItem>
                                                <SelectItem value="Shield">Shield</SelectItem>
                                                <SelectItem value="Sparkles">Sparkles</SelectItem>
                                                <SelectItem value="Heart">Heart</SelectItem>
                                                <SelectItem value="Award">Award</SelectItem>
                                                <SelectItem value="Globe">Globe</SelectItem>
                                                <SelectItem value="Users">Users</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setResearchDialogOpen(false)}>Cancel</Button>
                                <Button type="button" onClick={saveResearch} disabled={!researchForm.title || !researchForm.description}>
                                    {editingResearch ? "Update" : "Add"}
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
                            <CardTitle>Map & Business Hours</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="mapUrl">Google Maps Embed URL</Label>
                                <Input
                                    id="mapUrl"
                                    placeholder="https://www.google.com/maps/embed?pb=..."
                                    value={formData.mapUrl || ""}
                                    onChange={(e) => updateField("mapUrl", e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Go to Google Maps → Share → Embed a map → Copy the src URL from the iframe code
                                </p>
                            </div>
                            {formData.mapUrl && (
                                <div className="rounded-lg overflow-hidden border h-48">
                                    <iframe
                                        src={formData.mapUrl}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        title="Location Map"
                                    />
                                </div>
                            )}
                            <div className="space-y-3 pt-2">
                                <Label>Business Hours</Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Monday - Friday</Label>
                                        <Input
                                            placeholder="9:00 AM - 5:00 PM"
                                            value={(formData.businessHours as any)?.monFri || ""}
                                            onChange={(e) => updateField("businessHours", { ...(formData.businessHours as any || {}), monFri: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Saturday</Label>
                                        <Input
                                            placeholder="9:00 AM - 1:00 PM"
                                            value={(formData.businessHours as any)?.sat || ""}
                                            onChange={(e) => updateField("businessHours", { ...(formData.businessHours as any || {}), sat: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Sunday & Gazetted Holidays</Label>
                                        <Input
                                            placeholder="Closed"
                                            value={(formData.businessHours as any)?.sunHoliday || ""}
                                            onChange={(e) => updateField("businessHours", { ...(formData.businessHours as any || {}), sunHoliday: e.target.value })}
                                        />
                                    </div>
                                </div>
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

                {/* Payment Settings Tab */}
                <TabsContent value="payment" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Configuration</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Configure how this tenant accepts payments for event registrations
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Payment Mode Selection */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Payment Mode</Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {[
                                        { value: "NONE", label: "No Online Payment", desc: "Registrations only, no payment collection" },
                                        { value: "RAZORPAY", label: "Razorpay Gateway", desc: "Accept cards, UPI, net banking via Razorpay" },
                                        { value: "QR_CODE", label: "QR Code / UPI", desc: "Display QR code, attendees upload payment proof" },
                                    ].map((mode) => (
                                        <div
                                            key={mode.value}
                                            onClick={() => updateField("paymentMode", mode.value as "NONE" | "RAZORPAY" | "QR_CODE")}
                                            className={cn(
                                                "border-2 rounded-lg p-4 cursor-pointer transition-all",
                                                formData.paymentMode === mode.value
                                                    ? "border-primary bg-primary/5"
                                                    : "border-muted hover:border-muted-foreground/30"
                                            )}
                                        >
                                            <div className="font-medium">{mode.label}</div>
                                            <p className="text-xs text-muted-foreground mt-1">{mode.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Razorpay Settings */}
                            {formData.paymentMode === "RAZORPAY" && (
                                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                                    <h4 className="font-semibold">Razorpay Configuration</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="razorpayKeyId">Razorpay Key ID</Label>
                                            <Input
                                                id="razorpayKeyId"
                                                placeholder="rzp_live_..."
                                                value={formData.razorpayKeyId || ""}
                                                onChange={(e) => updateField("razorpayKeyId", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="razorpayKeySecret">Razorpay Key Secret</Label>
                                            <Input
                                                id="razorpayKeySecret"
                                                type="password"
                                                placeholder="Enter secret key"
                                                value={formData.razorpayKeySecret || ""}
                                                onChange={(e) => updateField("razorpayKeySecret", e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                This is stored securely and never exposed to the frontend
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* QR Code Settings */}
                            {formData.paymentMode === "QR_CODE" && (
                                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                                    <h4 className="font-semibold">QR Code Payment Configuration</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="paymentUpiId">UPI ID</Label>
                                            <Input
                                                id="paymentUpiId"
                                                placeholder="yourname@upi"
                                                value={formData.paymentUpiId || ""}
                                                onChange={(e) => updateField("paymentUpiId", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <Label>QR Code Image</Label>
                                            {formData.paymentQrCode ? (
                                                <div className="relative inline-block">
                                                    <img
                                                        src={formData.paymentQrCode}
                                                        alt="Payment QR Code"
                                                        className="w-40 h-40 object-contain border rounded"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute -top-2 -right-2 h-6 w-6"
                                                        onClick={() => updateField("paymentQrCode", "")}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            const result = await uploadFile(file, "qr-codes");
                                                            if (result.success && result.data?.url) {
                                                                updateField("paymentQrCode", result.data.url);
                                                            }
                                                        }}
                                                    />
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Upload your UPI/bank QR code image
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="paymentInstructions">Payment Instructions</Label>
                                        <Textarea
                                            id="paymentInstructions"
                                            placeholder="Please scan the QR code and upload the payment screenshot after completing the payment..."
                                            value={formData.paymentInstructions || ""}
                                            onChange={(e) => updateField("paymentInstructions", e.target.value)}
                                            rows={3}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            These instructions will be shown to attendees during registration payment
                                        </p>
                                    </div>
                                </div>
                            )}
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
