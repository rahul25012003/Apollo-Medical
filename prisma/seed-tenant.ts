import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check if tenant already exists
  const existing = await prisma.tenant.findUnique({
    where: { slug: 'apollo-medical' }
  });

  if (existing) {
    console.log('Tenant already exists:', existing.slug);
    return existing;
  }

  const tenant = await prisma.tenant.create({
    data: {
      slug: 'apollo-medical',
      name: 'Apollo Medical College',
      tagline: 'Excellence in Healthcare Education',
      primaryColor: '#2563eb',
      secondaryColor: '#7c3aed',
      accentColor: '#10b981',
      email: 'info@apollomedical.edu',
      phone: '+91 9876543210',
      address: '123 Medical Campus Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      website: 'https://apollomedical.edu',
      facebook: 'https://facebook.com/apollomedical',
      twitter: 'https://twitter.com/apollomedical',
      linkedin: 'https://linkedin.com/company/apollomedical',
      instagram: 'https://instagram.com/apollomedical',
      youtube: 'https://youtube.com/@apollomedical',
      sections: {
        hero: true,
        events: true,
        gallery: true,
        sponsors: true,
        about: true,
        contact: true
      },
      heroTitle: 'Advance Your Medical Career with Apollo',
      heroSubtitle: 'Join our world-class conferences, workshops, and CME programs. Learn from industry experts and earn credits.',
      aboutTitle: 'Why Choose Apollo Medical College?',
      aboutDescription: 'For over 25 years, Apollo Medical College has been at the forefront of medical education, producing exceptional healthcare professionals.',
      aboutFeatures: [
        { icon: 'GraduationCap', title: 'CME Accredited', description: 'All programs are accredited for Continuing Medical Education credits.' },
        { icon: 'Users', title: 'Expert Faculty', description: 'Learn from renowned medical professionals and researchers.' },
        { icon: 'Globe', title: 'Global Network', description: 'Connect with healthcare professionals worldwide.' },
        { icon: 'Award', title: 'Quality Programs', description: 'High-quality, well-organized medical conferences.' }
      ],
      galleryImages: [
        { id: 1, src: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80', alt: 'Apollo Conference 2024', category: 'Conference' },
        { id: 2, src: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80', alt: 'Surgical Workshop', category: 'Workshop' },
        { id: 3, src: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80', alt: 'Networking Event', category: 'Networking' },
        { id: 4, src: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=80', alt: 'Medical Exhibition', category: 'Exhibition' },
        { id: 5, src: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&q=80', alt: 'CME Training', category: 'Training' },
        { id: 6, src: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800&q=80', alt: 'Panel Discussion', category: 'Conference' }
      ],
      galleryVideos: [
        { id: 1, thumbnail: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80', title: 'Apollo Annual Conference Highlights', category: 'Conference', duration: '12:45', youtubeId: 'dQw4w9WgXcQ' },
        { id: 2, thumbnail: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&q=80', title: 'Surgical Skills Workshop', category: 'Workshop', duration: '45:30', youtubeId: 'dQw4w9WgXcQ' }
      ],
      footerText: 'Empowering healthcare professionals through quality education.',
      copyrightText: 'Apollo Medical College. All rights reserved.',
      isActive: true,
      defaultCurrency: 'INR',
      defaultTimezone: 'Asia/Kolkata'
    }
  });

  console.log('Sample tenant created successfully!');
  console.log('-----------------------------------');
  console.log('Tenant ID:', tenant.id);
  console.log('Slug:', tenant.slug);
  console.log('Name:', tenant.name);
  console.log('Primary Color:', tenant.primaryColor);
  console.log('-----------------------------------');
  console.log('\nAccess the tenant page at:');
  console.log('  http://localhost:3000/t/apollo-medical');

  return tenant;
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
