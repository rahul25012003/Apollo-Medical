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

type RouteContext = { params: Promise<{ id: string }> };

const sessionSpeakerSchema = z.object({
  speakerId: z.string(),
  talkTitle: z.string().optional().nullable(),
  talkDescription: z.string().optional().nullable(),
  talkDuration: z.number().int().positive().optional().nullable(),
  displayOrder: z.number().int().nonnegative().default(0),
});

// Validation schemas
const createSessionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  sessionType: z.string().default("OTHER"), // Dynamic session types from event config
  sessionDate: z.string().or(z.date()).optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
  hallId: z.string().optional().nullable(),
  sessionOrder: z.number().int().nonnegative().default(0),
  speakerId: z.string().optional().nullable(),
  sessionSpeakers: z.array(sessionSpeakerSchema).optional(),
  status: z.string().default("scheduled"),
  isPublished: z.boolean().default(true),
});

const updateSessionSchema = createSessionSchema.partial();

const sessionInclude = {
  speaker: {
    select: {
      id: true,
      name: true,
      designation: true,
      institution: true,
      photo: true,
    },
  },
  hall: {
    select: {
      id: true,
      name: true,
    },
  },
  sessionSpeakers: {
    include: {
      speaker: {
        select: {
          id: true,
          name: true,
          designation: true,
          institution: true,
          photo: true,
        },
      },
    },
    orderBy: { displayOrder: "asc" as const },
  },
};

// GET /api/events/[id]/sessions - Get event sessions (requires auth)
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to view sessions");
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

    const sessions = await prisma.eventSession.findMany({
      where: { eventId },
      include: sessionInclude,
      orderBy: [
        { sessionDate: "asc" },
        { sessionOrder: "asc" },
      ],
    });

    return successResponse(sessions);
  }
);

// POST /api/events/[id]/sessions - Create new session
export const POST = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage event sessions");
    }

    const { id: eventId } = await context!.params;

    // Check if event exists and verify tenant
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

    const parsed = createSessionSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const data = parsed.data;

    // If speakerId is provided, verify speaker exists and belongs to same tenant
    if (data.speakerId) {
      const speaker = await prisma.speaker.findFirst({
        where: { id: data.speakerId, tenantId: event.tenantId },
      });

      if (!speaker) {
        return Errors.notFound("Speaker");
      }
    }

    // Validate session speakers belong to same tenant
    if (data.sessionSpeakers && data.sessionSpeakers.length > 0) {
      const speakerIds = data.sessionSpeakers.map(sp => sp.speakerId);
      const validSpeakers = await prisma.speaker.findMany({
        where: { id: { in: speakerIds }, tenantId: event.tenantId },
        select: { id: true },
      });
      const validIds = new Set(validSpeakers.map(s => s.id));
      const invalidIds = speakerIds.filter(id => !validIds.has(id));
      if (invalidIds.length > 0) {
        return Errors.badRequest(`Invalid speaker IDs: ${invalidIds.join(", ")}`);
      }
    }

    // Create session with optional session speakers in a transaction
    const eventSession = await prisma.$transaction(async (tx) => {
      const created = await tx.eventSession.create({
        data: {
          eventId,
          title: data.title,
          description: data.description || null,
          sessionType: data.sessionType,
          sessionDate: data.sessionDate ? new Date(data.sessionDate) : null,
          startTime: data.startTime || null,
          endTime: data.endTime || null,
          venue: data.venue || null,
          hallId: data.hallId || null,
          sessionOrder: data.sessionOrder,
          speakerId: data.speakerId || null,
          status: data.status,
          isPublished: data.isPublished,
        },
      });

      // Create session speakers if provided
      if (data.sessionSpeakers && data.sessionSpeakers.length > 0) {
        await tx.sessionSpeaker.createMany({
          data: data.sessionSpeakers.map((sp) => ({
            sessionId: created.id,
            speakerId: sp.speakerId,
            talkTitle: sp.talkTitle || data.title, // Auto-fill from session title
            talkDescription: sp.talkDescription || null,
            talkDuration: sp.talkDuration || null,
            displayOrder: sp.displayOrder,
          })),
        });
      }

      return tx.eventSession.findUnique({
        where: { id: created.id },
        include: sessionInclude,
      });
    });

    return successResponse(eventSession, "Session created", 201);
  }
);

// PUT /api/events/[id]/sessions - Update session
export const PUT = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage event sessions");
    }

    const { id: eventId } = await context!.params;

    // Verify tenant ownership
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

    if (!body || !body.sessionId || typeof body.sessionId !== "string") {
      return Errors.badRequest("Session ID is required");
    }

    const sessionId = body.sessionId;
    const { sessionId: _, ...updateData } = body;

    // Check if session exists and belongs to this event
    const existing = await prisma.eventSession.findFirst({
      where: {
        id: sessionId,
        eventId,
      },
    });

    if (!existing) {
      return Errors.notFound("Session");
    }

    const parsed = updateSessionSchema.safeParse(updateData);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const data = parsed.data;

    // If speakerId is being updated, verify speaker exists and belongs to same tenant
    if (data.speakerId) {
      const speaker = await prisma.speaker.findFirst({
        where: { id: data.speakerId, tenantId: event.tenantId },
      });

      if (!speaker) {
        return Errors.notFound("Speaker");
      }
    }

    // Validate session speakers belong to same tenant
    if (data.sessionSpeakers && data.sessionSpeakers.length > 0) {
      const speakerIds = data.sessionSpeakers.map(sp => sp.speakerId);
      const validSpeakers = await prisma.speaker.findMany({
        where: { id: { in: speakerIds }, tenantId: event.tenantId },
        select: { id: true },
      });
      const validIds = new Set(validSpeakers.map(s => s.id));
      const invalidIds = speakerIds.filter(id => !validIds.has(id));
      if (invalidIds.length > 0) {
        return Errors.badRequest(`Invalid speaker IDs: ${invalidIds.join(", ")}`);
      }
    }

    // Build update data
    const updateFields: Record<string, unknown> = {};

    if (data.title !== undefined) updateFields.title = data.title;
    if (data.description !== undefined) updateFields.description = data.description || null;
    if (data.sessionType !== undefined) updateFields.sessionType = data.sessionType;
    if (data.sessionDate !== undefined) updateFields.sessionDate = data.sessionDate ? new Date(data.sessionDate) : null;
    if (data.startTime !== undefined) updateFields.startTime = data.startTime || null;
    if (data.endTime !== undefined) updateFields.endTime = data.endTime || null;
    if (data.venue !== undefined) updateFields.venue = data.venue || null;
    if (data.hallId !== undefined) updateFields.hallId = data.hallId || null;
    if (data.sessionOrder !== undefined) updateFields.sessionOrder = data.sessionOrder;
    if (data.speakerId !== undefined) updateFields.speakerId = data.speakerId || null;
    if (data.status !== undefined) updateFields.status = data.status;
    if (data.isPublished !== undefined) updateFields.isPublished = data.isPublished;

    // Update session and replace session speakers in a transaction
    const eventSession = await prisma.$transaction(async (tx) => {
      await tx.eventSession.update({
        where: { id: sessionId },
        data: updateFields,
      });

      // If sessionSpeakers is provided, replace them
      if (data.sessionSpeakers !== undefined) {
        await tx.sessionSpeaker.deleteMany({
          where: { sessionId },
        });

        if (data.sessionSpeakers && data.sessionSpeakers.length > 0) {
          // Use the updated title if provided, otherwise fall back to existing session title
          const sessionTitle = data.title || existing.title;
          await tx.sessionSpeaker.createMany({
            data: data.sessionSpeakers.map((sp) => ({
              sessionId,
              speakerId: sp.speakerId,
              talkTitle: sp.talkTitle || sessionTitle, // Auto-fill from session title
              talkDescription: sp.talkDescription || null,
              talkDuration: sp.talkDuration || null,
              displayOrder: sp.displayOrder,
            })),
          });
        }
      }

      return tx.eventSession.findUnique({
        where: { id: sessionId },
        include: sessionInclude,
      });
    });

    return successResponse(eventSession, "Session updated");
  }
);

// DELETE /api/events/[id]/sessions - Delete session
export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage event sessions");
    }

    const { id: eventId } = await context!.params;

    // Verify tenant ownership
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
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return Errors.badRequest("Session ID is required");
    }

    // Check if session exists and belongs to this event
    const existing = await prisma.eventSession.findFirst({
      where: {
        id: sessionId,
        eventId,
      },
    });

    if (!existing) {
      return Errors.notFound("Session");
    }

    // Cascade delete handles sessionSpeakers
    await prisma.eventSession.delete({
      where: { id: sessionId },
    });

    return successResponse({ id: sessionId }, "Session deleted");
  }
);
