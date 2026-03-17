import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { getEffectiveTenantId } from "@/lib/tenant-scope";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.user.role, "registrations")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const effectiveTenantId = getEffectiveTenantId(session, searchParams);

  const where: Record<string, unknown> = {};
  if (eventId) where.eventId = eventId;
  if (effectiveTenantId) where.event = { tenantId: effectiveTenantId };

  const registrations = await prisma.registration.findMany({
    where,
    include: { event: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  // Build CSV
  const headers = ["Name","Email","Phone","Organization","Designation","Category","Role","Event","Status","Payment Status","Amount","Currency","Registered At"];
  const rows = registrations.map(r => [
    r.name, r.email, r.phone || "", r.organization || "", r.designation || "",
    r.category || "", r.participantRole || "DELEGATE", r.event.title,
    r.status, r.paymentStatus, String(r.amount), r.currency,
    new Date(r.createdAt).toISOString()
  ]);

  const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registrations-${eventId || "all"}-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
