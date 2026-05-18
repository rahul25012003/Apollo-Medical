import { NextRequest, NextResponse } from "next/server";
import { auth, canAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Errors, successResponse } from "@/lib/api-utils";
import { isTenantOwner } from "@/lib/tenant-scope";
import { randomUUID } from "crypto";

type RouteContext = { params: Promise<{ id: string }> };

interface EventPhoto {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  uploadedAt: string;
}

// GET /api/events/[id]/photos
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      select: { photos: true },
    });
    if (!event) return Errors.notFound("Event");
    const photos = (event.photos as EventPhoto[] | null) || [];
    return successResponse(photos);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch photos" } }, { status: 500 });
  }
}

// POST /api/events/[id]/photos — add a photo (src already uploaded via /api/upload)
export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session || !canAccess(session.user.role, "events")) return Errors.forbidden();

  const { id } = await params;
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      select: { photos: true, tenantId: true },
    });
    if (!event) return Errors.notFound("Event");
    if (!isTenantOwner(session, event.tenantId)) return Errors.forbidden();

    const body = await req.json();
    const { src, alt, caption } = body;
    if (!src) return Errors.badRequest("src is required");

    const photos = (event.photos as EventPhoto[] | null) || [];
    const newPhoto: EventPhoto = {
      id: randomUUID(),
      src,
      alt: alt || "",
      caption: caption || "",
      uploadedAt: new Date().toISOString(),
    };
    photos.push(newPhoto);

    await prisma.event.update({
      where: { id },
      data: { photos: photos as any },
    });

    return successResponse(newPhoto, "Photo added");
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to add photo" } }, { status: 500 });
  }
}

// DELETE /api/events/[id]/photos?photoId=xxx
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session || !canAccess(session.user.role, "events")) return Errors.forbidden();

  const { id } = await params;
  const photoId = req.nextUrl.searchParams.get("photoId");
  if (!photoId) return Errors.badRequest("photoId is required");

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      select: { photos: true, tenantId: true },
    });
    if (!event) return Errors.notFound("Event");
    if (!isTenantOwner(session, event.tenantId)) return Errors.forbidden();

    const photos = (event.photos as EventPhoto[] | null) || [];
    const updated = photos.filter((p) => p.id !== photoId);

    await prisma.event.update({
      where: { id },
      data: { photos: updated as any },
    });

    return successResponse(null, "Photo deleted");
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete photo" } }, { status: 500 });
  }
}
