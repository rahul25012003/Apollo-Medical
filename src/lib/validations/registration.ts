import { z } from "zod";

export const registrationStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "WAITLIST",
  "ATTENDED",
  "CANCELLED",
]);

export const paymentStatusEnum = z.enum([
  "PENDING",
  "PAID",
  "REFUNDED",
  "FAILED",
  "FREE",
]);

export const createRegistrationSchema = z.object({
  // Event
  eventId: z.string().cuid(),

  // Attendee Info
  userId: z.string().cuid().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  organization: z.string().optional(),
  designation: z.string().optional(),
  category: z.string().optional(), // Faculty, Resident, Student, etc.
  participantRole: z.string().optional(), // Dynamic roles from event config

  // Registration Details
  status: registrationStatusEnum.default("PENDING"),
  paymentStatus: paymentStatusEnum.default("PENDING"),
  amount: z.number().nonnegative(),
  currency: z.string().default("INR"),

  // Payment Info
  paymentId: z.string().optional(),
  paymentMethod: z.string().optional(),

  // Notes
  notes: z.string().optional(),
  specialRequests: z.string().optional(),
});

export const updateRegistrationSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  organization: z.string().optional(),
  designation: z.string().optional(),
  category: z.string().optional(),
  participantRole: z.string().optional(), // Dynamic roles from event config

  status: registrationStatusEnum.optional(),
  paymentStatus: paymentStatusEnum.optional(),
  amount: z.number().nonnegative().optional(),
  paymentId: z.string().optional(),
  paymentMethod: z.string().optional(),
  paidAt: z.string().or(z.date()).optional(),

  attendanceStatus: z.string().optional(),
  checkedInAt: z.string().or(z.date()).optional(),

  notes: z.string().optional(),
  specialRequests: z.string().optional(),
});

export const bulkRegistrationActionSchema = z.object({
  registrationIds: z.array(z.string().cuid()).min(1),
  action: z.enum([
    "confirm",
    "cancel",
    "mark_attended",
    "mark_paid",
    "send_email",
  ]),
  data: z.record(z.string(), z.unknown()).optional(), // Additional data for the action
});

export const registrationQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  eventId: z.string().optional(),
  status: registrationStatusEnum.optional(),
  paymentStatus: paymentStatusEnum.optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Types
export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;
export type UpdateRegistrationInput = z.infer<typeof updateRegistrationSchema>;
export type BulkRegistrationAction = z.infer<typeof bulkRegistrationActionSchema>;
export type RegistrationQuery = z.infer<typeof registrationQuerySchema>;
