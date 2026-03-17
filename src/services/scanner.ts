import { api } from "@/lib/api-client";

export interface ScanRequest {
  qrCode: string;
  scanType: "CHECK_IN" | "ZONE_ACCESS" | "FOOD_DISTRIBUTION";
  zoneId?: string;
  foodZoneId?: string;
  accessPointId?: string;
  direction?: "IN" | "OUT";
}

export interface ScanResponse {
  result: "SUCCESS" | "DENIED" | "ALREADY_CHECKED_IN" | "ALREADY_SERVED" | "ZONE_FULL" | "NOT_FOUND" | "INVALID";
  registration?: {
    id: string;
    name: string;
    email: string;
    organization: string | null;
    designation: string | null;
    category: string | null;
    participantRole: string | null;
    checkedInAt: string | null;
  };
  message: string;
  zone?: { id: string; name: string } | null;
}

export interface ScanLog {
  id: string;
  eventId: string;
  registrationId: string;
  scanType: string;
  zoneId: string | null;
  result: string;
  scannedAt: string;
  scannedBy: string | null;
  registration?: { name: string; email: string; category: string | null };
  zone?: { name: string } | null;
}

export const scannerService = {
  scan: (eventId: string, data: ScanRequest) =>
    api.post<ScanResponse>(`/api/events/${eventId}/scan`, data),

  getLogs: (eventId: string, params?: { page?: number; limit?: number; scanType?: string; result?: string }) =>
    api.get<ScanLog[]>(`/api/events/${eventId}/scan`, params as Record<string, string | number | boolean>),
};
