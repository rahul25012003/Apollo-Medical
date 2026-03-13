/**
 * Sync carens tenant data from localhost to production DB.
 *
 * Usage:
 *   node scripts/sync-carens-to-prod.js <PRODUCTION_DATABASE_URL>
 *
 * Example:
 *   node scripts/sync-carens-to-prod.js "postgresql://user:pass@host:5432/dbname"
 */

const { Pool } = require("pg");

const PROD_DB_URL = process.argv[2];

if (!PROD_DB_URL) {
  console.error("Usage: node scripts/sync-carens-to-prod.js <PRODUCTION_DATABASE_URL>");
  process.exit(1);
}

// Data from localhost carens tenant
const carensData = {
  sections: {
    hero: true,
    about: true,
    events: true,
    contact: true,
    gallery: true,
    sponsors: false,
    testimonials: true,
    faq: true,
    ongoingResearch: true,
    moduleSpeakers: true,
    moduleSponsors: true,
    notifyPayments: true,
    moduleCertificates: true,
    moduleRegistrations: true,
    notifyRegistrations: true,
  },
  aboutTitle: "About Us",
  aboutDescription: `The TMS (transcranial magnetic) facility at AIIMS New Delhi was established on 5th Sept 2009 and inaugurated by the then director, Prof. Ramesh C. Deka. Since then, the neuromodulation facility has expanded and contributed significantly to the area of neuromodulation in the country. It was granted as India's first Centre for Advanced Research & Excellence (CARE) in Neuromodulation for Mental Health by Indian Council of Medical Research (ICMR). The CARE in Neuromodulation is headed by Prof. Nand Kumar since its inception in 2018 at the Department of Psychiatry, AIIMS New Delhi.

Services at the TMS facility: The centre aims to provide innovative solutions using neuromodulation for clinical management and research in a wide variety of patients, including those suffering from schizophrenia, depressive disorders, obsessive compulsive disorder, substance use disorders, pain syndromes, neurocognitive disorders, tinnitus, and movement disorders, among others.`,
  aboutImages: [
    "/uploads/tenants/carens/about/1773321801628-f7ce6367-26ea-4048-bbfb-46e2ae827830.jpg",
    "/uploads/tenants/carens/about/1773321809769-aabbeaea-91a9-4e4f-b141-b78028cc9a0b.jpg",
  ],
  yearlyStats: {
    year: "2025",
    events: "12",
    speakers: "30+",
    attendees: "1000+",
  },
  faqs: [
    {
      id: 1,
      answer: "CareNs is a professional organization dedicated to Care for Neuromodulation",
      question: "What is CareNs?",
    },
  ],
  researchItems: [
    {
      id: 1,
      icon: "BrainCircuit",
      title: "Neuromodulation Techniques",
      status: "Completed",
      description: "Investing novel non-invasive brain stimulation approaches..",
    },
  ],
  heroBgImage: "/uploads/tenants/carens/hero/1773321785628-4176f2c8-1024-48fe-92f7-5cf0909532b1.png",
  logo: "/uploads/tenants/carens/logos/1773321658428-61e1ee66-10f8-4a4a-8ab0-e062b0d3e6c0.jpg",
  secondaryLogo: "/uploads/tenants/carens/logos/1773321675774-16646d2b-5715-4d21-b926-1fee92fcaece.jpg",
  businessHours: {
    sat: "9:00 AM - 1:00 PM",
    monFri: "9:00 AM - 5:00 PM",
    sunHoliday: "Closed",
  },
  mapUrl: `https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d876.0186001063784!2d77.2111961!3d28.5675285!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce265cde4e507%3A0xe7a3c1f7d32b9fa2!2sAIIMS%20Academic%20Block!5e0!3m2!1sen!2sin!4v1773297092185!5m2!1sen!2sin" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"`,
  email: "careinneuromodulation@gmail.com",
  phone: "011-26546433",
  address: "rTMS facility, 4th floor, Academic Block, Near Central Lawn, AIIMS",
  state: "New Delhi ",
  country: "India",
  website: "https://neuromodulationaiims.com/",
};

async function syncData() {
  const pool = new Pool({ connectionString: PROD_DB_URL, ssl: { rejectUnauthorized: false } });

  try {
    console.log("Connecting to production database...");

    // Check if carens tenant exists
    const check = await pool.query("SELECT id, slug FROM tenants WHERE slug = $1", ["carens"]);
    if (check.rows.length === 0) {
      console.error("ERROR: carens tenant not found in production database!");
      process.exit(1);
    }

    console.log(`Found carens tenant: ${check.rows[0].id}`);

    const updateQuery = `
      UPDATE tenants SET
        sections = $1,
        "aboutTitle" = $2,
        "aboutDescription" = $3,
        "aboutImages" = $4,
        "yearlyStats" = $5,
        faqs = $6,
        "researchItems" = $7,
        "heroBgImage" = $8,
        logo = $9,
        "secondaryLogo" = $10,
        "businessHours" = $11,
        "mapUrl" = $12,
        email = $13,
        phone = $14,
        address = $15,
        state = $16,
        country = $17,
        website = $18,
        "updatedAt" = NOW()
      WHERE slug = 'carens'
    `;

    const values = [
      JSON.stringify(carensData.sections),
      carensData.aboutTitle,
      carensData.aboutDescription,
      JSON.stringify(carensData.aboutImages),
      JSON.stringify(carensData.yearlyStats),
      JSON.stringify(carensData.faqs),
      JSON.stringify(carensData.researchItems),
      carensData.heroBgImage,
      carensData.logo,
      carensData.secondaryLogo,
      JSON.stringify(carensData.businessHours),
      carensData.mapUrl,
      carensData.email,
      carensData.phone,
      carensData.address,
      carensData.state,
      carensData.country,
      carensData.website,
    ];

    const result = await pool.query(updateQuery, values);
    console.log(`Updated ${result.rowCount} row(s)`);
    console.log("Sync complete! Production carens tenant data now matches localhost.");
  } catch (err) {
    console.error("Error syncing data:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

syncData();
