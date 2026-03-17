import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, Errors } from "@/lib/api-utils";
import { auth, canAccess } from "@/lib/auth";
import { isTenantOwner } from "@/lib/tenant-scope";

// GET /api/events/public/[id] - Get single public event (no auth required)
// Supports ?preview=true for admins to preview unpublished events
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const isPreview = searchParams.get("preview") === "true";

    // For preview mode, require admin auth + tenant ownership
    let allowDraft = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let previewSession: any = null;
    if (isPreview) {
      previewSession = await auth();
      if (previewSession && canAccess(previewSession.user.role, "events")) {
        allowDraft = true;
      }
    }

    const event = await prisma.event.findFirst({
      where: {
        id,
        ...(allowDraft ? {} : { isPublished: true }),
      },
      include: {
        tenant: {
          select: {
            slug: true,
            name: true,
          },
        },
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
              orderBy: { displayOrder: "asc" },
            },
          },
          orderBy: [{ sessionDate: "asc" }, { sessionOrder: "asc" }, { startTime: "asc" }],
        },
        engagements: {
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
        },
        halls: {
          orderBy: { displayOrder: "asc" },
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

    // For preview mode, verify tenant ownership
    if (allowDraft && previewSession && !event.isPublished) {
      if (!isTenantOwner(previewSession, event.tenantId)) {
        return Errors.notFound("Event");
      }
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
