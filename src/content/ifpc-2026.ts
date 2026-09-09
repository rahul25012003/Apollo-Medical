/**
 * IFPC 2026 — static site copy.
 *
 * Sourced verbatim (professionally rewritten) from the official conference
 * website content package (forensicpsychiatry.in), for the apollo-medical
 * tenant only. This content is finished/final — no admin CMS is built for
 * it; the few fields organisers do need to edit live (fees, speakers,
 * schedule, FAQ) are backed by the existing Tenant/Event/Speaker/EventSession
 * database models instead (see prisma/seed-ifpc-2026.ts).
 */

export const CONFERENCE = {
  name: "International Forensic Psychiatry Conference 2026",
  shortName: "IFPC 2026",
  theme: "Bridging the Gap",
  dates: "2–5 November 2026",
  startDate: "2026-11-02",
  endDate: "2026-11-05",
  venueName: "NIMHANS Convention Centre",
  venueAddress: "Hosur Road, Bengaluru, India – 560029",
  city: "Bengaluru",
  hosts: "Hosted by NIMHANS, Bengaluru & RANZCP",
  hostsLong:
    "Hosted by NIMHANS, Bengaluru & RANZCP (Royal Australian and New Zealand College of Psychiatrists)",
};

// All hrefs are anchors on the single merged /t/apollo-medical page (see
// page.tsx) — there are no separate routes for these sections anymore.
export const CTA_LINKS = {
  registerNow: { label: "Register Now", href: "#registration" },
  submitAbstract: { label: "Submit Abstract", href: "#abstract" },
  exploreHighlights: { label: "Explore the Highlights", href: "#highlights" },
  viewSpeakers: { label: "View Speakers", href: "#speakers" },
  viewProgramme: { label: "View Scientific Programme", href: "#programme" },
  viewTopics: { label: "View Topics", href: "#topics" },
  planYourVisit: { label: "Plan Your Visit", href: "#venue" },
  learnMore: { label: "Learn More About Us", href: "#about" },
  contactUs: { label: "Contact Us", href: "#contact" },
  sendMessage: { label: "Send Us a Message", href: "#contact" },
  getDirections: { label: "Get Directions", href: "#venue" },
};

export const NAV_LINKS = [
  { label: "Home", href: "" },
  { label: "About", href: "#about" },
  { label: "Highlights", href: "#highlights" },
  { label: "Speakers", href: "#speakers" },
  { label: "Scientific Programme", href: "#programme" },
  { label: "Topics", href: "#topics" },
  { label: "Abstract Submission", href: "#abstract" },
  { label: "Registration", href: "#registration" },
  { label: "Venue & Travel", href: "#venue" },
  { label: "Organising Committee", href: "#organising-committee" },
  { label: "Contact", href: "#contact" },
  { label: "FAQ", href: "#faq" },
];

export const FOOTER_QUICK_LINKS = NAV_LINKS;

export const FOOTER = {
  tagline: "International Forensic Psychiatry Conference 2026 — Bridging the Gap",
  copyright: "© 2026 International Forensic Psychiatry Conference. All rights reserved.",
};

// ---------------------------------------------------------------------------
// HOME
// ---------------------------------------------------------------------------

export const HOME = {
  hero: {
    eyebrow: "International Forensic Psychiatry Conference 2026",
    headline: "Bridging the Gap",
    subheadline: "A global gathering advancing forensic psychiatry knowledge and practice",
    dates: "2–5 November 2026",
    venue: "NIMHANS Convention Centre, Bengaluru, India – 560029",
    hosts: "Hosted by NIMHANS, Bengaluru & RANZCP (Royal Australian and New Zealand College of Psychiatrists)",
  },
  welcome:
    "Join forensic psychiatrists, mental health professionals, and legal experts from around the world at the National Institute of Mental Health and Neuro Sciences (NIMHANS), Bengaluru, India, for a global gathering dedicated to advancing forensic psychiatry knowledge and practice. Co-hosted by NIMHANS, Bengaluru and RANZCP, the conference brings together clinicians, researchers, trainees, and law professionals for four days of expert-led sessions, workshops, and collaborative discussion.",
  theme: {
    title: "Conference Theme — “Bridging the Gap”",
    paragraphs: [
      "The theme of IFPC 2026 is ‘Bridging the Gap.’ The conference explores the critical interfaces within forensic psychiatry — between research and practice, courts and clinics, custody and care, and punishment and rehabilitation — fostering dialogue that strengthens evidence-based, ethical, and humane forensic mental health systems.",
      "The conference also seeks to bridge the gap between Australia, New Zealand, and India in forensic psychiatry by fostering academic, clinical, and policy-level collaboration, promoting mutual learning in training, service delivery, risk assessment, rehabilitation, and human-rights-based care.",
    ],
  },
  whatToExpect: {
    title: "What to Expect",
    items: [
      "Expert plenary lectures from national and international faculty",
      "Interactive sessions and case-based workshops",
      "Dedicated tracks for psychiatry trainees, psychiatrists, forensic medicine professionals, mental health professionals, and law professionals",
      "Cross-country learning through Australia–New Zealand–India collaboration",
      "Cultural programme, networking dinners, campus tour, and wellness sessions",
    ],
  },
  hosts: {
    title: "Host Institutions",
    items: [
      {
        name: "NIMHANS, Bengaluru",
        description:
          "An Institute of National Importance dedicated to excellence in mental health and neurosciences through integrated patient care, education, research, and community outreach.",
      },
      {
        name: "RANZCP",
        description:
          "The Royal Australian and New Zealand College of Psychiatrists, bringing together experts in forensic psychiatry to share knowledge and advance the field internationally.",
      },
    ],
  },
  closing: {
    title: "Join us at NIMHANS, Bengaluru",
    text: "for four days of insightful sessions, hands-on workshops, and meaningful networking.",
  },
};

// ---------------------------------------------------------------------------
// ABOUT
// ---------------------------------------------------------------------------

export const ABOUT = {
  intro:
    "The International Forensic Psychiatry Conference (IFPC) 2026 will be held over four days, from Monday, 2 November to Thursday, 5 November 2026, at the NIMHANS Convention Centre, Bengaluru, India. The conference is co-hosted by NIMHANS, Bengaluru and RANZCP, and is designed for psychiatry trainees, psychiatrists, forensic medicine professionals, mental health professionals, and law professionals.",
  theme: {
    title: "Our Theme: Bridging the Gap",
    paragraphs: [
      "‘Bridging the Gap’ reflects the conference’s aim to explore the critical interfaces in forensic psychiatry between research and practice, courts and clinics, custody and care, and punishment and rehabilitation — fostering dialogue that strengthens evidence-based, ethical, and humane forensic mental health systems.",
      "The conference also aims to bridge the gap between Australia, New Zealand, and India by fostering academic, clinical, and policy-level collaboration. Sharing experience across diverse legal systems, service models, and cultural contexts will promote mutual learning in forensic training, service delivery, risk assessment, rehabilitation, and human-rights-based care — contributing to globally informed, locally relevant, and evidence-based forensic psychiatry practice.",
    ],
    bridges: [
      "Research and Clinical Practice — translating evidence into real-world forensic care",
      "Courtroom and Bedside — integrating judicial expectations with therapeutic needs",
      "Clinic and Courtroom — strengthening the use of sound clinical evidence in legal decision-making",
      "Punitive Approaches and Therapeutic Rehabilitation — redefining justice through recovery-oriented care",
      "Custody and Care — ensuring continuity of mental healthcare across custodial settings",
      "Risk Assessment and Risk Management — moving from prediction to meaningful intervention",
      "Legal Standards and Clinical Ethics — harmonising law, ethics, and professional judgement",
      "Mental Illness and Criminal Responsibility — clarifying the interface between psychopathology and culpability",
      "Prisons and Community Reintegration — bridging institutional care and societal inclusion",
      "Victim Protection and Offender Treatment — balancing public safety with patient rights",
      "Policy and Practice — implementing mental health laws effectively at the ground level",
      "Expert Opinion and Judicial Understanding — improving clarity and credibility in expert testimony",
      "Human Rights and Public Safety — reconciling rights-based care with societal protection",
      "Fragmented Services and Integrated Forensic Systems — building coordinated multidisciplinary pathways",
      "Assessment and Recovery — shifting focus from evaluation to long-term rehabilitation",
    ],
  },
  nimhans: {
    title: "About NIMHANS, Bengaluru",
    paragraphs: [
      "The National Institute of Mental Health and Neuro Sciences (NIMHANS), Bengaluru, is an Institute of National Importance dedicated to excellence in mental health and neurosciences through integrated patient care, education, research, and community outreach.",
      "Its origins trace to 1847, when the Bangalore Lunatic Asylum was founded through the efforts of Dr. Charles Irving Smith. In 1946, the Bhore Committee recommended structured postgraduate psychiatric training, and the Government of India selected the hospital as the country’s first centre for postgraduate psychiatric training. Dr. M. V. Govindaswamy went on to establish the All India Institute of Mental Health (AIIMH) and served as its founding Director, integrating global advances with Indian psychological and philosophical perspectives.",
      "In 1974, the amalgamation of AIIMH and the Mental Hospital led to the formation of NIMHANS, bringing mental health care, neuroscience, training, and research together under one institution. In 2012, NIMHANS was declared an Institute of National Importance by an Act of Parliament (the NIMHANS Act, 2012), reaffirming its national leadership in mental health and neurosciences.",
      "Today, NIMHANS is one of India’s premier centres for advanced clinical services, multidisciplinary training, and cutting-edge research in psychiatry, neurology, neurosurgery, and allied disciplines, and plays a pivotal role in shaping national mental health policy.",
    ],
  },
  ranzcp: {
    title: "About RANZCP",
    text: "The Royal Australian and New Zealand College of Psychiatrists (RANZCP) brings together experts in forensic psychiatry from around the world to share knowledge and advance the field. RANZCP’s Bi-national Faculty of Forensic Psychiatry (Australia & New Zealand) is a co-host and academic partner for IFPC 2026.",
  },
  city: {
    title: "About Bengaluru — The Host City",
    text: "Bengaluru, popularly known as the “Silicon Valley of India,” blends a rich historical legacy with modern innovation. Founded in the 16th century by Kempe Gowda I, the city later evolved under the Wadiyar dynasty of the Mysore Kingdom and subsequent British administration. Today, Bengaluru is renowned for its thriving information-technology sector, world-class research institutions, pleasant climate, and cosmopolitan culture, making it one of Asia’s most dynamic and globally connected cities.",
  },
};

// ---------------------------------------------------------------------------
// HIGHLIGHTS
// ---------------------------------------------------------------------------

export const HIGHLIGHTS = {
  intro: "Participants can expect a comprehensive, practice-oriented, and internationally relevant learning experience in forensic psychiatry.",
  scientific: {
    title: "Scientific Highlights",
    items: [
      "High-quality plenary sessions by national and international experts addressing emerging trends, legal developments, and ethical challenges in forensic psychiatry",
      "Focused thematic tracks bridging clinical practice, research, law, human rights, and policy",
      "Practical insights into assessment, report writing, expert testimony, risk management, and rehabilitation",
      "Interactive workshops and case-based discussions building real-world skills for clinicians and allied professionals",
      "Cross-country learning through Australia–India collaboration in training, service models, and workforce development",
      "Networking and collaboration opportunities with psychiatrists, psychologists, legal professionals, policymakers, and researchers",
      "Dialogue on capacity building and workforce development in forensic mental health",
    ],
  },
  // preConference.text is derived from the live event's startDate at render
  // time (see HighlightsSection.tsx) — no hardcoded date here.
  preConference: {
    title: "Pre-Conference Workshops",
  },
  delegateExperience: {
    title: "Delegate Experience",
    items: [
      { title: "NIMHANS Campus Tour", text: "A guided tour of the historic NIMHANS campus, showcasing its legacy and state-of-the-art clinical, academic, and research facilities." },
      { title: "Morning Yoga Sessions", text: "Complimentary sessions offered daily by the Department of Integrative Medicine, NIMHANS, from 6:30 AM to 7:30 AM throughout the conference." },
      { title: "Two-Day Cultural Programme", text: "Included with delegate registration." },
      { title: "Networking Dinner & Official Conference Dinners", text: "Two official dinners included with registration, offering informal networking with peers." },
      { title: "Awards", text: "Prizes for Best Oral Presentation and Best ePoster announced at the Closing Ceremony." },
      { title: "Credit Points", text: "KMC credit points available for Indian doctors under the NMC Act, 2019." },
      { title: "Certificates", text: "Digital e-certificates issued to all registered attendees; presentation certificates issued to presenting authors." },
    ],
  },
};

// ---------------------------------------------------------------------------
// SPEAKERS — always pulled live from the current event's EventSpeaker
// records (see SpeakersSection.tsx / useIfpcEvent). No static fallback list:
// speakers change every year and must come from whichever event the tenant
// is currently running, not a name baked into this file.
// ---------------------------------------------------------------------------

export const SPEAKERS_INTRO =
  "IFPC 2026 brings together leading forensic psychiatrists and mental health experts from India, Australia, and New Zealand.";

export const SPEAKERS_NOTE =
  "Additional speakers and detailed session assignments will be announced as the scientific programme is finalised.";

// ---------------------------------------------------------------------------
// SCIENTIFIC PROGRAMME
// ---------------------------------------------------------------------------

export const SCIENTIFIC_PROGRAMME = {
  intro:
    "The Organising Committee is currently curating a dynamic scientific programme for IFPC 2026, which will be published in the coming months. The programme will run across four days at the NIMHANS Convention Centre, Bengaluru, built around the conference theme, ‘Bridging the Gap.’",
  // structure.items is derived from the live event's startDate/endDate at
  // render time (see buildStructureItems in ScientificProgrammeSection.tsx)
  // — no hardcoded date strings, and it stops showing once the event ends.
  structure: {
    title: "Programme Structure",
  },
  formats: {
    title: "Session Formats",
    items: [
      "Symposia & Workshops — 60-minute sessions; symposia are typically structured as 15 minutes per presenter followed by a 15-minute moderated discussion.",
      "Oral Presentations — 10 minutes total (8 minutes presentation + 2 minutes Q&A), each opening with a mandatory Conflict of Interest disclosure slide.",
      "Poster Presentations — displayed for the duration of the assigned session, with a designated Poster Walk for presenters to engage with delegates and judges.",
    ],
  },
};

// ---------------------------------------------------------------------------
// TOPICS
// ---------------------------------------------------------------------------

export const TOPICS_INTRO =
  "IFPC 2026 invites submissions across the following thematic areas in forensic psychiatry and allied disciplines. Submissions may be made as oral presentations, posters, papers, symposia, or workshops.";

export const TOPIC_CATEGORIES: { title: string; items: string[] }[] = [
  { title: "Core Forensic Psychiatry", items: ["Criminal responsibility & insanity defence", "Fitness to stand trial / competency", "Risk assessment (violence, recidivism)", "Forensic report writing", "Malingering & deception assessment"] },
  { title: "Law, Ethics & Policy", items: ["Mental Healthcare Act (India)", "Comparative international forensic laws", "Capacity assessment", "Ethical dilemmas in forensic psychiatry", "Human rights & mental illness"] },
  { title: "Correctional & Prison Psychiatry", items: ["Mental healthcare in prisons", "Substance use & dual diagnosis", "Suicide prevention in custody", "Rehabilitation & reintegration", "Telepsychiatry in prisons"] },
  { title: "Forensic Child & Adolescent Psychiatry", items: ["Juvenile justice & mental health", "Child abuse & forensic evaluation", "Internet-related offences & minors", "School violence & risk assessment", "Capacity & consent in minors"] },
  { title: "Digital & Emerging Forensic Psychiatry", items: ["Digital phenotyping", "Cybercrime & online behaviour", "AI in risk assessment", "Tele-forensic psychiatry", "Data privacy & ethics"] },
  { title: "Cultural & Global Psychiatry", items: ["Cultural perspectives in forensic psychiatry", "Migration, refugees & legal psychiatry", "Indigenous & community mental health", "Global mental health systems comparison"] },
  { title: "Clinical & Therapeutic Aspects", items: ["Pharmacological management", "Psychotherapy in offenders", "Aggression & impulse control", "Personality disorders", "Neuropsychiatry & forensic relevance"] },
  { title: "Education, Training & Capacity Building", items: ["Training models in forensic psychiatry", "Simulation-based learning", "Curriculum development", "Tele-education & digital learning"] },
  { title: "Research & Methodology", items: ["Quantitative & qualitative research", "Validation of assessment tools", "Cross-cultural psychiatry research", "Systematic reviews & meta-analyses", "Implementation science"] },
  { title: "Case-Based & Practice-Oriented", items: ["Complex medico-legal case discussions", "Unique or rare forensic presentations", "Lessons from clinical practice", "Documentation & certification challenges"] },
];

export const ALL_TOPICS: string[] = TOPIC_CATEGORIES.flatMap((c) => c.items);

// ---------------------------------------------------------------------------
// ABSTRACT SUBMISSION
// ---------------------------------------------------------------------------

export const ABSTRACT_SUBMISSION = {
  deadline: "15 September 2026 (extended)",
  deadlineISO: "2026-09-15T23:59:00+05:30",
  method: "Online only, via the official abstract submission portal",
  generalGuidelines: [
    "All abstracts are reviewed by the Scientific Committee.",
    "Presenters of selected abstracts must complete their presentations within the allotted time.",
    "Abstract submission is open to those who also intend to register for the conference; only online submissions are accepted.",
  ],
  unstructured: {
    title: "Unstructured Abstracts",
    items: ["Written in English, not exceeding 200 words."],
    maxWords: 200,
  },
  original: {
    title: "Original Scientific Abstracts (Oral / Poster Presentation)",
    items: [
      "Structured under: Introduction, Methods, Results, and Conclusion.",
      "Written in English, not exceeding 250 words.",
      "All abstracts undergo peer review; the Scientific Committee determines the presentation mode (oral or poster).",
      "Abstracts selected for oral presentation should use a maximum of 7 presentation slides.",
    ],
    maxWords: 250,
  },
  symposiaWorkshop: {
    title: "Symposia & Workshop Abstracts",
    items: [
      "Presenters must also intend to register for the conference.",
      "Online submission is the only accepted method.",
    ],
  },
  presenterRegistration: {
    title: "Presenter Registration",
    text: "An invitation to submit an abstract does not constitute an offer to cover travel, accommodation, or registration costs, and no presenter fee is paid to successful participants. All presenters must register for the conference for their presentation to be included in the programme.",
  },
  oralGuidelines: {
    title: "Oral Presentation Guidelines",
    items: [
      "Time limit: 10 minutes total (8 minutes presentation + 2 minutes Q&A).",
      "Slide count: maximum of 8–10 slides recommended.",
      "Equipment: the provided hall laptop must be used; personal laptops are not permitted.",
      "Mandatory disclosure: a Conflict of Interest (COI) slide must open every presentation.",
      "Submission: final slides must be uploaded via the link provided by email at least 48 hours before the conference.",
    ],
  },
  posterGuidelines: {
    title: "Poster Presentation Guidelines",
    technical: {
      title: "Technical Specifications",
      items: [
        "Size: Standard A0 (84.1 cm × 118.9 cm), Portrait orientation.",
        "Material: high-quality matte paper or wrinkle-free fabric recommended; avoid heavy gloss.",
        "Legibility: title readable from 5–6 feet (72pt+ font); body text minimum 24pt.",
      ],
    },
    layout: {
      title: "Layout & Content",
      items: [
        "Mandatory sections: Title, Authors & Affiliations, Introduction, Methods, Results (with tables/graphs), Discussion/Conclusion, and Conflict of Interest Disclosure.",
        "A QR code linking to the full paper or contact details is encouraged.",
        "Use high-resolution images (300 dpi) and bullet points rather than long paragraphs.",
      ],
    },
    onSite: {
      title: "On-Site Instructions",
      items: [
        "Each presenter is assigned a Poster Board Number (e.g., PP-042), confirmed via the final programme or registration desk.",
        "Adhesive tape, pins, or Velcro dots will be provided; permanent glue or nails are not permitted.",
        "Posters must be mounted during the morning break on the day of the assigned session.",
        "Presenters must be available at their poster during the designated Poster Walk to answer questions from judges and delegates.",
        "Posters must be removed by the presenter at the end of the day; unclaimed posters will be disposed of by venue staff.",
      ],
    },
  },
  symposiaGuidelines: {
    title: "Symposia & Workshop Guidelines",
    items: [
      "Duration: strictly 60 minutes per session.",
      "Symposia structure: 15 minutes per presenter followed by a 15-minute moderated discussion.",
      "Workshops should be interactive, with any hand-outs or digital materials prepared in advance.",
      "Format: Microsoft PowerPoint (.pptx) or PDF, using standard professional fonts (Arial, Calibri, Times New Roman).",
      "Any embedded video or audio should be offline-ready, as high-speed internet cannot be guaranteed in all session halls.",
    ],
  },
  awards: {
    title: "Awards & Certificates",
    items: [
      "Prizes for Best Oral Presentation and Best ePoster will be announced at the Closing Ceremony.",
      "Digital e-certificates will be issued to all registered attendees.",
      "Presentation certificates will be issued only to the presenting author.",
    ],
  },
};

// ---------------------------------------------------------------------------
// REGISTRATION
// ---------------------------------------------------------------------------

export const REGISTRATION = {
  intro:
    "Registration includes access to all workshops and scientific sessions, daily lunch, snacks, and refreshments (coffee and tea), entry to the two-day cultural programme, and an invitation to two official conference dinners — combining academic engagement, networking, and cultural experience throughout the event. All fees exclude accommodation.",
  creditNote: "KMC credit points for doctors are available under the NMC Act, 2019, for Indian delegates.",
  eligibility: [
    { title: "Indian Delegate", text: "must have worked continuously in India for the last two years (maximum one-month gap); anyone employed, training, or performing locum work abroad is classified as an International Delegate, regardless of nationality." },
    { title: "Indian Trainee Delegate", text: "must be pursuing an MD, PDF, or DM in Psychiatry, or a Master’s, MPhil, or PhD in another relevant field." },
  ],
  importantNotes: [
    "International delegates and trainees should not use the prefix “0” (zero) when entering a mobile number.",
    "International payment contact: Dr Vinesh Gupta, East Metropolitan Health Service, +61 427 493 089, vinesh.gupta2@health.wa.gov.au",
    "General registration queries — Conference Manager: Dr Madhu Sudhan R M, +91 7760504068, dr.madhusudhanrm@gmail.com",
  ],
  // Fee amounts live only on the actual registration page (EventPricing rows
  // from the DB, seeded by prisma/seed-ifpc-2026.ts) — not duplicated here.
};

// ---------------------------------------------------------------------------
// VENUE & TRAVEL
// ---------------------------------------------------------------------------

export const VENUE_TRAVEL = {
  venue: {
    name: "NIMHANS Convention Centre",
    address: "Hosur Road, Bengaluru, India – 560029",
    hours: "9 AM – 6 PM",
  },
  gettingToBengaluru: {
    title: "Getting to Bengaluru",
    intro: "Bengaluru’s Kempegowda International Airport (BLR) is located about 40 kilometres (24 miles) from the city centre. The conference venue and delegate accommodation are typically around 5 kilometres (3 miles) from the city centre.",
    items: [
      "Airport Taxis: official airport taxis, including Karnataka State Tourism Development Corporation (KSTDC) taxis, are available just outside the arrival terminal; fares are typically metered with additional toll charges. Private operator booking counters are also available inside the terminal, generally at a higher fare.",
      "App-Based Travel: Uber, Ola, Rapido, and Namma Yatri are widely available across the city for cabs, auto-rickshaws, and bike taxis, suitable for both short and longer journeys.",
      "City Apps: Namma BMTC and Bengaluru Traffic Police (BTP) apps provide real-time bus routes, schedules, and traffic advisories.",
    ],
  },
  localTravel: {
    title: "Local Travel & Traffic Advisory",
    text: "Bengaluru is a rapidly growing metropolitan hub for technology, healthcare, and education, and traffic congestion is common during peak hours (approximately 8:00–11:00 AM and 4:30–8:00 PM). Delegates are advised to plan their commute with adequate buffer time, particularly for morning sessions and official engagements.",
  },
  weather: {
    title: "Weather & What to Pack",
    intro: "Bengaluru enjoys a pleasant climate in November, with daytime temperatures between 18°C and 25°C and moderate humidity. Evenings can be cool.",
    items: [
      "Daytime: light cotton or breathable fabrics; comfortable walking shoes or sandals.",
      "Evenings & early mornings: a light jacket, sweater, or shawl is advisable.",
      "Carry a compact umbrella or light rain jacket, as brief showers can occur.",
      "Sunglasses and sunscreen are recommended for daytime excursions.",
    ],
    etiquette: "Cultural etiquette: Bengaluru is cosmopolitan, but modest attire is appreciated, especially when visiting temples or traditional areas.",
  },
  payment: {
    title: "Payment & Currency",
    text: "Visa and Mastercard are widely accepted in India. Delegates are advised to also carry some cash, which can be exchanged for Indian rupees at the airport.",
  },
  accommodation: {
    title: "Accommodation Near the Venue",
    intro: "The hotels below are located near the conference venue. Room tariffs are approximate and subject to change based on demand, availability, seasonality, and hotel policy; delegates should confirm current rates directly with each hotel.",
    hotels: [
      { name: "Taj MG Road", distance: "6 km", price: "₹16,000 – 22,000" },
      { name: "Vivanta Residency Road", distance: "8 km", price: "₹15,000 – 20,000" },
      { name: "Taj West End", distance: "8 km", price: "₹22,000 – 25,000" },
      { name: "JW Marriott Hotel Bengaluru", distance: "6 km", price: "₹18,000 – 21,000" },
      { name: "La Marvella Hotel", distance: "3 km", price: "₹10,000 – 12,000" },
      { name: "The Chancery Pavilion", distance: "6 km", price: "₹9,000 – 10,000" },
      { name: "The Ritz-Carlton, Residency Road", distance: "4 km", price: "₹35,000 – 45,000" },
      { name: "ITC Gardenia, Residency Road", distance: "5 km", price: "₹25,000 – 30,000" },
      { name: "Welcomhotel by ITC Hotels, Richmond Road", distance: "5 km", price: "₹10,000 – 15,000" },
      { name: "Green Park, Bengaluru", distance: "6 km", price: "₹7,000 – 9,000" },
      { name: "Conrad Bengaluru", distance: "7 km", price: "₹25,000 – 30,000" },
      { name: "ibis Bengaluru City Centre", distance: "4.5 km", price: "₹6,000 – 8,000" },
    ],
  },
  excursions: {
    title: "Optional Excursions Beyond Bengaluru",
    intro: "For delegates wishing to extend their stay, Karnataka and neighbouring regions offer notable heritage and nature destinations. Travel arrangements are the responsibility of each delegate; the organising committee does not arrange travel plans.",
    items: [
      { name: "Mysuru", distance: "148 km", text: "Karnataka’s cultural capital, known for Mysore Palace, the Chamundeshwari Temple, and the Dasara festival." },
      { name: "Shravanabelagola", distance: "154 km", text: "A major Jain pilgrimage site, home to the 57-foot monolithic statue of Lord Bahubali (Gommateshwara)." },
      { name: "Belur & Halebidu", distance: "approx. 220–230 km", text: "Former Hoysala capitals renowned for the Chennakeshava and Hoysaleswara temples." },
      { name: "Hampi", distance: "approx. 354 km", text: "A UNESCO World Heritage Site and the former capital of the Vijayanagara Empire." },
      { name: "Tirupati", distance: "approx. 250 km by road / 210 km by air", text: "Home to the Tirumala Venkateswara Temple, one of the world’s most visited religious sites." },
      { name: "Chikkamagaluru", distance: "approx. 245 km", text: "Regarded as the birthplace of coffee cultivation in India, set amid the Western Ghats." },
      { name: "Bandipur Tiger Reserve", distance: "approx. 220 km", text: "A premier wildlife reserve and part of the Nilgiri Biosphere Reserve." },
      { name: "Madikeri (Coorg)", distance: "approx. 265 km", text: "Known as the “Scotland of Karnataka,” famed for coffee estates and hill scenery." },
    ],
    note: "Note: distances may require an overnight stay, and temple visits may have dress codes. Delegates should confirm bookings and travel conditions in advance.",
  },
};

// ---------------------------------------------------------------------------
// ORGANISING COMMITTEE
// ---------------------------------------------------------------------------

export const ORGANISING_COMMITTEE = {
  intro: "A committed group from NIMHANS and RANZCP is working to create a seamless and enriching conference experience.",
  patrons: {
    title: "Patrons",
    items: [
      "The Director, NIMHANS, Bengaluru",
      "The Chair, Bi-national Faculty of Forensic Psychiatry, RANZCP (Australia & New Zealand)",
      "The Head of Department, Department of Psychiatry, NIMHANS, Bengaluru",
    ],
  },
  organisingCommittee: {
    title: "Organising Committee",
    chair: "Prof. Suresh Bada Math",
    members: [
      "Dr. Vinesh Gupta",
      "Dr. Lakshmi Narayan C",
      "Dr. Mahesh R Gowda",
      "Dr. Vijaykumar Harbishettar",
      "Dr. Mrigendra Das",
      "Dr. Prashant Pandurangi",
      "Dr. Malatesh C Barikar",
      "Dr. Chaitanya Reddy",
      "Dr. Vinay B",
      "Dr. Naveen C Kumar",
    ],
  },
  scientificCommittee: {
    title: "Scientific Committee",
    chair: "Dr. Vinesh Gupta",
    members: [
      "Dr. Manjunatha N",
      "Dr. Rajendra K M",
      "Dr. Andrew Ellis",
      "Dr. Erik Monasterio",
      "Dr. Yolisha Singh",
      "Dr. Dushad Ram",
      "Dr. Venkata L Narasimha",
      "Dr. Manik Inder Singh Sethi",
    ],
  },
  conferenceManager: {
    title: "Conference Manager",
    name: "Dr. Madhu Sudhan R M",
    role: "Senior Resident, Forensic Psychiatry, NIMHANS, Bengaluru",
    email: "dr.madhusudhanrm@gmail.com",
    phone: "+91 7760504068",
  },
};

// ---------------------------------------------------------------------------
// CONTACT
// ---------------------------------------------------------------------------

export const CONTACT = {
  intro: "For all queries related to the International Forensic Psychiatry Conference 2026, please reach out using the details below.",
  generalEmail: "fpnimhans@gmail.com",
  conferenceManager: {
    name: "Dr. Madhu Sudhan R M",
    mobile: "+91 7760504068",
    email: "dr.madhusudhanrm@gmail.com",
  },
  internationalPayment: {
    name: "Dr. Vinesh Gupta",
    organisation: "East Metropolitan Health Service",
    phone: "+61 427 493 089",
    email: "vinesh.gupta2@health.wa.gov.au",
  },
  venueAddress: "NIMHANS Convention Centre, Hosur Road, Bengaluru, India – 560029",
  social: {
    linkedin: "https://linkedin.com/company/113258209",
    instagram: "https://instagram.com/forensicpsychiatryin",
    youtube: "https://youtube.com/@forensicpsychiatryin",
  },
};

// ---------------------------------------------------------------------------
// FAQ (seeded into Tenant.faqs — kept here as the source of truth for seeding)
// ---------------------------------------------------------------------------

export const FAQ_ITEMS: { question: string; answer: string }[] = [
  { question: "When and where is the conference being held?", answer: "IFPC 2026 will be held from 2–5 November 2026 at the NIMHANS Convention Centre, Hosur Road, Bengaluru, India." },
  { question: "Who is organising the conference?", answer: "The conference is co-hosted by NIMHANS, Bengaluru and RANZCP (the Royal Australian and New Zealand College of Psychiatrists)." },
  { question: "What is the theme of IFPC 2026?", answer: "The theme is ‘Bridging the Gap,’ focused on strengthening the interface between research, clinical practice, law, and rehabilitation in forensic psychiatry, and on deepening collaboration between Australia, New Zealand, and India." },
  { question: "Who should attend?", answer: "The conference is designed for psychiatry trainees, psychiatrists, forensic medicine professionals, mental health professionals, and law professionals." },
  { question: "How do I register, and what does registration include?", answer: "Registration is completed through the official registration portal. It includes access to all workshops and scientific sessions, daily lunch, snacks and refreshments, the two-day cultural programme, and two official conference dinners. Accommodation is not included." },
  { question: "Are there different registration fees for Indian and international delegates?", answer: "Yes. Separate early-bird and standard fees apply for Indian Delegates, Indian Trainee Delegates, International Delegates, and International Trainee Delegates. Full fee details are available on the Registration page." },
  { question: "How do I submit an abstract, and what is the deadline?", answer: "Abstracts are submitted online through the official abstract submission portal. The submission deadline is 15 September 2026 (extended). Full formatting and category guidelines are available on the Abstract Submission page." },
  { question: "Do presenters need to register separately?", answer: "Yes. All presenters must register for the conference for their presentation to be included in the programme. Accepting an abstract does not include travel, accommodation, registration costs, or a presenter fee." },
  { question: "Are CME or credit points available?", answer: "KMC credit points are available for Indian doctors under the NMC Act, 2019." },
  { question: "What optional activities are available to delegates?", answer: "Registered delegates can enquire at the Registration Desk about the guided NIMHANS campus tour and the complimentary daily morning yoga sessions." },
  { question: "What is the weather like in November, and what should I pack?", answer: "Bengaluru is pleasant in November, with daytime temperatures of 18–25°C. A light jacket is recommended for cooler evenings, along with comfortable walking shoes and a compact umbrella for occasional showers." },
  { question: "Whom do I contact for further questions?", answer: "For general queries, email fpnimhans@gmail.com or contact the Conference Manager, Dr. Madhu Sudhan R M, at dr.madhusudhanrm@gmail.com / +91 7760504068." },
];

// ---------------------------------------------------------------------------
// FEEDBACK FORM (maps to an EventEngagement of type FEEDBACK)
// ---------------------------------------------------------------------------

export const FEEDBACK_QUESTIONS: { id: string; label: string; type: "rating" | "text" }[] = [
  { id: "q1", label: "Overall conference experience", type: "rating" },
  { id: "q2", label: "Quality of scientific sessions", type: "rating" },
  { id: "q3", label: "Workshops & pre-conference sessions", type: "rating" },
  { id: "q4", label: "Venue, organisation & logistics", type: "rating" },
  { id: "q5", label: "Comments, suggestions, or highlights you'd like to share", type: "text" },
];

// ---------------------------------------------------------------------------
// VENUE CAMPUS MAP (hand-drawn schematic — see CampusMap.tsx)
// ---------------------------------------------------------------------------

const NIMHANS_CAMPUS_ADDRESS = "NIMHANS Campus, Hosur Road, Bengaluru, India – 560029";

export const CAMPUS_POINTS = {
  conventionCentre: { label: "NIMHANS Convention Centre", note: "Main conference venue — all sessions, workshops, and the exhibition area.", address: NIMHANS_CAMPUS_ADDRESS },
  yogaCentre: { label: "Yoga Hall — Dept. of Integrative Medicine", note: "Daily 6:30–7:30 AM morning yoga, offered by the Department of Integrative Medicine.", address: NIMHANS_CAMPUS_ADDRESS },
  guestHouse: { label: "NIMHANS Guest House", note: "On-campus delegate accommodation.", address: NIMHANS_CAMPUS_ADDRESS },
};
