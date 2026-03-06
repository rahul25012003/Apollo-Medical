/**
 * Dashboard API Services
 */

import { api, ApiResponse } from "@/lib/api-client";

export interface DashboardStats {
  overview: {
    totalEvents: number;
    totalRegistrations: number;
    totalCertificates: number;
    totalUsers: number;
    totalSpeakers: number;
    totalSponsors: number;
    totalRevenue: number;
    monthlyRegistrations: number;
  };
  eventsByStatus: Record<string, number>;
  registrationsByStatus: Record<string, number>;
  upcomingEvents: {
    id: string;
    title: string;
    slug: string;
    startDate: string;
    endDate: string;
    location: string | null;
    city: string | null;
    capacity: number;
    status: string;
    type: string;
    registeredCount: number;
    availableSlots: number;
    utilizationPercent: number;
  }[];
  recentRegistrations: {
    id: string;
    name: string;
    email: string;
    status: string;
    paymentStatus: string;
    amount: number;
    createdAt: string;
    event: {
      id: string;
      title: string;
    };
  }[];
}

export const dashboardService = {
  /**
   * Get dashboard statistics
   */
  getStats: (tenantId?: string) =>
    api.get<DashboardStats>("/api/dashboard/stats", tenantId ? { tenantId } : undefined),
};
