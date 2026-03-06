import { z } from "zod";

export const sponsorTierEnum = z.enum(["PLATINUM", "GOLD", "SILVER", "BRONZE"]);

export const createSponsorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),

  // Company Info
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),

  // Media
  logo: z.string().url().optional().or(z.literal("")),

  // Status
  isActive: z.boolean().default(true),
});

export const updateSponsorSchema = createSponsorSchema.partial();

export const eventSponsorSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  sponsorId: z.string().min(1, "Sponsor ID is required"),
  tier: sponsorTierEnum.default("SILVER"),
  displayOrder: z.number().int().nonnegative().default(0),
  isPublished: z.boolean().default(true),
});

export const updateEventSponsorSchema = eventSponsorSchema.partial().omit({
  eventId: true,
  sponsorId: true,
});

export const sponsorQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  isActive: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Types
export type CreateSponsorInput = z.infer<typeof createSponsorSchema>;
export type UpdateSponsorInput = z.infer<typeof updateSponsorSchema>;
export type EventSponsorInput = z.infer<typeof eventSponsorSchema>;
export type UpdateEventSponsorInput = z.infer<typeof updateEventSponsorSchema>;
export type SponsorQuery = z.infer<typeof sponsorQuerySchema>;
