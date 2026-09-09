import { z } from "zod";

// A photo can arrive as an absolute URL, a relative upload path (/uploads/...),
// or an inline data URI (how photos are stored so they survive redeploys).
const photoSchema = z
  .string()
  .refine(
    (v) =>
      v === "" ||
      v.startsWith("/") ||
      v.startsWith("data:image/") ||
      /^https?:\/\//i.test(v),
    "Photo must be an image URL, an uploaded file path, or an inline image"
  );

export const createSpeakerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")).or(z.literal(null)),
  phone: z.string().optional(),

  // Professional Info
  designation: z.string().optional(),
  department: z.string().optional(),
  institution: z.string().optional(),
  biography: z.string().optional(),

  // Media
  photo: photoSchema.optional().nullable(),

  // Social Links
  linkedin: z.string().url().optional().or(z.literal("")),
  twitter: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),

  // Status
  isActive: z.boolean().default(true),
});

export const updateSpeakerSchema = createSpeakerSchema.partial();

export const eventSpeakerSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  speakerId: z.string().min(1, "Speaker ID is required"),

  // Session Details
  topic: z.string().optional().nullable(),
  sessionDescription: z.string().optional().nullable(),
  sessionDate: z.string().or(z.date()).optional().nullable(),
  sessionTime: z.string().optional().nullable(),
  sessionEndTime: z.string().optional().nullable(),
  sessionVenue: z.string().optional().nullable(),
  sessionOrder: z.number().int().nonnegative().default(0),

  // Status
  status: z.enum(["pending", "confirmed", "cancelled"]).default("pending"),
  isPublished: z.boolean().default(true),
});

export const updateEventSpeakerSchema = eventSpeakerSchema.partial().omit({
  eventId: true,
  speakerId: true,
});

export const speakerQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  isActive: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Types
export type CreateSpeakerInput = z.infer<typeof createSpeakerSchema>;
export type UpdateSpeakerInput = z.infer<typeof updateSpeakerSchema>;
export type EventSpeakerInput = z.infer<typeof eventSpeakerSchema>;
export type UpdateEventSpeakerInput = z.infer<typeof updateEventSpeakerSchema>;
export type SpeakerQuery = z.infer<typeof speakerQuerySchema>;
