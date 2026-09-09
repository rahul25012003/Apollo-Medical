/**
 * IFPC 2026 seed — CLI wrapper. The actual logic lives in src/lib/ifpc-seed.ts
 * so the deployed app can run the identical seed via /api/setup/ifpc.
 *
 * Run: npx tsx prisma/seed-ifpc-2026.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { seedIfpc2026 } from "../src/lib/ifpc-seed";

config();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

seedIfpc2026(prisma)
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
