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
  certificate?: {
    id: string;
    certificateCode: string;
    status: string;
  };
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
   * Mark as attended (check-in)
   */
  checkIn: (id: string) =>
    api.put<Registration>(`/api/registrations/${id}`, {
      status: "ATTENDED",
      attendanceStatus: "checked_in",
      checkedInAt: new Date().toISOString(),
    }),
};
