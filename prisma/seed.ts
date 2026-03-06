import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...\n");

  // ============================================================================
  // TENANTS
  // ============================================================================
  console.log("Creating tenants...");

  const tenant1 = await prisma.tenant.upsert({
    where: { slug: "apollo-medical" },
    update: {},
    create: {
      slug: "apollo-medical",
      name: "Apollo Medical College",
      tagline: "Excellence in Medical Education",
      primaryColor: "#0d9488",
      secondaryColor: "#0891b2",
      accentColor: "#10b981",
      email: "admin@apollomedical.edu",
      phone: "+91 44 2829 3333",
      city: "Chennai",
      state: "Tamil Nadu",
      country: "India",
      website: "https://apollomedical.edu",
      isActive: true,
    },
  });

  const tenant2 = await prisma.tenant.upsert({
    where: { slug: "fortis-institute" },
    update: {},
    create: {
      slug: "fortis-institute",
      name: "Fortis Institute of Research",
      tagline: "Advancing Healthcare Together",
      primaryColor: "#2563eb",
      secondaryColor: "#7c3aed",
      accentColor: "#f59e0b",
      email: "admin@fortisresearch.org",
      phone: "+91 11 4713 4000",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      website: "https://fortisresearch.org",
      isActive: true,
    },
  });

  console.log(`✅ Created 2 tenants\n`);

  // ============================================================================
  // USERS
  // ============================================================================
  console.log("Creating users...");

  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const userPassword = await bcrypt.hash("User@123", 12);

  const superAdmin = await prisma.user.upsert({
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

  // Apollo Medical tenant admin
  const apolloAdmin = await prisma.user.upsert({
    where: { email: "admin@apollo.com" },
    update: { password: adminPassword, isActive: true },
    create: {
      email: "admin@apollo.com",
      password: adminPassword,
      name: "Apollo Administrator",
      firstName: "Apollo",
      lastName: "Admin",
      role: "ADMIN",
      emailVerified: new Date(),
      isActive: true,
      tenantId: tenant1.id,
    },
  });

  // Apollo Medical tenant users
  const eventManager = await prisma.user.upsert({
    where: { email: "events@apollo.com" },
    update: { password: userPassword, isActive: true },
    create: {
      email: "events@apollo.com",
      password: userPassword,
      name: "Apollo Event Manager",
      firstName: "Apollo",
      lastName: "Events",
      role: "EVENT_MANAGER",
      emailVerified: new Date(),
      isActive: true,
      tenantId: tenant1.id,
    },
  });

  const registrationManager = await prisma.user.upsert({
    where: { email: "registrations@apollo.com" },
    update: { password: userPassword, isActive: true },
    create: {
      email: "registrations@apollo.com",
      password: userPassword,
      name: "Apollo Registration Manager",
      firstName: "Apollo",
      lastName: "Registrations",
      role: "REGISTRATION_MANAGER",
      emailVerified: new Date(),
      isActive: true,
      tenantId: tenant1.id,
    },
  });

  const certificateManager = await prisma.user.upsert({
    where: { email: "certificates@apollo.com" },
    update: { password: userPassword, isActive: true },
    create: {
      email: "certificates@apollo.com",
      password: userPassword,
      name: "Apollo Certificate Manager",
      firstName: "Apollo",
      lastName: "Certificates",
      role: "CERTIFICATE_MANAGER",
      emailVerified: new Date(),
      isActive: true,
      tenantId: tenant1.id,
    },
  });

  const attendee = await prisma.user.upsert({
    where: { email: "attendee@apollo.com" },
    update: { password: userPassword, isActive: true },
    create: {
      email: "attendee@apollo.com",
      password: userPassword,
      name: "Dr. Ravi Shankar",
      firstName: "Ravi",
      lastName: "Shankar",
      role: "ATTENDEE",
      phone: "+91 98765 43210",
      emailVerified: new Date(),
      isActive: true,
      tenantId: tenant1.id,
    },
  });

  // Fortis Institute tenant admin
  const fortisAdmin = await prisma.user.upsert({
    where: { email: "admin@fortis.com" },
    update: { password: adminPassword, isActive: true },
    create: {
      email: "admin@fortis.com",
      password: adminPassword,
      name: "Fortis Administrator",
      firstName: "Fortis",
      lastName: "Admin",
      role: "ADMIN",
      emailVerified: new Date(),
      isActive: true,
      tenantId: tenant2.id,
    },
  });

  // Fortis Institute tenant users
  const fortisEventManager = await prisma.user.upsert({
    where: { email: "events@fortis.com" },
    update: { password: userPassword, isActive: true },
    create: {
      email: "events@fortis.com",
      password: userPassword,
      name: "Fortis Event Manager",
      firstName: "Fortis",
      lastName: "Events",
      role: "EVENT_MANAGER",
      emailVerified: new Date(),
      isActive: true,
      tenantId: tenant2.id,
    },
  });

  const fortisRegManager = await prisma.user.upsert({
    where: { email: "registrations@fortis.com" },
    update: { password: userPassword, isActive: true },
    create: {
      email: "registrations@fortis.com",
      password: userPassword,
      name: "Fortis Registration Manager",
      firstName: "Fortis",
      lastName: "Registrations",
      role: "REGISTRATION_MANAGER",
      emailVerified: new Date(),
      isActive: true,
      tenantId: tenant2.id,
    },
  });

  const fortisCertManager = await prisma.user.upsert({
    where: { email: "certificates@fortis.com" },
    update: { password: userPassword, isActive: true },
    create: {
      email: "certificates@fortis.com",
      password: userPassword,
      name: "Fortis Certificate Manager",
      firstName: "Fortis",
      lastName: "Certificates",
      role: "CERTIFICATE_MANAGER",
      emailVerified: new Date(),
      isActive: true,
      tenantId: tenant2.id,
    },
  });

  const fortisAttendee = await prisma.user.upsert({
    where: { email: "attendee@fortis.com" },
    update: { password: userPassword, isActive: true },
    create: {
      email: "attendee@fortis.com",
      password: userPassword,
      name: "Dr. Neha Gupta",
      firstName: "Neha",
      lastName: "Gupta",
      role: "ATTENDEE",
      phone: "+91 87654 32100",
      emailVerified: new Date(),
      isActive: true,
      tenantId: tenant2.id,
    },
  });

  console.log(`✅ Created 11 users (1 super admin + 5 per tenant)\n`);

  // ============================================================================
  // SPEAKERS
  // ============================================================================
  console.log("Creating speakers...");

  // Apollo Medical speakers
  const speakers = await Promise.all([
    prisma.speaker.upsert({
      where: { email: "rajesh.kumar@aiims.edu" },
      update: {},
      create: {
        name: "Dr. Rajesh Kumar",
        email: "rajesh.kumar@aiims.edu",
        phone: "+91 98765 43210",
        designation: "Professor & Head",
        department: "Neurology",
        institution: "AIIMS, New Delhi",
        biography:
          "Dr. Rajesh Kumar is a renowned neurologist with over 25 years of experience in movement disorders and deep brain stimulation. He has published over 150 research papers and trained numerous specialists.",
        linkedin: "https://linkedin.com/in/drrajeshkumar",
        twitter: "https://twitter.com/drrajeshk",
        isActive: true,
        tenantId: tenant1.id,
      },
    }),
    prisma.speaker.upsert({
      where: { email: "priya.sharma@cmcvellore.ac.in" },
      update: {},
      create: {
        name: "Dr. Priya Sharma",
        email: "priya.sharma@cmcvellore.ac.in",
        phone: "+91 87654 32109",
        designation: "Associate Professor",
        department: "Neurosurgery",
        institution: "CMC Vellore",
        biography:
          "Dr. Priya Sharma specializes in minimally invasive neurosurgery and has pioneered several techniques in endoscopic surgery. She is an award-winning researcher and educator.",
        linkedin: "https://linkedin.com/in/drpriyasharma",
        isActive: true,
        tenantId: tenant1.id,
      },
    }),
    prisma.speaker.upsert({
      where: { email: "amit.patel@kokilaben.com" },
      update: {},
      create: {
        name: "Dr. Amit Patel",
        email: "amit.patel@kokilaben.com",
        phone: "+91 76543 21098",
        designation: "Consultant Neurophysiologist",
        department: "Clinical Neurophysiology",
        institution: "Kokilaben Hospital, Mumbai",
        biography:
          "Dr. Amit Patel is an expert in intraoperative neurophysiological monitoring with experience in over 5000 surgeries.",
        isActive: true,
        tenantId: tenant1.id,
      },
    }),
    // Fortis Institute speakers
    prisma.speaker.upsert({
      where: { email: "sarah.johnson@jhu.edu" },
      update: {},
      create: {
        name: "Dr. Sarah Johnson",
        email: "sarah.johnson@jhu.edu",
        phone: "+1 410 555 0123",
        designation: "Professor",
        department: "Neuroscience",
        institution: "Johns Hopkins University, USA",
        biography:
          "Dr. Sarah Johnson is a leading researcher in brain-computer interfaces and neural engineering. She leads a team of 30 researchers at Johns Hopkins.",
        website: "https://www.sarahjohnsonlab.com",
        isActive: true,
        tenantId: tenant2.id,
      },
    }),
    prisma.speaker.upsert({
      where: { email: "deepak.verma@fortis.com" },
      update: {},
      create: {
        name: "Dr. Deepak Verma",
        email: "deepak.verma@fortis.com",
        phone: "+91 99887 76654",
        designation: "Director",
        department: "Cardiology",
        institution: "Fortis Heart Institute, Delhi",
        biography:
          "Dr. Deepak Verma is a leading cardiologist specializing in interventional procedures. He has performed over 10,000 angioplasties.",
        linkedin: "https://linkedin.com/in/drdeepakverma",
        isActive: true,
        tenantId: tenant2.id,
      },
    }),
    prisma.speaker.upsert({
      where: { email: "kavita.nair@fortis.com" },
      update: {},
      create: {
        name: "Dr. Kavita Nair",
        email: "kavita.nair@fortis.com",
        phone: "+91 88776 65543",
        designation: "Senior Consultant",
        department: "Oncology",
        institution: "Fortis Memorial Research Institute",
        biography:
          "Dr. Kavita Nair is a specialist in precision oncology and immunotherapy. She has contributed to several landmark clinical trials.",
        isActive: true,
        tenantId: tenant2.id,
      },
    }),
  ]);

  console.log(`✅ Created ${speakers.length} speakers (3 Apollo + 3 Fortis)\n`);

  // ============================================================================
  // SPONSORS
  // ============================================================================
  console.log("Creating sponsors...");

  // Apollo Medical sponsors
  const sponsors = await Promise.all([
    prisma.sponsor.upsert({
      where: { id: "medtronic-sponsor" },
      update: {},
      create: {
        id: "medtronic-sponsor",
        name: "Medtronic",
        email: "partnerships@medtronic.com",
        description:
          "Global leader in medical technology, services, and solutions.",
        website: "https://www.medtronic.com",
        isActive: true,
        tenantId: tenant1.id,
      },
    }),
    prisma.sponsor.upsert({
      where: { id: "abbott-sponsor" },
      update: {},
      create: {
        id: "abbott-sponsor",
        name: "Abbott",
        email: "contact@abbott.com",
        description:
          "Global healthcare company creating breakthrough products in diagnostics, medical devices, nutrition and branded generic pharmaceuticals.",
        website: "https://www.abbott.com",
        isActive: true,
        tenantId: tenant1.id,
      },
    }),
    // Fortis Institute sponsors
    prisma.sponsor.upsert({
      where: { id: "boston-scientific-sponsor" },
      update: {},
      create: {
        id: "boston-scientific-sponsor",
        name: "Boston Scientific",
        email: "info@bostonscientific.com",
        description:
          "Dedicated to transforming lives through innovative medical solutions.",
        website: "https://www.bostonscientific.com",
        isActive: true,
        tenantId: tenant2.id,
      },
    }),
    prisma.sponsor.upsert({
      where: { id: "stryker-sponsor" },
      update: {},
      create: {
        id: "stryker-sponsor",
        name: "Stryker",
        email: "contact@stryker.com",
        description:
          "One of the world's leading medical technology companies.",
        website: "https://www.stryker.com",
        isActive: true,
        tenantId: tenant2.id,
      },
    }),
  ]);

  console.log(`✅ Created ${sponsors.length} sponsors (2 Apollo + 2 Fortis)\n`);

  // ============================================================================
  // EVENTS
  // ============================================================================
  console.log("Creating events...");

  // Fixed demo dates
  const tomorrow = new Date("2026-01-07T00:00:00");
  const dayAfterTomorrow = new Date("2026-01-08T00:00:00");

  const futureDate = (days: number) => {
    const date = new Date(tomorrow);
    date.setDate(date.getDate() + days);
    return date;
  };
  const pastDate = (days: number) => {
    const date = new Date(tomorrow);
    date.setDate(date.getDate() - days);
    return date;
  };

  const events = await Promise.all([
    prisma.event.upsert({
      where: { slug: "national-neurostimulation-summit-2026" },
      update: {},
      create: {
        title: "National Neurostimulation Summit 2026",
        slug: "national-neurostimulation-summit-2026",
        shortDescription:
          "Premier conference bringing together leading experts in neurostimulation technologies.",
        description:
          "Join us for the most comprehensive neurostimulation conference in India. This two-day summit features keynote presentations, hands-on workshops, and networking opportunities with pioneers in the field of deep brain stimulation, spinal cord stimulation, and emerging neuromodulation technologies.",
        startDate: dayAfterTomorrow, // Jan 8, 2026
        endDate: futureDate(2), // Jan 9, 2026
        startTime: "09:00",
        endTime: "17:00",
        timezone: "Asia/Kolkata",
        location: "Grand Conference Hall, AIIMS",
        address: "Ansari Nagar, New Delhi",
        city: "New Delhi",
        state: "Delhi",
        country: "India",
        capacity: 200,
        price: 5000,
        earlyBirdPrice: 4000,
        earlyBirdDeadline: tomorrow,
        registrationDeadline: dayAfterTomorrow,
        currency: "INR",
        status: "UPCOMING",
        type: "CONFERENCE",
        category: "Neurology",
        cmeCredits: 16,
        organizer: "Indian Neurostimulation Society",
        contactEmail: "contact@neurostim.org",
        contactPhone: "+91 11 2659 3000",
        website: "https://neurostim.org",
        isPublished: true,
        isFeatured: true,
        isRegistrationOpen: true,
        tenantId: tenant1.id,
      },
    }),
    prisma.event.upsert({
      where: { slug: "deep-brain-stimulation-workshop-2026" },
      update: {},
      create: {
        title: "Deep Brain Stimulation Hands-on Workshop",
        slug: "deep-brain-stimulation-workshop-2026",
        shortDescription:
          "Intensive hands-on workshop on DBS programming and patient management.",
        description:
          "This workshop provides comprehensive training on deep brain stimulation programming, troubleshooting, and patient management. Limited seats to ensure personalized attention.",
        startDate: futureDate(25),
        endDate: futureDate(25),
        startTime: "09:00",
        endTime: "17:00",
        timezone: "Asia/Kolkata",
        location: "Simulation Lab, CMC",
        address: "Ida Scudder Road",
        city: "Vellore",
        state: "Tamil Nadu",
        country: "India",
        capacity: 30,
        price: 3800,
        currency: "INR",
        status: "UPCOMING",
        type: "WORKSHOP",
        category: "Surgery",
        cmeCredits: 8,
        organizer: "CMC Vellore Neurosciences",
        contactEmail: "neuro@cmcvellore.ac.in",
        isPublished: true,
        isFeatured: false,
        isRegistrationOpen: true,
        tenantId: tenant1.id,
      },
    }),
    prisma.event.upsert({
      where: { slug: "epilepsy-management-cme-2026" },
      update: {},
      create: {
        title: "Epilepsy Management CME Session",
        slug: "epilepsy-management-cme-2026",
        shortDescription:
          "Update on latest advances in epilepsy diagnosis and treatment.",
        description:
          "A comprehensive CME session covering the latest guidelines in epilepsy management, new anti-epileptic drugs, and surgical options for drug-resistant epilepsy.",
        startDate: tomorrow, // Jan 7, 2026
        endDate: tomorrow, // Jan 7, 2026
        startTime: "14:00",
        endTime: "18:00",
        timezone: "Asia/Kolkata",
        location: "Conference Room A, NIMHANS",
        address: "Hosur Road",
        city: "Bangalore",
        state: "Karnataka",
        country: "India",
        capacity: 80,
        price: 1500,
        currency: "INR",
        status: "UPCOMING",
        type: "CME",
        category: "Neurology",
        cmeCredits: 4,
        organizer: "NIMHANS",
        contactEmail: "cme@nimhans.ac.in",
        isPublished: true,
        isFeatured: false,
        isRegistrationOpen: true,
        tenantId: tenant1.id,
      },
    }),
    prisma.event.upsert({
      where: { slug: "neural-engineering-symposium-2026" },
      update: {},
      create: {
        title: "Neural Engineering Research Symposium",
        slug: "neural-engineering-symposium-2026",
        shortDescription:
          "Virtual symposium on cutting-edge neural engineering research.",
        description:
          "An online symposium featuring presentations from leading researchers in neural engineering, brain-computer interfaces, and neuroprosthetics.",
        startDate: futureDate(35),
        endDate: futureDate(35),
        startTime: "10:00",
        endTime: "18:00",
        timezone: "Asia/Kolkata",
        location: "Virtual Event",
        isVirtual: true,
        virtualLink: "https://zoom.us/j/example",
        capacity: 500,
        price: 1500,
        currency: "INR",
        status: "UPCOMING",
        type: "SYMPOSIUM",
        category: "Research",
        cmeCredits: 8,
        organizer: "IIT Delhi Biomedical Engineering",
        contactEmail: "neuroeng@iitd.ac.in",
        isPublished: true,
        isFeatured: true,
        isRegistrationOpen: true,
        tenantId: tenant2.id,
      },
    }),
    prisma.event.upsert({
      where: { slug: "movement-disorders-update-2025" },
      update: {},
      create: {
        title: "Movement Disorders Update 2025",
        slug: "movement-disorders-update-2025",
        shortDescription:
          "Annual update on Parkinson's disease and movement disorders.",
        description:
          "Comprehensive update on the latest developments in movement disorders, including new treatments for Parkinson's disease, dystonia, and tremor.",
        startDate: pastDate(10),
        endDate: pastDate(10),
        startTime: "09:00",
        endTime: "13:00",
        timezone: "Asia/Kolkata",
        location: "Auditorium, KEM Hospital",
        address: "Parel",
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
        capacity: 65,
        price: 1200,
        currency: "INR",
        status: "COMPLETED",
        type: "CME",
        category: "Neurology",
        cmeCredits: 4,
        organizer: "KEM Hospital Neurology",
        contactEmail: "neuro@kemhospital.org",
        isPublished: true,
        isFeatured: false,
        isRegistrationOpen: false,
        tenantId: tenant2.id,
      },
    }),
    prisma.event.upsert({
      where: { slug: "medical-ai-innovation-forum-2026" },
      update: {},
      create: {
        title: "Medical AI & Innovation Forum 2026",
        slug: "medical-ai-innovation-forum-2026",
        shortDescription:
          "Exploring the future of AI in healthcare and medical diagnostics.",
        description:
          "A forward-looking conference on artificial intelligence applications in healthcare, featuring demos, panel discussions, and startup showcases.",
        startDate: futureDate(60),
        endDate: futureDate(60),
        startTime: "10:00",
        endTime: "18:00",
        timezone: "Asia/Kolkata",
        location: "HICC",
        address: "Madhapur",
        city: "Hyderabad",
        state: "Telangana",
        country: "India",
        capacity: 250,
        price: 2500,
        currency: "INR",
        status: "DRAFT",
        type: "CONFERENCE",
        category: "Research",
        cmeCredits: 6,
        organizer: "HealthTech India",
        isPublished: false,
        isFeatured: false,
        isRegistrationOpen: false,
        tenantId: tenant2.id,
      },
    }),
  ]);

  console.log(`✅ Created ${events.length} events (3 Apollo + 3 Fortis)\n`);

  // ============================================================================
  // EVENT SPEAKERS
  // ============================================================================
  console.log("Assigning speakers to events...");

  const eventSpeakerAssignments = await Promise.all([
    // Apollo events[0] speakers (Apollo tenant speakers)
    prisma.eventSpeaker.upsert({
      where: {
        eventId_speakerId: {
          eventId: events[0].id,
          speakerId: speakers[0].id,
        },
      },
      update: {},
      create: {
        eventId: events[0].id,
        speakerId: speakers[0].id,
        topic: "Advances in Deep Brain Stimulation",
        sessionDate: events[0].startDate,
        sessionTime: "09:30 - 11:00",
        sessionOrder: 1,
        status: "confirmed",
        isPublished: true,
      },
    }),
    prisma.eventSpeaker.upsert({
      where: {
        eventId_speakerId: {
          eventId: events[0].id,
          speakerId: speakers[1].id,
        },
      },
      update: {},
      create: {
        eventId: events[0].id,
        speakerId: speakers[1].id,
        topic: "Minimally Invasive Neurosurgical Techniques",
        sessionDate: events[0].startDate,
        sessionTime: "11:30 - 13:00",
        sessionOrder: 2,
        status: "confirmed",
        isPublished: true,
      },
    }),
    // Apollo events[1] speaker
    prisma.eventSpeaker.upsert({
      where: {
        eventId_speakerId: {
          eventId: events[1].id,
          speakerId: speakers[2].id,
        },
      },
      update: {},
      create: {
        eventId: events[1].id,
        speakerId: speakers[2].id,
        topic: "Intraoperative Neurophysiological Monitoring",
        sessionDate: events[1].startDate,
        sessionTime: "09:00 - 12:00",
        sessionOrder: 1,
        status: "confirmed",
        isPublished: true,
      },
    }),
    // Fortis events[3] speakers (Fortis tenant speakers)
    prisma.eventSpeaker.upsert({
      where: {
        eventId_speakerId: {
          eventId: events[3].id,
          speakerId: speakers[3].id,
        },
      },
      update: {},
      create: {
        eventId: events[3].id,
        speakerId: speakers[3].id,
        topic: "Future of Brain-Computer Interfaces",
        sessionDate: events[3].startDate,
        sessionTime: "10:00 - 11:30",
        sessionOrder: 1,
        status: "confirmed",
        isPublished: true,
      },
    }),
    prisma.eventSpeaker.upsert({
      where: {
        eventId_speakerId: {
          eventId: events[3].id,
          speakerId: speakers[4].id,
        },
      },
      update: {},
      create: {
        eventId: events[3].id,
        speakerId: speakers[4].id,
        topic: "AI-Driven Cardiac Diagnostics",
        sessionDate: events[3].startDate,
        sessionTime: "14:00 - 15:30",
        sessionOrder: 2,
        status: "confirmed",
        isPublished: true,
      },
    }),
    prisma.eventSpeaker.upsert({
      where: {
        eventId_speakerId: {
          eventId: events[4].id,
          speakerId: speakers[5].id,
        },
      },
      update: {},
      create: {
        eventId: events[4].id,
        speakerId: speakers[5].id,
        topic: "Precision Medicine in Oncology",
        sessionDate: events[4].startDate,
        sessionTime: "09:00 - 11:00",
        sessionOrder: 1,
        status: "confirmed",
        isPublished: true,
      },
    }),
  ]);

  console.log(`✅ Created ${eventSpeakerAssignments.length} speaker assignments\n`);

  // ============================================================================
  // EVENT SPONSORS
  // ============================================================================
  console.log("Assigning sponsors to events...");

  const eventSponsorAssignments = await Promise.all([
    // Apollo events with Apollo sponsors
    prisma.eventSponsor.upsert({
      where: {
        eventId_sponsorId: {
          eventId: events[0].id,
          sponsorId: sponsors[0].id,
        },
      },
      update: {},
      create: {
        eventId: events[0].id,
        sponsorId: sponsors[0].id,
        tier: "PLATINUM",
        displayOrder: 1,
        isPublished: true,
      },
    }),
    prisma.eventSponsor.upsert({
      where: {
        eventId_sponsorId: {
          eventId: events[0].id,
          sponsorId: sponsors[1].id,
        },
      },
      update: {},
      create: {
        eventId: events[0].id,
        sponsorId: sponsors[1].id,
        tier: "GOLD",
        displayOrder: 2,
        isPublished: true,
      },
    }),
    prisma.eventSponsor.upsert({
      where: {
        eventId_sponsorId: {
          eventId: events[1].id,
          sponsorId: sponsors[0].id,
        },
      },
      update: {},
      create: {
        eventId: events[1].id,
        sponsorId: sponsors[0].id,
        tier: "GOLD",
        displayOrder: 1,
        isPublished: true,
      },
    }),
    // Fortis events with Fortis sponsors
    prisma.eventSponsor.upsert({
      where: {
        eventId_sponsorId: {
          eventId: events[3].id,
          sponsorId: sponsors[2].id,
        },
      },
      update: {},
      create: {
        eventId: events[3].id,
        sponsorId: sponsors[2].id,
        tier: "PLATINUM",
        displayOrder: 1,
        isPublished: true,
      },
    }),
    prisma.eventSponsor.upsert({
      where: {
        eventId_sponsorId: {
          eventId: events[3].id,
          sponsorId: sponsors[3].id,
        },
      },
      update: {},
      create: {
        eventId: events[3].id,
        sponsorId: sponsors[3].id,
        tier: "GOLD",
        displayOrder: 2,
        isPublished: true,
      },
    }),
    prisma.eventSponsor.upsert({
      where: {
        eventId_sponsorId: {
          eventId: events[4].id,
          sponsorId: sponsors[2].id,
        },
      },
      update: {},
      create: {
        eventId: events[4].id,
        sponsorId: sponsors[2].id,
        tier: "SILVER",
        displayOrder: 1,
        isPublished: true,
      },
    }),
  ]);

  console.log(`✅ Created ${eventSponsorAssignments.length} sponsor assignments\n`);

  // ============================================================================
  // REGISTRATIONS
  // ============================================================================
  console.log("Creating registrations...");

  const registrations = await Promise.all([
    prisma.registration.upsert({
      where: {
        email_eventId: {
          email: "priya.sharma@hospital.in",
          eventId: events[0].id,
        },
      },
      update: {},
      create: {
        name: "Dr. Priya Sharma",
        email: "priya.sharma@hospital.in",
        phone: "+91 98765 43210",
        organization: "City Hospital",
        designation: "Senior Consultant",
        category: "Faculty",
        eventId: events[0].id,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        amount: 4000,
        currency: "INR",
        paidAt: new Date(),
      },
    }),
    prisma.registration.upsert({
      where: {
        email_eventId: {
          email: "rajesh.kumar@medcollege.edu",
          eventId: events[0].id,
        },
      },
      update: {},
      create: {
        name: "Dr. Rajesh Kumar",
        email: "rajesh.kumar@medcollege.edu",
        phone: "+91 87654 32109",
        organization: "Government Medical College",
        designation: "Assistant Professor",
        category: "Faculty",
        eventId: events[0].id,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        amount: 4000,
        currency: "INR",
        paidAt: new Date(),
      },
    }),
    prisma.registration.upsert({
      where: {
        email_eventId: {
          email: "ananya.patel@aiims.edu",
          eventId: events[0].id,
        },
      },
      update: {},
      create: {
        name: "Dr. Ananya Patel",
        email: "ananya.patel@aiims.edu",
        phone: "+91 76543 21098",
        organization: "AIIMS Delhi",
        designation: "Senior Resident",
        category: "Resident/Fellow",
        eventId: events[0].id,
        status: "PENDING",
        paymentStatus: "PENDING",
        amount: 4000,
        currency: "INR",
      },
    }),
    prisma.registration.upsert({
      where: {
        email_eventId: {
          email: "vikram.singh@apollo.com",
          eventId: events[0].id,
        },
      },
      update: {},
      create: {
        name: "Dr. Vikram Singh",
        email: "vikram.singh@apollo.com",
        phone: "+91 65432 10987",
        organization: "Apollo Hospital",
        designation: "Consultant Neurologist",
        category: "Faculty",
        eventId: events[0].id,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        amount: 5000,
        currency: "INR",
        paidAt: new Date(),
      },
    }),
    prisma.registration.upsert({
      where: {
        email_eventId: {
          email: "meera.krishnan@fortis.com",
          eventId: events[0].id,
        },
      },
      update: {},
      create: {
        name: "Dr. Meera Krishnan",
        email: "meera.krishnan@fortis.com",
        phone: "+91 54321 09876",
        organization: "Fortis Hospital",
        designation: "Junior Resident",
        category: "Resident/Fellow",
        eventId: events[0].id,
        status: "WAITLIST",
        paymentStatus: "PENDING",
        amount: 4000,
        currency: "INR",
      },
    }),
    prisma.registration.upsert({
      where: {
        email_eventId: {
          email: "sanjay.reddy@maxhealthcare.com",
          eventId: events[1].id,
        },
      },
      update: {},
      create: {
        name: "Dr. Sanjay Reddy",
        email: "sanjay.reddy@maxhealthcare.com",
        phone: "+91 43210 98765",
        organization: "Max Healthcare",
        designation: "Senior Consultant",
        category: "Faculty",
        eventId: events[1].id,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        amount: 3800,
        currency: "INR",
        paidAt: new Date(),
      },
    }),
    // Completed event registrations with ATTENDED status
    prisma.registration.upsert({
      where: {
        email_eventId: {
          email: "arun.mehta@kem.edu",
          eventId: events[4].id,
        },
      },
      update: {},
      create: {
        name: "Dr. Arun Mehta",
        email: "arun.mehta@kem.edu",
        phone: "+91 32109 87654",
        organization: "KEM Hospital",
        designation: "Professor",
        category: "Faculty",
        eventId: events[4].id,
        status: "ATTENDED",
        paymentStatus: "PAID",
        amount: 1200,
        currency: "INR",
        paidAt: pastDate(15),
        attendanceStatus: "checked_in",
        checkedInAt: pastDate(10),
      },
    }),
    prisma.registration.upsert({
      where: {
        email_eventId: {
          email: "sunita.patel@kem.edu",
          eventId: events[4].id,
        },
      },
      update: {},
      create: {
        name: "Dr. Sunita Patel",
        email: "sunita.patel@kem.edu",
        phone: "+91 21098 76543",
        organization: "KEM Hospital",
        designation: "Associate Professor",
        category: "Faculty",
        eventId: events[4].id,
        status: "ATTENDED",
        paymentStatus: "PAID",
        amount: 1200,
        currency: "INR",
        paidAt: pastDate(15),
        attendanceStatus: "checked_in",
        checkedInAt: pastDate(10),
      },
    }),
  ]);

  console.log(`✅ Created ${registrations.length} registrations\n`);

  // ============================================================================
  // CERTIFICATES
  // ============================================================================
  console.log("Creating certificates...");

  const certificates = await Promise.all([
    prisma.certificate.upsert({
      where: { registrationId: registrations[6].id },
      update: {},
      create: {
        certificateCode: "ICMS-2025-CME-001",
        registrationId: registrations[6].id,
        eventId: events[4].id,
        recipientName: "Dr. Arun Mehta",
        recipientEmail: "arun.mehta@kem.edu",
        title: "Certificate of Participation",
        description: "For successful completion of Movement Disorders Update 2025",
        cmeCredits: 4,
        status: "ISSUED",
        issuedAt: pastDate(9),
        downloadCount: 2,
      },
    }),
    prisma.certificate.upsert({
      where: { registrationId: registrations[7].id },
      update: {},
      create: {
        certificateCode: "ICMS-2025-CME-002",
        registrationId: registrations[7].id,
        eventId: events[4].id,
        recipientName: "Dr. Sunita Patel",
        recipientEmail: "sunita.patel@kem.edu",
        title: "Certificate of Participation",
        description: "For successful completion of Movement Disorders Update 2025",
        cmeCredits: 4,
        status: "ISSUED",
        issuedAt: pastDate(9),
        downloadCount: 1,
      },
    }),
  ]);

  console.log(`✅ Created ${certificates.length} certificates\n`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("========================================");
  console.log("🎉 Seed completed successfully!\n");
  console.log("Tenants:");
  console.log("----------------------------------------");
  console.log(`  Apollo Medical College  (slug: apollo-medical)`);
  console.log(`  Fortis Institute of Research  (slug: fortis-institute)`);
  console.log("");
  console.log("Login Credentials:");
  console.log("----------------------------------------");
  console.log("Super Admin (all tenants): admin@icms.com / Admin@123");
  console.log("");
  console.log("Apollo Medical:");
  console.log("  Administrator:  admin@apollo.com / Admin@123");
  console.log("  Event Manager:  events@apollo.com / User@123");
  console.log("  Reg. Manager:   registrations@apollo.com / User@123");
  console.log("  Cert. Manager:  certificates@apollo.com / User@123");
  console.log("  Attendee:       attendee@apollo.com / User@123");
  console.log("");
  console.log("Fortis Institute:");
  console.log("  Administrator:  admin@fortis.com / Admin@123");
  console.log("  Event Manager:  events@fortis.com / User@123");
  console.log("  Reg. Manager:   registrations@fortis.com / User@123");
  console.log("  Cert. Manager:  certificates@fortis.com / User@123");
  console.log("  Attendee:       attendee@fortis.com / User@123");
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
