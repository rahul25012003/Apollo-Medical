// Tenant configuration types for multi-tenancy support

export interface TenantSections {
  hero: boolean;
  events: boolean;
  gallery: boolean;
  sponsors: boolean;
  testimonials: boolean;
  about: boolean;
  contact: boolean;
  faq?: boolean;
  ongoingResearch?: boolean;
  moduleSpeakers?: boolean;
  moduleSponsors?: boolean;
  moduleCertificates?: boolean;
  moduleRegistrations?: boolean;
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
}

export interface TenantSocialLinks {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
}

export interface BusinessHours {
  monFri: string;
  sat: string;
  sunHoliday: string;
}

export interface TenantContact {
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  mapUrl?: string;
  businessHours?: BusinessHours;
}

export interface TenantTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface TenantBranding {
  logo?: string;
  favicon?: string;
  secondaryLogo?: string;
  name: string;
  tagline?: string;
}

export interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  category: string;
  event?: string;
}

export interface GalleryVideo {
  id: number;
  thumbnail: string;
  title: string;
  category: string;
  duration: string;
  youtubeId: string;
  event?: string;
}

export interface YearlyStats {
  year: string;
  events: string;
  attendees: string;
  speakers: string;
}

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export interface ResearchItem {
  id: number;
  icon: string;
  title: string;
  description: string;
  status: string;
}

export interface AboutFeature {
  icon: string;
  title: string;
  description: string;
}

export interface TenantHeroConfig {
  title?: string;
  subtitle?: string;
  bgImage?: string;
}

export interface TenantAboutConfig {
  title?: string;
  description?: string;
  features?: AboutFeature[];
}

export interface TenantGalleryConfig {
  images?: GalleryImage[];
  videos?: GalleryVideo[];
}

export interface TenantFooterConfig {
  text?: string;
  copyrightText?: string;
}

export interface TenantSettings {
  defaultCurrency: string;
  defaultTimezone: string;
}

export interface TenantConfig {
  id: string;
  slug: string;
  isActive: boolean;

  // Branding
  branding: TenantBranding;

  // Theme
  theme: TenantTheme;

  // Contact
  contact: TenantContact;

  // Social
  social: TenantSocialLinks;

  // Section visibility
  sections: TenantSections;

  // Section configs
  hero: TenantHeroConfig;
  about: TenantAboutConfig;
  gallery: TenantGalleryConfig;
  footer: TenantFooterConfig;
  testimonials?: Testimonial[];
  yearlyStats?: YearlyStats;
  faqs?: FAQItem[];
  researchItems?: ResearchItem[];

  // Settings
  settings: TenantSettings;
}

// Database tenant model (from Prisma)
export interface TenantModel {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  logo: string | null;
  favicon: string | null;
  secondaryLogo: string | null;
  tagline: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  website: string | null;
  mapUrl: string | null;
  businessHours: unknown | null; // JSON
  facebook: string | null;
  twitter: string | null;
  linkedin: string | null;
  instagram: string | null;
  youtube: string | null;
  sections: unknown; // JSON
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroBgImage: string | null;
  aboutTitle: string | null;
  aboutDescription: string | null;
  aboutFeatures: unknown | null; // JSON
  galleryImages: unknown | null; // JSON
  galleryVideos: unknown | null; // JSON
  testimonials: unknown | null; // JSON
  yearlyStats: unknown | null; // JSON
  faqs: unknown | null; // JSON
  researchItems: unknown | null; // JSON
  footerText: string | null;
  copyrightText: string | null;
  isActive: boolean;
  defaultCurrency: string;
  defaultTimezone: string;
  createdAt: Date;
  updatedAt: Date;
}

// Convert database model to TenantConfig
export function dbToTenantConfig(tenant: TenantModel): TenantConfig {
  return {
    id: tenant.id,
    slug: tenant.slug,
    isActive: tenant.isActive,

    branding: {
      name: tenant.name,
      logo: tenant.logo || undefined,
      favicon: tenant.favicon || undefined,
      secondaryLogo: tenant.secondaryLogo || undefined,
      tagline: tenant.tagline || undefined,
    },

    theme: {
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      accentColor: tenant.accentColor,
    },

    contact: {
      email: tenant.email || undefined,
      phone: tenant.phone || undefined,
      address: tenant.address || undefined,
      city: tenant.city || undefined,
      state: tenant.state || undefined,
      country: tenant.country || undefined,
      website: tenant.website || undefined,
      mapUrl: tenant.mapUrl || undefined,
      businessHours: (tenant.businessHours as BusinessHours) || undefined,
    },

    social: {
      facebook: tenant.facebook || undefined,
      twitter: tenant.twitter || undefined,
      linkedin: tenant.linkedin || undefined,
      instagram: tenant.instagram || undefined,
      youtube: tenant.youtube || undefined,
    },

    sections: (tenant.sections as TenantSections) || {
      hero: true,
      events: true,
      gallery: true,
      sponsors: true,
      testimonials: true,
      about: true,
      contact: true,
    },

    hero: {
      title: tenant.heroTitle || undefined,
      subtitle: tenant.heroSubtitle || undefined,
      bgImage: tenant.heroBgImage || undefined,
    },

    about: {
      title: tenant.aboutTitle || undefined,
      description: tenant.aboutDescription || undefined,
      features: (tenant.aboutFeatures as AboutFeature[]) || undefined,
    },

    gallery: {
      images: (tenant.galleryImages as GalleryImage[]) || undefined,
      videos: (tenant.galleryVideos as GalleryVideo[]) || undefined,
    },

    testimonials: (tenant.testimonials as Testimonial[]) || undefined,
    yearlyStats: (tenant.yearlyStats as YearlyStats) || undefined,
    faqs: (tenant.faqs as FAQItem[]) || undefined,
    researchItems: (tenant.researchItems as ResearchItem[]) || undefined,

    footer: {
      text: tenant.footerText || undefined,
      copyrightText: tenant.copyrightText || undefined,
    },

    settings: {
      defaultCurrency: tenant.defaultCurrency,
      defaultTimezone: tenant.defaultTimezone,
    },
  };
}
