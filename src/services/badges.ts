import { api } from "@/lib/api-client";

export interface BadgeRegistration {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  designation: string | null;
  category: string | null;
  participantRole: string | null;
  qrCode: string | null;
  badgeGenerated: boolean;
  status: string;
  paymentStatus: string;
  photo: string | null;
}

export interface BadgeCategory {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface IdCardSettings {
  requirePhoto: boolean;
  singleSided: boolean;
  badgeCategories?: BadgeCategory[];
}

export interface BadgesResponse {
  registrations: BadgeRegistration[];
  settings: {
    requirePhoto: boolean;
    singleSided: boolean;
  };
  badgeCategories: BadgeCategory[];
}

export const DEFAULT_BADGE_CATEGORIES: BadgeCategory[] = [
  { id: "delegate", label: "Delegate", color: "#0d9488", bgColor: "#f0fdfa", borderColor: "#99f6e4" },
  { id: "speaker", label: "Speaker", color: "#2563eb", bgColor: "#eff6ff", borderColor: "#93c5fd" },
  { id: "organizer", label: "Organizer", color: "#7c3aed", bgColor: "#f5f3ff", borderColor: "#c4b5fd" },
  { id: "vip", label: "VIP", color: "#d97706", bgColor: "#fffbeb", borderColor: "#fcd34d" },
  { id: "committee", label: "Committee", color: "#dc2626", bgColor: "#fef2f2", borderColor: "#fca5a5" },
];

export const badgesService = {
  getRegistrations: (eventId: string, status?: string) =>
    api.get<BadgesResponse>(`/api/events/${eventId}/badges`, status ? { status } : undefined),

  generateBadges: (eventId: string, registrationIds?: string[]) =>
    api.post<BadgeRegistration[]>(`/api/events/${eventId}/badges`, { registrationIds }),

  updateSettings: (eventId: string, settings: Partial<IdCardSettings>) =>
    api.patch<IdCardSettings>(`/api/events/${eventId}/badges`, settings),
};
