import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';

config();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      primaryColor: true,
      secondaryColor: true,
      isActive: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log('\n=== All Tenants ===\n');

  if (tenants.length === 0) {
    console.log('No tenants found.');
  } else {
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name}`);
      console.log(`   Slug: ${tenant.slug}`);
      console.log(`   Colors: ${tenant.primaryColor} / ${tenant.secondaryColor}`);
      console.log(`   Active: ${tenant.isActive}`);
      console.log(`   URL: http://localhost:3000/t/${tenant.slug}`);
      console.log('');
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
