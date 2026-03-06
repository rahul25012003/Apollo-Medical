import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { dbToTenantConfig } from "@/lib/tenant";
import {
  successResponse,
  Errors,
  withErrorHandler,
} from "@/lib/api-utils";
import { z } from "zod";

// Validation schema for creating a tenant
const createTenantSchema = z.object({
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be less than 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
  name: z.string().min(2, "Name is required"),
  domain: z.string().optional().nullable(),
  logo: z.string().url().optional().nullable(),
  favicon: z.string().url().optional().nullable(),
  tagline: z.string().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  facebook: z.string().url().optional().nullable(),
  twitter: z.string().url().optional().nullable(),
  linkedin: z.string().url().optional().nullable(),
  instagram: z.string().url().optional().nullable(),
  youtube: z.string().url().optional().nullable(),
  sections: z.object({
    hero: z.boolean().optional(),
    events: z.boolean().optional(),
    gallery: z.boolean().optional(),
    sponsors: z.boolean().optional(),
    testimonials: z.boolean().optional(),
    about: z.boolean().optional(),
    contact: z.boolean().optional(),
    moduleSpeakers: z.boolean().optional(),
    moduleSponsors: z.boolean().optional(),
    moduleCertificates: z.boolean().optional(),
    moduleRegistrations: z.boolean().optional(),
    notifyRegistrations: z.boolean().optional(),
    notifyPayments: z.boolean().optional(),
  }).optional(),
  heroTitle: z.string().optional().nullable(),
  heroSubtitle: z.string().optional().nullable(),
  heroBgImage: z.string().url().optional().nullable(),
  aboutTitle: z.string().optional().nullable(),
  aboutDescription: z.string().optional().nullable(),
  aboutFeatures: z.array(z.object({
    icon: z.string(),
    title: z.string(),
    description: z.string(),
  })).optional().nullable(),
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
  testimonials: z.array(z.object({
    id: z.number(),
    name: z.string(),
    role: z.string(),
    avatar: z.string(),
    content: z.string(),
    rating: z.number().min(1).max(5),
  })).optional().nullable(),
  footerText: z.string().optional().nullable(),
  copyrightText: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  defaultCurrency: z.string().optional(),
  defaultTimezone: z.string().optional(),
});

// GET /api/tenants - List all tenants (admin only)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  // Only super admin can list all tenants
  if (session.user.role !== "SUPER_ADMIN") {
    return Errors.forbidden("Only administrators can view all tenants");
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          events: true,
          users: true,
        },
      },
    },
  });

  return successResponse(tenants);
});

// POST /api/tenants - Create a new tenant
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  // Only super admin can create tenants
  if (session.user.role !== "SUPER_ADMIN") {
    return Errors.forbidden("Only administrators can create tenants");
  }

  const body = await request.json();
  const validationResult = createTenantSchema.safeParse(body);

  if (!validationResult.success) {
    return Errors.badRequest(
      validationResult.error.issues.map((e) => e.message).join(", ")
    );
  }

  const data = validationResult.data;

  // Check if slug already exists
  const existingSlug = await prisma.tenant.findUnique({
    where: { slug: data.slug },
  });

  if (existingSlug) {
    return Errors.badRequest("A tenant with this slug already exists");
  }

  // Check if domain already exists
  if (data.domain) {
    const existingDomain = await prisma.tenant.findUnique({
      where: { domain: data.domain },
    });

    if (existingDomain) {
      return Errors.badRequest("A tenant with this domain already exists");
    }
  }

  // Create the tenant
  const tenant = await prisma.tenant.create({
    data: {
      slug: data.slug,
      name: data.name,
      domain: data.domain,
      logo: data.logo,
      favicon: data.favicon,
      tagline: data.tagline,
      primaryColor: data.primaryColor || "#0d9488",
      secondaryColor: data.secondaryColor || "#0891b2",
      accentColor: data.accentColor || "#10b981",
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      website: data.website,
      facebook: data.facebook,
      twitter: data.twitter,
      linkedin: data.linkedin,
      instagram: data.instagram,
      youtube: data.youtube,
      sections: data.sections || {
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
      heroTitle: data.heroTitle,
      heroSubtitle: data.heroSubtitle,
      heroBgImage: data.heroBgImage,
      aboutTitle: data.aboutTitle,
      aboutDescription: data.aboutDescription,
      aboutFeatures: data.aboutFeatures ?? undefined,
      galleryImages: data.galleryImages ?? undefined,
      galleryVideos: data.galleryVideos ?? undefined,
      testimonials: data.testimonials ?? undefined,
      footerText: data.footerText,
      copyrightText: data.copyrightText,
      isActive: data.isActive ?? true,
      defaultCurrency: data.defaultCurrency || "INR",
      defaultTimezone: data.defaultTimezone || "Asia/Kolkata",
    },
  });

  return successResponse(
    dbToTenantConfig(tenant as any),
    "Tenant created successfully",
    201
  );
});
