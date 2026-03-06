import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { updateSpeakerSchema } from "@/lib/validations/speaker";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/speakers/[id] - Get single speaker
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    const { id } = await context!.params;

    const speaker = await prisma.speaker.findUnique({
      where: { id },
      include: {
        eventSpeakers: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                slug: true,
                startDate: true,
                endDate: true,
                status: true,
              },
            },
          },
          orderBy: {
            event: { startDate: "desc" },
          },
        },
      },
    });

    if (!speaker) {
      return Errors.notFound("Speaker");
    }

    return successResponse(speaker);
  }
);

// PUT /api/speakers/[id] - Update speaker
export const PUT = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "speakers")) {
      return Errors.forbidden("You don't have permission to update speakers");
    }

    const { id } = await context!.params;

    // Check if speaker exists
    const existingSpeaker = await prisma.speaker.findUnique({
      where: { id },
    });

    if (!existingSpeaker) {
      return Errors.notFound("Speaker");
    }

    const body = await parseBody(request);

    if (!body) {
      return Errors.badRequest("Invalid request body");
    }

    const parsed = updateSpeakerSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const data = parsed.data;

    // If email is being changed, check for duplicates
    if (data.email && data.email.toLowerCase() !== existingSpeaker.email) {
      const emailExists = await prisma.speaker.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (emailExists) {
        return Errors.conflict("A speaker with this email already exists");
      }
    }

    const speaker = await prisma.speaker.update({
      where: { id },
      data: {
        ...data,
        email: data.email ? data.email.toLowerCase() : undefined,
      },
    });

    return successResponse(speaker, "Speaker updated successfully");
  }
);

// DELETE /api/speakers/[id] - Delete speaker
export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "speakers")) {
      return Errors.forbidden("You don't have permission to delete speakers");
    }

    const { id } = await context!.params;

    // Check if speaker exists
    const existingSpeaker = await prisma.speaker.findUnique({
      where: { id },
      include: {
        _count: {
          select: { eventSpeakers: true },
        },
      },
    });

    if (!existingSpeaker) {
      return Errors.notFound("Speaker");
    }

    // Check if speaker has event assignments
    if (existingSpeaker._count.eventSpeakers > 0) {
      return Errors.badRequest(
        "Cannot delete speaker with event assignments. Remove from events first."
      );
    }

    await prisma.speaker.delete({
      where: { id },
    });

    return successResponse({ id }, "Speaker deleted successfully");
  }
);
