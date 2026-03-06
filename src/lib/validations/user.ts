import { z } from "zod";

export const userRoleEnum = z.enum([
  "SUPER_ADMIN",
  "EVENT_MANAGER",
  "REGISTRATION_MANAGER",
  "CERTIFICATE_MANAGER",
  "ATTENDEE",
]);

// Accept both full URLs and relative paths (e.g. /uploads/avatars/file.jpg)
const avatarSchema = z.string().url()
  .or(z.string().startsWith("/"))
  .or(z.literal(""))
  .optional();

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  avatar: avatarSchema,
  role: userRoleEnum.default("ATTENDEE"),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  avatar: avatarSchema,
  role: userRoleEnum.optional(),
  isActive: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  avatar: avatarSchema,
  // Notification preferences
  notifyEmail: z.boolean().optional(),
  notifyRegistrations: z.boolean().optional(),
  notifyPayments: z.boolean().optional(),
});

export const userQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  role: userRoleEnum.optional(),
  isActive: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Types
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
