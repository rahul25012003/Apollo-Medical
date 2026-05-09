import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { successResponse, Errors, withErrorHandler } from "@/lib/api-utils";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/events/[id]/certificates/config
// Returns existing config + list of categories from confirmed registrations
export const GET = withErrorHandler(async (
  _req: NextRequest,
  context?: RouteContext
) => {
  const session = await auth();
  if (!session) return Errors.unauthorized();

  const { id: eventId } = await context!.params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, tenantId: true, certificateConfig: true },
  });
  if (!event) return Errors.notFound("Event");

  // All registrations (any status) so admin can set templates before confirming anyone
  const rawCategories = await prisma.registration.groupBy({
    by: ["category"],
    where: { eventId, status: { notIn: ["CANCELLED"] } },
    _count: { _all: true },
  });

  // Also include categories from pricing tiers in case no one has registered yet
  const pricingCategories = await prisma.eventPricing.findMany({
    where: { eventId },
    select: { name: true },
  });

  const fromRegistrations = rawCategories
    .filter((r) => r.category)
    .map((r) => ({ name: r.category as string, count: r._count._all }));

  // Merge: registration categories + pricing categories (no duplicates)
  const seen = new Set(fromRegistrations.map((c) => c.name));
  for (const pc of pricingCategories) {
    if (!seen.has(pc.name)) {
      fromRegistrations.push({ name: pc.name, count: 0 });
      seen.add(pc.name);
    }
  }

  // Also include any category already in templates (in case it was manually configured)
  const config = (event.certificateConfig as Record<string, unknown> | null) ?? {};
  const templates = (config.templates as Record<string, unknown> | undefined) ?? {};
  for (const tplKey of Object.keys(templates)) {
    if (!seen.has(tplKey)) {
      fromRegistrations.push({ name: tplKey, count: 0 });
      seen.add(tplKey);
    }
  }

  const categories = fromRegistrations.sort((a, b) => a.name.localeCompare(b.name));

  return successResponse({ categories, templates });
});

// POST /api/events/[id]/certificates/config
export const POST = withErrorHandler(async (
  req: NextRequest,
  context?: RouteContext
) => {
  const session = await auth();
  if (!session) return Errors.unauthorized();

  const { id: eventId } = await context!.params;
  const body = await req.json();
  const { templates } = body as { templates: Record<string, unknown> };

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, certificateConfig: true },
  });
  if (!event) return Errors.notFound("Event");

  const existing = (event.certificateConfig as Record<string, unknown> | null) ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated: any = { ...existing, templates };

  await prisma.event.update({
    where: { id: eventId },
    data: { certificateConfig: updated },
  });

  return successResponse({ templates }, "Certificate config saved");
});
