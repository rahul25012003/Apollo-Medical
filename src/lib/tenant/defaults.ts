// Default tenant configuration - used when no tenant is specified

import { TenantConfig, GalleryImage, GalleryVideo, AboutFeature, Testimonial } from "./types";

// Default gallery images
export const defaultGalleryImages: GalleryImage[] = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80",
    alt: "Medical Conference Keynote",
    category: "Conference",
    event: "Annual Medical Summit",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
    alt: "Workshop Session",
    category: "Workshop",
    event: "Surgical Techniques Workshop",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80",
    alt: "Networking Event",
    category: "Networking",
    event: "Healthcare Leaders Meet",
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=80",
    alt: "Medical Equipment Exhibition",
    category: "Exhibition",
    event: "MedTech Expo",
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&q=80",
    alt: "CME Training Session",
    category: "Training",
    event: "CME Credit Program",
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800&q=80",
    alt: "Panel Discussion",
    category: "Conference",
    event: "Healthcare Innovation Forum",
  },
  {
    id: 7,
    src: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80",
    alt: "Award Ceremony",
    category: "Awards",
    event: "Excellence in Medicine Awards",
  },
  {
    id: 8,
    src: "https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=800&q=80",
    alt: "Hands-on Workshop",
    category: "Workshop",
    event: "Practical Skills Training",
  },
];

// Default gallery videos
export const defaultGalleryVideos: GalleryVideo[] = [
  {
    id: 1,
    thumbnail: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",
    title: "Annual Medical Conference - Highlights",
    category: "Conference",
    duration: "12:45",
    youtubeId: "dQw4w9WgXcQ",
    event: "Annual Medical Summit",
  },
  {
    id: 2,
    thumbnail: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&q=80",
    title: "Surgical Techniques Workshop - Full Session",
    category: "Workshop",
    duration: "45:30",
    youtubeId: "dQw4w9WgXcQ",
    event: "Surgical Skills Training",
  },
  {
    id: 3,
    thumbnail: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80",
    title: "Healthcare Innovation Panel Discussion",
    category: "Conference",
    duration: "32:15",
    youtubeId: "dQw4w9WgXcQ",
    event: "Healthcare Innovation Forum",
  },
  {
    id: 4,
    thumbnail: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=80",
    title: "MedTech Expo - Event Recap",
    category: "Exhibition",
    duration: "8:20",
    youtubeId: "dQw4w9WgXcQ",
    event: "MedTech Expo",
  },
];

// Default about features
export const defaultAboutFeatures: AboutFeature[] = [
  {
    icon: "BrainCircuit",
    title: "Multidisciplinary Approach",
    description: "Unique conferences bringing together Neuromodulation, Anatomy, Physiology, and allied departments for a holistic learning experience.",
  },
  {
    icon: "Users",
    title: "Expert-Led Training",
    description: "Courses delivered by experienced neuromodulation specialists and faculty with years of clinical and academic expertise.",
  },
  {
    icon: "GraduationCap",
    title: "Evidence-Based Curriculum",
    description: "Rigorously designed course content grounded in the latest research, clinical guidelines, and hands-on practical sessions.",
  },
  {
    icon: "Award",
    title: "CME Accredited Programs",
    description: "All programs are accredited for Continuing Medical Education credits, ensuring recognized professional development.",
  },
];

// Default testimonials
export const defaultTestimonials: Testimonial[] = [
  {
    id: 1,
    name: "Dr. Priya Sharma",
    role: "Neurophysiologist",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop",
    content: "The multidisciplinary approach involving Anatomy, Physiology, and Neuromodulation teams sets these conferences apart. Truly one of a kind.",
    rating: 5,
  },
  {
    id: 2,
    name: "Dr. Rajesh Kumar",
    role: "Neurosurgeon",
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop",
    content: "Outstanding course content and expert trainers. The hands-on workshops on neuromodulation techniques are invaluable for clinical practice.",
    rating: 5,
  },
  {
    id: 3,
    name: "Dr. Anita Patel",
    role: "Rehabilitation Medicine Specialist",
    avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop",
    content: "The quality of training is exceptional. Having experts from multiple departments collaborate makes the learning experience comprehensive and practical.",
    rating: 5,
  },
];

// Default tenant configuration
export const defaultTenantConfig: TenantConfig = {
  id: "default",
  slug: "default",
  isActive: true,

  branding: {
    name: "MedConf",
    tagline: "Medical Conference Portal",
    logo: undefined,
    favicon: undefined,
  },

  theme: {
    primaryColor: "#0d9488", // teal-600
    secondaryColor: "#0891b2", // cyan-600
    accentColor: "#10b981", // emerald-500
  },

  contact: {
    email: undefined,
    phone: undefined,
    address: undefined,
    city: undefined,
    state: undefined,
    country: undefined,
    website: undefined,
  },

  social: {
    facebook: undefined,
    twitter: undefined,
    linkedin: undefined,
    instagram: undefined,
    youtube: undefined,
  },

  sections: {
    hero: true,
    events: true,
    gallery: true,
    sponsors: true,
    testimonials: true,
    about: true,
    contact: true,
    moduleSpeakers: true,
    moduleSponsors: true,
    moduleCertificates: true,
    moduleRegistrations: true,
  },

  hero: {
    title: "Pioneering Neuromodulation Education",
    subtitle: "Experience unique multidisciplinary conferences where Neuromodulation, Anatomy, Physiology, and allied departments converge. Learn from expert trainers through evidence-based, hands-on programs.",
    bgImage: undefined,
  },

  about: {
    title: undefined,
    description: "Our conferences stand apart through a truly multidisciplinary approach — uniting the Neuromodulation team with Anatomy, Physiology, and other clinical departments. Led by expert trainers with deep clinical experience, every program delivers rigorously curated, evidence-based course content designed for real-world impact.",
    features: defaultAboutFeatures,
  },

  gallery: {
    images: defaultGalleryImages,
    videos: defaultGalleryVideos,
  },

  testimonials: defaultTestimonials,

  footer: {
    text: "Advancing neuromodulation education through expert-led, multidisciplinary conferences and hands-on training programs.",
    copyrightText: "MedConf. All rights reserved.",
  },

  settings: {
    defaultCurrency: "INR",
    defaultTimezone: "Asia/Kolkata",
  },
};

// Merge tenant config with defaults (for partial configs)
export function mergeTenantConfig(partial: Partial<TenantConfig>): TenantConfig {
  return {
    ...defaultTenantConfig,
    ...partial,
    branding: { ...defaultTenantConfig.branding, ...partial.branding },
    theme: { ...defaultTenantConfig.theme, ...partial.theme },
    contact: { ...defaultTenantConfig.contact, ...partial.contact },
    social: { ...defaultTenantConfig.social, ...partial.social },
    sections: { ...defaultTenantConfig.sections, ...partial.sections },
    hero: { ...defaultTenantConfig.hero, ...partial.hero },
    about: { ...defaultTenantConfig.about, ...partial.about },
    gallery: {
      images: partial.gallery?.images || defaultTenantConfig.gallery.images,
      videos: partial.gallery?.videos || defaultTenantConfig.gallery.videos,
    },
    testimonials: partial.testimonials || defaultTenantConfig.testimonials,
    footer: { ...defaultTenantConfig.footer, ...partial.footer },
    settings: { ...defaultTenantConfig.settings, ...partial.settings },
  };
}
