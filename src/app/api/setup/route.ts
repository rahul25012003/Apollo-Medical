import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/setup?key=SETUP_KEY — initialises DB and seeds apollo-medical tenant
// Protected by SETUP_KEY env var to prevent abuse
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (key !== process.env.SETUP_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: string[] = [];

  try {
    // Check DB connectivity
    await prisma.$queryRaw`SELECT 1`;
    results.push("DB connected");
  } catch (e) {
    return NextResponse.json({ error: "DB not reachable", detail: String(e) }, { status: 500 });
  }

  try {
    // Check if Tenant table exists
    const tenantCount = await prisma.tenant.count();
    results.push(`Tenant table exists (${tenantCount} rows)`);
  } catch (e) {
    return NextResponse.json({ error: "Tenant table missing — run prisma db push first", detail: String(e) }, { status: 500 });
  }

  // Upsert apollo-medical tenant
  try {
    const tenant = await prisma.tenant.upsert({
      where: { slug: "apollo-medical" },
      update: {},
      create: {
        slug: "apollo-medical",
        name: "Apollo Hospitals",
        shortName: "Apollo",
        tagline: "Touching lives, one heartbeat at a time",
        primaryColor: "#2582A1",
        secondaryColor: "#FDB931",
        accentColor: "#1a5f87",
        email: "info@apollohospitals.com",
        phone: "+91 1860-500-1066",
        address: "21, Greams Lane, Off Greams Road",
        city: "Chennai",
        state: "Tamil Nadu",
        country: "India",
        website: "https://www.apollohospitals.com",
        facebook: "https://www.facebook.com/theapollohospitals",
        twitter: "https://twitter.com/HospitalsApollo",
        linkedin: "https://www.linkedin.com/company/apollo-hospitals",
        instagram: "https://www.instagram.com/theapollohospitals/",
        youtube: "https://www.youtube.com/@apollohospitals",
        heroBgImage: "/images/apollo/hero-bg.jpg",
        heroTitle: "Excellence in Healthcare, Education & Innovation",
        heroSubtitle: "Join Apollo Hospitals' premier medical conferences, CME accredited programs, and hands-on workshops.",
        aboutTitle: "About Apollo Hospitals",
        aboutDescription: "Founded in 1983 by Dr. Prathap C. Reddy, Apollo Hospitals is India's largest private hospital network with 74 hospitals and 11,000+ qualified doctors.",
        footerText: "Advancing India's healthcare through world-class medical education.",
        copyrightText: "Apollo Hospitals Enterprise Ltd. All rights reserved.",
        isActive: true,
        defaultCurrency: "INR",
        defaultTimezone: "Asia/Kolkata",
      },
    });
    results.push(`Tenant upserted: ${tenant.name} (${tenant.slug})`);

    // Create admin user
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.default.hash("Admin@123", 12);
    const admin = await prisma.user.upsert({
      where: { email: "admin@apollo-medical.com" },
      update: {},
      create: {
        email: "admin@apollo-medical.com",
        password: hash,
        name: "Apollo Administrator",
        firstName: "Apollo",
        lastName: "Admin",
        role: "ADMIN",
        emailVerified: new Date(),
        isActive: true,
        tenantId: tenant.id,
      },
    });
    results.push(`Admin user: ${admin.email}`);

  } catch (e) {
    return NextResponse.json({ error: "Seed failed", detail: String(e), results }, { status: 500 });
  }

  return NextResponse.json({ success: true, results });
}
