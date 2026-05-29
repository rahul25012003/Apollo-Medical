import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// GET /api/setup/migrate?key=SETUP_KEY — runs prisma db push from within the server
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (key !== process.env.SETUP_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { stdout, stderr } = await execAsync(
      "npx prisma db push --skip-generate --accept-data-loss",
      { cwd: process.cwd(), timeout: 60000 }
    );
    return NextResponse.json({
      success: true,
      stdout: stdout.slice(0, 2000),
      stderr: stderr.slice(0, 500),
    });
  } catch (e: any) {
    return NextResponse.json({
      error: "Migration failed",
      detail: e.message?.slice(0, 1000),
      stdout: e.stdout?.slice(0, 1000),
      stderr: e.stderr?.slice(0, 1000),
    }, { status: 500 });
  }
}
