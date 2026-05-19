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
  registrationOpensDate: string | null;
  registrationDeadline: string | null;
  isRegistrationOpen: boolean;
  price: number;
  earlyBirdPrice: number | null;
  earlyBirdDeadline: string | null;
  currency: string;
  status: "DRAFT" | "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  type: "CONFERENCE" | "WORKSHOP" | "SEMINAR" | "WEBINAR" | "CME" | "SYMPOSIUM";
  typeTags: string[];
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
  brochureUrl: string | null;
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
  /** Breakdown of registrations by participantRole (e.g., DELEGATE, SPEAKER, ORGANIZER). null legacy rows bucket into DELEGATE. */
  registrationsByRole?: Record<string, number>;
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
  tenant?: {
    slug: string;
    name: string;
  };
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
  tenantSlug?: string;
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
  registrationOpensDate?: string | null;
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
  brochureUrl?: string | null;
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

export interface SessionSpeakerData {
  id?: string;
  speakerId: string;
  talkTitle?: string | null;
  talkDescription?: string | null;
  talkDuration?: number | null;
  displayOrder?: number;
  speaker?: {
    id: string;
    name: string;
    designation: string | null;
    institution: string | null;
    photo: string | null;
  };
}

export interface EventHall {
  id: string;
  eventId: string;
  name: string;
  displayOrder: number;
}

export interface EventSession {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  sessionType: string;
  sessionDate: string | null;
  startTime: string | null;
  endTime: string | null;
  venue: string | null;
  hallId: string | null;
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
  hall?: {
    id: string;
    name: string;
  } | null;
  sessionSpeakers?: SessionSpeakerData[];
}

export interface CreateSessionData {
  title: string;
  description?: string | null;
  sessionType?: string;
  sessionDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  venue?: string | null;
  hallId?: string | null;
  sessionOrder?: number;
  speakerId?: string | null;
  sessionSpeakers?: {
    speakerId: string;
    talkTitle?: string | null;
    talkDescription?: string | null;
    talkDuration?: number | null;
    displayOrder?: number;
  }[];
  status?: string;
  isPublished?: boolean;
}

export interface EventEngagement {
  id: string;
  eventId: string;
  title: string;
  type: string;
  description: string | null;
  content: unknown;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEngagementData {
  title: string;
  type: string;
  description?: string | null;
  content?: unknown;
  isActive?: boolean;
  displayOrder?: number;
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
   * Import schedule (sessions, halls, speaker links) from another event
   */
  importSchedule: (targetEventId: string, payload: {
    sourceEventId: string;
    mode?: "replace" | "append";
    shiftDates?: boolean;
    includeSpeakers?: boolean;
    includeHalls?: boolean;
  }) =>
    api.post<{ imported: number; replaced: number; mode: string; shiftDates: boolean; offsetDays: number }>(
      `/api/events/${targetEventId}/import-schedule`,
      payload
    ),

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

  // ============================================================================
  // ENGAGEMENT METHODS
  // ============================================================================

  getEngagements: (eventId: string) =>
    api.get<EventEngagement[]>(`/api/events/${eventId}/engagements`),

  createEngagement: (eventId: string, data: CreateEngagementData) =>
    api.post<EventEngagement>(`/api/events/${eventId}/engagements`, data),

  updateEngagement: (eventId: string, engagementId: string, data: Partial<CreateEngagementData>) =>
    api.put<EventEngagement>(`/api/events/${eventId}/engagements`, { engagementId, ...data }),

  deleteEngagement: (eventId: string, engagementId: string) =>
    api.delete(`/api/events/${eventId}/engagements?engagementId=${engagementId}`),

  // ============================================================================
  // ENGAGEMENT RESPONSE METHODS
  // ============================================================================

  getEngagementResponses: (eventId: string, engagementId: string, params?: { page?: number; limit?: number; sort?: string }) =>
    api.get<unknown>(`/api/events/${eventId}/engagements/${engagementId}/responses`, params as Record<string, string | number | boolean>),

  submitEngagementResponse: (eventId: string, engagementId: string, data: { response: Record<string, unknown> }) =>
    api.post<unknown>(`/api/events/${eventId}/engagements/${engagementId}/responses`, data),

  deleteEngagementResponse: (eventId: string, engagementId: string, responseId: string) =>
    api.delete(`/api/events/${eventId}/engagements/${engagementId}/responses?responseId=${responseId}`),

  // ============================================================================
  // HALL METHODS
  // ============================================================================

  getHalls: (eventId: string) =>
    api.get<EventHall[]>(`/api/events/${eventId}/halls`),

  createHall: (eventId: string, data: { name: string; displayOrder?: number }) =>
    api.post<EventHall>(`/api/events/${eventId}/halls`, data),

  updateHalls: (eventId: string, halls: { id?: string; name: string; displayOrder: number }[]) =>
    api.put<EventHall[]>(`/api/events/${eventId}/halls`, { halls }),

  deleteHall: (eventId: string, hallId: string) =>
    api.delete(`/api/events/${eventId}/halls?hallId=${hallId}`),
};
