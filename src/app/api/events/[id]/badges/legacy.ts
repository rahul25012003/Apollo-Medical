import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { isTenantOwner } from "@/lib/tenant-scope";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";
import { z } from "zod";
import { Prisma, RegistrationStatus } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

const DEFAULT_BADGE_CATEGORIES = [
  { id: "delegate", label: "Delegate", color: "#0d9488", bgColor: "#f0fdfa", borderColor: "#99f6e4" },
  { id: "speaker", label: "Speaker", color: "#2563eb", bgColor: "#eff6ff", borderColor: "#93c5fd" },
  { id: "organizer", label: "Organizer", color: "#7c3aed", bgColor: "#f5f3ff", borderColor: "#c4b5fd" },
  { id: "vip", label: "VIP", color: "#d97706", bgColor: "#fffbeb", borderColor: "#fcd34d" },
  { id: "committee", label: "Committee", color: "#dc2626", bgColor: "#fef2f2", borderColor: "#fca5a5" },
];

const generateBadgesSchema = z.object({
  registrationIds: z.array(z.string()).optional(),
});

// GET /api/events/[id]/badges - Get registrations with badge status + settings + categories
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to view badges");
    }

    const { id: eventId } = await context!.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        tenantId: true,
        idCardRequirePhoto: true,
        idCardSingleSided: true,
        badgeCategories: true,
      },
    });

    if (!event) {
      return Errors.notFound("Event");
    }

    if (!isTenantOwner(session, event.tenantId)) {
      return Errors.forbidden("You don't have access to this event");
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Prisma.RegistrationWhereInput = { eventId };
    if (status) {
      where.status = status as RegistrationStatus;
    }

    const registrations = await prisma.registration.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        organization: true,
        designation: true,
        category: true,
        participantRole: true,
        qrCode: true,
        badgeGenerated: true,
        status: true,
        paymentStatus: true,
        photo: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({
      registrations,
      settings: {
        requirePhoto: event.idCardRequirePhoto ?? false,
        singleSided: event.idCardSingleSided ?? true,
      },
      badgeCategories: (event.badgeCategories as unknown[]) || DEFAULT_BADGE_CATEGORIES,
    });
  }
);

// POST /api/events/[id]/badges - Generate QR codes for registrations
export const POST = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to generate badges");
    }

    const { id: eventId } = await context!.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, tenantId: true },
    });

    if (!event) {
      return Errors.notFound("Event");
    }

    if (!isTenantOwner(session, event.tenantId)) {
      return Errors.forbidden("You don't have access to this event");
    }

    const body = await parseBody(request);

    if (!body) {
      return Errors.badRequest("Invalid request body");
    }

    const parsed = generateBadgesSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const { registrationIds } = parsed.data;

    // Build where clause
    const where: Prisma.RegistrationWhereInput = { eventId };

    if (registrationIds && registrationIds.length > 0) {
      where.id = { in: registrationIds };
    } else {
      // Generate for all confirmed registrations without QR code
      where.status = "CONFIRMED" as RegistrationStatus;
      where.qrCode = null;
    }

    const registrations = await prisma.registration.findMany({
      where,
      select: { id: true },
    });

    if (registrations.length === 0) {
      return successResponse([], "No registrations to generate badges for");
    }

    // Update each registration with QR code
    const updated = [];
    for (const reg of registrations) {
      const result = await prisma.registration.update({
        where: { id: reg.id },
        data: {
          qrCode: `ICMS:${reg.id}`,
          badgeGenerated: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          organization: true,
          designation: true,
          category: true,
          participantRole: true,
          qrCode: true,
          badgeGenerated: true,
          status: true,
          paymentStatus: true,
          photo: true,
        },
      });
      updated.push(result);
    }

    return successResponse(updated, `Generated badges for ${updated.length} registrations`);
  }
);

// PATCH /api/events/[id]/badges - Update ID card settings + badge categories
const settingsSchema = z.object({
  requirePhoto: z.boolean().optional(),
  singleSided: z.boolean().optional(),
  badgeCategories: z.array(z.object({
    id: z.string(),
    label: z.string(),
    color: z.string(),
    bgColor: z.string(),
    borderColor: z.string(),
  })).optional(),
});

export const PATCH = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();
    if (!session) return Errors.unauthorized();
    if (!canAccess(session.user.role, "events")) return Errors.forbidden("No permission");

    const { id: eventId } = await context!.params;
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, tenantId: true },
    });
    if (!event) return Errors.notFound("Event");
    if (!isTenantOwner(session, event.tenantId)) return Errors.forbidden("No access");

    const body = await parseBody(request);
    if (!body) return Errors.badRequest("Invalid body");

    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) return Errors.validationError(parsed.error);

    const updateData: Record<string, unknown> = {};
    if (parsed.data.requirePhoto !== undefined) updateData.idCardRequirePhoto = parsed.data.requirePhoto;
    if (parsed.data.singleSided !== undefined) updateData.idCardSingleSided = parsed.data.singleSided;
    if (parsed.data.badgeCategories !== undefined) updateData.badgeCategories = parsed.data.badgeCategories;

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      select: {
        idCardRequirePhoto: true,
        idCardSingleSided: true,
        badgeCategories: true,
      },
    });

    return successResponse({
      requirePhoto: updated.idCardRequirePhoto,
      singleSided: updated.idCardSingleSided,
      badgeCategories: updated.badgeCategories || DEFAULT_BADGE_CATEGORIES,
    }, "Settings updated");
  }
);
