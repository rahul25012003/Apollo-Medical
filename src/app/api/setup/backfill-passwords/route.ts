import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-utils";
import { IFPC_DEFAULT_PASSWORD, IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";

// GET /api/setup/backfill-passwords?key=SETUP_KEY — one-off fix for accounts
// created before every account always got a real password (OTP-only accounts
// with password: null). Sets the known default password so they can log in.
// &all=true additionally resets every ATTENDEE account to the default —
// covers accounts stuck with an unrecoverable random password from the old
// generatePassword() path that predates the IFPC_DEFAULT_PASSWORD fix.
// Never touches ADMIN/staff accounts (role filter is unconditional), and only
// IFPC (apollo-medical) accounts — other tenants' accounts are never changed.
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (key !== process.env.SETUP_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resetAll = request.nextUrl.searchParams.get("all") === "true";

  const affected = await prisma.user.findMany({
    where: {
      role: "ATTENDEE",
      tenant: { slug: IFPC_TENANT_SLUG },
      ...(resetAll ? {} : { password: null }),
    },
    select: { id: true },
  });

  if (affected.length === 0) {
    return NextResponse.json({ success: true, updated: 0 });
  }

  const hashed = await hashPassword(IFPC_DEFAULT_PASSWORD);
  await prisma.user.updateMany({
    where: { id: { in: affected.map((u) => u.id) } },
    data: { password: hashed },
  });

  return NextResponse.json({ success: true, updated: affected.length });
}
