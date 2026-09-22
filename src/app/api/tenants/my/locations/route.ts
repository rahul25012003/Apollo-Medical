import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { successResponse, Errors, withErrorHandler, parseBody } from "@/lib/api-utils";
import { isIfpcTenantId } from "@/lib/ifpc-tenant";
import { CAMPUS_POINTS } from "@/content/ifpc-2026";
import { logActivity } from "@/lib/activity-log";
import { z } from "zod";

// Location & Directions master (IFPC): the campus points shown on the
// On-Campus Map and Campus Tour. Admin-editable; falls back to the built-in
// defaults from content/ifpc-2026.ts until the admin saves an override.
const pointSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(120),
  note: z.string().max(500).optional().default(""),
  address: z.string().max(300).optional().default(""),
  mapUrl: z.string().url().or(z.literal("")).optional().default(""),
});
const routeSchema = z.object({ from: z.string().min(1), to: z.string().min(1), note: z.string().max(120).optional().default("") });
const bodySchema = z.object({ points: z.array(pointSchema).min(1).max(20), routes: z.array(routeSchema).max(20).default([]) });

function defaults() {
  return {
    points: Object.entries(CAMPUS_POINTS).map(([id, p]) => ({ id, label: p.label, note: p.note, address: p.address, mapUrl: p.mapUrl })),
    routes: [
      { from: "yogaCentre", to: "conventionCentre", note: "≈ 8 min walk" },
      { from: "guestHouse", to: "conventionCentre", note: "" },
    ],
  };
}

// GET /api/tenants/my/locations — the signed-in admin's campus locations (or defaults)
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (!(await isIfpcTenantId(session.user.tenantId))) return Errors.notFound("Page");

  const tenant = await prisma.tenant.findUnique({ where: { id: session.user.tenantId! }, select: { campusLocations: true } });
  const saved = tenant?.campusLocations as { points?: unknown[]; routes?: unknown[] } | null;
  return successResponse(saved?.points?.length ? saved : defaults());
});

// PUT /api/tenants/my/locations — save the campus locations
export const PUT = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return Errors.forbidden("You don't have permission to manage locations");
  }
  if (!(await isIfpcTenantId(session.user.tenantId))) return Errors.notFound("Page");

  const body = await parseBody(request);
  if (!body) return Errors.badRequest("Invalid request body");
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return Errors.validationError(parsed.error);

  await prisma.tenant.update({ where: { id: session.user.tenantId! }, data: { campusLocations: parsed.data } });
  await logActivity(session, {
    action: "locations.update",
    summary: `Updated campus locations (${parsed.data.points.length} places)`,
    entityType: "Tenant",
    entityId: session.user.tenantId,
    request,
  });
  return successResponse(parsed.data, "Locations saved");
});
