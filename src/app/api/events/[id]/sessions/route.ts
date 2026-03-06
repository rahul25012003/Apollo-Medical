import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

// Validation schemas
const createSessionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  sessionDate: z.string().or(z.date()).optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
  sessionOrder: z.number().int().nonnegative().default(0),
  speakerId: z.string().optional().nullable(),
  status: z.string().default("scheduled"),
  isPublished: z.boolean().default(true),
});

const updateSessionSchema = createSessionSchema.partial();

// GET /api/events/[id]/sessions - Get event sessions
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const { id: eventId } = await context!.params;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    if (!event) {
      return Errors.notFound("Event");
    }

    const sessions = await prisma.eventSession.findMany({
      where: { eventId },
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

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    if (!event) {
      return Errors.notFound("Event");
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

    // If speakerId is provided, verify speaker exists
    if (data.speakerId) {
      const speaker = await prisma.speaker.findUnique({
        where: { id: data.speakerId },
      });

      if (!speaker) {
        return Errors.notFound("Speaker");
      }
    }

    const eventSession = await prisma.eventSession.create({
      data: {
        eventId,
        title: data.title,
        description: data.description || null,
        sessionDate: data.sessionDate ? new Date(data.sessionDate) : null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        venue: data.venue || null,
        sessionOrder: data.sessionOrder,
        speakerId: data.speakerId || null,
        status: data.status,
        isPublished: data.isPublished,
      },
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

    // If speakerId is being updated, verify speaker exists
    if (data.speakerId) {
      const speaker = await prisma.speaker.findUnique({
        where: { id: data.speakerId },
      });

      if (!speaker) {
        return Errors.notFound("Speaker");
      }
    }

    // Build update data
    const updateFields: Record<string, unknown> = {};

    if (data.title !== undefined) {
      updateFields.title = data.title;
    }
    if (data.description !== undefined) {
      updateFields.description = data.description || null;
    }
    if (data.sessionDate !== undefined) {
      updateFields.sessionDate = data.sessionDate ? new Date(data.sessionDate) : null;
    }
    if (data.startTime !== undefined) {
      updateFields.startTime = data.startTime || null;
    }
    if (data.endTime !== undefined) {
      updateFields.endTime = data.endTime || null;
    }
    if (data.venue !== undefined) {
      updateFields.venue = data.venue || null;
    }
    if (data.sessionOrder !== undefined) {
      updateFields.sessionOrder = data.sessionOrder;
    }
    if (data.speakerId !== undefined) {
      updateFields.speakerId = data.speakerId || null;
    }
    if (data.status !== undefined) {
      updateFields.status = data.status;
    }
    if (data.isPublished !== undefined) {
      updateFields.isPublished = data.isPublished;
    }

    const eventSession = await prisma.eventSession.update({
      where: { id: sessionId },
      data: updateFields,
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

    await prisma.eventSession.delete({
      where: { id: sessionId },
    });

    return successResponse({ id: sessionId }, "Session deleted");
  }
);
