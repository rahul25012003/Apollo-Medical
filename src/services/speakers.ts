/**
 * Speakers API Services
 */

import { api, ApiResponse } from "@/lib/api-client";

export interface Speaker {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  department: string | null;
  institution: string | null;
  biography: string | null;
  photo: string | null;
  linkedin: string | null;
  twitter: string | null;
  website: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  eventSpeakers?: {
    id: string;
    topic: string | null;
    status: string;
    event: {
      id: string;
      title: string;
      startDate: string;
    };
  }[];
  _count?: {
    eventSpeakers: number;
  };
}

export interface SpeakerFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  tenantId?: string;
}

export interface CreateSpeakerData {
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
  institution?: string;
  biography?: string;
  photo?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
  isActive?: boolean;
  tenantId?: string | null;
}

export const speakersService = {
  /**
   * Get all speakers
   */
  getAll: (filters?: SpeakerFilters) =>
    api.get<Speaker[]>("/api/speakers", filters as Record<string, string | number | boolean>),

  /**
   * Get single speaker by ID
   */
  getById: (id: string) =>
    api.get<Speaker>(`/api/speakers/${id}`),

  /**
   * Create new speaker
   */
  create: (data: CreateSpeakerData) =>
    api.post<Speaker>("/api/speakers", data),

  /**
   * Update speaker
   */
  update: (id: string, data: Partial<CreateSpeakerData>) =>
    api.put<Speaker>(`/api/speakers/${id}`, data),

  /**
   * Delete speaker
   */
  delete: (id: string) =>
    api.delete<{ id: string }>(`/api/speakers/${id}`),

  /**
   * Search speakers by name or email
   */
  search: (query: string) =>
    api.get<Speaker[]>("/api/speakers", { search: query, limit: 10 }),
};
