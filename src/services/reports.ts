/**
 * Reports API Services
 */

import { api } from "@/lib/api-client";

export interface RegistrationReport {
  total: number;
  dailyRegistrations: { date: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  roleBreakdown: { role: string; count: number }[];
  categoryBreakdown: { category: string; count: number }[];
}

export interface RevenueReport {
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  totalFree: number;
  dailyRevenue: { date: string; amount: number }[];
  eventBreakdown: { eventTitle: string; amount: number }[];
}

export interface AttendanceReport {
  totalRegistrations: number;
  checkedIn: number;
  checkInRate: number;
  hourlyData: { hour: number; count: number }[];
  peakHour: number;
  peakCount: number;
}

export interface CertificateReport {
  total: number;
  statusBreakdown: { status: string; count: number }[];
  typeBreakdown: { type: string; count: number }[];
}

export const reportsService = {
  /**
   * Get registration analytics
   */
  getRegistrations: (eventId?: string) =>
    api.get<RegistrationReport>("/api/reports", {
      type: "registrations",
      ...(eventId && { eventId }),
    }),

  /**
   * Get revenue analytics
   */
  getRevenue: (eventId?: string) =>
    api.get<RevenueReport>("/api/reports", {
      type: "revenue",
      ...(eventId && { eventId }),
    }),

  /**
   * Get attendance analytics
   */
  getAttendance: (eventId?: string) =>
    api.get<AttendanceReport>("/api/reports", {
      type: "attendance",
      ...(eventId && { eventId }),
    }),

  /**
   * Get certificate analytics
   */
  getCertificates: (eventId?: string) =>
    api.get<CertificateReport>("/api/reports", {
      type: "certificates",
      ...(eventId && { eventId }),
    }),
};
