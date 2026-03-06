/**
 * Certificates API Services
 */

import { api, ApiResponse } from "@/lib/api-client";

export interface Certificate {
  id: string;
  certificateCode: string;
  registrationId: string;
  eventId: string;
  recipientName: string;
  recipientEmail: string;
  title: string | null;
  description: string | null;
  cmeCredits: number | null;
  status: "PENDING" | "ISSUED" | "REVOKED";
  issuedAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  downloadCount: number;
  lastDownloadedAt: string | null;
  createdAt: string;
  updatedAt: string;
  event?: {
    id: string;
    title: string;
    type: "CONFERENCE" | "WORKSHOP" | "SEMINAR" | "WEBINAR" | "CME" | "SYMPOSIUM";
    startDate: string;
    endDate: string;
    location: string | null;
    city: string | null;
    organizer: string | null;
    cmeCredits: number | null;
    signatory1Name: string | null;
    signatory1Title: string | null;
    signatory2Name: string | null;
    signatory2Title: string | null;
  };
  registration?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CertificateFilters {
  page?: number;
  limit?: number;
  eventId?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  tenantId?: string;
}

export interface CreateCertificateData {
  registrationId: string;
  eventId: string;
  recipientName: string;
  recipientEmail: string;
  title?: string;
  description?: string;
  cmeCredits?: number;
  status?: string;
}

export interface BulkCreateCertificateData {
  registrationIds: string[];
  eventId: string;
  title?: string;
  description?: string;
  cmeCredits?: number;
}

export interface CertificateVerification {
  valid: boolean;
  certificate: {
    code: string;
    recipientName: string;
    title: string | null;
    description: string | null;
    cmeCredits: number | null;
    status: string;
    issuedAt: string | null;
    revokedAt: string | null;
    revokedReason: string | null;
    event: {
      title: string;
      date: string;
      location: string | null;
      organizer: string | null;
    };
  };
}

export const certificatesService = {
  /**
   * Get all certificates
   */
  getAll: (filters?: CertificateFilters) =>
    api.get<Certificate[]>("/api/certificates", filters as Record<string, string | number | boolean>),

  /**
   * Get single certificate by ID
   */
  getById: (id: string) =>
    api.get<Certificate>(`/api/certificates/${id}`),

  /**
   * Create single certificate
   */
  create: (data: CreateCertificateData) =>
    api.post<Certificate>("/api/certificates", data),

  /**
   * Bulk create certificates
   */
  bulkCreate: (data: BulkCreateCertificateData) =>
    api.post<{ created: number }>("/api/certificates", data),

  /**
   * Update certificate
   */
  update: (id: string, data: Partial<CreateCertificateData & { revokedReason?: string }>) =>
    api.put<Certificate>(`/api/certificates/${id}`, data),

  /**
   * Delete certificate
   */
  delete: (id: string) =>
    api.delete<{ id: string }>(`/api/certificates/${id}`),

  /**
   * Regenerate certificate (delete and create new atomically)
   */
  regenerate: (id: string) =>
    api.post<Certificate>(`/api/certificates/${id}/regenerate`, {}),

  /**
   * Issue certificate
   */
  issue: (id: string) =>
    api.put<Certificate>(`/api/certificates/${id}`, { status: "ISSUED" }),

  /**
   * Revoke certificate
   */
  revoke: (id: string, reason: string) =>
    api.put<Certificate>(`/api/certificates/${id}`, { status: "REVOKED", revokedReason: reason }),

  /**
   * Verify certificate (public)
   */
  verify: (code: string) =>
    api.get<CertificateVerification>(`/api/certificates/verify/${code}`),
};
