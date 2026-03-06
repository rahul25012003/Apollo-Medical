import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { eventSpeakerSchema, updateEventSpeakerSchema } from "@/lib/validations/speaker";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/events/[id]/speakers - Get event speakers
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

    const speakers = await prisma.eventSpeaker.findMany({
      where: { eventId },
      include: {
        speaker: true,
      },
      orderBy: { sessionOrder: "asc" },
    });

    return successResponse(speakers);
  }
);

// POST /api/events/[id]/speakers - Add speaker to event
export const POST = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage event speakers");
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

    // Override eventId from URL
    const dataWithEventId = { ...body, eventId };
    const parsed = eventSpeakerSchema.safeParse(dataWithEventId);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const data = parsed.data;

    // Check if speaker exists
    const speaker = await prisma.speaker.findUnique({
      where: { id: data.speakerId },
    });

    if (!speaker) {
      return Errors.notFound("Speaker");
    }

    // Check if speaker is already assigned to this event
    const existing = await prisma.eventSpeaker.findUnique({
      where: {
        eventId_speakerId: {
          eventId,
          speakerId: data.speakerId,
        },
      },
    });

    if (existing) {
      return Errors.conflict("Speaker is already assigned to this event");
    }

    const eventSpeaker = await prisma.eventSpeaker.create({
      data: {
        ...data,
        sessionDate: data.sessionDate ? new Date(data.sessionDate) : null,
      },
      include: {
        speaker: true,
      },
    });

    return successResponse(eventSpeaker, "Speaker added to event", 201);
  }
);

// PUT /api/events/[id]/speakers - Update event speaker assignment
export const PUT = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage event speakers");
    }

    const { id: eventId } = await context!.params;

    const body = await parseBody(request);

    if (!body || !body.speakerId || typeof body.speakerId !== "string") {
      return Errors.badRequest("Speaker ID is required");
    }

    const speakerId = body.speakerId;
    const { speakerId: _, ...updateData } = body;

    // Check if assignment exists
    const existing = await prisma.eventSpeaker.findUnique({
      where: {
        eventId_speakerId: {
          eventId,
          speakerId,
        },
      },
    });

    if (!existing) {
      return Errors.notFound("Speaker assignment");
    }

    const parsed = updateEventSpeakerSchema.safeParse(updateData);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const data = parsed.data;

    // Build update data, converting empty strings to null
    const updateFields: Record<string, unknown> = {};

    if (data.topic !== undefined) {
      updateFields.topic = data.topic || null;
    }
    if (data.sessionDescription !== undefined) {
      updateFields.sessionDescription = data.sessionDescription || null;
    }
    if (data.sessionDate !== undefined) {
      updateFields.sessionDate = data.sessionDate ? new Date(data.sessionDate) : null;
    }
    if (data.sessionTime !== undefined) {
      updateFields.sessionTime = data.sessionTime || null;
    }
    if (data.sessionEndTime !== undefined) {
      updateFields.sessionEndTime = data.sessionEndTime || null;
    }
    if (data.sessionVenue !== undefined) {
      updateFields.sessionVenue = data.sessionVenue || null;
    }
    if (data.sessionOrder !== undefined) {
      updateFields.sessionOrder = data.sessionOrder;
    }
    if (data.status !== undefined) {
      updateFields.status = data.status;
    }
    if (data.isPublished !== undefined) {
      updateFields.isPublished = data.isPublished;
    }

    const eventSpeaker = await prisma.eventSpeaker.update({
      where: {
        eventId_speakerId: {
          eventId,
          speakerId,
        },
      },
      data: updateFields,
      include: {
        speaker: true,
      },
    });

    return successResponse(eventSpeaker, "Speaker assignment updated");
  }
);

// DELETE /api/events/[id]/speakers - Remove speaker from event
export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage event speakers");
    }

    const { id: eventId } = await context!.params;
    const { searchParams } = new URL(request.url);
    const speakerId = searchParams.get("speakerId");

    if (!speakerId) {
      return Errors.badRequest("Speaker ID is required");
    }

    // Check if assignment exists
    const existing = await prisma.eventSpeaker.findUnique({
      where: {
        eventId_speakerId: {
          eventId,
          speakerId,
        },
      },
    });

    if (!existing) {
      return Errors.notFound("Speaker assignment");
    }

    await prisma.eventSpeaker.delete({
      where: {
        eventId_speakerId: {
          eventId,
          speakerId,
        },
      },
    });

    return successResponse({ eventId, speakerId }, "Speaker removed from event");
  }
);
