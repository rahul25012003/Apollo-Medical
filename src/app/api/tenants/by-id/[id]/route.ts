import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/tenants/by-id/[id] - Get tenant by ID (authenticated users only)
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    const { id } = await context!.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      return Errors.notFound("Tenant");
    }

    return successResponse(tenant);
  }
);

// PUT /api/tenants/by-id/[id] - Update tenant by ID (SUPER_ADMIN or own-tenant ADMIN)
export const PUT = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    const { id } = await context!.params;

    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    const isOwnTenantAdmin =
      session.user.role === "ADMIN" &&
      (session.user as any).tenantId === id;

    if (!isSuperAdmin && !isOwnTenantAdmin) {
      return Errors.forbidden(
        "You do not have permission to update this tenant"
      );
    }

    const body = await parseBody(request);

    if (!body) {
      return Errors.badRequest("Invalid request body");
    }

    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) {
      return Errors.notFound("Tenant");
    }

    // Strip restricted fields for non-SUPER_ADMIN
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bodyAny = body as Record<string, any>;
    if (!isSuperAdmin) {
      delete bodyAny.slug;
      delete bodyAny.isActive;
      delete bodyAny.domain;
      delete bodyAny.defaultCurrency;
      delete bodyAny.defaultTimezone;
      // Payment fields are super admin only
      delete bodyAny.paymentMode;
      delete bodyAny.razorpayKeyId;
      delete bodyAny.razorpayKeySecret;
      delete bodyAny.paymentQrCode;
      delete bodyAny.paymentUpiId;
      delete bodyAny.paymentInstructions;
      if (bodyAny.sections) {
        delete bodyAny.sections.moduleSpeakers;
        delete bodyAny.sections.moduleSponsors;
        delete bodyAny.sections.moduleCertificates;
        delete bodyAny.sections.moduleRegistrations;
        delete bodyAny.sections.notifyRegistrations;
        delete bodyAny.sections.notifyPayments;
      }
    }

    // Whitelist only known Prisma fields to avoid unknown field errors
    const allowedFields = [
      "name", "tagline", "logo", "favicon", "secondaryLogo",
      "primaryColor", "secondaryColor", "accentColor",
      "email", "phone", "address", "city", "state", "country", "website", "mapUrl", "businessHours",
      "facebook", "twitter", "linkedin", "instagram", "youtube",
      "sections", "heroTitle", "heroSubtitle", "heroBgImage",
      "aboutTitle", "aboutDescription", "aboutFeatures", "aboutImages",
      "galleryImages", "galleryVideos", "testimonials",
      "yearlyStats", "faqs", "researchItems",
      "footerText", "copyrightText",
      // Admin-only fields (already stripped for non-super-admins above)
      "slug", "isActive", "domain", "defaultCurrency", "defaultTimezone",
      // Payment fields (super admin only)
      "paymentMode", "razorpayKeyId", "razorpayKeySecret",
      "paymentQrCode", "paymentUpiId", "paymentInstructions",
    ];

    const updateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in bodyAny) {
        updateData[key] = bodyAny[key];
      }
    }

    // Merge sections with existing to avoid overwriting unset keys
    if (updateData.sections && existing.sections) {
      updateData.sections = {
        ...(existing.sections as object),
        ...(updateData.sections as object),
      };
    }

    try {
      const tenant = await prisma.tenant.update({
        where: { id },
        data: updateData,
      });

      return successResponse(tenant, "Tenant updated successfully");
    } catch (prismaError: unknown) {
      console.error("Prisma update error for tenant:", id);
      throw prismaError;
    }
  }
);
