import { z } from "zod";

export const createNotificationChannelSchema = z.object({
  channel: z.enum(["EMAIL", "SMS", "WHATSAPP"]),
  provider: z.string().min(1, "Provider is required"),
  name: z.string().min(1, "Name is required"),
  config: z.record(z.string(), z.unknown()),
  isActive: z.boolean().optional().default(true),
  isDefault: z.boolean().optional().default(false),
  tenantId: z.string().optional().nullable(),
});

export const updateNotificationChannelSchema = z.object({
  channel: z.enum(["EMAIL", "SMS", "WHATSAPP"]).optional(),
  provider: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export type CreateNotificationChannelInput = z.infer<typeof createNotificationChannelSchema>;
export type UpdateNotificationChannelInput = z.infer<typeof updateNotificationChannelSchema>;
