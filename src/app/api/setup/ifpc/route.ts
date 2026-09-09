import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedIfpc2026 } from "@/lib/ifpc-seed";

export const maxDuration = 60;

// GET /api/setup/ifpc?key=SETUP_KEY — seeds the IFPC 2026 content + event for
// the apollo-medical tenant. Needed because Render's managed Postgres has no
// external connection string, so the seed can only run from inside the app.
//
// Idempotent: re-running updates tenant content and skips an existing event.
// Deliberately separate from /api/setup, which seeds the OLD Apollo Hospitals
// demo content and would overwrite the conference site if called.
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!process.env.SETUP_KEY || key !== process.env.SETUP_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    logs.push(args.map(String).join(" "));
    originalLog(...args);
  };

  try {
    await seedIfpc2026(prisma);
    return NextResponse.json({ success: true, logs });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json(
      { error: "Seed failed", detail: err.message?.slice(0, 1000), logs },
      { status: 500 }
    );
  } finally {
    console.log = originalLog;
  }
}
