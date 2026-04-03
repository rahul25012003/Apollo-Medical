import { z } from "zod";

// Pricing category schema for category-based pricing
export const pricingCategorySchema = z.object({
  id: z.string().optional(), // Optional for new categories
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  totalSlots: z.number().int().positive().default(20),
  price: z.number().nonnegative(),
  earlyBirdPrice: z.number().nonnegative().optional(),
  earlyBirdDeadline: z.string().or(z.date()).optional(),
  displayOrder: z.number().int().default(0),
});

export type PricingCategoryInput = z.infer<typeof pricingCategorySchema>;

export const eventStatusEnum = z.enum([
  "DRAFT",
  "UPCOMING",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);

export const eventTypeEnum = z.enum([
  "CONFERENCE",
  "WORKSHOP",
  "SEMINAR",
  "WEBINAR",
  "CME",
  "SYMPOSIUM",
]);

export const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),

  // Date & Time (optional for drafts, required for publishing)
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  timezone: z.string().default("UTC"),

  // Location
  location: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  mapLink: z.string().optional(),
  isVirtual: z.boolean().default(false),
  virtualLink: z.string().optional(),

  // Capacity & Registration
  capacity: z.number().int().positive().default(100),
  registrationOpensDate: z.string().or(z.date()).optional().nullable(),
  registrationDeadline: z.string().or(z.date()).optional().nullable(),
  isRegistrationOpen: z.boolean().default(true),

  // Pricing
  price: z.number().nonnegative().default(0),
  earlyBirdPrice: z.number().nonnegative().optional(),
  earlyBirdDeadline: z.string().or(z.date()).optional(),
  currency: z.string().default("USD"),

  // Status & Meta
  status: eventStatusEnum.default("DRAFT"),
  type: eventTypeEnum.default("CONFERENCE"),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),

  // Additional Info
  cmeCredits: z.number().int().nonnegative().optional(),
  cmeCoordinatorName: z.string().optional(),
  cmeCoordinatorEmail: z.string().optional().refine(
    (val) => !val || val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    { message: "Invalid email format" }
  ),
  cmeCoordinatorDesignation: z.string().optional(),
  organizer: z.string().optional(),
  contactEmail: z.string().optional().refine(
    (val) => !val || val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    { message: "Invalid email format" }
  ),
  contactPhone: z.string().optional(),
  website: z.string().optional().refine(
    (val) => !val || val === "" || /^https?:\/\/.+/.test(val),
    { message: "Invalid URL format" }
  ),
  includes: z.array(z.string()).default([]), // What's included in the event

  // Media
  bannerImage: z.string().optional(),
  thumbnailImage: z.string().optional(),

  // Certificate Signatories
  signatory1Name: z.string().optional(),
  signatory1Title: z.string().optional(),
  signatory2Name: z.string().optional(),
  signatory2Title: z.string().optional(),

  // Settings
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),

  // Pricing Categories (for category-based pricing)
  pricingCategories: z.array(pricingCategorySchema).optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const eventQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: eventStatusEnum.optional(),
  type: eventTypeEnum.optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isPublished: z.string().optional(),
  isFeatured: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Types
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventQuery = z.infer<typeof eventQuerySchema>;
