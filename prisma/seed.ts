import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { config } from "dotenv";
import bcrypt from "bcryptjs";

config();
const cs = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString: cs, ...(cs?.includes('.neon.tech') ? { ssl: { rejectUnauthorized: false } } : {}) });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...\n");

  // ============================================================================
  // TENANT
  // ============================================================================
  console.log("Creating tenant...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "carens" },
    update: {},
    create: {
      slug: "carens",
      name: "CareNS",
      domain: "careneuromodulationaiims.in",
      primaryColor: "#0d9488",
      secondaryColor: "#0891b2",
      accentColor: "#10b981",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      isActive: true,
    },
  });

  console.log(`✅ Created tenant: ${tenant.name} (slug: ${tenant.slug})\n`);

  // ============================================================================
  // USERS
  // ============================================================================
  console.log("Creating users...");

  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const userPassword = await bcrypt.hash("User@123", 12);

  // Super Admin (platform-level, no tenant)
  await prisma.user.upsert({
    where: { email: "admin@icms.com" },
    update: { password: adminPassword, isActive: true },
    create: {
      email: "admin@icms.com",
      password: adminPassword,
      name: "Super Admin",
      firstName: "Super",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      emailVerified: new Date(),
      isActive: true,
    },
  });

  // CareNS Tenant Admin
  await prisma.user.upsert({
    where: { email: "admin@carens.com" },
    update: { password: adminPassword, isActive: true },
    create: {
      email: "admin@carens.com",
      password: adminPassword,
      name: "CareNS Administrator",
      firstName: "CareNS",
      lastName: "Admin",
      role: "ADMIN",
      emailVerified: new Date(),
      isActive: true,
      tenantId: tenant.id,
    },
  });

  // CareNS Event Manager
  await prisma.user.upsert({
    where: { email: "events@carens.com" },
    update: { password: userPassword, isActive: true },
    create: {
      email: "events@carens.com",
      password: userPassword,
      name: "CareNS Event Manager",
      firstName: "CareNS",
      lastName: "Events",
      role: "EVENT_MANAGER",
      emailVerified: new Date(),
      isActive: true,
      tenantId: tenant.id,
    },
  });

  // CareNS Registration Manager
  await prisma.user.upsert({
    where: { email: "registrations@carens.com" },
    update: { password: userPassword, isActive: true },
    create: {
      email: "registrations@carens.com",
      password: userPassword,
      name: "CareNS Registration Manager",
      firstName: "CareNS",
      lastName: "Registrations",
      role: "REGISTRATION_MANAGER",
      emailVerified: new Date(),
      isActive: true,
      tenantId: tenant.id,
    },
  });

  // CareNS Certificate Manager
  await prisma.user.upsert({
    where: { email: "certificates@carens.com" },
    update: { password: userPassword, isActive: true },
    create: {
      email: "certificates@carens.com",
      password: userPassword,
      name: "CareNS Certificate Manager",
      firstName: "CareNS",
      lastName: "Certificates",
      role: "CERTIFICATE_MANAGER",
      emailVerified: new Date(),
      isActive: true,
      tenantId: tenant.id,
    },
  });

  // CareNS Attendee
  await prisma.user.upsert({
    where: { email: "attendee@carens.com" },
    update: { password: userPassword, isActive: true },
    create: {
      email: "attendee@carens.com",
      password: userPassword,
      name: "CareNS Attendee",
      firstName: "CareNS",
      lastName: "Attendee",
      role: "ATTENDEE",
      emailVerified: new Date(),
      isActive: true,
      tenantId: tenant.id,
    },
  });

  console.log(`✅ Created 7 users (1 super admin + 6 tenant users)\n`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("========================================");
  console.log("🎉 Seed completed successfully!\n");
  console.log("Tenant:");
  console.log("----------------------------------------");
  console.log(`  ${tenant.name}  (slug: ${tenant.slug})`);
  console.log(`  Domain: ${tenant.domain}`);
  console.log("");
  console.log("Login Credentials:");
  console.log("----------------------------------------");
  console.log("Super Admin (platform): admin@icms.com / Admin@123");
  console.log("");
  console.log("CareNS:");
  console.log("  Administrator:  admin@carens.com / Admin@123");
  console.log("  Event Manager:  events@carens.com / User@123");
  console.log("  Reg. Manager:   registrations@carens.com / User@123");
  console.log("  Cert. Manager:  certificates@carens.com / User@123");
  console.log("  Attendee:       attendee@carens.com / User@123");
  console.log("========================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
