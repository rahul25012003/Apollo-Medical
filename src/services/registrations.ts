/**
 * Registrations API Services
 */

import { api, ApiResponse } from "@/lib/api-client";

export interface Registration {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  designation: string | null;
  category: string | null;
  participantRole: string | null;
  eventId: string;
  status: "PENDING" | "CONFIRMED" | "WAITLIST" | "ATTENDED" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "REFUNDED" | "FAILED" | "FREE";
  amount: number;
  currency: string;
  paymentId: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  attendanceStatus: string | null;
  checkedInAt: string | null;
  notes: string | null;
  specialRequests: string | null;
  registeredById: string | null;
  paymentProof: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
  updatedAt: string;
  event?: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  registeredBy?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  certificates?: {
    id: string;
    certificateCode: string;
    status: string;
    certificateType?: string;
    title?: string | null;
  }[];
  /** @deprecated Use certificates[0] instead */
  certificate?: {
    id: string;
    certificateCode: string;
    status: string;
  } | null;
}

export interface RegistrationFilters {
  page?: number;
  limit?: number;
  eventId?: string;
  status?: string;
  paymentStatus?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  tenantId?: string;
}

export interface CreateRegistrationData {
  eventId: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  designation?: string;
  category?: string;
  participantRole?: string;
  amount: number;
  notes?: string;
  specialRequests?: string;
  status?: "PENDING" | "CONFIRMED" | "WAITLIST" | "ATTENDED" | "CANCELLED";
  paymentStatus?: "PENDING" | "PAID" | "REFUNDED" | "FAILED" | "FREE";
}

export interface UpdateRegistrationData {
  name?: string;
  phone?: string;
  organization?: string;
  designation?: string;
  category?: string;
  status?: string;
  paymentStatus?: string;
  amount?: number;
  paymentId?: string;
  paymentMethod?: string;
  paidAt?: string;
  attendanceStatus?: string;
  checkedInAt?: string;
  notes?: string;
  specialRequests?: string;
}

export interface BulkAction {
  registrationIds: string[];
  action: "confirm" | "cancel" | "mark_attended" | "mark_paid" | "send_email";
  data?: Record<string, unknown>;
}

export const registrationsService = {
  /**
   * Get all registrations
   */
  getAll: (filters?: RegistrationFilters) =>
    api.get<Registration[]>("/api/registrations", filters as Record<string, string | number | boolean>),

  /**
   * Get single registration by ID
   */
  getById: (id: string) =>
    api.get<Registration>(`/api/registrations/${id}`),

  /**
   * Create new registration (public - no auth required)
   */
  create: (data: CreateRegistrationData) =>
    api.post<Registration>("/api/registrations/public", data),

  /**
   * Create new registration (admin - requires auth)
   */
  createAdmin: (data: CreateRegistrationData) =>
    api.post<Registration>("/api/registrations", data),

  /**
   * Update registration
   */
  update: (id: string, data: UpdateRegistrationData) =>
    api.put<Registration>(`/api/registrations/${id}`, data),

  /**
   * Delete registration
   */
  delete: (id: string) =>
    api.delete<{ id: string }>(`/api/registrations/${id}`),

  /**
   * Bulk actions on registrations
   */
  bulkAction: (data: BulkAction) =>
    api.post<{ updated: number }>("/api/registrations/bulk", data),

  /**
   * Confirm registration
   */
  confirm: (id: string) =>
    api.put<Registration>(`/api/registrations/${id}`, { status: "CONFIRMED" }),

  /**
   * Cancel registration
   */
  cancel: (id: string) =>
    api.put<Registration>(`/api/registrations/${id}`, { status: "CANCELLED" }),

  /**
   * Mark as paid
   */
  markPaid: (id: string, paymentId?: string, paymentMethod?: string) =>
    api.put<Registration>(`/api/registrations/${id}`, {
      paymentStatus: "PAID",
      paidAt: new Date().toISOString(),
      paymentId,
      paymentMethod,
    }),

  /**
   * Approve registration (confirm + mark paid in one action)
   */
  approve: (id: string) =>
    api.put<Registration>(`/api/registrations/${id}`, {
      status: "CONFIRMED",
      paymentStatus: "PAID",
      paidAt: new Date().toISOString(),
    }),

  /**
   * Mark as attended (check-in)
   */
  checkIn: (id: string) =>
    api.put<Registration>(`/api/registrations/${id}`, {
      status: "ATTENDED",
      attendanceStatus: "checked_in",
      checkedInAt: new Date().toISOString(),
    }),

  /**
   * Send registration confirmation email to one registrant
   */
  sendConfirmationEmail: (id: string) =>
    api.post<{ sent: boolean; email: string }>(`/api/registrations/${id}/send-email`, {}),

  /**
   * Send registration confirmation emails to multiple registrants
   */
  sendBulkConfirmationEmails: (ids: string[]) =>
    api.post<{ sent: number; failed: number; total: number; failures: { id: string; email: string; error: string }[] }>(
      "/api/registrations/send-emails",
      { ids }
    ),
};
