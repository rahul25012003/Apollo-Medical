/**
 * Events API Services
 */

import { api, ApiResponse } from "@/lib/api-client";

export interface Event {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  timezone: string;
  location: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  mapLink: string | null;
  isVirtual: boolean;
  virtualLink: string | null;
  capacity: number;
  registrationDeadline: string | null;
  isRegistrationOpen: boolean;
  price: number;
  earlyBirdPrice: number | null;
  earlyBirdDeadline: string | null;
  currency: string;
  status: "DRAFT" | "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  type: "CONFERENCE" | "WORKSHOP" | "SEMINAR" | "WEBINAR" | "CME" | "SYMPOSIUM";
  category: string | null;
  tags: string[];
  cmeCredits: number | null;
  cmeCoordinatorName: string | null;
  cmeCoordinatorEmail: string | null;
  cmeCoordinatorDesignation: string | null;
  organizer: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  bannerImage: string | null;
  thumbnailImage: string | null;
  signatory1Name: string | null;
  signatory1Title: string | null;
  signatory2Name: string | null;
  signatory2Title: string | null;
  includes: string[];
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    registrations: number;
  };
  eventSpeakers?: {
    id: string;
    speakerId: string;
    speaker: {
      id: string;
      name: string;
      designation: string | null;
      institution: string | null;
      photo: string | null;
    };
    topic: string | null;
    sessionDescription: string | null;
    sessionDate: string | null;
    sessionTime: string | null;
    sessionEndTime: string | null;
    sessionVenue: string | null;
  }[];
  eventSponsors?: {
    id: string;
    sponsorId: string;
    sponsor: {
      id: string;
      name: string;
      logo: string | null;
    };
    tier: string;
  }[];
  pricingCategories?: {
    id: string;
    name: string;
    description: string | null;
    totalSlots: number;
    price: number | string;
    earlyBirdPrice: number | string | null;
    earlyBirdDeadline: string | null;
    displayOrder: number;
  }[];
}

export interface EventFilters {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  search?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  startDateFrom?: string;
  startDateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  tenantId?: string;
}

export interface CreateEventData {
  title: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  mapLink?: string;
  isVirtual?: boolean;
  virtualLink?: string;
  capacity?: number;
  registrationDeadline?: string;
  isRegistrationOpen?: boolean;
  price?: number;
  earlyBirdPrice?: number;
  earlyBirdDeadline?: string;
  currency?: string;
  status?: string;
  type?: string;
  category?: string;
  tags?: string[];
  cmeCredits?: number;
  cmeCoordinatorName?: string;
  cmeCoordinatorEmail?: string;
  cmeCoordinatorDesignation?: string;
  organizer?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  bannerImage?: string;
  thumbnailImage?: string;
  signatory1Name?: string;
  signatory1Title?: string;
  signatory2Name?: string;
  signatory2Title?: string;
  includes?: string[];
  isPublished?: boolean;
  isFeatured?: boolean;
  pricingCategories?: {
    name: string;
    description?: string;
    totalSlots?: number;
    price: number;
    earlyBirdPrice?: number;
    earlyBirdDeadline?: string;
    displayOrder?: number;
  }[];
}

export interface EventSpeaker {
  id: string;
  eventId: string;
  speakerId: string;
  topic: string | null;
  sessionDescription: string | null;
  sessionDate: string | null;
  sessionTime: string | null;
  sessionEndTime: string | null;
  sessionVenue: string | null;
  sessionOrder: number;
  status: string;
  isPublished: boolean;
  speaker: {
    id: string;
    name: string;
    designation: string | null;
    institution: string | null;
    photo: string | null;
  };
}

export interface EventSponsor {
  id: string;
  eventId: string;
  sponsorId: string;
  tier: "PLATINUM" | "GOLD" | "SILVER" | "BRONZE";
  displayOrder: number;
  isPublished: boolean;
  sponsor: {
    id: string;
    name: string;
    logo: string | null;
  };
}

export interface EventSession {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  sessionDate: string | null;
  startTime: string | null;
  endTime: string | null;
  venue: string | null;
  sessionOrder: number;
  speakerId: string | null;
  status: string;
  isPublished: boolean;
  speaker?: {
    id: string;
    name: string;
    designation: string | null;
    institution: string | null;
    photo: string | null;
  } | null;
}

export interface CreateSessionData {
  title: string;
  description?: string | null;
  sessionDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  venue?: string | null;
  sessionOrder?: number;
  speakerId?: string | null;
  status?: string;
  isPublished?: boolean;
}

export const eventsService = {
  /**
   * Get all events (admin)
   */
  getAll: (filters?: EventFilters) =>
    api.get<Event[]>("/api/events", filters as Record<string, string | number | boolean>),

  /**
   * Get public events
   */
  getPublic: (filters?: EventFilters) =>
    api.get<Event[]>("/api/events/public", filters as Record<string, string | number | boolean>),

  /**
   * Get single public event by ID (no auth required)
   */
  getPublicById: (id: string) =>
    api.get<Event & { eventSpeakers: EventSpeaker[]; eventSessions: EventSession[]; eventSponsors: EventSponsor[] }>(`/api/events/public/${id}`),

  /**
   * Get single event by ID (requires auth)
   */
  getById: (id: string) =>
    api.get<Event & { eventSpeakers: EventSpeaker[]; eventSessions: EventSession[]; eventSponsors: EventSponsor[] }>(`/api/events/${id}`),

  /**
   * Create new event
   */
  create: (data: CreateEventData) =>
    api.post<Event>("/api/events", data),

  /**
   * Update event
   */
  update: (id: string, data: Partial<CreateEventData>) =>
    api.put<Event>(`/api/events/${id}`, data),

  /**
   * Delete event
   */
  delete: (id: string) =>
    api.delete<{ id: string }>(`/api/events/${id}`),

  /**
   * Duplicate event
   * Creates a copy of the event with dates shifted +3 months, status set to DRAFT
   */
  duplicate: (id: string) =>
    api.post<Event>(`/api/events/${id}/duplicate`, {}),

  /**
   * Get event speakers
   */
  getSpeakers: (eventId: string) =>
    api.get<EventSpeaker[]>(`/api/events/${eventId}/speakers`),

  /**
   * Add speaker to event
   */
  addSpeaker: (eventId: string, data: { speakerId: string; topic?: string; sessionDescription?: string; sessionDate?: string; sessionTime?: string; sessionEndTime?: string; sessionVenue?: string }) =>
    api.post<EventSpeaker>(`/api/events/${eventId}/speakers`, data),

  /**
   * Update event speaker
   */
  updateSpeaker: (eventId: string, speakerId: string, data: Partial<EventSpeaker>) =>
    api.put<EventSpeaker>(`/api/events/${eventId}/speakers`, { speakerId, ...data }),

  /**
   * Remove speaker from event
   */
  removeSpeaker: (eventId: string, speakerId: string) =>
    api.delete(`/api/events/${eventId}/speakers`, { speakerId }),

  /**
   * Get event sponsors
   */
  getSponsors: (eventId: string) =>
    api.get<EventSponsor[]>(`/api/events/${eventId}/sponsors`),

  /**
   * Add sponsor to event
   */
  addSponsor: (eventId: string, data: { sponsorId: string; tier?: "PLATINUM" | "GOLD" | "SILVER" | "BRONZE"; displayOrder?: number }) =>
    api.post<EventSponsor>(`/api/events/${eventId}/sponsors`, data),

  /**
   * Update event sponsor
   */
  updateSponsor: (eventId: string, sponsorId: string, data: Partial<EventSponsor>) =>
    api.put<EventSponsor>(`/api/events/${eventId}/sponsors`, { sponsorId, ...data }),

  /**
   * Remove sponsor from event
   */
  removeSponsor: (eventId: string, sponsorId: string) =>
    api.delete(`/api/events/${eventId}/sponsors`, { sponsorId }),

  /**
   * Get event registrations
   */
  getRegistrations: (eventId: string, filters?: { page?: number; limit?: number; status?: string; paymentStatus?: string; search?: string }) =>
    api.get(`/api/events/${eventId}/registrations`, filters as Record<string, string | number | boolean>),

  // ============================================================================
  // SESSION METHODS
  // ============================================================================

  /**
   * Get event sessions
   */
  getSessions: (eventId: string) =>
    api.get<EventSession[]>(`/api/events/${eventId}/sessions`),

  /**
   * Create event session
   */
  createSession: (eventId: string, data: CreateSessionData) =>
    api.post<EventSession>(`/api/events/${eventId}/sessions`, data),

  /**
   * Update event session
   */
  updateSession: (eventId: string, sessionId: string, data: Partial<CreateSessionData>) =>
    api.put<EventSession>(`/api/events/${eventId}/sessions`, { sessionId, ...data }),

  /**
   * Delete event session
   */
  deleteSession: (eventId: string, sessionId: string) =>
    api.delete(`/api/events/${eventId}/sessions?sessionId=${sessionId}`),
};
