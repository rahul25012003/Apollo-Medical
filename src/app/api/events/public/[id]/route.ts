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

    // For preview mode, try auth but don't fail if session unavailable
    let allowDraft = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let previewSession: any = null;
    if (isPreview) {
      try {
        previewSession = await auth();
        if (previewSession && canAccess(previewSession.user.role, "events")) {
          allowDraft = true;
        }
      } catch {
        // Auth failed (cookie/domain issue on production) — only show published events
        allowDraft = false;
      }
    }

    // Try to find the event — for preview, allow any status
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

    // Convert Prisma Decimal fields to plain numbers for JSON serialization
    const eventPrice = Number(event.price) || 0;
    const categories = event.pricingCategories?.map((pc: any) => ({
      ...pc,
      price: Number(pc.price) || 0,
      earlyBirdPrice: pc.earlyBirdPrice ? Number(pc.earlyBirdPrice) : null,
    })) || [];
    // Effective price: use lowest category price if categories exist and event price is 0
    const categoryPrices = categories.map((c: any) => Number(c.price)).filter((p: number) => p > 0);
    const effectivePrice = eventPrice > 0 ? eventPrice : (categoryPrices.length > 0 ? Math.min(...categoryPrices) : 0);

    const safeEvent = {
      ...event,
      price: effectivePrice,
      earlyBirdPrice: event.earlyBirdPrice ? Number(event.earlyBirdPrice) : null,
      pricingCategories: categories,
    };

    return successResponse(safeEvent);
  } catch (error) {
    console.error("Error fetching public event:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch event" } },
      { status: 500 }
    );
  }
}
