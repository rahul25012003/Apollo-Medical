/**
 * Setup Email Notification Channel
 *
 * Run: npx tsx scripts/setup-email-channel.ts
 *
 * This creates an EMAIL notification channel so OTPs and notifications can be sent.
 *
 * Before running, set these environment variables:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_EMAIL=your-email@gmail.com
 *   SMTP_PASSWORD=your-app-password  (NOT your Gmail password — use App Password)
 *   SMTP_FROM_NAME=ICMS
 *
 * For Gmail:
 *   1. Go to https://myaccount.google.com/apppasswords
 *   2. Generate an app password for "Mail"
 *   3. Use that 16-character password as SMTP_PASSWORD
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const email = process.env.SMTP_EMAIL;
  const password = process.env.SMTP_PASSWORD;
  const fromName = process.env.SMTP_FROM_NAME || "ICMS";

  if (!email || !password) {
    console.error("ERROR: Set SMTP_EMAIL and SMTP_PASSWORD environment variables");
    console.error("");
    console.error("Example:");
    console.error('  SMTP_EMAIL="your@gmail.com" SMTP_PASSWORD="abcd efgh ijkl mnop" npx tsx scripts/setup-email-channel.ts');
    process.exit(1);
  }

  // Check if email channel already exists (platform-level)
  const existing = await prisma.notificationChannel.findFirst({
    where: { channel: "EMAIL", tenantId: null, isActive: true },
  });

  if (existing) {
    console.log("Email channel already exists:", existing.name);
    console.log("Updating config...");
    await prisma.notificationChannel.update({
      where: { id: existing.id },
      data: {
        config: { smtpHost: host, smtpPort: port, email, password, fromName },
        name: `SMTP — ${email}`,
      },
    });
    console.log("Updated successfully!");
  } else {
    await prisma.notificationChannel.create({
      data: {
        channel: "EMAIL",
        provider: "gmail_smtp",
        name: `SMTP — ${email}`,
        config: { smtpHost: host, smtpPort: port, email, password, fromName },
        isActive: true,
        isDefault: true,
        tenantId: null, // Platform-level (works for all tenants)
      },
    });
    console.log("Email channel created successfully!");
  }

  console.log("");
  console.log("Config:");
  console.log(`  Host: ${host}`);
  console.log(`  Port: ${port}`);
  console.log(`  Email: ${email}`);
  console.log(`  From: ${fromName}`);
  console.log("");
  console.log("OTPs and notifications will now be sent via this email.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
