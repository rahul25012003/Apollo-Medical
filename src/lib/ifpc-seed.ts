/**
 * IFPC 2026 — content + event seed for the apollo-medical tenant.
 *
 * Extracted so it can run BOTH from the CLI (prisma/seed-ifpc-2026.ts) and
 * from the protected setup endpoint (/api/setup/ifpc), because Render's
 * managed Postgres has no external connection string — the seed can only be
 * run from inside the deployed app.
 *
 * Scope: only ever touches the apollo-medical Tenant row and its own
 * events/speakers. It never reads or writes any other tenant's data.
 */

import type { PrismaClient } from "@prisma/client";

const d = (s: string) => new Date(s);

export async function seedIfpc2026(prisma: PrismaClient) {
  console.log("IFPC 2026 — content + event seed\n");

  const tenant = await prisma.tenant.findUnique({ where: { slug: "apollo-medical" } });
  if (!tenant) throw new Error("apollo-medical tenant not found — run prisma/seed-tenant.ts first");
  console.log(`Tenant: ${tenant.name} (${tenant.id})\n`);

  // ── 1. Tenant content ──────────────────────────────────────────────────
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      name: "International Forensic Psychiatry Conference 2026",
      shortName: "IFPC 2026",
      tagline: "Bridging the Gap",
      // Official NIMHANS logo, sourced from forensicpsychiatry.in
      favicon: "/ifpc/nimhans-logo.png",
      email: "fpnimhans@gmail.com",
      phone: "+91 7760504068",
      address: "NIMHANS Convention Centre, Hosur Road",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      website: "https://forensicpsychiatry.in",
      mapUrl: "https://www.google.com/maps?q=NIMHANS+Convention+Centre,+Hosur+Road,+Bengaluru&output=embed",
      facebook: null,
      twitter: null,
      linkedin: "https://linkedin.com/company/113258209",
      instagram: "https://instagram.com/forensicpsychiatryin",
      youtube: "https://youtube.com/@forensicpsychiatryin",

      heroTitle: "Bridging the Gap",
      heroSubtitle: "International Forensic Psychiatry Conference (IFPC) 2026 — a global gathering advancing forensic psychiatry knowledge and practice. 2–5 November 2026, NIMHANS Convention Centre, Bengaluru, India. Hosted by NIMHANS, Bengaluru & RANZCP.",
      // Real photo of the NIMHANS Convention Centre, sourced from forensicpsychiatry.in
      heroBgImage: "/ifpc/convention-centre.jpg",

      aboutTitle: "About IFPC 2026",
      aboutDescription: "Join forensic psychiatrists, mental health professionals, and legal experts from around the world at the National Institute of Mental Health and Neuro Sciences (NIMHANS), Bengaluru, India, for a global gathering dedicated to advancing forensic psychiatry knowledge and practice. Co-hosted by NIMHANS, Bengaluru and RANZCP, the conference brings together clinicians, researchers, trainees, and law professionals for four days of expert-led sessions, workshops, and collaborative discussion.",
      aboutFeatures: [
        { icon: "GraduationCap", title: "Expert Plenary Lectures", description: "Expert plenary lectures from national and international faculty." },
        { icon: "Microscope", title: "Interactive Workshops", description: "Interactive sessions and case-based workshops." },
        { icon: "Shield", title: "Dedicated Professional Tracks", description: "Dedicated tracks for psychiatry trainees, psychiatrists, forensic medicine professionals, mental health professionals, and law professionals." },
        { icon: "Globe", title: "Global Collaboration", description: "Cross-country learning through Australia–New Zealand–India collaboration." },
        { icon: "Heart", title: "Cultural & Delegate Experience", description: "Cultural programme, networking dinners, campus tour, and wellness sessions." },
      ],
      aboutImages: [],

      galleryImages: [],
      galleryVideos: [],
      testimonials: [],
      // yearlyStats cleared separately below via raw SQL (Prisma's typed update
      // can't easily express "set this Json column to NULL" here).

      faqs: [
        { id: 1, question: "When and where is the conference being held?", answer: "IFPC 2026 will be held from 2–5 November 2026 at the NIMHANS Convention Centre, Hosur Road, Bengaluru, India." },
        { id: 2, question: "Who is organising the conference?", answer: "The conference is co-hosted by NIMHANS, Bengaluru and RANZCP (the Royal Australian and New Zealand College of Psychiatrists)." },
        { id: 3, question: "What is the theme of IFPC 2026?", answer: "The theme is 'Bridging the Gap,' focused on strengthening the interface between research, clinical practice, law, and rehabilitation in forensic psychiatry, and on deepening collaboration between Australia, New Zealand, and India." },
        { id: 4, question: "Who should attend?", answer: "The conference is designed for psychiatry trainees, psychiatrists, forensic medicine professionals, mental health professionals, and law professionals." },
        { id: 5, question: "How do I register, and what does registration include?", answer: "Registration is completed through the official registration portal. It includes access to all workshops and scientific sessions, daily lunch, snacks and refreshments, the two-day cultural programme, and two official conference dinners. Accommodation is not included." },
        { id: 6, question: "Are there different registration fees for Indian and international delegates?", answer: "Yes. Separate early-bird and standard fees apply for Indian Delegates, Indian Trainee Delegates, International Delegates, and International Trainee Delegates. Full fee details are available on the Registration page." },
        { id: 7, question: "How do I submit an abstract, and what is the deadline?", answer: "Abstracts are submitted online through the official abstract submission portal. The submission deadline is 15 September 2026 (extended). Full formatting and category guidelines are available on the Abstract Submission page." },
        { id: 8, question: "Do presenters need to register separately?", answer: "Yes. All presenters must register for the conference for their presentation to be included in the programme. Accepting an abstract does not include travel, accommodation, registration costs, or a presenter fee." },
        { id: 9, question: "Are CME or credit points available?", answer: "KMC credit points are available for Indian doctors under the NMC Act, 2019." },
        { id: 10, question: "What optional activities are available to delegates?", answer: "Registered delegates can enquire at the Registration Desk about the guided NIMHANS campus tour and the complimentary daily morning yoga sessions." },
        { id: 11, question: "What is the weather like in November, and what should I pack?", answer: "Bengaluru is pleasant in November, with daytime temperatures of 18–25°C. A light jacket is recommended for cooler evenings, along with comfortable walking shoes and a compact umbrella for occasional showers." },
        { id: 12, question: "Whom do I contact for further questions?", answer: "For general queries, email fpnimhans@gmail.com or contact the Conference Manager, Dr. Madhu Sudhan R M, at dr.madhusudhanrm@gmail.com / +91 7760504068." },
      ],
      researchItems: [],

      footerText: "International Forensic Psychiatry Conference 2026 — Bridging the Gap",
      copyrightText: "© 2026 International Forensic Psychiatry Conference. All rights reserved.",

      sections: {
        hero: true, events: true, gallery: false, sponsors: false,
        testimonials: false, about: true, contact: true, faq: true,
        ongoingResearch: false,
        moduleSpeakers: true, moduleSponsors: true, moduleCertificates: true,
        moduleRegistrations: true, notifyRegistrations: true, notifyPayments: true,
      },
    },
  });
  // yearlyStats has no JSON-null helper via the typed update above — clear it explicitly.
  await prisma.$executeRawUnsafe(`UPDATE tenants SET "yearlyStats" = NULL WHERE id = $1`, tenant.id);
  console.log("Tenant content updated to IFPC 2026.\n");

  // ── 1b. Deactivate leftover demo sponsors (pharma companies from the old
  // Apollo cardiology demo) — sponsors are fetched tenant-wide (not per-event),
  // so they'd otherwise still show in the footer "Our Partners" strip even
  // after the demo events themselves are deleted. No real sponsors exist for
  // IFPC 2026 per the source content, so these are simply switched off.
  const deactivatedSponsors = await prisma.sponsor.updateMany({
    where: { tenantId: tenant.id, isActive: true },
    data: { isActive: false },
  });
  console.log(`Deactivated ${deactivatedSponsors.count} leftover demo sponsor(s).\n`);

  // ── 2. Remove fake Apollo demo events ──────────────────────────────────
  const DEMO_SLUGS = [
    "apollo-cardiology-summit-2026",
    "apollo-healthcare-innovation-forum-2026",
    "apollo-surgical-excellence-workshop-2026",
    "apollo-international-medical-congress-2026",
  ];
  for (const slug of DEMO_SLUGS) {
    const ev = await prisma.event.findUnique({ where: { slug } });
    if (ev) { await prisma.event.delete({ where: { slug } }); console.log(`Deleted demo event: ${slug}`); }
  }
  console.log();

  // ── 3. Speakers (no email supplied in source content — left null) ─────
  console.log("Creating speakers...");
  const SPEAKER_DATA = [
    { name: "Prof. Suresh Bada Math", institution: "India" },
    { name: "Dr. Vinesh Gupta", institution: "Australia" },
    { name: "Dr. Jacqueline Short", institution: "New Zealand" },
    { name: "Prof. Rajan Darjee", institution: "Australia" },
    { name: "Dr. Kerri Eagle", institution: "Australia" },
    { name: "Prof. (Dr.) Nandimath Omprakash V", institution: "India" },
    { name: "Prof. Yogender Malik", institution: "India" },
  ];
  const speakerIds: string[] = [];
  for (const sp of SPEAKER_DATA) {
    const existing = await prisma.speaker.findFirst({ where: { name: sp.name, tenantId: tenant.id } });
    const rec = existing
      ? await prisma.speaker.update({ where: { id: existing.id }, data: { institution: sp.institution, isActive: true } })
      : await prisma.speaker.create({ data: { name: sp.name, institution: sp.institution, tenantId: tenant.id, isActive: true } });
    speakerIds.push(rec.id);
  }
  console.log(`${speakerIds.length} speakers ready.\n`);

  // ── 4. The IFPC 2026 event ─────────────────────────────────────────────
  const SLUG = "ifpc-2026";
  const existingEvent = await prisma.event.findUnique({ where: { slug: SLUG } });
  if (existingEvent) {
    console.log("IFPC 2026 event already exists — skipping event/pricing/session creation.");
    console.log("\nDone.");
    return;
  }

  const event = await prisma.event.create({ data: {
    title: "International Forensic Psychiatry Conference 2026",
    slug: SLUG,
    shortDescription: "Bridging the Gap — a global gathering advancing forensic psychiatry knowledge and practice.",
    description: "The International Forensic Psychiatry Conference (IFPC) 2026 will be held over four days, from Monday, 2 November to Thursday, 5 November 2026, at the NIMHANS Convention Centre, Bengaluru, India. Co-hosted by NIMHANS, Bengaluru and RANZCP, the conference is designed for psychiatry trainees, psychiatrists, forensic medicine professionals, mental health professionals, and law professionals.",
    startDate: d("2026-11-02T09:00:00+05:30"),
    endDate: d("2026-11-05T18:00:00+05:30"),
    startTime: "09:00", endTime: "18:00", timezone: "Asia/Kolkata",
    location: "NIMHANS Convention Centre", address: "Hosur Road", city: "Bengaluru",
    state: "Karnataka", country: "India",
    mapLink: "https://www.google.com/maps?q=NIMHANS+Convention+Centre,+Hosur+Road,+Bengaluru",
    capacity: 800, status: "UPCOMING", type: "CONFERENCE",
    typeTags: ["FORENSIC PSYCHIATRY", "INTERNATIONAL"],
    price: 12620, currency: "INR",
    earlyBirdPrice: 10620, earlyBirdDeadline: d("2026-09-15T23:59:00+05:30"),
    registrationDeadline: null, isRegistrationOpen: true,
    organizer: "NIMHANS, Bengaluru & RANZCP",
    contactEmail: "fpnimhans@gmail.com", contactPhone: "+91 7760504068",
    includes: [
      "Access to all workshops and scientific sessions",
      "Daily lunch, snacks & refreshments",
      "Two-day cultural programme",
      "Two official conference dinners",
    ],
    signatory1Name: "Prof. Suresh Bada Math", signatory1Title: "Chair, Organising Committee",
    signatory2Name: "Dr. Vinesh Gupta", signatory2Title: "Chair, Scientific Committee",
    isPublished: true, isFeatured: true,
    tenantId: tenant.id,
    badgeCategories: [
      { id: "indian-delegate", label: "Indian Delegate", color: "#fff", bgColor: "#1e3a5f", borderColor: "#16304d" },
      { id: "indian-trainee", label: "Indian Trainee", color: "#fff", bgColor: "#0f766e", borderColor: "#0d5c56" },
      { id: "intl-delegate", label: "International Delegate", color: "#fff", bgColor: "#7c3aed", borderColor: "#6d28d9" },
      { id: "intl-trainee", label: "International Trainee", color: "#fff", bgColor: "#b45309", borderColor: "#92400e" },
      { id: "speaker", label: "Speaker", color: "#fff", bgColor: "#dc2626", borderColor: "#b91c1c" },
    ],
  }});
  console.log(`Event created: ${event.title}\n`);

  // Fee tiers — Early Bird till 15 Sept 2026, 11:59 PM IST.
  // The source content states international fees in AUD and gives an INR
  // approximation only for the early-bird figures (900 AUD ≈ ₹69,550;
  // 500 AUD ≈ ₹39,000 — an implied rate of ~77.28 INR/AUD). The standard
  // (non-early-bird) AUD figures have no INR conversion in the source, and
  // this system charges a single currency (INR via Razorpay) per event, so
  // the standard INR prices below are DERIVED using that same implied rate
  // (1000 AUD → ₹77,280; 600 AUD → ₹46,370) as a placeholder — the AUD
  // figures in `description` are the authoritative ones from the source
  // content. Flagging clearly: confirm/update these two derived INR amounts
  // against the actual FX rate before relying on them for real charges.
  const EARLY_BIRD_DEADLINE = d("2026-09-15T23:59:00+05:30");
  await prisma.eventPricing.createMany({ data: [
    { eventId: event.id, name: "International Delegate", description: "900 AUD (Early Bird, approx. ₹69,550) / 1000 AUD (Standard)", totalSlots: 100, price: 77280, earlyBirdPrice: 69550, earlyBirdDeadline: EARLY_BIRD_DEADLINE, displayOrder: 0 },
    { eventId: event.id, name: "International Trainee Delegate", description: "500 AUD (Early Bird, approx. ₹39,000) / 600 AUD (Standard)", totalSlots: 40, price: 46370, earlyBirdPrice: 39000, earlyBirdDeadline: EARLY_BIRD_DEADLINE, displayOrder: 1 },
    { eventId: event.id, name: "Indian Delegate", totalSlots: 500, price: 12620, earlyBirdPrice: 10620, earlyBirdDeadline: EARLY_BIRD_DEADLINE, displayOrder: 2 },
    { eventId: event.id, name: "Indian Trainee Delegate", totalSlots: 160, price: 7900, earlyBirdPrice: 5900, earlyBirdDeadline: EARLY_BIRD_DEADLINE, displayOrder: 3 },
  ]});
  console.log("Fee tiers (EventPricing) created.\n");

  // Speakers linked to the event (no fixed session/time — programme is TBA per source content)
  for (let i = 0; i < speakerIds.length; i++) {
    await prisma.eventSpeaker.create({ data: { eventId: event.id, speakerId: speakerIds[i], status: "confirmed", isPublished: true, sessionOrder: i + 1 } });
  }
  console.log("Speakers linked to event.\n");

  // Sessions — programme structure + the seat-limited Workshop/Seminar listings
  await prisma.eventSession.create({ data: {
    eventId: event.id, title: "Pre-Conference Workshops",
    description: "Hands-on workshops led by national and international experts, offering interactive sessions designed to bridge psychiatry and the justice system effectively.",
    sessionType: "WORKSHOP", sessionDate: d("2026-11-02"), startTime: "09:00", endTime: "17:00",
    sessionOrder: 1, status: "scheduled", isPublished: true, capacity: 100,
  }});

  await prisma.eventSession.create({ data: {
    eventId: event.id, title: "Morning Yoga Sessions",
    description: "Complimentary sessions offered daily by the Department of Integrative Medicine, NIMHANS, 6:30–7:30 AM, at the Yoga Hall, Department of Integrative Medicine, throughout the conference. Comfortable, loose-fitting clothing recommended; practiced barefoot; mats provided.",
    sessionType: "SEMINAR", sessionDate: d("2026-11-02"), startTime: "06:30", endTime: "07:30",
    sessionOrder: 2, status: "scheduled", isPublished: true, capacity: 30,
  }});

  await prisma.eventSession.create({ data: {
    eventId: event.id, title: "NIMHANS Campus Tour",
    description: "A guided, approximately 2-hour tour of the historic NIMHANS campus, showcasing its legacy and state-of-the-art clinical, academic, and research facilities. Enquire at the Registration Desk for schedule and available slots.",
    sessionType: "SEMINAR", sessionOrder: 3, status: "scheduled", isPublished: true, capacity: 40,
  }});

  await prisma.eventSession.create({ data: {
    eventId: event.id, title: "Scientific Sessions — Day 2",
    description: "Plenary sessions, symposia, oral and poster presentations, and panel discussions across the conference's thematic tracks.",
    sessionType: "PLENARY", sessionDate: d("2026-11-03"), startTime: "09:00", endTime: "18:00",
    sessionOrder: 4, status: "scheduled", isPublished: true,
  }});

  await prisma.eventSession.create({ data: {
    eventId: event.id, title: "Scientific Sessions — Day 3",
    description: "Plenary sessions, symposia, oral and poster presentations, and panel discussions across the conference's thematic tracks.",
    sessionType: "PLENARY", sessionDate: d("2026-11-04"), startTime: "09:00", endTime: "18:00",
    sessionOrder: 5, status: "scheduled", isPublished: true,
  }});

  await prisma.eventSession.create({ data: {
    eventId: event.id, title: "Forensic Psychiatry Quiz Competition",
    description: "A team-based quiz testing knowledge across forensic psychiatry, law, and ethics — open to trainees and delegates. Winning team announced at the Closing Ceremony alongside the Best Oral Presentation and Best ePoster awards.",
    sessionType: "COMPETITION", sessionDate: d("2026-11-04"), startTime: "18:00", endTime: "19:00",
    sessionOrder: 6, status: "scheduled", isPublished: true, capacity: 40,
  }});

  await prisma.eventSession.create({ data: {
    eventId: event.id, title: "Scientific Sessions — Day 4 & Closing Ceremony",
    description: "Final day of plenary sessions and presentations, followed by the Closing Ceremony with Best Oral Presentation and Best ePoster awards.",
    sessionType: "OTHER", sessionDate: d("2026-11-05"), startTime: "09:00", endTime: "17:00",
    sessionOrder: 7, status: "scheduled", isPublished: true,
  }});
  console.log("Sessions created (incl. capacity-limited Workshop/Seminar listings).\n");

  // Announcements — shown in the "Bridging the Gap" home section feed
  await prisma.eventEngagement.create({ data: {
    eventId: event.id,
    title: "Abstract Submission Deadline Extended",
    type: "ANNOUNCEMENT",
    description: "The abstract submission deadline has been extended to 15 September 2026, 11:59 PM IST. Submit via the Abstract Submission page.",
    isActive: true, displayOrder: 0,
  }});

  // Delegate feedback — sessions, workshops, overall experience
  await prisma.eventEngagement.create({ data: {
    eventId: event.id,
    title: "Delegate Feedback — IFPC 2026",
    type: "FEEDBACK",
    description: "Share your feedback on sessions, workshops, and your overall conference experience.",
    isActive: true, displayOrder: 0,
    content: { questions: [
      { text: "Overall conference experience", type: "rating" },
      { text: "Quality of scientific sessions", type: "rating" },
      { text: "Workshops & pre-conference sessions", type: "rating" },
      { text: "Venue, organisation & logistics", type: "rating" },
      { text: "Comments, suggestions, or highlights you'd like to share", type: "text" },
    ]},
  }});
  console.log("Feedback engagement created.\n");

  console.log("Done.");
}
