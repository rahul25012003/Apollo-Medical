import { api } from "@/lib/api-client";

export interface EventZone {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  displayOrder: number;
  accessRules?: ZoneAccessRule[];
}

export interface ZoneAccessRule {
  id: string;
  zoneId: string;
  category: string;
  allowed: boolean;
}

export const zonesService = {
  getAll: (eventId: string) =>
    api.get<EventZone[]>(`/api/events/${eventId}/zones`),

  create: (eventId: string, data: { name: string; description?: string; displayOrder?: number }) =>
    api.post<EventZone>(`/api/events/${eventId}/zones`, data),

  bulkUpdate: (eventId: string, zones: { id?: string; name: string; description?: string; displayOrder: number; rules?: { category: string; allowed: boolean }[] }[]) =>
    api.put<EventZone[]>(`/api/events/${eventId}/zones`, { zones }),

  delete: (eventId: string, zoneId: string) =>
    api.delete(`/api/events/${eventId}/zones?zoneId=${zoneId}`),
};
