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
import { isIfpcTenantId } from "@/lib/ifpc-tenant";

type RouteContext = { params: Promise<{ id: string }> };

// In-app notification for every confirmed delegate when an admin posts (or
// activates) an announcement. IFPC (apollo-medical) only, so no other
// tenant's attendees start seeing bell notifications they didn't before.
async function notifyDelegatesOfAnnouncement(eventId: string, tenantId: string, title: string, message: string) {
  if (!(await isIfpcTenantId(tenantId))) return;
  try {
    const registrants = await prisma.registration.findMany({
      where: { eventId, status: { in: ["CONFIRMED", "ATTENDED"] }, userId: { not: null } },
      select: { userId: true },
      distinct: ["userId"],
    });
    if (registrants.length === 0) return;
    await prisma.notification.createMany({
      data: registrants.map((r) => ({
        type: "GENERAL" as const,
        title,
        message,
        userId: r.userId!,
        tenantId,
      })),
    });
  } catch (err) {
    console.error("[engagements] delegate notification failed:", err);
  }
}

const createEngagementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["POLL", "QA", "FEEDBACK", "ANNOUNCEMENT", "QUIZ"]),
  description: z.string().optional().nullable(),
  content: z.any().optional().nullable(),
  isActive: z.boolean().default(false),
  displayOrder: z.number().int().nonnegative().default(0),
  sessionId: z.string().optional().nullable(),
});

const updateEngagementSchema = createEngagementSchema.partial();

// GET /api/events/[id]/engagements - Get event engagements (requires auth)
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to view engagements");
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

    // Optional sessionId filter
    const { searchParams } = new URL(request.url);
    const sessionIdFilter = searchParams.get("sessionId");

    const engagements = await prisma.eventEngagement.findMany({
      where: {
        eventId,
        ...(sessionIdFilter ? { sessionId: sessionIdFilter } : {}),
      },
      include: {
        session: {
          select: { id: true, title: true, sessionType: true },
        },
      },
      orderBy: { displayOrder: "asc" },
    });

    return successResponse(engagements);
  }
);

// POST /api/events/[id]/engagements - Create engagement
export const POST = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage engagements");
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

    const parsed = createEngagementSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const data = parsed.data;

    const engagement = await prisma.eventEngagement.create({
      data: {
        eventId,
        title: data.title,
        type: data.type,
        description: data.description || null,
        content: data.content || null,
        isActive: data.isActive,
        displayOrder: data.displayOrder,
        sessionId: data.sessionId || null,
      },
    });

    if (engagement.type === "ANNOUNCEMENT" && engagement.isActive && event.tenantId) {
      await notifyDelegatesOfAnnouncement(eventId, event.tenantId, engagement.title, engagement.description || engagement.title);
    }

    return successResponse(engagement, "Engagement created", 201);
  }
);

// PUT /api/events/[id]/engagements - Update engagement
export const PUT = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage engagements");
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

    if (!body || !body.engagementId || typeof body.engagementId !== "string") {
      return Errors.badRequest("Engagement ID is required");
    }

    const engagementId = body.engagementId;
    const { engagementId: _, ...updateData } = body;

    const existing = await prisma.eventEngagement.findFirst({
      where: { id: engagementId, eventId },
    });

    if (!existing) {
      return Errors.notFound("Engagement");
    }

    const parsed = updateEngagementSchema.safeParse(updateData);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const data = parsed.data;
    const updateFields: Record<string, unknown> = {};

    if (data.title !== undefined) updateFields.title = data.title;
    if (data.type !== undefined) updateFields.type = data.type;
    if (data.description !== undefined) updateFields.description = data.description || null;
    if (data.content !== undefined) updateFields.content = data.content || null;
    if (data.isActive !== undefined) updateFields.isActive = data.isActive;
    if (data.displayOrder !== undefined) updateFields.displayOrder = data.displayOrder;
    if (data.sessionId !== undefined) updateFields.sessionId = data.sessionId || null;

    const engagement = await prisma.eventEngagement.update({
      where: { id: engagementId },
      data: updateFields,
    });

    // Notify only on the transition to active, not every subsequent edit.
    if (engagement.type === "ANNOUNCEMENT" && engagement.isActive && !existing.isActive && event.tenantId) {
      await notifyDelegatesOfAnnouncement(eventId, event.tenantId, engagement.title, engagement.description || engagement.title);
    }

    return successResponse(engagement, "Engagement updated");
  }
);

// DELETE /api/events/[id]/engagements - Delete engagement
export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage engagements");
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

    const { searchParams } = new URL(request.url);
    const engagementId = searchParams.get("engagementId");

    if (!engagementId) {
      return Errors.badRequest("Engagement ID is required");
    }

    const existing = await prisma.eventEngagement.findFirst({
      where: { id: engagementId, eventId },
    });

    if (!existing) {
      return Errors.notFound("Engagement");
    }

    await prisma.eventEngagement.delete({
      where: { id: engagementId },
    });

    return successResponse({ id: engagementId }, "Engagement deleted");
  }
);
