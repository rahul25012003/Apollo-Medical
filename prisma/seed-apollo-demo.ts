/**
 * Apollo Medical — Full Demo Data Seed
 * Creates 4 events: 1 completed (2-day), 1 active (3-day), 2 upcoming (2-day + 3-day)
 * with sessions, halls, engagements, quizzes, registrations, certificates, scan logs.
 *
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-apollo-demo.ts
 *   OR: npx tsx prisma/seed-apollo-demo.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import bcrypt from "bcryptjs";

config();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ── helpers ──────────────────────────────────────────────────────────────────
const d = (s: string) => new Date(s);
let certSeq = 0;
const certCode = (prefix: string) => `${prefix}-${String(++certSeq).padStart(4, "0")}`;

async function main() {
  console.log("🌱  Apollo Medical — Demo Seed\n");

  // ── 1. Find tenant ──────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.findUnique({ where: { slug: "apollo-medical" } });
  if (!tenant) throw new Error("Run prisma/seed-tenant.ts first — apollo-medical tenant not found");
  console.log(`✅  Tenant: ${tenant.name}\n`);

  // ── 2. Clean existing demo events ───────────────────────────────────────────
  const DEMO_SLUGS = [
    "apollo-cardiology-summit-2026",
    "apollo-healthcare-innovation-forum-2026",
    "apollo-surgical-excellence-workshop-2026",
    "apollo-international-medical-congress-2026",
  ];
  for (const slug of DEMO_SLUGS) {
    const ev = await prisma.event.findUnique({ where: { slug } });
    if (ev) { await prisma.event.delete({ where: { slug } }); console.log(`🗑️   Deleted: ${slug}`); }
  }
  console.log();

  // ── 3. Speakers ─────────────────────────────────────────────────────────────
  console.log("Creating speakers...");
  const SPEAKER_DATA = [
    { email: "priya.sharma@apollo.demo", name: "Dr. Priya Sharma", designation: "Senior Interventional Cardiologist", department: "Cardiology", institution: "Apollo Hospitals Chennai" },
    { email: "rajesh.kumar@apollo.demo", name: "Dr. Rajesh Kumar", designation: "Chief Neurosurgeon", department: "Neurosurgery", institution: "Apollo Hospitals Delhi" },
    { email: "anitha.menon@apollo.demo", name: "Dr. Anitha Menon", designation: "Senior Surgical Oncologist", department: "Oncology", institution: "Apollo Cancer Centers Mumbai" },
    { email: "vikram.nair@apollo.demo", name: "Dr. Vikram Nair", designation: "Head of Orthopedics & Joint Replacement", department: "Orthopedics", institution: "Apollo Hospitals Hyderabad" },
    { email: "sneha.patel@apollo.demo", name: "Dr. Sneha Patel", designation: "Senior Gastroenterologist", department: "Gastroenterology", institution: "Apollo Hospitals Bengaluru" },
    { email: "arun.krishnaswamy@apollo.demo", name: "Dr. Arun Krishnaswamy", designation: "Pulmonologist & Critical Care Specialist", department: "Pulmonology", institution: "Apollo Hospitals Chennai" },
    { email: "deepa.verma@apollo.demo", name: "Dr. Deepa Verma", designation: "Senior Endocrinologist", department: "Endocrinology", institution: "Apollo Hospitals Delhi" },
    { email: "suresh.rao@apollo.demo", name: "Dr. Suresh Rao", designation: "Hepatologist & Liver Transplant Surgeon", department: "Hepatology", institution: "Apollo Hospitals Pune" },
    { email: "kavitha.iyer@apollo.demo", name: "Dr. Kavitha Iyer", designation: "Senior Rheumatologist", department: "Rheumatology", institution: "Apollo Hospitals Kochi" },
    { email: "manohar.reddy@apollo.demo", name: "Dr. Manohar Reddy", designation: "Senior Transplant Surgeon", department: "Transplant Surgery", institution: "Apollo Hospitals Hyderabad" },
  ];
  const speakers: Record<string, string> = {}; // email → id
  for (const sp of SPEAKER_DATA) {
    const rec = await prisma.speaker.upsert({
      where: { email: sp.email },
      update: { ...sp, tenantId: tenant.id },
      create: { ...sp, tenantId: tenant.id, isActive: true },
    });
    speakers[sp.email] = rec.id;
  }
  const SP = (email: string) => speakers[email];
  console.log(`✅  ${Object.keys(speakers).length} speakers\n`);

  // ── 4. Sponsors ──────────────────────────────────────────────────────────────
  console.log("Creating sponsors...");
  const SPONSOR_DATA = [
    { name: "Pfizer India", description: "Global pharmaceutical leader" },
    { name: "Sun Pharmaceutical Industries", description: "India's largest pharma company" },
    { name: "Cipla Limited", description: "Agile & sustainable global pharma" },
    { name: "Medtronic India", description: "World's largest medical device company" },
    { name: "Abbott India", description: "Diagnostics, devices & nutrition leader" },
  ];
  const sponsorIds: string[] = [];
  for (const s of SPONSOR_DATA) {
    const ex = await prisma.sponsor.findFirst({ where: { name: s.name, tenantId: tenant.id } });
    const rec = ex
      ? await prisma.sponsor.update({ where: { id: ex.id }, data: s })
      : await prisma.sponsor.create({ data: { ...s, tenantId: tenant.id, isActive: true } });
    sponsorIds.push(rec.id);
  }
  console.log(`✅  ${sponsorIds.length} sponsors\n`);

  // ── 5. Attendee users (20) ───────────────────────────────────────────────────
  console.log("Creating attendee users...");
  const pass = await bcrypt.hash("User@123", 12);
  const USERS = [
    { email: "anil.gupta@demo.apollo", name: "Dr. Anil Gupta", fn: "Anil", ln: "Gupta", org: "AIIMS Delhi", desg: "Associate Professor", cat: "Faculty" },
    { email: "shalini.mehta@demo.apollo", name: "Dr. Shalini Mehta", fn: "Shalini", ln: "Mehta", org: "JIPMER Puducherry", desg: "Senior Resident", cat: "Resident" },
    { email: "ramesh.babu@demo.apollo", name: "Dr. Ramesh Babu", fn: "Ramesh", ln: "Babu", org: "Manipal Hospital", desg: "Consultant Cardiologist", cat: "Faculty" },
    { email: "nandini.krishna@demo.apollo", name: "Dr. Nandini Krishna", fn: "Nandini", ln: "Krishna", org: "KEM Hospital Mumbai", desg: "Junior Resident", cat: "Resident" },
    { email: "sunil.joshi@demo.apollo", name: "Dr. Sunil Joshi", fn: "Sunil", ln: "Joshi", org: "Fortis Hospital Delhi", desg: "Consultant Orthopaedic Surgeon", cat: "Faculty" },
    { email: "preethi.anand@demo.apollo", name: "Dr. Preethi Anand", fn: "Preethi", ln: "Anand", org: "CMC Vellore", desg: "MBBS Student", cat: "Student" },
    { email: "varun.sharma@demo.apollo", name: "Dr. Varun Sharma", fn: "Varun", ln: "Sharma", org: "Max Hospital Delhi", desg: "Consultant Neurologist", cat: "Faculty" },
    { email: "lakshmi.nair@demo.apollo", name: "Dr. Lakshmi Nair", fn: "Lakshmi", ln: "Nair", org: "Govt Medical College Thrissur", desg: "MD Student", cat: "Student" },
    { email: "arvind.patel@demo.apollo", name: "Dr. Arvind Patel", fn: "Arvind", ln: "Patel", org: "Apollo Hospitals Ahmedabad", desg: "Consultant Gastroenterologist", cat: "Faculty" },
    { email: "meena.rajan@demo.apollo", name: "Dr. Meena Rajan", fn: "Meena", ln: "Rajan", org: "PSG Hospitals Coimbatore", desg: "Junior Resident", cat: "Resident" },
    { email: "krishna.murthy@demo.apollo", name: "Dr. Krishna Murthy", fn: "Krishna", ln: "Murthy", org: "Narayana Health Bengaluru", desg: "Consultant Pulmonologist", cat: "Faculty" },
    { email: "pooja.singh@demo.apollo", name: "Dr. Pooja Singh", fn: "Pooja", ln: "Singh", org: "SGPGI Lucknow", desg: "Senior Resident", cat: "Resident" },
    { email: "harish.reddy@demo.apollo", name: "Dr. Harish Reddy", fn: "Harish", ln: "Reddy", org: "NIMS Hyderabad", desg: "MBBS Final Year", cat: "Student" },
    { email: "rohini.desai@demo.apollo", name: "Dr. Rohini Desai", fn: "Rohini", ln: "Desai", org: "Kokilaben Hospital Mumbai", desg: "Consultant Endocrinologist", cat: "Faculty" },
    { email: "sanjay.kumar@demo.apollo", name: "Dr. Sanjay Kumar", fn: "Sanjay", ln: "Kumar", org: "RML Hospital Delhi", desg: "Professor & HOD Cardiology", cat: "Faculty" },
    { email: "divya.gopalan@demo.apollo", name: "Dr. Divya Gopalan", fn: "Divya", ln: "Gopalan", org: "Christian Medical College", desg: "MD Student", cat: "Student" },
    { email: "mohan.krishna@demo.apollo", name: "Dr. Mohan Krishna", fn: "Mohan", ln: "Krishna", org: "Care Hospital Hyderabad", desg: "Consultant Oncologist", cat: "Faculty" },
    { email: "ananya.bose@demo.apollo", name: "Dr. Ananya Bose", fn: "Ananya", ln: "Bose", org: "Medanta Hospital", desg: "Senior Resident", cat: "Resident" },
    { email: "sreekanth.menon@demo.apollo", name: "Dr. Sreekanth Menon", fn: "Sreekanth", ln: "Menon", org: "KIMS Hospital Trivandrum", desg: "Consultant Hepatologist", cat: "Faculty" },
    { email: "kavya.reddy@demo.apollo", name: "Dr. Kavya Reddy", fn: "Kavya", ln: "Reddy", org: "AIIMS Hyderabad", desg: "MBBS 3rd Year", cat: "Student" },
  ];
  const userMap: Array<typeof USERS[0] & { id: string }> = [];
  for (const u of USERS) {
    const rec = await prisma.user.upsert({
      where: { email: u.email },
      update: { isActive: true, tenantId: tenant.id },
      create: {
        email: u.email, password: pass, name: u.name,
        firstName: u.fn, lastName: u.ln, role: "ATTENDEE",
        emailVerified: d("2025-12-01"), isActive: true, tenantId: tenant.id,
      },
    });
    userMap.push({ ...u, id: rec.id });
  }
  console.log(`✅  ${userMap.length} attendee users\n`);

  // ══════════════════════════════════════════════════════════════════════════════
  // EVENT 1  ·  Apollo Annual Cardiology Summit 2026  (COMPLETED, 2 days)
  // Jan 15–16 2026 · Chennai
  // ══════════════════════════════════════════════════════════════════════════════
  console.log("━━  Event 1: Apollo Annual Cardiology Summit 2026 (COMPLETED)");

  const e1 = await prisma.event.create({ data: {
    title: "Apollo Annual Cardiology Summit 2026",
    slug: "apollo-cardiology-summit-2026",
    shortDescription: "India's premier 2-day cardiology conference on interventional cardiology, heart failure & structural heart disease.",
    description: "The Apollo Annual Cardiology Summit 2026 brought together 200+ cardiology experts for two intensive days of scientific sessions, hands-on workshops, and a high-stakes MCQ quiz. CME accredited — 12 credits.",
    startDate: d("2026-01-15T09:00:00+05:30"),
    endDate:   d("2026-01-16T17:00:00+05:30"),
    startTime: "09:00", endTime: "17:00", timezone: "Asia/Kolkata",
    location: "Apollo Convention Centre", address: "Greams Road", city: "Chennai",
    state: "Tamil Nadu", country: "India",
    capacity: 200, status: "COMPLETED", type: "CONFERENCE",
    typeTags: ["CME", "CARDIOLOGY"],
    price: 2000, currency: "INR",
    cmeCredits: 12, cmeCoordinatorName: "Dr. Priya Sharma",
    cmeCoordinatorEmail: "priya.sharma@apollo.demo",
    organizer: "Apollo Hospitals Medical Education Division",
    contactEmail: "conferences@apollohospitals.com",
    contactPhone: "+91 44 2829 3333",
    includes: ["Conference Kit", "Lunch (Both Days)", "Tea Breaks", "CME Certificate", "E-Proceedings"],
    signatory1Name: "Dr. Priya Sharma", signatory1Title: "Senior Interventional Cardiologist",
    signatory2Name: "Dr. K. Subramaniam", signatory2Title: "Director, Apollo Hospitals Chennai",
    isPublished: true, isFeatured: false, isRegistrationOpen: false,
    tenantId: tenant.id,
    badgeCategories: [
      { id: "faculty", label: "Faculty", color: "#fff", bgColor: "#1e40af", borderColor: "#1e3a8a" },
      { id: "resident", label: "Resident", color: "#fff", bgColor: "#065f46", borderColor: "#064e3b" },
      { id: "student", label: "Student", color: "#fff", bgColor: "#92400e", borderColor: "#78350f" },
      { id: "international", label: "International", color: "#fff", bgColor: "#581c87", borderColor: "#4c1d95" },
    ],
    participantRoles: [
      { id: "DELEGATE", label: "Delegate", showOnPublicReg: true, certificate: { title: "Certificate of Participation", bodyText: "has actively participated in the Apollo Annual Cardiology Summit 2026" } },
      { id: "SPEAKER", label: "Speaker", showOnPublicReg: false, certificate: { title: "Certificate of Appreciation", bodyText: "for their outstanding contribution as a Speaker at the Apollo Annual Cardiology Summit 2026" } },
    ],
  }});

  // halls
  const e1hA = await prisma.eventHall.create({ data: { eventId: e1.id, name: "Main Auditorium", displayOrder: 0 } });
  const e1hB = await prisma.eventHall.create({ data: { eventId: e1.id, name: "Workshop Room A", displayOrder: 1 } });
  const e1hC = await prisma.eventHall.create({ data: { eventId: e1.id, name: "Workshop Room B", displayOrder: 2 } });

  // pricing
  await prisma.eventPricing.createMany({ data: [
    { eventId: e1.id, name: "Faculty",       totalSlots: 80,  price: 2000, displayOrder: 0 },
    { eventId: e1.id, name: "Resident",      totalSlots: 60,  price: 1200, displayOrder: 1 },
    { eventId: e1.id, name: "Student",       totalSlots: 40,  price: 600,  displayOrder: 2 },
    { eventId: e1.id, name: "International", totalSlots: 20,  price: 8000, displayOrder: 3 },
  ]});

  // event speakers
  const e1SpkEmails = ["priya.sharma@apollo.demo","arun.krishnaswamy@apollo.demo","deepa.verma@apollo.demo","sneha.patel@apollo.demo","rajesh.kumar@apollo.demo"];
  for (let i = 0; i < e1SpkEmails.length; i++) {
    await prisma.eventSpeaker.create({ data: { eventId: e1.id, speakerId: SP(e1SpkEmails[i]), status: "confirmed", isPublished: true, sessionOrder: i + 1 } });
  }

  // sessions — Day 1
  const e1s1 = await prisma.eventSession.create({ data: {
    eventId: e1.id, title: "Inaugural Keynote: Advances in Interventional Cardiology",
    description: "Opening keynote on latest breakthroughs in coronary intervention, TAVI, and structural heart procedures.",
    sessionType: "KEYNOTE", sessionDate: d("2026-01-15T09:30:00+05:30"), startTime: "09:30", endTime: "10:30",
    hallId: e1hA.id, speakerId: SP("priya.sharma@apollo.demo"), sessionOrder: 1, status: "completed", isPublished: true,
  }});
  await prisma.sessionSpeaker.create({ data: { sessionId: e1s1.id, speakerId: SP("priya.sharma@apollo.demo"), talkTitle: "TAVI in 2026: State of the Art", talkDuration: 45, displayOrder: 0 } });

  const e1s2 = await prisma.eventSession.create({ data: {
    eventId: e1.id, title: "Heart Failure Management: From Guidelines to Bedside",
    description: "Comprehensive review of HFrEF and HFpEF management strategies with case discussions.",
    sessionType: "PLENARY", sessionDate: d("2026-01-15T11:00:00+05:30"), startTime: "11:00", endTime: "12:30",
    hallId: e1hA.id, sessionOrder: 2, status: "completed", isPublished: true,
  }});
  await prisma.sessionSpeaker.createMany({ data: [
    { sessionId: e1s2.id, speakerId: SP("priya.sharma@apollo.demo"),    talkTitle: "HFrEF: Device Therapy Updates",                      talkDuration: 30, displayOrder: 0 },
    { sessionId: e1s2.id, speakerId: SP("arun.krishnaswamy@apollo.demo"), talkTitle: "Pulmonary Hypertension in Heart Failure",              talkDuration: 30, displayOrder: 1 },
  ]});

  const e1s3 = await prisma.eventSession.create({ data: {
    eventId: e1.id, title: "Workshop: Coronary Angiography Interpretation",
    description: "Hands-on workshop with angiographic images and case-based learning.",
    sessionType: "WORKSHOP", sessionDate: d("2026-01-15T14:00:00+05:30"), startTime: "14:00", endTime: "16:00",
    hallId: e1hB.id, speakerId: SP("rajesh.kumar@apollo.demo"), sessionOrder: 3, status: "completed", isPublished: true,
  }});
  await prisma.sessionSpeaker.create({ data: { sessionId: e1s3.id, speakerId: SP("rajesh.kumar@apollo.demo"), talkTitle: "Reading Coronary Angiograms: A Structured Approach", talkDuration: 90, displayOrder: 0 } });

  const e1s4 = await prisma.eventSession.create({ data: {
    eventId: e1.id, title: "Cardio-Metabolic Connections: Diabetes & the Heart",
    description: "Understanding the link between diabetes, obesity, and cardiovascular outcomes.",
    sessionType: "PLENARY", sessionDate: d("2026-01-15T16:00:00+05:30"), startTime: "16:00", endTime: "17:00",
    hallId: e1hA.id, speakerId: SP("deepa.verma@apollo.demo"), sessionOrder: 4, status: "completed", isPublished: true,
  }});
  await prisma.sessionSpeaker.create({ data: { sessionId: e1s4.id, speakerId: SP("deepa.verma@apollo.demo"), talkTitle: "SGLT2 Inhibitors and Cardiovascular Protection", talkDuration: 45, displayOrder: 0 } });

  // sessions — Day 2
  const e1s5 = await prisma.eventSession.create({ data: {
    eventId: e1.id, title: "Panel: Difficult Cases in Interventional Cardiology",
    description: "Expert panel discussion on complex clinical cardiology scenarios.",
    sessionType: "PANEL", sessionDate: d("2026-01-16T09:30:00+05:30"), startTime: "09:30", endTime: "11:00",
    hallId: e1hA.id, sessionOrder: 5, status: "completed", isPublished: true,
  }});
  await prisma.sessionSpeaker.createMany({ data: [
    { sessionId: e1s5.id, speakerId: SP("priya.sharma@apollo.demo"),   talkTitle: "Moderator",                               talkDuration: 10, displayOrder: 0 },
    { sessionId: e1s5.id, speakerId: SP("sneha.patel@apollo.demo"),    talkTitle: "Takotsubo Syndrome: Differential Diagnosis", talkDuration: 20, displayOrder: 1 },
    { sessionId: e1s5.id, speakerId: SP("arun.krishnaswamy@apollo.demo"), talkTitle: "Cardiogenic Shock: ICU Perspective",       talkDuration: 20, displayOrder: 2 },
  ]});

  const e1s6 = await prisma.eventSession.create({ data: {
    eventId: e1.id, title: "Cardiology MCQ Challenge — Quiz Finale",
    description: "High-stakes MCQ quiz competition with audience participation and prize distribution.",
    sessionType: "OTHER", sessionDate: d("2026-01-16T11:00:00+05:30"), startTime: "11:00", endTime: "12:00",
    hallId: e1hA.id, sessionOrder: 6, status: "completed", isPublished: true,
  }});

  const e1s7 = await prisma.eventSession.create({ data: {
    eventId: e1.id, title: "ECG Interpretation Masterclass",
    description: "Advanced ECG analysis: arrhythmias, ischemia, and electrolyte disturbances.",
    sessionType: "WORKSHOP", sessionDate: d("2026-01-16T14:00:00+05:30"), startTime: "14:00", endTime: "15:30",
    hallId: e1hB.id, speakerId: SP("arun.krishnaswamy@apollo.demo"), sessionOrder: 7, status: "completed", isPublished: true,
  }});
  await prisma.sessionSpeaker.create({ data: { sessionId: e1s7.id, speakerId: SP("arun.krishnaswamy@apollo.demo"), talkTitle: "ECG Pearls: Arrhythmia Recognition", talkDuration: 75, displayOrder: 0 } });

  await prisma.eventSession.create({ data: {
    eventId: e1.id, title: "Valedictory & Certificate Distribution",
    description: "Closing ceremony with CME certificate distribution and vote of thanks.",
    sessionType: "OTHER", sessionDate: d("2026-01-16T16:00:00+05:30"), startTime: "16:00", endTime: "17:00",
    hallId: e1hA.id, sessionOrder: 8, status: "completed", isPublished: true,
  }});

  // zones
  const e1z1 = await prisma.eventZone.create({ data: { eventId: e1.id, name: "Main Hall",     displayOrder: 0 } });
  const e1z2 = await prisma.eventZone.create({ data: { eventId: e1.id, name: "VIP Lounge",    displayOrder: 1 } });
  const e1z3 = await prisma.eventZone.create({ data: { eventId: e1.id, name: "Workshop Area", displayOrder: 2 } });
  await prisma.zoneAccessRule.createMany({ data: [
    { zoneId: e1z1.id, category: "Faculty",       allowed: true  },
    { zoneId: e1z1.id, category: "Resident",      allowed: true  },
    { zoneId: e1z1.id, category: "Student",       allowed: true  },
    { zoneId: e1z1.id, category: "International", allowed: true  },
    { zoneId: e1z2.id, category: "Faculty",       allowed: true  },
    { zoneId: e1z2.id, category: "Resident",      allowed: false },
    { zoneId: e1z2.id, category: "Student",       allowed: false },
    { zoneId: e1z2.id, category: "International", allowed: true  },
    { zoneId: e1z3.id, category: "Faculty",       allowed: true  },
    { zoneId: e1z3.id, category: "Resident",      allowed: true  },
    { zoneId: e1z3.id, category: "Student",       allowed: true  },
    { zoneId: e1z3.id, category: "International", allowed: true  },
  ]});

  // access points
  const e1ap = await prisma.accessPoint.create({ data: { eventId: e1.id, name: "Main Entrance", type: "ACCESS", hallId: e1hA.id, direction: "BOTH", isActive: true } });

  // food zones
  const e1f1 = await prisma.foodZone.create({ data: { eventId: e1.id, name: "Breakfast (Day 1)", maxServings: 200, isActive: true } });
  const e1f2 = await prisma.foodZone.create({ data: { eventId: e1.id, name: "Lunch (Day 1)",     maxServings: 200, isActive: true } });
  const e1f3 = await prisma.foodZone.create({ data: { eventId: e1.id, name: "Tea Break",         maxServings: 200, isActive: true } });
  const e1f4 = await prisma.foodZone.create({ data: { eventId: e1.id, name: "Lunch (Day 2)",     maxServings: 200, isActive: true } });

  // sponsors
  await prisma.eventSponsor.createMany({ data: [
    { eventId: e1.id, sponsorId: sponsorIds[0], tier: "PLATINUM", displayOrder: 0, isPublished: true },
    { eventId: e1.id, sponsorId: sponsorIds[1], tier: "GOLD",     displayOrder: 1, isPublished: true },
    { eventId: e1.id, sponsorId: sponsorIds[2], tier: "GOLD",     displayOrder: 2, isPublished: true },
    { eventId: e1.id, sponsorId: sponsorIds[3], tier: "SILVER",   displayOrder: 3, isPublished: true },
  ]});

  // engagements
  const e1poll = await prisma.eventEngagement.create({ data: {
    eventId: e1.id, title: "Which cardiac intervention technique do you find most impactful?",
    type: "POLL", isActive: false, displayOrder: 0,
    content: { options: [
      { id: "a", label: "TAVI / TAVR" },
      { id: "b", label: "Primary PCI" },
      { id: "c", label: "Coronary Artery Bypass Grafting" },
      { id: "d", label: "MitraClip / Structural Repair" },
    ]},
  }});

  await prisma.eventEngagement.create({ data: {
    eventId: e1.id,
    title: "Welcome to Apollo Annual Cardiology Summit 2026!",
    type: "ANNOUNCEMENT",
    description: "Dear delegates, sessions begin at 9:30 AM in the Main Auditorium. Collect your conference kits from the registration desk. Wi-Fi: ApolloConf2026 | Password: Cardio@2026",
    isActive: true, displayOrder: 1,
  }});

  const e1feedback = await prisma.eventEngagement.create({ data: {
    eventId: e1.id, title: "Post-Event Feedback Survey", type: "FEEDBACK",
    description: "Rate your experience at the Apollo Annual Cardiology Summit 2026",
    isActive: false, displayOrder: 2,
    content: { questions: [
      { id: "q1", label: "Overall satisfaction", type: "rating" },
      { id: "q2", label: "Quality of scientific sessions", type: "rating" },
      { id: "q3", label: "Organisation & logistics", type: "rating" },
      { id: "q4", label: "Would you recommend this event?", type: "yesno" },
      { id: "q5", label: "Suggestions for improvement", type: "text" },
    ]},
  }});

  // poll responses (45)
  const pollDistrib = [
    { id: "a", label: "TAVI / TAVR", count: 18 },
    { id: "b", label: "Primary PCI", count: 16 },
    { id: "c", label: "Coronary Artery Bypass Grafting", count: 7 },
    { id: "d", label: "MitraClip / Structural Repair", count: 4 },
  ];
  let uIdx = 0;
  for (const opt of pollDistrib) {
    for (let i = 0; i < opt.count; i++) {
      const u = userMap[uIdx % userMap.length];
      await prisma.engagementResponse.create({ data: {
        engagementId: e1poll.id,
        userId: uIdx < userMap.length ? u.id : null,
        userName: u.name,
        response: { answer: opt.id, label: opt.label },
        createdAt: d("2026-01-15T11:45:00+05:30"),
      }});
      uIdx++;
    }
  }

  // feedback responses (30)
  const feedbackTexts = [
    "Excellent conference! Dr. Priya Sharma's keynote was outstanding.",
    "Very well organised. Hands-on workshops were practical and useful.",
    "Great learning experience. Would love more clinical case discussions.",
    "Superb faculty. Learned a great deal about TAVI and structural heart.",
    "Well-structured agenda. No time was wasted. Highly recommended.",
    "Good event. Suggest longer breaks between sessions next time.",
    "The quiz competition was a brilliant addition — very engaging!",
    "Excellent networking opportunity with the cardiology community.",
    "One of the best cardiology CME programs I have attended in India.",
    "Looking forward to the next edition!",
  ];
  const starRatings = [5, 5, 5, 4, 5, 4, 5, 5, 4, 5, 5, 4, 5, 5, 4, 5, 4, 5, 5, 4, 5, 5, 5, 4, 5, 4, 5, 5, 5, 4];
  for (let i = 0; i < 30; i++) {
    const u = userMap[i % userMap.length];
    await prisma.engagementResponse.create({ data: {
      engagementId: e1feedback.id,
      userId: i < userMap.length ? u.id : null,
      userName: u.name,
      response: { q1: starRatings[i], q2: starRatings[(i + 2) % 30], q3: starRatings[(i + 4) % 30], q4: "yes", q5: feedbackTexts[i % feedbackTexts.length] },
      createdAt: d("2026-01-16T17:30:00+05:30"),
    }});
  }

  // quiz
  const e1quiz = await prisma.quiz.create({ data: {
    eventId: e1.id,
    title: "Cardiology MCQ Challenge 2026",
    description: "30 MCQs covering interventional cardiology, heart failure, ECG interpretation, and pharmacology. Top 3 scorers win prizes and certificates.",
    status: "COMPLETED",
  }});

  // registrations — 20 attended, 3 confirmed no-show, 2 cancelled
  const e1AttendedUsers = userMap.slice(0, 20);
  const e1regs: string[] = []; // registration ids for attended users

  const e1AmountMap: Record<string, number> = {
    Faculty: 2000, Resident: 1200, Student: 600, International: 8000,
  };
  const e1Methods = ["razorpay","razorpay","razorpay","qr_code","razorpay","razorpay","razorpay","qr_code","razorpay","razorpay","razorpay","razorpay","qr_code","razorpay","razorpay","qr_code","razorpay","razorpay","razorpay","razorpay"];
  const checkInTimes = ["08:45","08:52","09:00","09:05","09:10","09:15","09:20","09:25","09:30","09:35","09:38","09:42","09:47","09:50","09:55","10:00","10:05","10:10","10:15","10:20"];

  for (let i = 0; i < e1AttendedUsers.length; i++) {
    const u = e1AttendedUsers[i];
    const amt = e1AmountMap[u.cat] ?? 2000;
    const reg = await prisma.registration.create({ data: {
      userId: u.id, eventId: e1.id,
      name: u.name, email: u.email, phone: "+91 98765 4" + String(1000 + i).slice(1),
      organization: u.org, designation: u.desg, category: u.cat,
      participantRole: "DELEGATE",
      status: "ATTENDED", paymentStatus: "PAID", amount: amt, currency: "INR",
      paymentMethod: e1Methods[i], paymentId: `PAY_E1_${String(i + 1).padStart(3, "0")}`,
      paidAt: d("2026-01-10T00:00:00Z"),
      attendanceStatus: "checked_in",
      checkedInAt: d(`2026-01-15T${checkInTimes[i]}:00+05:30`),
      qrCode: `QR-E1-${String(i + 1).padStart(4, "0")}`,
    }});
    e1regs.push(reg.id);
  }

  // 3 no-show confirmed registrations (no user account)
  const noShows = [
    { name: "Dr. Karthik Pillai",  email: "karthik.pillai@noshowdemo.apollo", cat: "Faculty",  amt: 2000 },
    { name: "Dr. Sunita Agarwal", email: "sunita.agarwal@noshowdemo.apollo", cat: "Resident", amt: 1200 },
    { name: "Dr. Rishi Verma",    email: "rishi.verma@noshowdemo.apollo",    cat: "Student",  amt: 600  },
  ];
  for (const ns of noShows) {
    await prisma.registration.create({ data: {
      eventId: e1.id, name: ns.name, email: ns.email, phone: "+91 99000 00001",
      category: ns.cat, participantRole: "DELEGATE",
      status: "CONFIRMED", paymentStatus: "PAID", amount: ns.amt, currency: "INR",
      paymentMethod: "razorpay", paidAt: d("2026-01-12T00:00:00Z"),
    }});
  }

  // 2 cancelled
  const cancelled = [
    { name: "Dr. Amit Das",   email: "amit.das@canceldemo.apollo", cat: "Faculty",  amt: 2000 },
    { name: "Dr. Geeta Nair", email: "geeta.nair@canceldemo.apollo", cat: "Resident", amt: 1200 },
  ];
  for (const c of cancelled) {
    await prisma.registration.create({ data: {
      eventId: e1.id, name: c.name, email: c.email, phone: "+91 99000 00002",
      category: c.cat, participantRole: "DELEGATE",
      status: "CANCELLED", paymentStatus: "REFUNDED", amount: c.amt, currency: "INR",
      paymentMethod: "razorpay",
    }});
  }

  // scan logs (check-in) for attended registrations
  for (let i = 0; i < e1regs.length; i++) {
    await prisma.scanLog.create({ data: {
      eventId: e1.id, registrationId: e1regs[i],
      scanType: "CHECK_IN", zoneId: e1z1.id, accessPointId: e1ap.id,
      direction: "IN", result: "SUCCESS",
      scannedAt: d(`2026-01-15T${checkInTimes[i]}:00+05:30`),
      scannedBy: "Desk Staff",
    }});
  }

  // food logs (breakfast + lunch day1 for all attended; tea+lunch day2 for first 18)
  for (let i = 0; i < e1regs.length; i++) {
    await prisma.foodLog.create({ data: { eventId: e1.id, foodZoneId: e1f1.id, registrationId: e1regs[i], servedAt: d("2026-01-15T08:30:00+05:30"), scannedBy: "Catering Staff" } });
    await prisma.foodLog.create({ data: { eventId: e1.id, foodZoneId: e1f2.id, registrationId: e1regs[i], servedAt: d("2026-01-15T13:00:00+05:30"), scannedBy: "Catering Staff" } });
    if (i < 18) {
      await prisma.foodLog.create({ data: { eventId: e1.id, foodZoneId: e1f3.id, registrationId: e1regs[i], servedAt: d("2026-01-16T10:30:00+05:30"), scannedBy: "Catering Staff" } });
      await prisma.foodLog.create({ data: { eventId: e1.id, foodZoneId: e1f4.id, registrationId: e1regs[i], servedAt: d("2026-01-16T13:00:00+05:30"), scannedBy: "Catering Staff" } });
    }
  }

  // quiz participants (top 8 who took the quiz)
  const quizScores = [92, 88, 85, 80, 76, 72, 68, 65];
  for (let i = 0; i < 8; i++) {
    await prisma.quizParticipant.create({ data: {
      quizId: e1quiz.id, registrationId: e1regs[i],
      score: quizScores[i],
      position: i < 3 ? i + 1 : null,
      isFinalist: i < 5,
      isWinner: i < 3,
    }});
  }

  // certificates — attendance for all attended
  for (let i = 0; i < e1regs.length; i++) {
    const u = e1AttendedUsers[i];
    await prisma.certificate.create({ data: {
      certificateCode: certCode("CARD-ATT"),
      registrationId: e1regs[i], eventId: e1.id,
      certificateType: "ATTENDANCE",
      recipientName: u.name, recipientEmail: u.email,
      title: "Certificate of Participation",
      description: "has actively participated in the Apollo Annual Cardiology Summit 2026",
      cmeCredits: 12,
      status: "ISSUED", issuedAt: d("2026-01-17T10:00:00Z"),
      downloadCount: Math.floor(i / 3) + 1,
    }});
  }

  // speaker certificates (for the 5 speakers — using first 5 regs as proxy)
  const e1spkNames = ["Dr. Priya Sharma","Dr. Arun Krishnaswamy","Dr. Deepa Verma","Dr. Sneha Patel","Dr. Rajesh Kumar"];
  const e1spkEmails2 = ["priya.sharma@apollo.demo","arun.krishnaswamy@apollo.demo","deepa.verma@apollo.demo","sneha.patel@apollo.demo","rajesh.kumar@apollo.demo"];
  for (let i = 0; i < 5; i++) {
    await prisma.certificate.create({ data: {
      certificateCode: certCode("CARD-SPK"),
      registrationId: e1regs[i], eventId: e1.id, sessionId: [e1s1.id,e1s2.id,e1s3.id,e1s4.id,e1s5.id][i],
      certificateType: "SPEAKER_SESSION",
      recipientName: e1spkNames[i], recipientEmail: e1spkEmails2[i],
      title: "Certificate of Appreciation",
      description: "for their outstanding contribution as a Speaker at the Apollo Annual Cardiology Summit 2026",
      status: "ISSUED", issuedAt: d("2026-01-17T10:00:00Z"),
      downloadCount: 1,
    }});
  }

  // quiz winner certificates (top 3)
  const quizCertTypes = ["QUIZ_WINNER","QUIZ_FINALIST","QUIZ_FINALIST"];
  const quizPositions = [1, 2, 3];
  for (let i = 0; i < 3; i++) {
    await prisma.certificate.create({ data: {
      certificateCode: certCode("CARD-QUIZ"),
      registrationId: e1regs[i], eventId: e1.id, quizId: e1quiz.id,
      certificateType: quizCertTypes[i],
      recipientName: e1AttendedUsers[i].name, recipientEmail: e1AttendedUsers[i].email,
      title: i === 0 ? "Quiz Winner Certificate" : "Quiz Finalist Certificate",
      description: i === 0 ? "has won 1st place in the Cardiology MCQ Challenge 2026" : `achieved ${i === 1 ? "2nd" : "3rd"} place in the Cardiology MCQ Challenge 2026`,
      position: quizPositions[i],
      status: "ISSUED", issuedAt: d("2026-01-16T13:00:00Z"),
      downloadCount: 2,
    }});
  }

  console.log(`✅  Event 1 complete — ${e1regs.length} attended, ${20 + 3 + 2} total regs, ${20 + 5 + 3} certificates\n`);

  // ══════════════════════════════════════════════════════════════════════════════
  // EVENT 2  ·  Apollo Healthcare Innovation Forum 2026  (ACTIVE, 3 days)
  // Jun 8–10 2026 · Hyderabad  (today = Jun 9 = Day 2)
  // ══════════════════════════════════════════════════════════════════════════════
  console.log("━━  Event 2: Apollo Healthcare Innovation Forum 2026 (ACTIVE)");

  const e2 = await prisma.event.create({ data: {
    title: "Apollo Healthcare Innovation Forum 2026",
    slug: "apollo-healthcare-innovation-forum-2026",
    shortDescription: "A 3-day multidisciplinary forum on AI in medicine, digital health, robotic surgery, and telemedicine innovations.",
    description: "The Apollo Healthcare Innovation Forum 2026 brings together clinicians, researchers, and health-tech leaders for three intensive days exploring the future of medicine. Featured tracks: AI & Diagnostics, Robotic Surgery, Digital Health, and Personalised Medicine.",
    startDate: d("2026-06-08T09:00:00+05:30"),
    endDate:   d("2026-06-10T17:00:00+05:30"),
    startTime: "09:00", endTime: "17:00", timezone: "Asia/Kolkata",
    location: "Apollo Convention Centre", address: "Road No. 2, Banjara Hills", city: "Hyderabad",
    state: "Telangana", country: "India",
    capacity: 300, status: "ACTIVE", type: "CONFERENCE",
    typeTags: ["CME", "DIGITAL HEALTH", "AI"],
    price: 3500, currency: "INR",
    cmeCredits: 18, cmeCoordinatorName: "Dr. Manohar Reddy",
    cmeCoordinatorEmail: "manohar.reddy@apollo.demo",
    organizer: "Apollo Hospitals Medical Education Division",
    contactEmail: "conferences@apollohospitals.com", contactPhone: "+91 40 2360 7777",
    includes: ["Conference Kit", "All Meals (3 Days)", "Tea Breaks", "CME Certificate", "Innovation Expo Access"],
    signatory1Name: "Dr. Manohar Reddy", signatory1Title: "Senior Transplant Surgeon",
    signatory2Name: "Dr. A. Subramaniam", signatory2Title: "Director, Apollo Hospitals Hyderabad",
    isPublished: true, isFeatured: true, isRegistrationOpen: true,
    tenantId: tenant.id,
    badgeCategories: [
      { id: "faculty",    label: "Faculty",    color: "#fff", bgColor: "#0369a1", borderColor: "#075985" },
      { id: "resident",   label: "Resident",   color: "#fff", bgColor: "#15803d", borderColor: "#166534" },
      { id: "student",    label: "Student",    color: "#fff", bgColor: "#b45309", borderColor: "#92400e" },
      { id: "innovator",  label: "Innovator",  color: "#fff", bgColor: "#7c3aed", borderColor: "#6d28d9" },
    ],
  }});

  // halls
  const e2hA = await prisma.eventHall.create({ data: { eventId: e2.id, name: "Grand Auditorium",  displayOrder: 0 } });
  const e2hB = await prisma.eventHall.create({ data: { eventId: e2.id, name: "Innovation Lab",    displayOrder: 1 } });
  const e2hC = await prisma.eventHall.create({ data: { eventId: e2.id, name: "Seminar Hall A",    displayOrder: 2 } });
  const e2hD = await prisma.eventHall.create({ data: { eventId: e2.id, name: "Workshop Bay",      displayOrder: 3 } });

  // pricing
  await prisma.eventPricing.createMany({ data: [
    { eventId: e2.id, name: "Faculty",   totalSlots: 100, price: 3500, displayOrder: 0 },
    { eventId: e2.id, name: "Resident",  totalSlots: 100, price: 1800, displayOrder: 1 },
    { eventId: e2.id, name: "Student",   totalSlots:  60, price:  900, displayOrder: 2 },
    { eventId: e2.id, name: "Innovator", totalSlots:  40, price: 5000, description: "For health-tech entrepreneurs and startup founders", displayOrder: 3 },
  ]});

  // event speakers
  const e2SpkEmails = ["manohar.reddy@apollo.demo","vikram.nair@apollo.demo","kavitha.iyer@apollo.demo","suresh.rao@apollo.demo","anitha.menon@apollo.demo","deepa.verma@apollo.demo"];
  for (let i = 0; i < e2SpkEmails.length; i++) {
    await prisma.eventSpeaker.create({ data: { eventId: e2.id, speakerId: SP(e2SpkEmails[i]), status: "confirmed", isPublished: true, sessionOrder: i + 1 } });
  }

  // sessions — Day 1 (Jun 8, completed)
  const e2s1 = await prisma.eventSession.create({ data: {
    eventId: e2.id, title: "Inaugural: AI & the Future of Clinical Diagnostics",
    sessionType: "KEYNOTE", sessionDate: d("2026-06-08T09:30:00+05:30"), startTime: "09:30", endTime: "10:30",
    hallId: e2hA.id, speakerId: SP("manohar.reddy@apollo.demo"), sessionOrder: 1, status: "completed", isPublished: true,
  }});
  await prisma.sessionSpeaker.create({ data: { sessionId: e2s1.id, speakerId: SP("manohar.reddy@apollo.demo"), talkTitle: "Machine Learning in Radiology: Clinical Reality Check", talkDuration: 50, displayOrder: 0 } });

  const e2s2 = await prisma.eventSession.create({ data: {
    eventId: e2.id, title: "Robotic Surgery: Precision, Safety & Outcomes",
    sessionType: "PLENARY", sessionDate: d("2026-06-08T11:00:00+05:30"), startTime: "11:00", endTime: "12:30",
    hallId: e2hA.id, sessionOrder: 2, status: "completed", isPublished: true,
  }});
  await prisma.sessionSpeaker.createMany({ data: [
    { sessionId: e2s2.id, speakerId: SP("vikram.nair@apollo.demo"),   talkTitle: "Robotic Joint Replacement: 3-Year Apollo Data",  talkDuration: 30, displayOrder: 0 },
    { sessionId: e2s2.id, speakerId: SP("anitha.menon@apollo.demo"),  talkTitle: "Robotic Oncological Surgery: What Changed?",     talkDuration: 30, displayOrder: 1 },
  ]});

  const e2s3 = await prisma.eventSession.create({ data: {
    eventId: e2.id, title: "Digital Health Bootcamp: Build Your First Telehealth Workflow",
    sessionType: "WORKSHOP", sessionDate: d("2026-06-08T14:00:00+05:30"), startTime: "14:00", endTime: "16:00",
    hallId: e2hD.id, speakerId: SP("deepa.verma@apollo.demo"), sessionOrder: 3, status: "completed", isPublished: true,
  }});
  await prisma.sessionSpeaker.create({ data: { sessionId: e2s3.id, speakerId: SP("deepa.verma@apollo.demo"), talkTitle: "Diabetes Digital Monitoring: App to Clinical Decision", talkDuration: 90, displayOrder: 0 } });

  // sessions — Day 2 (Jun 9, today = ongoing)
  const e2s4 = await prisma.eventSession.create({ data: {
    eventId: e2.id, title: "Morning Keynote: Personalised Medicine & Genomics",
    sessionType: "KEYNOTE", sessionDate: d("2026-06-09T09:30:00+05:30"), startTime: "09:30", endTime: "10:30",
    hallId: e2hA.id, speakerId: SP("kavitha.iyer@apollo.demo"), sessionOrder: 4, status: "ongoing", isPublished: true,
  }});
  await prisma.sessionSpeaker.create({ data: { sessionId: e2s4.id, speakerId: SP("kavitha.iyer@apollo.demo"), talkTitle: "Pharmacogenomics in Rheumatology: From Lab to Clinic", talkDuration: 45, displayOrder: 0 } });

  const e2s5 = await prisma.eventSession.create({ data: {
    eventId: e2.id, title: "Panel: Is AI Replacing the Physician?",
    sessionType: "PANEL", sessionDate: d("2026-06-09T11:00:00+05:30"), startTime: "11:00", endTime: "12:30",
    hallId: e2hA.id, sessionOrder: 5, status: "scheduled", isPublished: true,
  }});
  await prisma.sessionSpeaker.createMany({ data: [
    { sessionId: e2s5.id, speakerId: SP("manohar.reddy@apollo.demo"), talkTitle: "Moderator", talkDuration: 10, displayOrder: 0 },
    { sessionId: e2s5.id, speakerId: SP("vikram.nair@apollo.demo"),   talkTitle: "AI in Orthopedics: Evidence vs Hype", talkDuration: 20, displayOrder: 1 },
    { sessionId: e2s5.id, speakerId: SP("kavitha.iyer@apollo.demo"),  talkTitle: "Human Touch in AI-Augmented Care", talkDuration: 20, displayOrder: 2 },
  ]});

  const e2s6 = await prisma.eventSession.create({ data: {
    eventId: e2.id, title: "Live Demo: Surgical Robot in Action",
    sessionType: "WORKSHOP", sessionDate: d("2026-06-09T14:00:00+05:30"), startTime: "14:00", endTime: "16:00",
    hallId: e2hD.id, speakerId: SP("vikram.nair@apollo.demo"), sessionOrder: 6, status: "scheduled", isPublished: true,
  }});
  await prisma.sessionSpeaker.create({ data: { sessionId: e2s6.id, speakerId: SP("vikram.nair@apollo.demo"), talkTitle: "Da Vinci Surgical System: Live Demonstration", talkDuration: 90, displayOrder: 0 } });

  // sessions — Day 3 (Jun 10, tomorrow)
  const e2s7 = await prisma.eventSession.create({ data: {
    eventId: e2.id, title: "Wearables & Remote Monitoring in Chronic Disease",
    sessionType: "PLENARY", sessionDate: d("2026-06-10T09:30:00+05:30"), startTime: "09:30", endTime: "11:00",
    hallId: e2hA.id, sessionOrder: 7, status: "scheduled", isPublished: true,
  }});
  await prisma.sessionSpeaker.createMany({ data: [
    { sessionId: e2s7.id, speakerId: SP("deepa.verma@apollo.demo"),  talkTitle: "Continuous Glucose Monitoring: Real-World Impact",    talkDuration: 30, displayOrder: 0 },
    { sessionId: e2s7.id, speakerId: SP("suresh.rao@apollo.demo"),   talkTitle: "Wearables in Liver Disease Monitoring",               talkDuration: 30, displayOrder: 1 },
  ]});

  await prisma.eventSession.create({ data: {
    eventId: e2.id, title: "Healthcare Innovation Quiz — Grand Finale",
    sessionType: "OTHER", sessionDate: d("2026-06-10T11:00:00+05:30"), startTime: "11:00", endTime: "12:00",
    hallId: e2hA.id, sessionOrder: 8, status: "scheduled", isPublished: true,
  }});

  await prisma.eventSession.create({ data: {
    eventId: e2.id, title: "Valedictory & Certificate Distribution",
    sessionType: "OTHER", sessionDate: d("2026-06-10T16:00:00+05:30"), startTime: "16:00", endTime: "17:00",
    hallId: e2hA.id, sessionOrder: 9, status: "scheduled", isPublished: true,
  }});

  // zones & access points
  const e2z1 = await prisma.eventZone.create({ data: { eventId: e2.id, name: "Auditorium",    displayOrder: 0 } });
  const e2z2 = await prisma.eventZone.create({ data: { eventId: e2.id, name: "Innovation Expo", displayOrder: 1 } });
  await prisma.zoneAccessRule.createMany({ data: [
    { zoneId: e2z1.id, category: "Faculty",   allowed: true },
    { zoneId: e2z1.id, category: "Resident",  allowed: true },
    { zoneId: e2z1.id, category: "Student",   allowed: true },
    { zoneId: e2z1.id, category: "Innovator", allowed: true },
    { zoneId: e2z2.id, category: "Faculty",   allowed: true },
    { zoneId: e2z2.id, category: "Resident",  allowed: true },
    { zoneId: e2z2.id, category: "Student",   allowed: false },
    { zoneId: e2z2.id, category: "Innovator", allowed: true },
  ]});
  const e2ap = await prisma.accessPoint.create({ data: { eventId: e2.id, name: "Main Gate", type: "ACCESS", hallId: e2hA.id, direction: "BOTH", isActive: true } });

  // food zones
  const e2fB1 = await prisma.foodZone.create({ data: { eventId: e2.id, name: "Breakfast (Day 1)", maxServings: 300, isActive: true } });
  const e2fL1 = await prisma.foodZone.create({ data: { eventId: e2.id, name: "Lunch (Day 1)",     maxServings: 300, isActive: true } });
  const e2fB2 = await prisma.foodZone.create({ data: { eventId: e2.id, name: "Breakfast (Day 2)", maxServings: 300, isActive: true } });
  await prisma.foodZone.create({ data: { eventId: e2.id, name: "Lunch (Day 2)",     maxServings: 300, isActive: true } });
  await prisma.foodZone.create({ data: { eventId: e2.id, name: "Breakfast (Day 3)", maxServings: 300, isActive: true } });
  await prisma.foodZone.create({ data: { eventId: e2.id, name: "Lunch (Day 3)",     maxServings: 300, isActive: true } });

  // sponsors
  await prisma.eventSponsor.createMany({ data: [
    { eventId: e2.id, sponsorId: sponsorIds[0], tier: "PLATINUM", displayOrder: 0, isPublished: true },
    { eventId: e2.id, sponsorId: sponsorIds[3], tier: "GOLD",     displayOrder: 1, isPublished: true },
    { eventId: e2.id, sponsorId: sponsorIds[4], tier: "GOLD",     displayOrder: 2, isPublished: true },
    { eventId: e2.id, sponsorId: sponsorIds[1], tier: "SILVER",   displayOrder: 3, isPublished: true },
  ]});

  // LIVE engagements (the active ones on Day 2)
  const e2poll = await prisma.eventEngagement.create({ data: {
    eventId: e2.id,
    title: "What is the biggest barrier to AI adoption in Indian healthcare?",
    type: "POLL", isActive: true, displayOrder: 0,
    content: { options: [
      { id: "a", label: "Data privacy & regulatory gaps" },
      { id: "b", label: "High implementation cost" },
      { id: "c", label: "Lack of physician training" },
      { id: "d", label: "Poor digital infrastructure" },
    ]},
    sessionId: e2s5.id,
  }});

  const e2qa = await prisma.eventEngagement.create({ data: {
    eventId: e2.id,
    title: "Live Q&A — Is AI Replacing the Physician?",
    type: "QA", isActive: true, displayOrder: 1,
    description: "Submit your questions for the panel. Upvote questions you want answered first.",
    sessionId: e2s5.id,
  }});

  const e2wordcloud = await prisma.eventEngagement.create({ data: {
    eventId: e2.id,
    title: "Word Cloud: One word that defines Healthcare Innovation",
    type: "ANNOUNCEMENT", isActive: true, displayOrder: 2,
    description: "Share one word that you feel best defines healthcare innovation today.",
    content: { type: "wordcloud" },
  }});

  await prisma.eventEngagement.create({ data: {
    eventId: e2.id,
    title: "📢 Day 2 Schedule Update",
    type: "ANNOUNCEMENT", isActive: true, displayOrder: 3,
    description: "Day 2 morning keynote now begins at 09:30 AM in the Grand Auditorium. The Innovation Expo opens at 13:00. Workshop Bay access via Badge QR scan only.",
  }});

  const e2feedback = await prisma.eventEngagement.create({ data: {
    eventId: e2.id, title: "Post-Event Experience Survey", type: "FEEDBACK",
    isActive: false, displayOrder: 4,
    content: { questions: [
      { id: "q1", label: "Overall forum experience", type: "rating" },
      { id: "q2", label: "Relevance of innovation topics", type: "rating" },
      { id: "q3", label: "Speaker expertise", type: "rating" },
      { id: "q4", label: "Which track was most valuable?", type: "choice", options: ["AI & Diagnostics","Robotic Surgery","Digital Health","Personalised Medicine"] },
      { id: "q5", label: "Comments", type: "text" },
    ]},
  }});

  // poll responses (25 so far, live event)
  const e2PollDist = [{ id: "a", count: 10 }, { id: "b", count: 7 }, { id: "c", count: 5 }, { id: "d", count: 3 }];
  const e2PollLabels = ["Data privacy & regulatory gaps","High implementation cost","Lack of physician training","Poor digital infrastructure"];
  let e2Idx = 0;
  for (let o = 0; o < e2PollDist.length; o++) {
    for (let i = 0; i < e2PollDist[o].count; i++) {
      const u = userMap[(e2Idx + 5) % userMap.length];
      await prisma.engagementResponse.create({ data: {
        engagementId: e2poll.id, userId: u.id, userName: u.name,
        response: { answer: e2PollDist[o].id, label: e2PollLabels[o] },
        createdAt: d("2026-06-09T10:15:00+05:30"),
      }});
      e2Idx++;
    }
  }

  // Q&A questions (8 submitted questions)
  const qaQuestions = [
    "How do we ensure explainability of AI diagnostic models for clinicians?",
    "What is Apollo's roadmap for AI in pathology and radiology by 2028?",
    "Can AI models trained on Western data reliably work for Indian patient populations?",
    "How does Apollo handle data privacy when training AI on patient data?",
    "What is the cost-effectiveness of robotic surgery in rural India?",
    "Are there any published Apollo studies comparing robotic vs laparoscopic outcomes?",
    "How soon will we see AI-assisted real-time surgical guidance in Indian hospitals?",
    "What upskilling programs does Apollo offer for physicians to use AI tools?",
  ];
  for (let i = 0; i < qaQuestions.length; i++) {
    const u = userMap[(i + 3) % userMap.length];
    await prisma.engagementResponse.create({ data: {
      engagementId: e2qa.id, userId: u.id, userName: u.name,
      response: { text: qaQuestions[i], upvotes: [8, 12, 6, 9, 4, 7, 5, 3][i], answered: i < 3 },
      createdAt: d("2026-06-09T10:30:00+05:30"),
    }});
  }

  // word cloud entries (20)
  const wcWords = ["Innovation","Empathy","Technology","Precision","Access","Equity","AI","Digital","Care","Future","Data","Humans","Smart","Heal","Connect","Progress","Evidence","Patient","Compassion","Quality"];
  for (let i = 0; i < wcWords.length; i++) {
    const u = userMap[i % userMap.length];
    await prisma.engagementResponse.create({ data: {
      engagementId: e2wordcloud.id, userId: u.id, userName: u.name,
      response: { word: wcWords[i] },
      createdAt: d("2026-06-09T09:45:00+05:30"),
    }});
  }

  // quiz
  const e2quiz = await prisma.quiz.create({ data: {
    eventId: e2.id,
    title: "Healthcare Innovation Quiz 2026",
    description: "25 questions on AI in medicine, digital health, robotic surgery, and healthcare informatics. Top scorers receive certificates and special prizes.",
    status: "ONGOING",
  }});

  // registrations — 22 total (18 confirmed, 15 checked in, 2 pending, 2 waitlist)
  const e2Users = userMap.slice(2, 20); // 18 users
  const e2regs: string[] = [];
  const e2catMap: Record<string, number> = { Faculty: 3500, Resident: 1800, Student: 900 };
  const e2CheckedIn = new Set([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14]); // first 15 checked in

  for (let i = 0; i < e2Users.length; i++) {
    const u = e2Users[i];
    const amt = e2catMap[u.cat] ?? 3500;
    const isCheckedIn = e2CheckedIn.has(i);
    const reg = await prisma.registration.create({ data: {
      userId: u.id, eventId: e2.id,
      name: u.name, email: u.email, phone: "+91 87654 3" + String(1000 + i).slice(1),
      organization: u.org, designation: u.desg, category: u.cat,
      participantRole: "DELEGATE",
      status: "CONFIRMED", paymentStatus: "PAID", amount: amt, currency: "INR",
      paymentMethod: i % 3 === 0 ? "qr_code" : "razorpay",
      paymentId: `PAY_E2_${String(i + 1).padStart(3, "0")}`,
      paidAt: d("2026-06-01T00:00:00Z"),
      attendanceStatus: isCheckedIn ? "checked_in" : null,
      checkedInAt: isCheckedIn ? d("2026-06-08T09:00:00+05:30") : null,
      qrCode: `QR-E2-${String(i + 1).padStart(4, "0")}`,
    }});
    e2regs.push(reg.id);
  }

  // 2 pending
  await prisma.registration.create({ data: { eventId: e2.id, name: "Dr. Prabhakaran Nair", email: "prabhakaran.nair@pendingdemo.apollo", category: "Faculty", status: "PENDING", paymentStatus: "PENDING", amount: 3500, currency: "INR" } });
  await prisma.registration.create({ data: { eventId: e2.id, name: "Dr. Fatima Sheikh", email: "fatima.sheikh@pendingdemo.apollo", category: "Resident", status: "PENDING", paymentStatus: "PENDING", amount: 1800, currency: "INR" } });
  // 2 waitlist
  await prisma.registration.create({ data: { eventId: e2.id, name: "Dr. George Thomas", email: "george.thomas@waitlistdemo.apollo", category: "Student", status: "WAITLIST", paymentStatus: "PENDING", amount: 900, currency: "INR" } });
  await prisma.registration.create({ data: { eventId: e2.id, name: "Dr. Neha Kapoor", email: "neha.kapoor@waitlistdemo.apollo", category: "Faculty", status: "WAITLIST", paymentStatus: "PENDING", amount: 3500, currency: "INR" } });

  // scan logs for checked-in (Day 1 check-in)
  for (let i = 0; i < 15; i++) {
    await prisma.scanLog.create({ data: {
      eventId: e2.id, registrationId: e2regs[i],
      scanType: "CHECK_IN", zoneId: e2z1.id, accessPointId: e2ap.id,
      direction: "IN", result: "SUCCESS",
      scannedAt: d("2026-06-08T09:00:00+05:30"),
    }});
  }

  // food logs — day 1 breakfast + lunch for all 15 checked in; day 2 breakfast for 13
  for (let i = 0; i < 15; i++) {
    await prisma.foodLog.create({ data: { eventId: e2.id, foodZoneId: e2fB1.id, registrationId: e2regs[i], servedAt: d("2026-06-08T08:30:00+05:30") } });
    await prisma.foodLog.create({ data: { eventId: e2.id, foodZoneId: e2fL1.id, registrationId: e2regs[i], servedAt: d("2026-06-08T13:00:00+05:30") } });
    if (i < 13) {
      await prisma.foodLog.create({ data: { eventId: e2.id, foodZoneId: e2fB2.id, registrationId: e2regs[i], servedAt: d("2026-06-09T08:30:00+05:30") } });
    }
  }

  // quiz participants so far (5 started)
  const e2QuizScores = [78, 71, 65, 59, 52];
  for (let i = 0; i < 5; i++) {
    await prisma.quizParticipant.create({ data: {
      quizId: e2quiz.id, registrationId: e2regs[i],
      score: e2QuizScores[i], isFinalist: false, isWinner: false,
    }});
  }

  console.log(`✅  Event 2 complete — ${e2regs.length} confirmed, 15 checked in, live poll/Q&A/wordcloud active\n`);

  // ══════════════════════════════════════════════════════════════════════════════
  // EVENT 3  ·  Apollo Surgical Excellence Workshop 2026  (UPCOMING, 2 days)
  // Jul 10–11 2026 · Delhi
  // ══════════════════════════════════════════════════════════════════════════════
  console.log("━━  Event 3: Apollo Surgical Excellence Workshop 2026 (UPCOMING, 2-day)");

  const e3 = await prisma.event.create({ data: {
    title: "Apollo Surgical Excellence Workshop 2026",
    slug: "apollo-surgical-excellence-workshop-2026",
    shortDescription: "Intensive 2-day surgical skills workshop covering laparoscopic, robotic, and advanced open surgical techniques.",
    description: "This hands-on workshop is designed for surgeons and surgical residents seeking to sharpen their operative skills. Small group format (max 40 per session) ensures personal faculty attention. Includes cadaveric and simulation lab sessions.",
    startDate: d("2026-07-10T09:00:00+05:30"),
    endDate:   d("2026-07-11T17:00:00+05:30"),
    startTime: "09:00", endTime: "17:00", timezone: "Asia/Kolkata",
    location: "Apollo Institute of Surgery", address: "Mathura Road", city: "New Delhi",
    state: "Delhi", country: "India",
    capacity: 80, status: "UPCOMING", type: "WORKSHOP",
    typeTags: ["CME", "SURGERY", "HANDS-ON"],
    price: 4500, currency: "INR",
    registrationOpensDate: d("2026-06-01T00:00:00Z"),
    registrationDeadline:  d("2026-07-05T23:59:00Z"),
    cmeCredits: 10,
    organizer: "Apollo Hospitals Medical Education Division",
    contactEmail: "workshops@apollohospitals.com", contactPhone: "+91 11 2692 5858",
    includes: ["Workshop Kit", "Simulation Lab Access", "Lunch (Both Days)", "CME Certificate"],
    signatory1Name: "Dr. Anitha Menon", signatory1Title: "Senior Surgical Oncologist",
    signatory2Name: "Dr. R. Krishnamurthy", signatory2Title: "Director, Apollo Institute of Surgery",
    isPublished: true, isFeatured: false, isRegistrationOpen: true,
    tenantId: tenant.id,
    badgeCategories: [
      { id: "faculty",  label: "Faculty",  color: "#fff", bgColor: "#7c3aed", borderColor: "#6d28d9" },
      { id: "resident", label: "Resident", color: "#fff", bgColor: "#be123c", borderColor: "#9f1239" },
      { id: "student",  label: "Student",  color: "#fff", bgColor: "#0369a1", borderColor: "#075985" },
    ],
  }});

  // halls
  const e3hA = await prisma.eventHall.create({ data: { eventId: e3.id, name: "Main Hall",        displayOrder: 0 } });
  const e3hB = await prisma.eventHall.create({ data: { eventId: e3.id, name: "Skills Lab A",      displayOrder: 1 } });
  const e3hC = await prisma.eventHall.create({ data: { eventId: e3.id, name: "Simulation Centre", displayOrder: 2 } });

  // pricing
  await prisma.eventPricing.createMany({ data: [
    { eventId: e3.id, name: "Faculty",  totalSlots: 20, price: 4500,  displayOrder: 0 },
    { eventId: e3.id, name: "Resident", totalSlots: 40, price: 2200,  displayOrder: 1 },
    { eventId: e3.id, name: "Student",  totalSlots: 20, price: 1100,  displayOrder: 2 },
    { eventId: e3.id, name: "International", totalSlots: 10, price: 12000, displayOrder: 3 },
  ]});

  // event speakers
  const e3Spks = ["anitha.menon@apollo.demo","vikram.nair@apollo.demo","rajesh.kumar@apollo.demo","suresh.rao@apollo.demo"];
  for (let i = 0; i < e3Spks.length; i++) {
    await prisma.eventSpeaker.create({ data: { eventId: e3.id, speakerId: SP(e3Spks[i]), status: "confirmed", isPublished: true, sessionOrder: i + 1 } });
  }

  // sessions
  const e3sessions = [
    { title: "Laparoscopic Cholecystectomy: Tips & Pitfall Avoidance", type: "WORKSHOP", date: "2026-07-10T09:30:00+05:30", start: "09:30", end: "11:00", hall: e3hB, spk: "anitha.menon@apollo.demo", order: 1 },
    { title: "Surgical Anatomy Masterclass: Abdomen & Retroperitoneum", type: "PLENARY", date: "2026-07-10T11:00:00+05:30", start: "11:00", end: "12:30", hall: e3hA, spk: "rajesh.kumar@apollo.demo", order: 2 },
    { title: "Simulation Lab: Knot Tying & Endoscopic Suturing", type: "WORKSHOP", date: "2026-07-10T14:00:00+05:30", start: "14:00", end: "16:00", hall: e3hC, spk: "anitha.menon@apollo.demo", order: 3 },
    { title: "Robotic Surgery Fundamentals: Console Training", type: "WORKSHOP", date: "2026-07-11T09:30:00+05:30", start: "09:30", end: "11:30", hall: e3hC, spk: "vikram.nair@apollo.demo", order: 4 },
    { title: "Hepatobiliary Surgery: Tricks of the Trade", type: "PLENARY", date: "2026-07-11T11:30:00+05:30", start: "11:30", end: "13:00", hall: e3hA, spk: "suresh.rao@apollo.demo", order: 5 },
    { title: "Surgical Quiz & Certificate Distribution", type: "OTHER", date: "2026-07-11T15:00:00+05:30", start: "15:00", end: "17:00", hall: e3hA, spk: "anitha.menon@apollo.demo", order: 6 },
  ];
  for (const s of e3sessions) {
    const ses = await prisma.eventSession.create({ data: {
      eventId: e3.id, title: s.title, sessionType: s.type,
      sessionDate: d(s.date), startTime: s.start, endTime: s.end,
      hallId: s.hall.id, speakerId: SP(s.spk),
      sessionOrder: s.order, status: "scheduled", isPublished: true,
    }});
    await prisma.sessionSpeaker.create({ data: { sessionId: ses.id, speakerId: SP(s.spk), talkTitle: s.title, talkDuration: 60, displayOrder: 0 } });
  }

  // zones
  await prisma.eventZone.create({ data: { eventId: e3.id, name: "Conference Area",    displayOrder: 0 } });
  await prisma.eventZone.create({ data: { eventId: e3.id, name: "Skills Lab Area",    displayOrder: 1 } });
  await prisma.accessPoint.create({ data: { eventId: e3.id, name: "Main Entry", type: "ACCESS", hallId: e3hA.id, direction: "BOTH", isActive: true } });
  await prisma.foodZone.createMany({ data: [
    { eventId: e3.id, name: "Lunch (Day 1)", maxServings: 80, isActive: true },
    { eventId: e3.id, name: "Lunch (Day 2)", maxServings: 80, isActive: true },
    { eventId: e3.id, name: "Tea Break",     maxServings: 80, isActive: true },
  ]});

  // sponsors
  await prisma.eventSponsor.createMany({ data: [
    { eventId: e3.id, sponsorId: sponsorIds[3], tier: "PLATINUM", displayOrder: 0, isPublished: true },
    { eventId: e3.id, sponsorId: sponsorIds[4], tier: "GOLD",     displayOrder: 1, isPublished: true },
    { eventId: e3.id, sponsorId: sponsorIds[2], tier: "SILVER",   displayOrder: 2, isPublished: true },
  ]});

  // engagements (pre-configured, not yet active)
  await prisma.eventEngagement.create({ data: {
    eventId: e3.id, title: "Which surgical workshop are you most excited about?",
    type: "POLL", isActive: false, displayOrder: 0,
    content: { options: [
      { id: "a", label: "Laparoscopic Skills Lab" },
      { id: "b", label: "Robotic Surgery Console Training" },
      { id: "c", label: "Simulation Centre — Suturing" },
      { id: "d", label: "Hepatobiliary Surgery Masterclass" },
    ]},
  }});

  await prisma.eventEngagement.create({ data: {
    eventId: e3.id, title: "Pre-Workshop Q&A — Submit Your Surgical Questions",
    type: "QA", isActive: false, displayOrder: 1,
    description: "Submit questions for faculty ahead of the workshop. Top voted questions will be addressed during sessions.",
  }});

  await prisma.eventEngagement.create({ data: {
    eventId: e3.id, title: "📢 Welcome to Apollo Surgical Excellence Workshop 2026",
    type: "ANNOUNCEMENT", isActive: true, displayOrder: 2,
    description: "Thank you for registering! The workshop begins Jul 10 at 9:00 AM at Apollo Institute of Surgery, New Delhi. Please bring a valid photo ID and your registration QR code. Smart casuals recommended. Cadaveric gloves & aprons will be provided.",
  }});

  await prisma.eventEngagement.create({ data: {
    eventId: e3.id, title: "Post-Workshop Feedback", type: "FEEDBACK",
    isActive: false, displayOrder: 3,
    content: { questions: [
      { id: "q1", label: "Overall workshop experience", type: "rating" },
      { id: "q2", label: "Quality of faculty instruction", type: "rating" },
      { id: "q3", label: "Hands-on lab equipment & setup", type: "rating" },
      { id: "q4", label: "Would you attend future Apollo workshops?", type: "yesno" },
      { id: "q5", label: "Suggestions", type: "text" },
    ]},
  }});

  // quiz
  await prisma.quiz.create({ data: {
    eventId: e3.id, title: "Surgical Anatomy & Technique Quiz",
    description: "20 MCQs on surgical anatomy, laparoscopic principles, and procedural safety. Qualifies you for the workshop participation certificate.",
    status: "UPCOMING",
  }});

  // registrations — 18 total (12 confirmed, 4 pending, 2 cancelled)
  const e3Users = [...userMap.slice(0, 8), ...userMap.slice(10, 14)]; // 12 users
  const e3regs: string[] = [];
  const e3amtMap: Record<string, number> = { Faculty: 4500, Resident: 2200, Student: 1100 };

  for (let i = 0; i < 12; i++) {
    const u = e3Users[i];
    const reg = await prisma.registration.create({ data: {
      userId: u.id, eventId: e3.id,
      name: u.name, email: u.email, phone: "+91 76543 2" + String(1000 + i).slice(1),
      organization: u.org, designation: u.desg, category: u.cat,
      participantRole: "DELEGATE",
      status: "CONFIRMED", paymentStatus: "PAID", amount: e3amtMap[u.cat] ?? 4500, currency: "INR",
      paymentMethod: i % 4 === 0 ? "qr_code" : "razorpay",
      paidAt: d("2026-06-15T00:00:00Z"),
      qrCode: `QR-E3-${String(i + 1).padStart(4, "0")}`,
    }});
    e3regs.push(reg.id);
  }

  // 4 pending
  const e3Pending = [
    { name: "Dr. Akash Tiwari", email: "akash.tiwari@pendingdemo.apollo", cat: "Resident" },
    { name: "Dr. Shobha Rao",   email: "shobha.rao@pendingdemo.apollo",   cat: "Faculty"  },
    { name: "Dr. Vivek Menon",  email: "vivek.menon@pendingdemo.apollo",  cat: "Student"  },
    { name: "Dr. Kamla Devi",   email: "kamla.devi@pendingdemo.apollo",   cat: "Resident" },
  ];
  for (const p of e3Pending) {
    await prisma.registration.create({ data: {
      eventId: e3.id, name: p.name, email: p.email,
      category: p.cat, status: "PENDING", paymentStatus: "PENDING",
      amount: e3amtMap[p.cat] ?? 2200, currency: "INR",
    }});
  }

  // 2 cancelled
  await prisma.registration.create({ data: { eventId: e3.id, name: "Dr. Ajit Rao", email: "ajit.rao@canceldemo.apollo", category: "Faculty", status: "CANCELLED", paymentStatus: "REFUNDED", amount: 4500, currency: "INR" } });
  await prisma.registration.create({ data: { eventId: e3.id, name: "Dr. Nisha Kumari", email: "nisha.kumari@canceldemo.apollo", category: "Student", status: "CANCELLED", paymentStatus: "REFUNDED", amount: 1100, currency: "INR" } });

  console.log(`✅  Event 3 complete — 12 confirmed, 4 pending, 2 cancelled\n`);

  // ══════════════════════════════════════════════════════════════════════════════
  // EVENT 4  ·  Apollo International Medical Congress 2026  (UPCOMING, 3 days)
  // Aug 5–7 2026 · Mumbai
  // ══════════════════════════════════════════════════════════════════════════════
  console.log("━━  Event 4: Apollo International Medical Congress 2026 (UPCOMING, 3-day)");

  const e4 = await prisma.event.create({ data: {
    title: "Apollo International Medical Congress 2026",
    slug: "apollo-international-medical-congress-2026",
    shortDescription: "The flagship 3-day international congress bringing together Apollo's finest specialists and global medical leaders across all super-specialties.",
    description: "The Apollo International Medical Congress 2026 is the most comprehensive medical conference in the Apollo calendar. With 15 concurrent symposia, 4 pre-congress workshops, an industry innovation expo, and a gala dinner, this 3-day congress is the ultimate platform for medical networking, learning, and collaboration. All sessions are CME accredited — 24 credits.",
    startDate: d("2026-08-05T09:00:00+05:30"),
    endDate:   d("2026-08-07T17:00:00+05:30"),
    startTime: "09:00", endTime: "17:00", timezone: "Asia/Kolkata",
    location: "Jio World Convention Centre", address: "G-Block, BKC", city: "Mumbai",
    state: "Maharashtra", country: "India",
    capacity: 500, status: "UPCOMING", type: "CONFERENCE",
    typeTags: ["CME", "INTERNATIONAL", "MULTI-SPECIALTY"],
    price: 6000, currency: "INR",
    earlyBirdPrice: 4500,
    earlyBirdDeadline: d("2026-07-15T23:59:00Z"),
    registrationOpensDate: d("2026-06-01T00:00:00Z"),
    registrationDeadline:  d("2026-08-01T23:59:00Z"),
    cmeCredits: 24,
    organizer: "Apollo Hospitals Medical Education Division",
    contactEmail: "congress@apollohospitals.com", contactPhone: "+91 22 2626 8888",
    includes: ["Congress Kit", "All Meals (3 Days)", "Tea Breaks", "Gala Dinner", "Industry Expo Access", "CME Certificate", "E-Proceedings USB"],
    signatory1Name: "Dr. Priya Sharma", signatory1Title: "Senior Interventional Cardiologist",
    signatory2Name: "Dr. Suresh Rao", signatory2Title: "Hepatologist & Congress Chair",
    isPublished: true, isFeatured: true, isRegistrationOpen: true,
    tenantId: tenant.id,
    badgeCategories: [
      { id: "faculty",       label: "Faculty",       color: "#fff", bgColor: "#1e3a8a", borderColor: "#172554" },
      { id: "resident",      label: "Resident",      color: "#fff", bgColor: "#14532d", borderColor: "#052e16" },
      { id: "student",       label: "Student",       color: "#fff", bgColor: "#713f12", borderColor: "#422006" },
      { id: "international", label: "International", color: "#fff", bgColor: "#4a044e", borderColor: "#2e1065" },
      { id: "press",         label: "Media",         color: "#fff", bgColor: "#450a0a", borderColor: "#7f1d1d" },
    ],
  }});

  // halls
  const e4hA = await prisma.eventHall.create({ data: { eventId: e4.id, name: "Grand Plenary Hall",    displayOrder: 0 } });
  const e4hB = await prisma.eventHall.create({ data: { eventId: e4.id, name: "Conference Hall 1",     displayOrder: 1 } });
  const e4hC = await prisma.eventHall.create({ data: { eventId: e4.id, name: "Conference Hall 2",     displayOrder: 2 } });
  const e4hD = await prisma.eventHall.create({ data: { eventId: e4.id, name: "Workshop & Simulation", displayOrder: 3 } });
  const e4hE = await prisma.eventHall.create({ data: { eventId: e4.id, name: "Innovation Expo Hall",  displayOrder: 4 } });

  // pricing
  await prisma.eventPricing.createMany({ data: [
    { eventId: e4.id, name: "Faculty",       totalSlots: 150, price: 6000,  earlyBirdPrice: 4500, earlyBirdDeadline: d("2026-07-15T23:59:00Z"), displayOrder: 0 },
    { eventId: e4.id, name: "Resident",      totalSlots: 150, price: 3000,  earlyBirdPrice: 2200, earlyBirdDeadline: d("2026-07-15T23:59:00Z"), displayOrder: 1 },
    { eventId: e4.id, name: "Student",       totalSlots: 100, price: 1500,  earlyBirdPrice: 1000, earlyBirdDeadline: d("2026-07-15T23:59:00Z"), displayOrder: 2 },
    { eventId: e4.id, name: "International", totalSlots:  50, price: 15000, description: "International delegates (outside India)", displayOrder: 3 },
    { eventId: e4.id, name: "Virtual",       totalSlots: 200, price: 1200,  description: "Online access to all livestreamed sessions", displayOrder: 4 },
  ]});

  // ALL 10 speakers for flagship congress
  for (let i = 0; i < SPEAKER_DATA.length; i++) {
    await prisma.eventSpeaker.create({ data: { eventId: e4.id, speakerId: SP(SPEAKER_DATA[i].email), status: "confirmed", isPublished: true, sessionOrder: i + 1 } });
  }

  // sessions — Day 1 (Aug 5)
  const e4s = [
    { title: "Presidential Address: Healthcare India 2030", type: "KEYNOTE", date: "2026-08-05T09:30:00+05:30", s: "09:30", e: "10:30", hall: e4hA, spk: "priya.sharma@apollo.demo", order: 1 },
    { title: "Symposium: Advances in Cardiovascular Medicine", type: "PLENARY", date: "2026-08-05T11:00:00+05:30", s: "11:00", e: "12:30", hall: e4hA, spk: "priya.sharma@apollo.demo", order: 2 },
    { title: "Workshop: Minimally Invasive Surgery Masterclass", type: "WORKSHOP", date: "2026-08-05T11:00:00+05:30", s: "11:00", e: "13:00", hall: e4hD, spk: "anitha.menon@apollo.demo", order: 3 },
    { title: "Oncology Update: From Bench to Bedside", type: "PLENARY", date: "2026-08-05T14:00:00+05:30", s: "14:00", e: "15:30", hall: e4hB, spk: "anitha.menon@apollo.demo", order: 4 },
    { title: "Neuroscience Forum: Stroke & Brain Injury", type: "PLENARY", date: "2026-08-05T14:00:00+05:30", s: "14:00", e: "15:30", hall: e4hC, spk: "rajesh.kumar@apollo.demo", order: 5 },
    // Day 2 (Aug 6)
    { title: "Keynote: Personalised Medicine — A New Paradigm", type: "KEYNOTE", date: "2026-08-06T09:30:00+05:30", s: "09:30", e: "10:30", hall: e4hA, spk: "kavitha.iyer@apollo.demo", order: 6 },
    { title: "Transplant Medicine: 40 Years of Progress", type: "PLENARY", date: "2026-08-06T11:00:00+05:30", s: "11:00", e: "12:30", hall: e4hA, spk: "manohar.reddy@apollo.demo", order: 7 },
    { title: "Panel: Chronic Disease Management at Scale", type: "PANEL", date: "2026-08-06T14:00:00+05:30", s: "14:00", e: "15:30", hall: e4hB, spk: "deepa.verma@apollo.demo", order: 8 },
    { title: "Gastroenterology & Hepatology Grand Rounds", type: "PLENARY", date: "2026-08-06T14:00:00+05:30", s: "14:00", e: "15:30", hall: e4hC, spk: "suresh.rao@apollo.demo", order: 9 },
    { title: "International Medical Congress Quiz", type: "OTHER", date: "2026-08-06T16:00:00+05:30", s: "16:00", e: "17:00", hall: e4hA, spk: "priya.sharma@apollo.demo", order: 10 },
    // Day 3 (Aug 7)
    { title: "Keynote: The Future of Surgery — Robotics & Beyond", type: "KEYNOTE", date: "2026-08-07T09:30:00+05:30", s: "09:30", e: "10:30", hall: e4hA, spk: "vikram.nair@apollo.demo", order: 11 },
    { title: "Rheumatology & Musculoskeletal Disease Update", type: "PLENARY", date: "2026-08-07T11:00:00+05:30", s: "11:00", e: "12:30", hall: e4hB, spk: "kavitha.iyer@apollo.demo", order: 12 },
    { title: "Pulmonology: COPD, ILD & Critical Care", type: "PLENARY", date: "2026-08-07T11:00:00+05:30", s: "11:00", e: "12:30", hall: e4hC, spk: "arun.krishnaswamy@apollo.demo", order: 13 },
    { title: "Multi-Disciplinary Tumour Board Live Cases", type: "WORKSHOP", date: "2026-08-07T14:00:00+05:30", s: "14:00", e: "15:30", hall: e4hD, spk: "anitha.menon@apollo.demo", order: 14 },
    { title: "Valedictory, Awards & Certificate Distribution", type: "OTHER", date: "2026-08-07T16:00:00+05:30", s: "16:00", e: "17:00", hall: e4hA, spk: "priya.sharma@apollo.demo", order: 15 },
  ];
  for (const s of e4s) {
    const ses = await prisma.eventSession.create({ data: {
      eventId: e4.id, title: s.title, sessionType: s.type,
      sessionDate: d(s.date), startTime: s.s, endTime: s.e,
      hallId: s.hall.id, speakerId: SP(s.spk),
      sessionOrder: s.order, status: "scheduled", isPublished: true,
    }});
    await prisma.sessionSpeaker.create({ data: { sessionId: ses.id, speakerId: SP(s.spk), talkTitle: s.title, talkDuration: 60, displayOrder: 0 } });
  }

  // zones
  const e4z1 = await prisma.eventZone.create({ data: { eventId: e4.id, name: "Plenary Area",       displayOrder: 0 } });
  const e4z2 = await prisma.eventZone.create({ data: { eventId: e4.id, name: "VIP / Speaker Zone", displayOrder: 1 } });
  const e4z3 = await prisma.eventZone.create({ data: { eventId: e4.id, name: "Expo Hall",          displayOrder: 2 } });
  await prisma.zoneAccessRule.createMany({ data: [
    { zoneId: e4z1.id, category: "Faculty",       allowed: true  },
    { zoneId: e4z1.id, category: "Resident",      allowed: true  },
    { zoneId: e4z1.id, category: "Student",       allowed: true  },
    { zoneId: e4z1.id, category: "International", allowed: true  },
    { zoneId: e4z2.id, category: "Faculty",       allowed: true  },
    { zoneId: e4z2.id, category: "Resident",      allowed: false },
    { zoneId: e4z2.id, category: "Student",       allowed: false },
    { zoneId: e4z2.id, category: "International", allowed: true  },
    { zoneId: e4z3.id, category: "Faculty",       allowed: true  },
    { zoneId: e4z3.id, category: "Resident",      allowed: true  },
    { zoneId: e4z3.id, category: "Student",       allowed: false },
    { zoneId: e4z3.id, category: "International", allowed: true  },
  ]});
  await prisma.accessPoint.create({ data: { eventId: e4.id, name: "Main Congress Entry", type: "ACCESS", hallId: e4hA.id, direction: "BOTH", isActive: true } });

  // food zones
  const mealNames = ["Breakfast Day 1","Lunch Day 1","Gala Dinner","Breakfast Day 2","Lunch Day 2","Breakfast Day 3","Lunch Day 3"];
  for (const m of mealNames) {
    await prisma.foodZone.create({ data: { eventId: e4.id, name: m, maxServings: 500, isActive: true } });
  }

  // sponsors (all 5)
  await prisma.eventSponsor.createMany({ data: [
    { eventId: e4.id, sponsorId: sponsorIds[0], tier: "PLATINUM", displayOrder: 0, isPublished: true },
    { eventId: e4.id, sponsorId: sponsorIds[1], tier: "GOLD",     displayOrder: 1, isPublished: true },
    { eventId: e4.id, sponsorId: sponsorIds[2], tier: "GOLD",     displayOrder: 2, isPublished: true },
    { eventId: e4.id, sponsorId: sponsorIds[3], tier: "SILVER",   displayOrder: 3, isPublished: true },
    { eventId: e4.id, sponsorId: sponsorIds[4], tier: "SILVER",   displayOrder: 4, isPublished: true },
  ]});

  // engagements — rich pre-configured set
  await prisma.eventEngagement.create({ data: {
    eventId: e4.id, title: "📢 Early Bird Registration is Now Open!",
    type: "ANNOUNCEMENT", isActive: true, displayOrder: 0,
    description: "Early bird rates available until July 15, 2026. Register now and save up to ₹1,500! Group discounts available for 5+ delegates from the same institution. Contact congress@apollohospitals.com for group registrations.",
  }});

  await prisma.eventEngagement.create({ data: {
    eventId: e4.id, title: "Which super-specialty track interests you most?",
    type: "POLL", isActive: false, displayOrder: 1,
    description: "Help us prioritise session topics — your vote shapes the final programme!",
    content: { options: [
      { id: "a", label: "Cardiology & Interventional Procedures" },
      { id: "b", label: "Oncology & Cancer Surgery" },
      { id: "c", label: "Neurosciences & Stroke" },
      { id: "d", label: "Transplant Medicine" },
    ]},
  }});

  await prisma.eventEngagement.create({ data: {
    eventId: e4.id, title: "Pre-Congress Poll: What is India's biggest healthcare challenge?",
    type: "POLL", isActive: false, displayOrder: 2,
    content: { options: [
      { id: "a", label: "Access to affordable care in rural areas" },
      { id: "b", label: "Shortage of trained specialists" },
      { id: "c", label: "Rising burden of non-communicable diseases" },
      { id: "d", label: "Digital health literacy & infrastructure" },
    ]},
  }});

  await prisma.eventEngagement.create({ data: {
    eventId: e4.id, title: "Submit Your Abstract / Clinical Case for Congress Review",
    type: "QA", isActive: false, displayOrder: 3,
    description: "Submit interesting clinical cases or research abstracts for presentation during the Free Paper Sessions. Top submissions will be awarded during the Valedictory.",
  }});

  await prisma.eventEngagement.create({ data: {
    eventId: e4.id, title: "Live Q&A — Presidential Address",
    type: "QA", isActive: false, displayOrder: 4,
    description: "Submit your questions for the Presidential Address. Questions will be curated by the moderator.",
  }});

  await prisma.eventEngagement.create({ data: {
    eventId: e4.id, title: "Word Cloud: Your Expectations from the Congress",
    type: "ANNOUNCEMENT", isActive: false, displayOrder: 5,
    description: "Share one word that captures what you hope to gain from the Apollo International Medical Congress 2026.",
    content: { type: "wordcloud" },
  }});

  await prisma.eventEngagement.create({ data: {
    eventId: e4.id, title: "Congress Experience Survey",
    type: "FEEDBACK", isActive: false, displayOrder: 6,
    content: { questions: [
      { id: "q1", label: "Overall congress experience", type: "rating" },
      { id: "q2", label: "Scientific programme quality", type: "rating" },
      { id: "q3", label: "Venue, catering & logistics", type: "rating" },
      { id: "q4", label: "Networking opportunities", type: "rating" },
      { id: "q5", label: "Value for money", type: "rating" },
      { id: "q6", label: "Which session was most impactful?", type: "text" },
      { id: "q7", label: "Would you attend again?", type: "yesno" },
    ]},
  }});

  // quiz
  await prisma.quiz.create({ data: {
    eventId: e4.id, title: "Apollo International Medical Congress Quiz 2026",
    description: "The flagship MCQ competition with 40 questions spanning all super-specialties. Winners receive cash prizes and special recognition certificates. Top 10 advance to the Grand Finale on Day 2.",
    status: "UPCOMING",
  }});

  // early registrations — 12 (8 confirmed early bird, 4 pending)
  const e4amtMap: Record<string, number> = { Faculty: 4500, Resident: 2200, Student: 1000, International: 15000 };
  const e4earlyUsers = userMap.slice(4, 12); // 8 users
  const e4regs: string[] = [];
  for (let i = 0; i < e4earlyUsers.length; i++) {
    const u = e4earlyUsers[i];
    const reg = await prisma.registration.create({ data: {
      userId: u.id, eventId: e4.id,
      name: u.name, email: u.email, phone: "+91 65432 1" + String(1000 + i).slice(1),
      organization: u.org, designation: u.desg, category: u.cat,
      participantRole: "DELEGATE",
      status: "CONFIRMED", paymentStatus: "PAID",
      amount: e4amtMap[u.cat] ?? 4500, currency: "INR",
      paymentMethod: "razorpay", paymentId: `PAY_E4_${String(i + 1).padStart(3, "0")}`,
      paidAt: d("2026-06-05T00:00:00Z"),
      notes: "Early bird registration",
      qrCode: `QR-E4-${String(i + 1).padStart(4, "0")}`,
    }});
    e4regs.push(reg.id);
  }

  // 4 pending
  const e4Pending = [
    { name: "Dr. Emmanuel Joseph",  email: "emmanuel.joseph@pendingdemo.apollo",  cat: "Faculty"       },
    { name: "Dr. Sana Mirza",       email: "sana.mirza@pendingdemo.apollo",       cat: "International" },
    { name: "Dr. Aditya Banerjee",  email: "aditya.banerjee@pendingdemo.apollo",  cat: "Resident"      },
    { name: "Dr. Swati Kulkarni",   email: "swati.kulkarni@pendingdemo.apollo",   cat: "Student"       },
  ];
  for (const p of e4Pending) {
    await prisma.registration.create({ data: {
      eventId: e4.id, name: p.name, email: p.email,
      category: p.cat, status: "PENDING", paymentStatus: "PENDING",
      amount: e4amtMap[p.cat] ?? 4500, currency: "INR",
    }});
  }

  console.log(`✅  Event 4 complete — 8 early-bird confirmed, 4 pending, 15 sessions, all engagements pre-configured\n`);

  // ── DONE ───────────────────────────────────────────────────────────────────
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("🎉  Apollo Medical Demo Seed Complete!\n");
  console.log("Events created:");
  console.log("  1.  Apollo Annual Cardiology Summit 2026         (COMPLETED, 2-day, Chennai)");
  console.log("      → 25 registrations | 20 attended | 28 certificates | quiz done");
  console.log("  2.  Apollo Healthcare Innovation Forum 2026      (ACTIVE, 3-day, Hyderabad)");
  console.log("      → 22 confirmed | 15 checked in | Live poll + Q&A + word cloud");
  console.log("  3.  Apollo Surgical Excellence Workshop 2026     (UPCOMING, 2-day, Delhi)");
  console.log("      → 18 registrations | engagements pre-configured | quiz upcoming");
  console.log("  4.  Apollo International Medical Congress 2026   (UPCOMING, 3-day, Mumbai)");
  console.log("      → 12 early-bird regs | 15 sessions | 7 engagements | early bird open");
  console.log();
  console.log("Supporting data:");
  console.log("  10 speakers  |  5 sponsors  |  20 attendee users (pass: User@123)");
  console.log("═══════════════════════════════════════════════════════════════\n");
}

main()
  .catch((e) => { console.error("❌  Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
