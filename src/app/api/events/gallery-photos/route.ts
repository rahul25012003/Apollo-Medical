import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, Errors } from "@/lib/api-utils";

// GET /api/events/gallery-photos?tenant=<slug>
// Returns all events for a tenant that have photos (regardless of publish status)
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

    // Fetch all events for this tenant (no isPublished filter — photos are
    // deliberately uploaded by admin so they should always appear in gallery)
    const events = await prisma.event.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        title: true,
        photos: true,
        startDate: true,
      },
      orderBy: { startDate: "desc" },
    });

    // Filter to only events that have at least one photo
    const eventsWithPhotos = events.filter((e) => {
      const photos = (e as any).photos;
      return Array.isArray(photos) && photos.length > 0;
    });

    return successResponse(eventsWithPhotos);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch gallery" } },
      { status: 500 }
    );
  }
}
