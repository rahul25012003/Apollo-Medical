# Apollo Medical Tenant — Feature Gap Analysis & Requirements
**Reference Website:** https://dermazonesouth2026.in/ (Dermazone South – Cuticon KN 2026)
**Prepared:** June 2026
**Pages Crawled:** index, RegPage, SeniorReg, cmereg, orgcommittee, Accommodation, ConferenceVenue, trade, ContactUs, iadvl-national, IADVL-Karnataka, IADVL-AndhraPradesh, IADVL-Kerala, IADVL-TamilNadu, IADVL-Telangana, IADVL-Pondicherry, local cruise, shopping, Tourist Places, CommingSoon, AbstractSubmission, Schedule

---

## PART 1 — CONFIRMED GAPS: FEATURES ON DERMAZONE THAT APOLLO MEDICAL DOES NOT HAVE

---

### 1. TIERED / DATE-BASED REGISTRATION PRICING
**What dermazone does:**
Four automatic price tiers per category, triggered by registration date:
- Early Bird (until July 15): ₹10,000
- Regular (July 16 – Aug 15): ₹11,000
- Late (Aug 16 – Sept 30): ₹12,000
- Spot (from Oct 1): ₹13,000

**What to build:**
- Admin configures tiers: name, price, start date, end date per category per event
- System auto-applies the active tier at registration time
- Registration page banner: "Early Bird closes in X days — register now at ₹10,000"

---

### 2. MULTIPLE REGISTRATION CATEGORIES WITH SEPARATE FEES
**What dermazone does:**
Distinct categories with different prices:
- IADVL Life Member (LM)
- Provisional Life Member (PLM) — lower fee
- Accompanying Person — separate fee
Each category has its own set of tiered prices.

**What to build:**
- Admin defines categories per event (unlimited)
- Each category has independent price tiers
- Registrant selects category; price updates dynamically

---

### 3. WORKSHOP / PAID ADD-ON SESSION REGISTRATION
**What dermazone does:**
Optional workshops selectable during registration:
- Dermatosurgery Workshop (without Hands-on): ₹2,000–₹2,500
- Dermatosurgery Workshop (with Hands-on): ₹4,000–₹4,500
- AI in Dermatology Workshop: ₹2,000–₹2,500
- Organized as Morning Slot / Afternoon Slot
- Capacity-limited per workshop

**UX pattern observed:**
Workshop selection starts with a Yes/No toggle. Selecting "Yes" reveals the workshop sub-options. This avoids cluttering the form for those who don't want workshops.

**What to build:**
- "Do you want to register for workshops?" Yes/No toggle in registration form
- If Yes: show workshop list grouped by time slot (Morning / Afternoon)
- Per workshop: name, slot, capacity, fee
- Workshop fees added to registration total
- Auto-close workshop when capacity is reached
- Separate attendance/check-in per workshop

---

### 4. ACCOMPANYING PERSON REGISTRATION
**What dermazone does:**
Dropdown: "No Accompanying Person / 1 / 2 / 3"
Gender field appears per accompanying person.
Separate fee per person.

**What to build:**
- Dropdown selector (0–N) for accompanying persons; admin sets max N per event
- Gender field per accompanying person
- Fee per accompanying person added to total
- Accompanying persons in attendance/badge records

---

### 5. SENIOR / COMPLIMENTARY REGISTRATION FLOW
**What dermazone does:**
Completely separate registration form for doctors aged 70+:
- ₹0 fee (complimentary)
- Fields: Name, Age, IADVL Membership No., Gender, Mobile, Email, KMC Number, City, Institute (optional)
- Meal Preference: Veg / Non-Veg / Jain
- Accompanying Person: Yes/No with name field
- Mandatory masked ID proof upload (PDF only)
- Separate button on homepage: "Senior Doctor Registration"

**What to build:**
- "Complimentary" price type (₹0) for specific categories
- Separate registration entry point per category type
- Document upload requirement toggleable per category
- Age field conditionally required for senior/complimentary category

---

### 6. PROFESSIONAL DETAILS FIELDS IN REGISTRATION
**What dermazone does (exact fields in CME registration form):**
In order: Full Name → Email → WhatsApp Number → Gender → Age → Institute/Hospital/Clinic → Designation → Medical Council Number → Medical Council State → IADVL Membership Category → IADVL Membership Number → City → State → Meal Preference → Workshop (Yes/No) → Workshop options

**Designation dropdown exact options:**
Professor / Associate Professor / Assistant Professor / Senior Resident / Post Graduate / Tutor / Consultant / Other

**Medical Council State:**
Dropdown with all 28 Indian states + Union Territories

**State (residence):**
Dropdown with all 28 Indian states + Union Territories

**What to build:**
- Configurable professional fields per event (admin toggles on/off)
- WhatsApp number field + "Same as mobile" checkbox
- Designation dropdown with configurable options (medical-specific defaults included)
- Medical Council Number + Medical Council State fields (state dropdown)
- Membership Category + Membership Number fields
- City (text) + State (dropdown) for residence

---

### 7. CONDITIONAL DOCUMENT UPLOAD IN REGISTRATION
**What dermazone does:**
- Bonafide Certificate upload: **visible and required only when PLM Member category is selected** — hidden for LM Members
- Senior Registration: ID proof always required (age verification)
- Format: PDF only, max 2 MB

**What to build:**
- Conditional file upload field: admin defines which category triggers the upload
- Upload shown/hidden dynamically based on category selection
- File stored with registration record
- Admin can review document and approve/reject registration

---

### 8. JAIN MEAL PREFERENCE (THIRD OPTION)
**What dermazone does:**
CME form: Vegetarian / Non-Vegetarian (2 options)
Senior registration: Veg / Non-Veg / Jain (3 options)

**What to build:**
- Meal preference with at least 3 options: Vegetarian / Non-Vegetarian / Jain
- Admin configures meal options per event (add/remove options)
- Meal preference shown in registrations export
- Meal counts per preference in reports

---

### 9. ABSTRACT SUBMISSION PAGE
**What dermazone does (confirmed live at AbstractSubmission.aspx):**
Form fields: Presenter Author, Co Author, Email, Abstract Title, Abstract Details (text area)
Also serves as an inquiry form ("Fill out the form below to learn more!")

**What to build:**
- Abstract submission form: Title, Presenter, Co-Authors, Email, Category/Track, Abstract body (word limit enforced)
- Optional PDF upload for full paper
- Auto-generated submission ID + confirmation email to presenter
- Admin review panel: Accept / Reject / Request Revision with email notification to author
- Accepted abstracts published to Scientific Program
- Separate "Abstract Presentation Schedule" visible after review
- E-poster upload option for accepted abstracts

---

### 10. DOWNLOADABLE PDF SCHEDULES
**What dermazone does (confirmed at Schedule.aspx):**
Two separate downloadable PDFs:
1. **Program Schedule** — `Dermazone South – Cuticon KN 2026 BROCHURE Scientific Schedule.pdf`
2. **Abstract Presentation Schedule** — `Dermazone South – Cuticon KN 2026 BROCHURE Abstract Schedule.pdf`
No schedule is shown on-screen — downloads only.

**What to build:**
- Admin can upload Schedule PDF(s) per event
- "Download Program Schedule" button on public scientific program page
- "Download Abstract Schedule" button (separate file, separate section)
- Named clearly with event branding

---

### 11. MULTI-TIER ORGANIZING COMMITTEE PAGE
**What dermazone does (confirmed full structure):**
- **Patrons** — Chancellor and Vice Chancellor level
- **Core Organizing Committee** — Chairman, Co-Chairmen (×2), Secretary, Joint Secretary, Treasurer
- **Scientific Committee** — Scientific Chairman + Co-chairs + 15 members
- **Workshop Committee** — Chairman + Co-chairs + 5 members
- **Advisory Committee** — 6+ advisors
- **Functional Committees** — Travel/Accommodation, Cultural Affairs, Registration, Website, Food Services, Audio-Visual

Each member: Photo, Name, Role, Membership Number (format: LM/KN/5761)

**What to build:**
- Committee page at `/t/apollo-medical/committee`
- Admin creates committee groups (unlimited) and assigns members to groups
- Per member: Name, Photo, Role, Institution, Membership Number
- Patrons displayed at top with distinct styling
- Optional welcome message (rich text) per key member
- Homepage embed: show Chairman + Secretary with their welcome addresses

---

### 12. ASSOCIATION / PARENT BODY PAGES
**What dermazone does:**
Separate page per association body — each with ~8–10 office bearers with photos, names, roles, membership numbers:
- IADVL National (9 bearers)
- IADVL Karnataka (9 bearers)
- IADVL Andhra Pradesh (7 bearers)
- IADVL Kerala (9 bearers)
- IADVL Tamil Nadu (7 bearers)
- IADVL Telangana (9 bearers)
- IADVL Pondicherry (7 bearers)

Navigation dropdown auto-lists all bodies.

**What to build:**
- Admin creates "Association Bodies" (National + State chapters)
- Each body: Name, Logo, List of office bearers (Name, Photo, Role, Membership No.)
- Navigation dropdown auto-generated from active bodies
- Individual page per body: `/t/apollo-medical/association/[slug]`

---

### 13. VENUE DETAILS PAGE WITH NAMED HALLS + PHOTOS
**What dermazone does:**
- Venue name: S.D.M. College of Medical Sciences & Hospital, Sattur, Dharwad
- Named halls: Conference Hall, Kalakshetra Auditorium
- 5 venue photos (campus, facilities, auditorium)

**What to build:**
- Venue page at `/t/apollo-medical/venue`
- Admin adds: Name, Address, Named Halls, Description
- Venue photo gallery (uploaded by admin)
- Embedded Google Maps iframe
- How-to-reach section (by road, rail, air)

---

### 14. NEARBY HOTELS / ACCOMMODATION PAGE
**What dermazone does:**
11 hotels listed:
- Hotel name
- Distance from venue (km)
- Phone number
- Google Maps directions link per hotel
- Budget vs Premium distinction

Dedicated accommodation inquiry email: `dermazonesouth2026accomodation@gmail.com`

**What to build:**
- Accommodation page at `/t/apollo-medical/accommodation`
- Admin adds hotels: Name, Category (Budget/Standard/Premium), Distance, Phone, Email, Maps URL
- Card display with distance badges and Google Maps link per card
- Separate accommodation contact email shown on page

---

### 15. TOURIST ATTRACTIONS PAGE (DETAILED)
**What dermazone does:**
Organized by category with distance + travel time per attraction:
- Local highlights (< 30 min)
- Adventure activities (Dandeli — rafting, trekking, wildlife)
- Coastal / beach (Murudeshwar, Gokarna, Netrani)
- Historical & religious sites (Hampi, Badami, Pattadakal, Aihole — all with km + hours)
- Waterfalls (Jog Falls, Gokak Falls, Sathodi Falls, Dudhsagar — with heights)

**What to build:**
- Attractions page at `/t/apollo-medical/attractions`
- Admin adds attractions: Name, Photo, Description, Category, Distance (km), Travel time
- Category filter tabs (Local, Adventure, Heritage, Coastal, Nature)
- Google Maps link per attraction

---

### 16. LOCAL CUISINE GUIDE (SEPARATE PAGE)
**What dermazone does (local cruise.aspx):**
- Named signature dishes with full descriptions and where to find them
- Street food guide with vendor locations
- Desserts/sweets section (with GI tag info for Dharwad Peda)
- Beverages section

**What to build:**
- Cuisine guide page at `/t/apollo-medical/cuisine`
- Admin adds items: Name, Description, Category (Main/Snack/Dessert/Beverage), Where to find, Photo

---

### 17. SHOPPING GUIDE (SEPARATE PAGE FROM CUISINE)
**What dermazone does (shopping.aspx — separate from cuisine):**
- Named textiles with price ranges (Ilkal Sarees ₹1,500–₹15,000, Kasuti Embroidery ₹2,500–₹25,000, Lambani Embroidery ₹800–₹8,000)
- Named shopping locations with addresses
- Authenticity tips (GI tags, cash, gift packaging)

**What to build:**
- Shopping guide as a separate tab or page
- Admin adds items: Product name, Price range, Where to buy (address), Tips
- Can be under `/t/apollo-medical/shopping`

---

### 18. TRADE / EXHIBITOR PAGE WITH PDF DOWNLOADS
**What dermazone does:**
3 downloadable documents:
- Trade Brochure PDF (sponsorship opportunities + exhibition details)
- Sponsorship Prospectus PDF (branding + sponsorship packages)
- Exhibition Stall Layout PDF (floor plan)

Contact for inquiries: direct phone + email (no online form).

**What to build:**
- Trade & Exhibition page at `/t/apollo-medical/trade-exhibition`
- Admin uploads up to 3 PDFs: Trade Brochure, Sponsorship Prospectus, Stall Layout
- "Download" / "View PDF" button per document
- Contact details section for stall inquiries
- Future: online stall inquiry form (company, contact, interest)
- Confirmed exhibitor list with logos + stall numbers

---

### 19. DUAL CONFERENCE SERIES DISPLAY
**What dermazone does:**
The site explicitly shows the event belongs to TWO simultaneous conference series:
- "27th Annual Conference of the IADVL South Zone"
- "17th Annual Conference of the IADVL Karnataka Branch"

Both edition numbers are displayed in the hero and welcome sections.

**What to build:**
- Admin can add "Conference Series" metadata to an event: Series Name + Edition Number
- Multiple series can be assigned to one event
- Displayed in hero section and on all official communications/certificates
- Example: "9th Annual Apollo CME Conference" + "3rd Regional Cardiology Summit"

---

### 20. ROLE-BASED / DEPARTMENT-BASED CONTACT PAGE
**What dermazone does:**
Contact page organized by department:
- Registration inquiries: 2 named doctors with phone numbers
- Scientific program / Faculty coordination: 2 named doctors
- Abstract submission: 2 named doctors
- Accommodation: 2 named doctors + separate dedicated email
- Technical support: 2 named IT persons

**What to build:**
- Structured contact page with sections per department
- Admin configures contact persons per role: Registration, Scientific, Abstract, Accommodation, Technical, General
- Each entry: Name, Designation, Phone, Email
- Displayed as organized sections with role headings

---

### 21. "COMING SOON" SECTION PLACEHOLDER
**What dermazone does:**
Pages that aren't ready show: "This Section Is Currently Under Preparation. The detailed content for this section is being carefully curated by the organizing team and will be made available shortly."
Link back to homepage only. No broken 404.

**What to build:**
- Admin marks any public page/section as "Coming Soon"
- Shows styled under-preparation page instead of 404
- Admin-configurable message text

---

### 22. PATRON / HONORARY PATRON SECTION IN COMMITTEE
**What dermazone does:**
Patrons listed above organizing committee:
- Chief Patron: Poojya Shri D. Veerendra Heggade (Chancellor of SDM University)
- Patron: Dr. Niranjan Kumar (Vice Chancellor of SDM University)

These are institutional heads who aren't part of the working committee.

**What to build:**
- "Patron" group in committee management
- Patrons displayed at top with distinct visual treatment (larger photo, gold/premium styling)

---

### 23. MEMBERSHIP NUMBER ON COMMITTEE/SPEAKER PROFILES
**What dermazone does:**
Every committee member shows their membership number: e.g., LM/KN/5761, LM/AP/51, LM/TS/236

**What to build:**
- "Membership / Registration Number" optional field on Speaker and Committee member profiles
- Displayed on public committee and speaker profile pages

---

### 24. CULTURAL / SOCIAL EVENTS MANAGEMENT
**What dermazone does:**
A dedicated "Cultural Affairs" functional committee exists, implying cultural/social programs (Welcome Dinner, Cultural Evening, Gala Night) are formal parts of the conference program.

**What to build:**
- "Social Events" or "Cultural Events" session type in scientific program
- Examples: Welcome Dinner, Cultural Evening, City Tour, Gala Dinner
- Can have RSVP/registration (optional)
- Shown on public scientific program with distinct color/icon

---

### 25. CONFERENCE-THEMED DECORATIVE ICON SET
**What dermazone does:**
7 themed SVG icons displayed in header, matching the dermatology specialty:
Skin cell, Hair follicle, Dermatoscope, Microscope, AI brain, Microchip, Neural network, Temple outline

These create visual identity around the conference theme ("Skinnovation").

**What to build:**
- Admin uploads a set of themed decorative SVG/PNG icons per event or tenant
- Used in: hero section, section dividers, loading screens, email headers
- Pre-built icon packs for common medical specialties (Cardiology, Dermatology, Oncology, Orthopedics, Neurology, etc.)

---

### 26. GST / PAN / ORGANIZATION REGISTRATION IN FOOTER AND RECEIPTS
**What dermazone does:**
Footer shows (on every page):
- Organization full name
- "Registered under Karnataka Societies Registration Act, 1960"
- PAN: AAAJI0345N
- GSTIN: 29AAAJI0345N1Z0

**What to build:**
- Organization settings fields: PAN, GSTIN, Registration Act, Registration Number
- Displayed in footer on all tenant pages
- Printed on payment receipts and invoices

---

### 27. SCIENTIFIC PROGRAM AS PDF DOWNLOAD PAGE (NOT JUST ONLINE)
**What dermazone does (Schedule.aspx):**
Two separate PDF download buttons — no on-screen schedule displayed:
1. Program Schedule PDF (full conference schedule)
2. Abstract Presentation Schedule PDF (separate, for abstract presenters)

**What to build:**
- Admin uploads one or more schedule PDFs per event (named separately)
- "Download Schedule" button on public scientific program page
- Separate "Abstract Presentation Schedule" download for abstract submitters
- On-screen schedule is optional — PDF must always be available

---

## PART 2 — ADDITIONAL SUGGESTIONS (GOOD TO HAVE, NOT ON DERMAZONE)

| # | Feature | Why Add | Priority |
|---|---|---|---|
| A | WhatsApp Notifications | Registrants expect WhatsApp confirmations in India | HIGH |
| B | Speaker Public Profile Pages | Currently admin-only; speakers want a public presence | HIGH |
| C | Certificate Public QR Verification Page | Currently API exists but no public UI | MEDIUM |
| D | Group / Institutional Registration (Excel upload) | Hospitals sending 10+ delegates | MEDIUM |
| E | Post-event Recordings Access (password-protected) | Delegates want to revisit sessions | MEDIUM |
| F | Feedback / Evaluation Form | Links to CME credit issuance | MEDIUM |
| G | Announcement / News Ticker | Quick updates (new speaker added, date changed) | MEDIUM |
| H | Live Streaming Integration | Virtual delegates; Zoom/YouTube embed | MEDIUM |
| I | Social Sharing (personalized card) | Viral loop for conference promotion | LOW |
| J | Newsletter Subscription | Build a list before event | LOW |
| K | Conference PWA (Install App) | Offline schedule, push notifications | LOW |
| L | Abstract Review Dashboard | Reviewers see assigned abstracts, give scores/comments | HIGH |
| M | E-Poster Gallery | Accepted poster abstracts displayed publicly | MEDIUM |

---

## PART 3 — EXISTING FEATURES TO ENHANCE

| Feature | Current State | Enhancement Needed |
|---|---|---|
| Hero | ✅ | Add conference series numbers ("27th Annual"), themed icon set |
| Registration | ✅ Basic flat fee | Add tiers, categories, workshops, accompanying persons, professional fields |
| Meal preference | ❌ Missing | Add Veg/Non-Veg/Jain with export to catering report |
| Contact page | ✅ Generic | Restructure as department-based with named contacts per role |
| Speakers | ✅ Admin-only | Add public profile pages with session assignments |
| Gallery | ✅ | Add venue photo album; add past-event albums |
| Sponsors | ✅ | Split into Sponsors (branding) vs Exhibitors (stall booking) |
| Scientific Program | ✅ Admin-only | Make public-facing with PDF download + abstract schedule download |
| Certificates | ✅ | Add public QR scan verification page |
| Footer | ✅ | Add GST/PAN, org registration, tech credit |
| Reports | ✅ | Add: meal count by preference, workshop attendance, category-wise registration breakdown |
| FAQ | ✅ | Add abstract submission FAQ, visa/travel FAQ |

---

## IMPLEMENTATION PRIORITY ORDER

| # | Feature | Priority | Effort |
|---|---|---|---|
| 1 | Tiered pricing (Early Bird / Regular / Late / Spot) | HIGH | Medium |
| 2 | Registration categories with separate fees | HIGH | Medium |
| 3 | Workshop add-on registration (Yes/No → options) | HIGH | Medium |
| 4 | Accompanying person registration | HIGH | Low |
| 5 | Professional fields (designation, council no., state, membership) | HIGH | Low |
| 6 | Meal preference — Veg / Non-Veg / Jain | HIGH | Low |
| 7 | Conditional document upload in registration | HIGH | Medium |
| 8 | Abstract submission form | HIGH | High |
| 9 | Abstract review panel (admin) | HIGH | High |
| 10 | Organizing committee page (multi-tier with patrons) | HIGH | Low |
| 11 | Venue details page with named halls + photos | HIGH | Low |
| 12 | Nearby hotels / accommodation page | HIGH | Low |
| 13 | Trade / exhibitor page with PDF downloads | HIGH | Medium |
| 14 | PDF schedule download (Program + Abstract schedules) | HIGH | Low |
| 15 | Role-based contact page (Registration/Scientific/Accommodation) | MEDIUM | Low |
| 16 | Association body pages (National + State chapters) | MEDIUM | Medium |
| 17 | Senior / complimentary registration flow | MEDIUM | Medium |
| 18 | Tourist attractions page (with distance/time) | MEDIUM | Low |
| 19 | Local cuisine guide page | MEDIUM | Low |
| 20 | Shopping guide page (separate from cuisine) | MEDIUM | Low |
| 21 | Conference series / edition number display | MEDIUM | Low |
| 22 | Dual conference series support | MEDIUM | Low |
| 23 | Cultural / social events session type | MEDIUM | Low |
| 24 | Coming soon placeholder pages | MEDIUM | Low |
| 25 | Patron section in committee page | MEDIUM | Low |
| 26 | Membership number on committee/speaker profiles | MEDIUM | Low |
| 27 | Themed decorative icon set per specialty | MEDIUM | Medium |
| 28 | GST / PAN in footer and receipts | MEDIUM | Low |
| 29 | Abstract public speaker profile pages | MEDIUM | Medium |
| 30 | WhatsApp notifications | MEDIUM | Medium |
| 31 | Certificate public QR verification page | MEDIUM | Low |
| 32 | Feedback / evaluation form | MEDIUM | Medium |
| 33 | Announcement / news ticker | MEDIUM | Low |
| 34 | Group / institutional registration | MEDIUM | High |
| 35 | E-poster gallery | MEDIUM | Medium |
| 36 | Live streaming integration | LOW | Low |
| 37 | Abstract review scoring dashboard | HIGH | High |
| 38 | Post-event recordings page | LOW | Low |
| 39 | Social sharing cards | LOW | Low |
| 40 | Newsletter subscription | LOW | Low |
| 41 | Conference PWA | LOW | High |

---

*Total confirmed gaps from Dermazone: 27 | Additional suggestions: 13 | Total items: 40*
*Reference pages crawled: 22 pages across https://dermazonesouth2026.in/*
