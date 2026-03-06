/**
 * Shared TypeScript types for ICMS
 */

import type {
  User,
  Event,
  Registration,
  Speaker,
  Sponsor,
  Certificate,
  EventSpeaker,
  EventSponsor,
  UserRole,
  EventStatus,
  EventType,
  RegistrationStatus,
  PaymentStatus,
  SponsorTier,
  CertificateStatus,
} from "@prisma/client";

// Re-export Prisma types for convenience
export type {
  User,
  Event,
  Registration,
  Speaker,
  Sponsor,
  Certificate,
  EventSpeaker,
  EventSponsor,
  UserRole,
  EventStatus,
  EventType,
  RegistrationStatus,
  PaymentStatus,
  SponsorTier,
  CertificateStatus,
};

// User without sensitive fields
export type SafeUser = Omit<User, "password">;

// Event with relations
export type EventWithRelations = Event & {
  registrations?: Registration[];
  eventSpeakers?: (EventSpeaker & { speaker: Speaker })[];
  eventSponsors?: (EventSponsor & { sponsor: Sponsor })[];
  _count?: {
    registrations: number;
  };
};

// Registration with relations
export type RegistrationWithRelations = Registration & {
  user?: SafeUser | null;
  event?: Event;
  certificate?: Certificate | null;
};

// Speaker with event assignments
export type SpeakerWithEvents = Speaker & {
  eventSpeakers?: (EventSpeaker & { event: Event })[];
};

// Sponsor with event assignments
export type SponsorWithEvents = Sponsor & {
  eventSponsors?: (EventSponsor & { event: Event })[];
};

// Certificate with relations
export type CertificateWithRelations = Certificate & {
  registration: Registration;
  event: Event;
};

// Dashboard stats
export interface DashboardStats {
  totalEvents: number;
  totalRegistrations: number;
  totalCertificates: number;
  totalRevenue: number;
  upcomingEvents: Event[];
  recentRegistrations: RegistrationWithRelations[];
  eventsByStatus: Record<EventStatus, number>;
  registrationsByStatus: Record<RegistrationStatus, number>;
}

// Pagination params
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

// Sort params
export interface SortParams {
  field: string;
  order: "asc" | "desc";
}

// Common query filters
export interface CommonFilters {
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

// Event-specific filters
export interface EventFilters extends CommonFilters {
  status?: EventStatus;
  type?: EventType;
  isPublished?: boolean;
  isFeatured?: boolean;
}

// Registration-specific filters
export interface RegistrationFilters extends CommonFilters {
  eventId?: string;
  status?: RegistrationStatus;
  paymentStatus?: PaymentStatus;
}

// Auth session user
export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  image?: string | null;
}
