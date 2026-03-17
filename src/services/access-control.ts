import { api } from "@/lib/api-client";

export interface AccessPoint {
  id: string;
  eventId: string;
  name: string;
  type: string;
  hallId: string | null;
  direction: string;
  isActive: boolean;
  hall?: { name: string } | null;
  _count?: { scanLogs: number };
}

export interface FoodZone {
  id: string;
  eventId: string;
  name: string;
  maxServings: number | null;
  isActive: boolean;
  _count?: { foodLogs: number };
}

export interface AccessControlStats {
  totalRegistrations: number;
  totalCheckedIn: number;
  checkedInPercent: number;
  foodServedToday: number;
  activeAccessPoints: number;
  peakHour: string;
  hourlyCheckins: { hour: string; count: number }[];
  recentScans: {
    id: string;
    name: string;
    result: string;
    scanType: string;
    accessPoint: string | null;
    direction: string | null;
    scannedAt: string;
  }[];
  accessPoints: {
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    todayScans: number;
  }[];
  foodZones: {
    id: string;
    name: string;
    served: number;
    maxServings: number | null;
  }[];
}

export const accessControlService = {
  // Stats
  getStats: (eventId: string) =>
    api.get<AccessControlStats>(`/api/events/${eventId}/access-control/stats`),

  // Access Points
  getAccessPoints: (eventId: string) =>
    api.get<AccessPoint[]>(`/api/events/${eventId}/access-points`),

  createAccessPoint: (eventId: string, data: { name: string; type?: string; hallId?: string | null; direction?: string; isActive?: boolean }) =>
    api.post<AccessPoint>(`/api/events/${eventId}/access-points`, data),

  updateAccessPoint: (eventId: string, data: { accessPointId: string; name: string; type?: string; hallId?: string | null; direction?: string; isActive?: boolean }) =>
    api.put<AccessPoint>(`/api/events/${eventId}/access-points`, data),

  deleteAccessPoint: (eventId: string, id: string) =>
    api.delete(`/api/events/${eventId}/access-points?accessPointId=${id}`),

  // Food Zones
  getFoodZones: (eventId: string) =>
    api.get<FoodZone[]>(`/api/events/${eventId}/food-zones`),

  createFoodZone: (eventId: string, data: { name: string; maxServings?: number | null; isActive?: boolean }) =>
    api.post<FoodZone>(`/api/events/${eventId}/food-zones`, data),

  updateFoodZone: (eventId: string, data: { foodZoneId: string; name: string; maxServings?: number | null; isActive?: boolean }) =>
    api.put<FoodZone>(`/api/events/${eventId}/food-zones`, data),

  deleteFoodZone: (eventId: string, id: string) =>
    api.delete(`/api/events/${eventId}/food-zones?foodZoneId=${id}`),
};
