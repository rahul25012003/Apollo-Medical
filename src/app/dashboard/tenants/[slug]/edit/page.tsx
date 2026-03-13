"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TenantForm } from "../../_components/tenant-form";
import { tenantsService } from "@/services/tenants";
import { TenantFormData } from "@/lib/tenant/validation";

export default function EditTenantPage() {
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;

    const [initialData, setInitialData] = useState<Partial<TenantFormData> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTenant() {
            try {
                setLoading(true);
                const response = await tenantsService.getBySlug(slug);
                if (response.success && response.data) {
                    const t = response.data as any;
                    setInitialData({
                        slug: t.slug,
                        name: t.branding?.name || t.name,
                        tagline: t.branding?.tagline || t.tagline || "",
                        logo: t.branding?.logo || t.logo || "",
                        favicon: t.branding?.favicon || t.favicon || "",
                        isActive: t.isActive,
                        primaryColor: t.theme?.primaryColor || t.primaryColor || "#0d9488",
                        secondaryColor: t.theme?.secondaryColor || t.secondaryColor || "#0891b2",
                        accentColor: t.theme?.accentColor || t.accentColor || "#10b981",
                        sections: t.sections || {
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
                        heroTitle: t.hero?.title || t.heroTitle || "",
                        heroSubtitle: t.hero?.subtitle || t.heroSubtitle || "",
                        heroBgImage: t.hero?.bgImage || t.heroBgImage || "",
                        aboutTitle: t.about?.title || t.aboutTitle || "",
                        aboutDescription: t.about?.description || t.aboutDescription || "",
                        aboutFeatures: t.about?.features || t.aboutFeatures || null,
                        galleryImages: t.gallery?.images || t.galleryImages || null,
                        galleryVideos: t.gallery?.videos || t.galleryVideos || null,
                        testimonials: t.testimonials || null,
                        footerText: t.footer?.text || t.footerText || "",
                        copyrightText: t.footer?.copyrightText || t.copyrightText || "",
                        email: t.contact?.email || t.email || "",
                        phone: t.contact?.phone || t.phone || "",
                        address: t.contact?.address || t.address || "",
                        city: t.contact?.city || t.city || "",
                        state: t.contact?.state || t.state || "",
                        country: t.contact?.country || t.country || "",
                        website: t.contact?.website || t.website || "",
                        facebook: t.social?.facebook || t.facebook || "",
                        twitter: t.social?.twitter || t.twitter || "",
                        linkedin: t.social?.linkedin || t.linkedin || "",
                        instagram: t.social?.instagram || t.instagram || "",
                        youtube: t.social?.youtube || t.youtube || "",
                        domain: t.domain || "",
                        defaultCurrency: t.settings?.defaultCurrency || t.defaultCurrency || "INR",
                        defaultTimezone: t.settings?.defaultTimezone || t.defaultTimezone || "Asia/Kolkata",
                    });
                } else {
                    setError("Tenant not found");
                }
            } catch (err) {
                console.error("Failed to fetch tenant:", err);
                setError("Failed to load tenant");
            } finally {
                setLoading(false);
            }
        }
        fetchTenant();
    }, [slug]);

    const handleSubmit = async (data: TenantFormData) => {
        const response = await tenantsService.update(slug, data);
        if (!response.success) {
            const errorMessage =
                typeof response.error === "string"
                    ? response.error
                    : response.error?.message || "Failed to update tenant";
            throw new Error(errorMessage);
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="Edit Tenant" subtitle="Loading tenant details...">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Edit Tenant" subtitle="">
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-destructive">{error}</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Edit Tenant" subtitle={`Editing: ${initialData?.name || slug}`}>
            <TenantForm
                initialData={initialData}
                onSubmit={handleSubmit}
                isEditing
                slug={slug}
            />
        </DashboardLayout>
    );
}
