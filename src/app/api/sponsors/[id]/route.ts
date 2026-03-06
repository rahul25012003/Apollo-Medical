import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { updateSponsorSchema } from "@/lib/validations/sponsor";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/sponsors/[id] - Get single sponsor
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    const { id } = await context!.params;

    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
      include: {
        eventSponsors: {
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

    if (!sponsor) {
      return Errors.notFound("Sponsor");
    }

    return successResponse(sponsor);
  }
);

// PUT /api/sponsors/[id] - Update sponsor
export const PUT = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "sponsors")) {
      return Errors.forbidden("You don't have permission to update sponsors");
    }

    const { id } = await context!.params;

    // Check if sponsor exists
    const existingSponsor = await prisma.sponsor.findUnique({
      where: { id },
    });

    if (!existingSponsor) {
      return Errors.notFound("Sponsor");
    }

    const body = await parseBody(request);

    if (!body) {
      return Errors.badRequest("Invalid request body");
    }

    const parsed = updateSponsorSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const data = parsed.data;

    const sponsor = await prisma.sponsor.update({
      where: { id },
      data: {
        ...data,
        email: data.email ? data.email.toLowerCase() : undefined,
      },
    });

    return successResponse(sponsor, "Sponsor updated successfully");
  }
);

// DELETE /api/sponsors/[id] - Delete sponsor
export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "sponsors")) {
      return Errors.forbidden("You don't have permission to delete sponsors");
    }

    const { id } = await context!.params;

    // Check if sponsor exists
    const existingSponsor = await prisma.sponsor.findUnique({
      where: { id },
      include: {
        _count: {
          select: { eventSponsors: true },
        },
      },
    });

    if (!existingSponsor) {
      return Errors.notFound("Sponsor");
    }

    // Check if sponsor has event assignments
    if (existingSponsor._count.eventSponsors > 0) {
      return Errors.badRequest(
        "Cannot delete sponsor with event assignments. Remove from events first."
      );
    }

    await prisma.sponsor.delete({
      where: { id },
    });

    return successResponse({ id }, "Sponsor deleted successfully");
  }
);
