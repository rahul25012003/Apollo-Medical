// Client-side validation schema for tenant forms
import { z } from "zod";

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
const slugRegex = /^[a-z0-9-]+$/;

export const tenantFormSchema = z.object({
  // Basic Info
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be less than 50 characters")
    .regex(slugRegex, "Slug can only contain lowercase letters, numbers, and hyphens"),
  name: z.string().min(2, "Name is required"),
  tagline: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  favicon: z.string().optional().nullable(),
  secondaryLogo: z.string().optional().nullable(),
  isActive: z.boolean().optional(),

  // Theme
  primaryColor: z.string().regex(hexColorRegex, "Invalid hex color").optional(),
  secondaryColor: z.string().regex(hexColorRegex, "Invalid hex color").optional(),
  accentColor: z.string().regex(hexColorRegex, "Invalid hex color").optional(),

  // Sections (frontpage + dashboard modules + notifications)
  sections: z.object({
    hero: z.boolean().optional(),
    events: z.boolean().optional(),
    gallery: z.boolean().optional(),
    sponsors: z.boolean().optional(),
    testimonials: z.boolean().optional(),
    about: z.boolean().optional(),
    contact: z.boolean().optional(),
    faq: z.boolean().optional(),
    ongoingResearch: z.boolean().optional(),
    moduleSpeakers: z.boolean().optional(),
    moduleSponsors: z.boolean().optional(),
    moduleCertificates: z.boolean().optional(),
    moduleRegistrations: z.boolean().optional(),
    notifyRegistrations: z.boolean().optional(),
    notifyPayments: z.boolean().optional(),
  }).optional(),

  // Hero Content
  heroTitle: z.string().optional().nullable(),
  heroSubtitle: z.string().optional().nullable(),
  heroBgImage: z.string().optional().nullable(),

  // About Content
  aboutTitle: z.string().optional().nullable(),
  aboutDescription: z.string().optional().nullable(),
  aboutFeatures: z.array(z.object({
    icon: z.string(),
    title: z.string(),
    description: z.string(),
  })).optional().nullable(),

  // Testimonials
  testimonials: z.array(z.object({
    id: z.number(),
    name: z.string(),
    role: z.string(),
    avatar: z.string(),
    content: z.string(),
    rating: z.number().min(1).max(5),
  })).optional().nullable(),

  // Gallery
  galleryImages: z.array(z.object({
    id: z.number(),
    src: z.string(),
    alt: z.string(),
    category: z.string(),
    event: z.string().optional(),
  })).optional().nullable(),
  galleryVideos: z.array(z.object({
    id: z.number(),
    thumbnail: z.string(),
    title: z.string(),
    category: z.string(),
    duration: z.string(),
    youtubeId: z.string(),
    event: z.string().optional(),
  })).optional().nullable(),

  // Yearly Stats
  yearlyStats: z.object({
    year: z.string(),
    events: z.string(),
    attendees: z.string(),
    speakers: z.string(),
  }).optional().nullable(),

  // FAQs
  faqs: z.array(z.object({
    id: z.number(),
    question: z.string(),
    answer: z.string(),
  })).optional().nullable(),

  // Ongoing Research
  researchItems: z.array(z.object({
    id: z.number(),
    icon: z.string(),
    title: z.string(),
    description: z.string(),
    status: z.string(),
  })).optional().nullable(),

  // Footer
  footerText: z.string().optional().nullable(),
  copyrightText: z.string().optional().nullable(),

  // Contact
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  website: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  mapUrl: z.string().optional().nullable(),
  businessHours: z.object({
    monFri: z.string(),
    sat: z.string(),
    sunHoliday: z.string(),
  }).optional().nullable(),

  // Social
  facebook: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  twitter: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  linkedin: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  instagram: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  youtube: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),

  // Settings
  domain: z.string().optional().nullable(),
  defaultCurrency: z.string().optional(),
  defaultTimezone: z.string().optional(),
});

export type TenantFormData = z.infer<typeof tenantFormSchema>;

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}
