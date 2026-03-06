import { z } from "zod";

export const certificateStatusEnum = z.enum(["PENDING", "ISSUED", "REVOKED"]);

export const createCertificateSchema = z.object({
  registrationId: z.string().cuid(),
  eventId: z.string().cuid(),

  // Recipient Info
  recipientName: z.string().min(2, "Recipient name is required"),
  recipientEmail: z.string().email("Invalid email address"),

  // Certificate Content
  title: z.string().optional(),
  description: z.string().optional(),
  cmeCredits: z.number().int().nonnegative().optional(),

  // Status
  status: certificateStatusEnum.default("PENDING"),
});

export const updateCertificateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  cmeCredits: z.number().int().nonnegative().optional(),
  status: certificateStatusEnum.optional(),
  revokedReason: z.string().optional(),
});

export const bulkCertificateSchema = z.object({
  registrationIds: z.array(z.string().cuid()).min(1),
  eventId: z.string().cuid(),
  title: z.string().optional(),
  description: z.string().optional(),
  cmeCredits: z.number().int().nonnegative().optional(),
});

export const certificateQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  eventId: z.string().optional(),
  status: certificateStatusEnum.optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Types
export type CreateCertificateInput = z.infer<typeof createCertificateSchema>;
export type UpdateCertificateInput = z.infer<typeof updateCertificateSchema>;
export type BulkCertificateInput = z.infer<typeof bulkCertificateSchema>;
export type CertificateQuery = z.infer<typeof certificateQuerySchema>;
