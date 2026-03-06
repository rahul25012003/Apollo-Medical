import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check if tenant already exists
  const existing = await prisma.tenant.findUnique({
    where: { slug: 'global-health-summit' }
  });

  if (existing) {
    console.log('Tenant already exists:', existing.slug);
    return existing;
  }

  const tenant = await prisma.tenant.create({
    data: {
      slug: 'global-health-summit',
      name: 'Global Health Summit',
      tagline: 'Connecting Healthcare Leaders Worldwide',
      primaryColor: '#059669',
      secondaryColor: '#0891b2',
      accentColor: '#f59e0b',
      email: 'info@globalhealthsummit.org',
      phone: '+1 555-123-4567',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      website: 'https://globalhealthsummit.org',
      sections: {
        hero: true,
        events: true,
        gallery: true,
        sponsors: true,
        about: true,
        contact: true
      },
      heroTitle: 'Shape the Future of Global Healthcare',
      heroSubtitle: 'Join world leaders, innovators, and practitioners at the premier healthcare conference.',
      aboutTitle: 'About Global Health Summit',
      aboutDescription: 'The Global Health Summit brings together healthcare professionals from 50+ countries to discuss the most pressing challenges in medicine.',
      aboutFeatures: [
        { icon: 'Globe', title: 'International Reach', description: 'Participants from over 50 countries worldwide.' },
        { icon: 'Users', title: 'Expert Speakers', description: '200+ renowned speakers and panelists.' },
        { icon: 'Award', title: 'Innovation Awards', description: 'Recognizing breakthrough healthcare solutions.' },
        { icon: 'GraduationCap', title: 'CME Credits', description: 'Earn continuing education credits.' }
      ],
      galleryImages: [
        { id: 1, src: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80', alt: 'Summit Opening', category: 'Conference' },
        { id: 2, src: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80', alt: 'Keynote Session', category: 'Conference' },
        { id: 3, src: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80', alt: 'Networking', category: 'Networking' },
        { id: 4, src: 'https://images.unsplash.com/photo-1559223607-a43c990c692c?w=800&q=80', alt: 'Panel Discussion', category: 'Conference' }
      ],
      footerText: 'Advancing global health through collaboration and innovation.',
      copyrightText: 'Global Health Summit. All rights reserved.',
      isActive: true,
      defaultCurrency: 'USD',
      defaultTimezone: 'America/New_York'
    }
  });

  console.log('Second tenant created successfully!');
  console.log('-----------------------------------');
  console.log('Tenant ID:', tenant.id);
  console.log('Slug:', tenant.slug);
  console.log('Name:', tenant.name);
  console.log('Primary Color:', tenant.primaryColor);
  console.log('-----------------------------------');
  console.log('\nAccess the tenant page at:');
  console.log('  http://localhost:3000/t/global-health-summit');

  return tenant;
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
