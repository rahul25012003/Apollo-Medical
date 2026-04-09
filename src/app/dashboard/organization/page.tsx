"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TenantForm } from "../tenants/_components/tenant-form";
import { tenantsService } from "@/services/tenants";
import { TenantFormData } from "@/lib/tenant/validation";

export default function OrganizationPage() {
    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();

    const [initialData, setInitialData] = useState<Partial<TenantFormData> | null>(null);
    const [tenantSlug, setTenantSlug] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const userRole = session?.user?.role;
    const tenantId = session?.user?.tenantId ?? undefined;

    useEffect(() => {
        if (sessionStatus === "loading") return;

        if (userRole !== "ADMIN" || !tenantId) {
            setError("You do not have permission to access organization settings.");
            setLoading(false);
            return;
        }

        async function fetchTenant() {
            try {
                setLoading(true);
                const response = await tenantsService.getById(tenantId!);
                if (response.success && response.data) {
                    const t = response.data!;
                    setTenantSlug(t.slug || "");
                    const formData: Partial<TenantFormData> = {
                        slug: t.slug,
                        name: t.name,
                        shortName: t.shortName || "",
                        tagline: t.tagline || "",
                        logo: t.logo || "",
                        favicon: t.favicon || "",
                        secondaryLogo: t.secondaryLogo || "",
                        isActive: t.isActive,
                        primaryColor: t.primaryColor || "#0d9488",
                        secondaryColor: t.secondaryColor || "#0891b2",
                        accentColor: t.accentColor || "#10b981",
                        sections: t.sections || {
                            hero: true,
                            events: true,
                            gallery: true,
                            sponsors: true,
                            testimonials: true,
                            about: true,
                            contact: true,
                            faq: true,
                            ongoingResearch: true,
                        },
                        heroTitle: t.heroTitle || "",
                        heroSubtitle: t.heroSubtitle || "",
                        heroBgImage: t.heroBgImage || "",
                        aboutTitle: t.aboutTitle || "",
                        aboutDescription: t.aboutDescription || "",
                        aboutFeatures: (t.aboutFeatures as TenantFormData["aboutFeatures"]) || null,
                        aboutImages: (t.aboutImages as TenantFormData["aboutImages"]) || null,
                        galleryImages: (t.galleryImages as TenantFormData["galleryImages"]) || null,
                        galleryVideos: (t.galleryVideos as TenantFormData["galleryVideos"]) || null,
                        testimonials: (t.testimonials as TenantFormData["testimonials"]) || null,
                        yearlyStats: (t.yearlyStats as TenantFormData["yearlyStats"]) || { year: "2025", events: "", attendees: "", speakers: "" },
                        faqs: (t.faqs as TenantFormData["faqs"]) || null,
                        researchItems: (t.researchItems as TenantFormData["researchItems"]) || null,
                        footerText: t.footerText || "",
                        copyrightText: t.copyrightText || "",
                        email: t.email || "",
                        phone: t.phone || "",
                        address: t.address || "",
                        city: t.city || "",
                        state: t.state || "",
                        country: t.country || "",
                        website: t.website || "",
                        mapUrl: t.mapUrl || "",
                        businessHours: (t.businessHours as TenantFormData["businessHours"]) || { monFri: "9:00 AM - 5:00 PM", sat: "9:00 AM - 1:00 PM", sunHoliday: "Closed" },
                        facebook: t.facebook || "",
                        twitter: t.twitter || "",
                        linkedin: t.linkedin || "",
                        instagram: t.instagram || "",
                        youtube: t.youtube || "",
                        domain: t.domain || "",
                        defaultCurrency: t.defaultCurrency || "INR",
                        defaultTimezone: t.defaultTimezone || "Asia/Kolkata",
                    };
                    setInitialData(formData);
                } else {
                    setError("Organization not found.");
                }
            } catch (err) {
                console.error("Failed to fetch organization:", err);
                setError("Failed to load organization settings.");
            } finally {
                setLoading(false);
            }
        }

        fetchTenant();
    }, [sessionStatus, userRole, tenantId]);

    const handleSubmit = async (data: TenantFormData) => {
        if (!tenantId) throw new Error("No tenant ID");

        // Strip restricted fields client-side as defense in depth
        const { slug: _slug, isActive: _isActive, domain: _domain, defaultCurrency: _currency, defaultTimezone: _tz, ...safeData } = data;

        if (safeData.sections) {
            const { moduleSpeakers, moduleSponsors, moduleCertificates, moduleRegistrations, notifyRegistrations, notifyPayments, ...safeSections } = safeData.sections;
            safeData.sections = safeSections;
        }

        const response = await tenantsService.updateById(tenantId, safeData);
        if (!response.success) {
            const errorMessage =
                typeof response.error === "string"
                    ? response.error
                    : response.error?.message || "Failed to update organization";
            throw new Error(errorMessage);
        }
    };

    if (sessionStatus === "loading" || loading) {
        return (
            <DashboardLayout title="Organization" subtitle="Loading organization settings...">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Organization" subtitle="">
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                    <p className="text-destructive text-lg">{error}</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Organization" subtitle="Manage your organization settings">
            <TenantForm
                restrictedMode
                isEditing
                initialData={initialData}
                onSubmit={handleSubmit}
                slug={tenantSlug}
            />
        </DashboardLayout>
    );
}
