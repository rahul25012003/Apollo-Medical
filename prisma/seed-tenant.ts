import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import bcrypt from 'bcryptjs';

config();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Tenant (upsert — updates if already exists) ───────────────────────────
  const tenantData = {
    name: 'Apollo Hospitals',
    shortName: 'Apollo',
    tagline: 'Touching lives, one heartbeat at a time',
    primaryColor: '#2582A1',
    secondaryColor: '#FDB931',
    accentColor: '#1a5f87',
    email: 'info@apollohospitals.com',
    phone: '+91 1860-500-1066',
    address: '21, Greams Lane, Off Greams Road',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    website: 'https://www.apollohospitals.com',
    facebook: 'https://www.facebook.com/theapollohospitals',
    twitter: 'https://twitter.com/HospitalsApollo',
    linkedin: 'https://www.linkedin.com/company/apollo-hospitals',
    instagram: 'https://www.instagram.com/theapollohospitals/',
    youtube: 'https://www.youtube.com/@apollohospitals',
    sections: {
      hero: true,
      events: true,
      gallery: true,
      sponsors: true,
      testimonials: true,
      about: true,
      contact: true,
      faq: true,
      moduleSpeakers: true,
      moduleSponsors: true,
      moduleCertificates: true,
      moduleRegistrations: true,
      notifyRegistrations: true,
      notifyPayments: true,
    },
    heroTitle: 'Excellence in Healthcare, Education & Innovation',
    heroSubtitle:
      "Join Apollo Hospitals' premier medical conferences, CME accredited programs, and hands-on workshops led by India's finest physicians and researchers.",
    aboutTitle: 'About Apollo Hospitals',
    aboutDescription:
      "Founded in 1983 by Dr. Prathap C. Reddy, Apollo Hospitals is India's largest private hospital network and Asia's leading integrated healthcare group. With 74 hospitals, 10,400+ beds, and 11,000+ qualified doctors across 27 cities, Apollo has pioneered healthcare excellence in India. Our CME and conference division brings together the nation's top medical minds to advance clinical knowledge and improve patient outcomes.",
    aboutFeatures: [
      {
        icon: 'GraduationCap',
        title: 'CME Accredited Programs',
        description:
          'All programs are accredited for Continuing Medical Education credits, recognized nationwide.',
      },
      {
        icon: 'Users',
        title: 'Expert Faculty',
        description:
          'Learn from 11,000+ Apollo specialists and renowned international medical professionals.',
      },
      {
        icon: 'Globe',
        title: 'Pan-India Network',
        description:
          'Connect with healthcare professionals across 27 cities and 74 Apollo hospitals.',
      },
      {
        icon: 'Award',
        title: 'Clinical Excellence',
        description:
          "Programs grounded in Apollo's 40+ years of pioneering clinical outcomes and research.",
      },
    ],
    aboutImages: [
      'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80',
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
      'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&q=80',
    ],
    galleryImages: [
      { id: 1, src: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80', alt: 'Apollo Medical Conference 2024', category: 'Conference' },
      { id: 2, src: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80', alt: 'Surgical Skills Workshop', category: 'Workshop' },
      { id: 3, src: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80', alt: 'Healthcare Leaders Networking', category: 'Networking' },
      { id: 4, src: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=80', alt: 'Medical Technology Exhibition', category: 'Exhibition' },
      { id: 5, src: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&q=80', alt: 'CME Training Session', category: 'Training' },
      { id: 6, src: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800&q=80', alt: 'Panel Discussion', category: 'Conference' },
    ],
    galleryVideos: [
      { id: 1, thumbnail: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80', title: 'Apollo Annual Medical Conference — Highlights', category: 'Conference', duration: '12:45', youtubeId: 'dQw4w9WgXcQ' },
      { id: 2, thumbnail: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&q=80', title: 'Apollo Surgical Skills Workshop — Full Session', category: 'Workshop', duration: '45:30', youtubeId: 'dQw4w9WgXcQ' },
    ],
    testimonials: [
      {
        id: 1,
        name: 'Dr. Suresh Nair',
        role: 'Cardiologist, Apollo Chennai',
        avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop',
        content: "Apollo's CME conferences are unmatched in quality. The faculty expertise and structured curriculum have directly impacted my clinical practice.",
        rating: 5,
      },
      {
        id: 2,
        name: 'Dr. Meenakshi Iyer',
        role: 'Neurosurgeon, Apollo Hyderabad',
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop',
        content: 'The hands-on workshops and case discussions give participants real-world insights. I have attended 5 Apollo conferences and every one exceeded expectations.',
        rating: 5,
      },
      {
        id: 3,
        name: 'Dr. Arjun Mehta',
        role: 'Oncologist, Apollo Delhi',
        avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop',
        content: "Outstanding organization and world-class faculty. Apollo's conference management system makes registration and certification completely seamless.",
        rating: 5,
      },
    ],
    yearlyStats: {
      year: '2024',
      events: '40+',
      attendees: '5,000+',
      speakers: '200+',
    },
    faqs: [
      { id: 1, question: 'How do I register for an Apollo medical conference?', answer: "Click on any upcoming event and select \"Register Now\". Choose your participant category, fill in your details, and complete the payment. You'll receive a confirmation email with your registration ID immediately." },
      { id: 2, question: 'Are the programs CME accredited?', answer: 'Yes, all Apollo Hospitals medical conferences and workshops are accredited for Continuing Medical Education (CME) credits. CME certificates are issued digitally through this portal upon successful completion.' },
      { id: 3, question: 'How do I download my CME certificate?', answer: 'After the event, log in to your participant dashboard using your registered email. Navigate to "My Certificates" and download your CME certificate in PDF format.' },
      { id: 4, question: 'What is the cancellation policy?', answer: 'Cancellations made 7 days before the event receive a full refund. Cancellations within 7 days may be transferred to a future Apollo event. Please contact our team for assistance.' },
      { id: 5, question: 'Can I register as a team or group?', answer: 'Yes, group registrations are available for teams of 5 or more. Please contact us at info@apollohospitals.com for group pricing and coordination.' },
    ],
    footerText: "Advancing India's healthcare through world-class medical education, cutting-edge research, and compassionate patient care.",
    copyrightText: 'Apollo Hospitals Enterprise Ltd. All rights reserved.',
    isActive: true,
    defaultCurrency: 'INR',
    defaultTimezone: 'Asia/Kolkata',
  };

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'apollo-medical' },
    update: tenantData,
    create: { slug: 'apollo-medical', ...tenantData },
  });

  console.log('Apollo Hospitals tenant upserted!\n');

  // ── Admin users (idempotent) ──────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const userPassword = await bcrypt.hash('User@123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@apollo-medical.com' },
    update: { password: adminPassword, isActive: true, tenantId: tenant.id },
    create: {
      email: 'admin@apollo-medical.com',
      password: adminPassword,
      name: 'Apollo Administrator',
      firstName: 'Apollo',
      lastName: 'Admin',
      role: 'ADMIN',
      emailVerified: new Date(),
      isActive: true,
      tenantId: tenant.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'events@apollo-medical.com' },
    update: { password: userPassword, isActive: true, tenantId: tenant.id },
    create: {
      email: 'events@apollo-medical.com',
      password: userPassword,
      name: 'Apollo Event Manager',
      firstName: 'Apollo',
      lastName: 'Events',
      role: 'EVENT_MANAGER',
      emailVerified: new Date(),
      isActive: true,
      tenantId: tenant.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'registrations@apollo-medical.com' },
    update: { password: userPassword, isActive: true, tenantId: tenant.id },
    create: {
      email: 'registrations@apollo-medical.com',
      password: userPassword,
      name: 'Apollo Registration Manager',
      firstName: 'Apollo',
      lastName: 'Registrations',
      role: 'REGISTRATION_MANAGER',
      emailVerified: new Date(),
      isActive: true,
      tenantId: tenant.id,
    },
  });

  console.log('========================================');
  console.log('Apollo Hospitals tenant ready!\n');
  console.log('Tenant:  ' + tenant.name + '  (slug: ' + tenant.slug + ')');
  console.log('Colors:  ' + tenant.primaryColor + ' (blue)  ' + tenant.secondaryColor + ' (gold)');
  console.log('');
  console.log('Login Credentials:');
  console.log('  Administrator:    admin@apollo-medical.com / Admin@123');
  console.log('  Event Manager:    events@apollo-medical.com / User@123');
  console.log('  Reg. Manager:     registrations@apollo-medical.com / User@123');
  console.log('');
  console.log('Homepage:  http://localhost:3000/t/apollo-medical');
  console.log('Login:     http://localhost:3000/auth/login?tenant=apollo-medical');
  console.log('========================================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
