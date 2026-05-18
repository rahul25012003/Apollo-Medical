import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, Errors } from "@/lib/api-utils";

// GET /api/events/gallery-photos?tenant=<slug>
// Returns all published events for a tenant that have photos
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant");

  if (!tenantSlug) return Errors.badRequest("tenant is required");

  try {
    const tenant = await prisma.tenant.findFirst({
      where: { slug: tenantSlug, isActive: true },
      select: { id: true },
    });
    if (!tenant) return Errors.notFound("Tenant");

    const events = await prisma.event.findMany({
      where: {
        tenantId: tenant.id,
        isPublished: true,
        NOT: [{ photos: { equals: null } }],
      } as any,
      select: {
        id: true,
        title: true,
        photos: true,
        startDate: true,
      },
      orderBy: { startDate: "desc" },
    });

    // Filter out events with empty photos arrays
    const eventsWithPhotos = events.filter((e) => {
      const photos = (e as any).photos as any[];
      return Array.isArray(photos) && photos.length > 0;
    });

    return successResponse(eventsWithPhotos);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch gallery" } }, { status: 500 });
  }
}
