import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { successResponse, Errors, withErrorHandler } from "@/lib/api-utils";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/events/[id]/certificates/participants?category=Faculty
// Returns registrations with certificate status so admin can review before sending
export const GET = withErrorHandler(async (req: NextRequest, context?: RouteContext) => {
  const session = await auth();
  if (!session) return Errors.unauthorized();

  const { id: eventId } = await context!.params;
  const category = req.nextUrl.searchParams.get("category");
  const search = req.nextUrl.searchParams.get("search") ?? "";

  const NO_CATEGORY_KEY = "__no_category__";

  const registrations = await prisma.registration.findMany({
    where: {
      eventId,
      status: { in: ["CONFIRMED", "ATTENDED"] },
      ...(category
        ? category === NO_CATEGORY_KEY
          ? { category: null }
          : { category }
        : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: { id: true, name: true, email: true, category: true },
    orderBy: { name: "asc" },
  });

  // Check which ones already have a certificate issued
  const certMap = new Map<string, { issuedAt: Date | null }>();
  if (registrations.length > 0) {
    const certs = await prisma.certificate.findMany({
      where: {
        registrationId: { in: registrations.map((r) => r.id) },
        certificateType: "ATTENDANCE",
      },
      select: { registrationId: true, status: true, issuedAt: true },
    });
    certs.forEach((c) => certMap.set(c.registrationId, { issuedAt: c.issuedAt }));
  }

  const participants = registrations.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    category: r.category,
    alreadySent: certMap.has(r.id),
    issuedAt: certMap.get(r.id)?.issuedAt ?? null,
  }));

  return successResponse({ participants });
});
