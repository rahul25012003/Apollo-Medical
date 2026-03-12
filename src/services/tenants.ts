/**
 * Tenants API Services
 */

import { api, ApiResponse } from "@/lib/api-client";

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  logo: string | null;
  favicon: string | null;
  secondaryLogo: string | null;
  tagline: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  website: string | null;
  mapUrl: string | null;
  businessHours: unknown | null;
  facebook: string | null;
  twitter: string | null;
  linkedin: string | null;
  instagram: string | null;
  youtube: string | null;
  sections: {
    hero: boolean;
    events: boolean;
    gallery: boolean;
    sponsors: boolean;
    testimonials: boolean;
    about: boolean;
    contact: boolean;
    faq?: boolean;
    ongoingResearch?: boolean;
    moduleSpeakers?: boolean;
    moduleSponsors?: boolean;
    moduleCertificates?: boolean;
    moduleRegistrations?: boolean;
    notifyRegistrations?: boolean;
    notifyPayments?: boolean;
  };
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroBgImage: string | null;
  aboutTitle: string | null;
  aboutDescription: string | null;
  aboutFeatures: unknown | null;
  galleryImages: unknown | null;
  galleryVideos: unknown | null;
  testimonials: unknown | null;
  yearlyStats: unknown | null;
  faqs: unknown | null;
  researchItems: unknown | null;
  footerText: string | null;
  copyrightText: string | null;
  isActive: boolean;
  defaultCurrency: string;
  defaultTimezone: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    events: number;
    users: number;
  };
}

export interface CreateTenantData {
  slug: string;
  name: string;
  domain?: string | null;
  logo?: string | null;
  favicon?: string | null;
  secondaryLogo?: string | null;
  tagline?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  website?: string | null;
  mapUrl?: string | null;
  businessHours?: unknown | null;
  facebook?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  sections?: {
    hero?: boolean;
    events?: boolean;
    gallery?: boolean;
    sponsors?: boolean;
    testimonials?: boolean;
    about?: boolean;
    contact?: boolean;
    moduleSpeakers?: boolean;
    moduleSponsors?: boolean;
    moduleCertificates?: boolean;
    moduleRegistrations?: boolean;
    notifyRegistrations?: boolean;
    notifyPayments?: boolean;
  };
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroBgImage?: string | null;
  aboutTitle?: string | null;
  aboutDescription?: string | null;
  aboutFeatures?: unknown | null;
  galleryImages?: unknown | null;
  galleryVideos?: unknown | null;
  testimonials?: unknown | null;
  yearlyStats?: unknown | null;
  faqs?: unknown | null;
  researchItems?: unknown | null;
  footerText?: string | null;
  copyrightText?: string | null;
  isActive?: boolean;
  defaultCurrency?: string;
  defaultTimezone?: string;
}

export const tenantsService = {
  getAll: () =>
    api.get<Tenant[]>("/api/tenants"),

  getById: (id: string) =>
    api.get<Tenant>(`/api/tenants/by-id/${id}`),

  updateById: (id: string, data: Partial<CreateTenantData>) =>
    api.put<Tenant>(`/api/tenants/by-id/${id}`, data),

  getBySlug: (slug: string) =>
    api.get<Tenant>(`/api/tenants/${slug}`),

  create: (data: CreateTenantData) =>
    api.post<Tenant>("/api/tenants", data),

  update: (slug: string, data: Partial<CreateTenantData>) =>
    api.put<Tenant>(`/api/tenants/${slug}`, data),

  delete: (slug: string) =>
    api.delete<{ slug: string }>(`/api/tenants/${slug}`),
};
