import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { eventSponsorSchema, updateEventSponsorSchema } from "@/lib/validations/sponsor";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/events/[id]/sponsors - Get event sponsors
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

    const sponsors = await prisma.eventSponsor.findMany({
      where: { eventId },
      include: {
        sponsor: true,
      },
      orderBy: [{ tier: "asc" }, { displayOrder: "asc" }],
    });

    return successResponse(sponsors);
  }
);

// POST /api/events/[id]/sponsors - Add sponsor to event
export const POST = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage event sponsors");
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

    // Debug log
    console.log("Adding sponsor to event:", JSON.stringify(dataWithEventId, null, 2));

    const parsed = eventSponsorSchema.safeParse(dataWithEventId);

    if (!parsed.success) {
      console.log("Validation error:", parsed.error.issues);
      return Errors.validationError(parsed.error);
    }

    const data = parsed.data;

    // Check if sponsor exists
    const sponsor = await prisma.sponsor.findUnique({
      where: { id: data.sponsorId },
    });

    if (!sponsor) {
      return Errors.notFound("Sponsor");
    }

    // Check if sponsor is already assigned to this event
    const existing = await prisma.eventSponsor.findUnique({
      where: {
        eventId_sponsorId: {
          eventId,
          sponsorId: data.sponsorId,
        },
      },
    });

    if (existing) {
      return Errors.conflict("Sponsor is already assigned to this event");
    }

    const eventSponsor = await prisma.eventSponsor.create({
      data,
      include: {
        sponsor: true,
      },
    });

    return successResponse(eventSponsor, "Sponsor added to event", 201);
  }
);

// PUT /api/events/[id]/sponsors - Update event sponsor assignment
export const PUT = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage event sponsors");
    }

    const { id: eventId } = await context!.params;

    const body = await parseBody(request);

    if (!body || !body.sponsorId || typeof body.sponsorId !== "string") {
      return Errors.badRequest("Sponsor ID is required");
    }

    const sponsorId = body.sponsorId;
    const { sponsorId: _, ...updateData } = body;

    // Check if assignment exists
    const existing = await prisma.eventSponsor.findUnique({
      where: {
        eventId_sponsorId: {
          eventId,
          sponsorId,
        },
      },
    });

    if (!existing) {
      return Errors.notFound("Sponsor assignment");
    }

    const parsed = updateEventSponsorSchema.safeParse(updateData);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const updatedEventSponsor = await prisma.eventSponsor.update({
      where: {
        eventId_sponsorId: {
          eventId,
          sponsorId,
        },
      },
      data: parsed.data,
      include: {
        sponsor: true,
      },
    });

    return successResponse(updatedEventSponsor, "Sponsor assignment updated");
  }
);

// DELETE /api/events/[id]/sponsors - Remove sponsor from event
export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to manage event sponsors");
    }

    const { id: eventId } = await context!.params;
    const { searchParams } = new URL(request.url);
    const sponsorId = searchParams.get("sponsorId");

    if (!sponsorId) {
      return Errors.badRequest("Sponsor ID is required");
    }

    // Check if assignment exists
    const existing = await prisma.eventSponsor.findUnique({
      where: {
        eventId_sponsorId: {
          eventId,
          sponsorId,
        },
      },
    });

    if (!existing) {
      return Errors.notFound("Sponsor assignment");
    }

    await prisma.eventSponsor.delete({
      where: {
        eventId_sponsorId: {
          eventId,
          sponsorId,
        },
      },
    });

    return successResponse({ eventId, sponsorId }, "Sponsor removed from event");
  }
);
