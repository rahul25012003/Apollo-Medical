/**
 * Sponsors API Services
 */

import { api, ApiResponse } from "@/lib/api-client";

export interface Sponsor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  description: string | null;
  website: string | null;
  logo: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  eventSponsors?: {
    id: string;
    tier: string;
    event: {
      id: string;
      title: string;
      startDate: string;
    };
  }[];
  _count?: {
    eventSponsors: number;
  };
}

export interface SponsorFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  tenantId?: string;
}

export interface CreateSponsorData {
  name: string;
  email?: string;
  phone?: string;
  description?: string;
  website?: string;
  logo?: string;
  isActive?: boolean;
  tenantId?: string | null;
}

export const sponsorsService = {
  /**
   * Get all sponsors (requires auth)
   */
  getAll: (filters?: SponsorFilters) =>
    api.get<Sponsor[]>("/api/sponsors", filters as Record<string, string | number | boolean>),

  /**
   * Get public sponsors (no auth required)
   */
  getPublic: (filters?: SponsorFilters) =>
    api.get<Sponsor[]>("/api/sponsors/public", filters as Record<string, string | number | boolean>),

  /**
   * Get single sponsor by ID
   */
  getById: (id: string) =>
    api.get<Sponsor>(`/api/sponsors/${id}`),

  /**
   * Create new sponsor
   */
  create: (data: CreateSponsorData) =>
    api.post<Sponsor>("/api/sponsors", data),

  /**
   * Update sponsor
   */
  update: (id: string, data: Partial<CreateSponsorData>) =>
    api.put<Sponsor>(`/api/sponsors/${id}`, data),

  /**
   * Delete sponsor
   */
  delete: (id: string) =>
    api.delete<{ id: string }>(`/api/sponsors/${id}`),

  /**
   * Search sponsors by name
   */
  search: (query: string) =>
    api.get<Sponsor[]>("/api/sponsors", { search: query, limit: 10 }),
};
