import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { dbToTenantConfig, TenantModel } from "@/lib/tenant";
import {
  successResponse,
  Errors,
  withErrorHandler,
} from "@/lib/api-utils";
import { z } from "zod";

type RouteContext = { params: Promise<{ slug: string }> };

// Validation schema for updating a tenant
const updateTenantSchema = z.object({
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens").optional(),
  name: z.string().min(2).optional(),
  domain: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  favicon: z.string().optional().nullable(),
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
  heroBgImage: z.string().optional().nullable(),
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

// GET /api/tenants/[slug] - Get tenant config by slug (public)
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const { slug } = await context!.params;

    // Try to find by slug first
    let tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    // If not found by slug, try domain
    if (!tenant) {
      tenant = await prisma.tenant.findUnique({
        where: { domain: slug },
      });
    }

    if (!tenant) {
      return Errors.notFound("Tenant");
    }

    // Return only active tenants for public access
    if (!tenant.isActive) {
      // Check if user is admin
      const session = await auth();
      if (!session || session.user.role !== "SUPER_ADMIN") {
        return Errors.notFound("Tenant");
      }
    }

    return successResponse(dbToTenantConfig(tenant as TenantModel));
  }
);

// PUT /api/tenants/[slug] - Update tenant config
export const PUT = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    // Only super admin can update tenants
    if (session.user.role !== "SUPER_ADMIN") {
      return Errors.forbidden("Only administrators can update tenants");
    }

    const { slug } = await context!.params;
    const body = await request.json();
    const validationResult = updateTenantSchema.safeParse(body);

    if (!validationResult.success) {
      return Errors.badRequest(
        validationResult.error.issues.map((e) => e.message).join(", ")
      );
    }

    const data = validationResult.data;

    // Check if tenant exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!existingTenant) {
      return Errors.notFound("Tenant");
    }

    // Check if new slug conflicts with existing
    if (data.slug && data.slug !== existingTenant.slug) {
      const existingSlug = await prisma.tenant.findUnique({
        where: { slug: data.slug },
      });

      if (existingSlug) {
        return Errors.badRequest("A tenant with this slug already exists");
      }
    }

    // Check if new domain conflicts with existing
    if (data.domain && data.domain !== existingTenant.domain) {
      const existingDomain = await prisma.tenant.findUnique({
        where: { domain: data.domain },
      });

      if (existingDomain) {
        return Errors.badRequest("A tenant with this domain already exists");
      }
    }

    // Prepare update data, converting null to undefined for JSON fields
    const updateData: any = { ...data };
    if (data.aboutFeatures === null) updateData.aboutFeatures = undefined;
    if (data.galleryImages === null) updateData.galleryImages = undefined;
    if (data.galleryVideos === null) updateData.galleryVideos = undefined;
    if (data.testimonials === null) updateData.testimonials = undefined;

    // Merge sections if provided
    if (data.sections) {
      updateData.sections = { ...(existingTenant.sections as object), ...data.sections };
    }

    // Update the tenant
    const tenant = await prisma.tenant.update({
      where: { slug },
      data: updateData,
    });

    return successResponse(
      dbToTenantConfig(tenant as TenantModel),
      "Tenant updated successfully"
    );
  }
);

// DELETE /api/tenants/[slug] - Delete a tenant
export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    // Only super admin can delete tenants
    if (session.user.role !== "SUPER_ADMIN") {
      return Errors.forbidden("Only administrators can delete tenants");
    }

    const { slug } = await context!.params;

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            events: true,
            users: true,
          },
        },
      },
    });

    if (!tenant) {
      return Errors.notFound("Tenant");
    }

    // Prevent deletion if tenant has events or users
    if (tenant._count.events > 0 || tenant._count.users > 0) {
      return Errors.badRequest(
        `Cannot delete tenant with ${tenant._count.events} events and ${tenant._count.users} users. Please reassign or delete them first.`
      );
    }

    await prisma.tenant.delete({
      where: { slug },
    });

    return successResponse({ slug }, "Tenant deleted successfully");
  }
);
