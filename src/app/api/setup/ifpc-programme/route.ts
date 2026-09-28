import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncIfpcProgramme } from "@/lib/ifpc-programme";

export const maxDuration = 60;

// GET /api/setup/ifpc-programme?key=SETUP_KEY — adds the IFPC 2026 selectable
// programme (Audi 1–3 halls, workshops, yoga, campus tour slots) to the live
// event. Only halls and those sessions are touched: unlike /api/setup/ifpc it
// never rewrites the site's content, so it is safe to run on production.
// Idempotent — anything already in its slot is left exactly as it is.
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!process.env.SETUP_KEY || key !== process.env.SETUP_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const event = await prisma.event.findUnique({ where: { slug: "ifpc-2026" }, select: { id: true } });
  if (!event) return NextResponse.json({ error: "IFPC 2026 event not found" }, { status: 404 });
  try {
    const logs = await syncIfpcProgramme(prisma, event.id);
    return NextResponse.json({ success: true, logs });
  } catch (e) {
    return NextResponse.json({ error: "Programme sync failed", detail: (e as Error).message?.slice(0, 1000) }, { status: 500 });
  }
}
