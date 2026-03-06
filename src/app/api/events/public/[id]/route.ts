import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, Errors } from "@/lib/api-utils";

// GET /api/events/public/[id] - Get single public event (no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await prisma.event.findFirst({
      where: {
        id,
        isPublished: true,
      },
      include: {
        eventSpeakers: {
          include: {
            speaker: {
              select: {
                id: true,
                name: true,
                designation: true,
                institution: true,
                biography: true,
                photo: true,
              },
            },
          },
          orderBy: { sessionOrder: "asc" },
        },
        eventSponsors: {
          include: {
            sponsor: {
              select: {
                id: true,
                name: true,
                logo: true,
                website: true,
              },
            },
          },
          orderBy: { tier: "asc" },
        },
        eventSessions: {
          orderBy: [{ sessionDate: "asc" }, { startTime: "asc" }],
        },
        pricingCategories: {
          orderBy: { displayOrder: "asc" },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!event) {
      return Errors.notFound("Event");
    }

    return successResponse(event);
  } catch (error) {
    console.error("Error fetching public event:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch event" } },
      { status: 500 }
    );
  }
}
