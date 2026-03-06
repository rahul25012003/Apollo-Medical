/**
 * Users API Services
 */

import { api, ApiResponse } from "@/lib/api-client";

export interface User {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatar: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "EVENT_MANAGER" | "REGISTRATION_MANAGER" | "CERTIFICATE_MANAGER" | "ATTENDEE";
  isActive: boolean;
  emailVerified: string | null;
  // Notification preferences
  notifyEmail: boolean;
  notifyRegistrations: boolean;
  notifyPayments: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    registrations: number;
  };
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  tenantId?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role?: string;
  isActive?: boolean;
}

export interface UpdateUserData {
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role?: string;
  isActive?: boolean;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  // Notification preferences
  notifyEmail?: boolean;
  notifyRegistrations?: boolean;
  notifyPayments?: boolean;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserSession {
  id: string;
  deviceName: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  location: string | null;
  lastActiveAt: string;
  createdAt: string;
  expires: string;
  isCurrent: boolean;
}

export const usersService = {
  /**
   * Get all users (admin only)
   */
  getAll: (filters?: UserFilters) =>
    api.get<User[]>("/api/users", filters as Record<string, string | number | boolean>),

  /**
   * Get single user by ID
   */
  getById: (id: string) =>
    api.get<User>(`/api/users/${id}`),

  /**
   * Create new user (admin only)
   */
  create: (data: CreateUserData) =>
    api.post<User>("/api/users", data),

  /**
   * Update user
   */
  update: (id: string, data: UpdateUserData) =>
    api.put<User>(`/api/users/${id}`, data),

  /**
   * Deactivate user (soft delete)
   */
  deactivate: (id: string) =>
    api.delete<{ id: string }>(`/api/users/${id}`),

  /**
   * Activate user
   */
  activate: (id: string) =>
    api.put<User>(`/api/users/${id}`, { isActive: true }),

  /**
   * Update user role
   */
  updateRole: (id: string, role: string) =>
    api.put<User>(`/api/users/${id}`, { role }),

  // ============================================================================
  // Current User (Profile) Methods
  // ============================================================================

  /**
   * Get current user profile
   */
  getProfile: () =>
    api.get<User>("/api/users/me"),

  /**
   * Update current user profile
   */
  updateProfile: (data: UpdateProfileData) =>
    api.put<User>("/api/users/me", data),

  /**
   * Change current user password
   */
  changePassword: (data: ChangePasswordData) =>
    api.patch<{ message: string }>("/api/users/me", data),

  // ============================================================================
  // Session Management Methods
  // ============================================================================

  /**
   * Get all active sessions for current user
   */
  getSessions: () =>
    api.get<UserSession[]>("/api/users/me/sessions"),

  /**
   * Revoke a specific session
   */
  revokeSession: (sessionId: string) =>
    api.delete<{ id: string }>(`/api/users/me/sessions/${sessionId}`),

  /**
   * Revoke all sessions except current
   */
  revokeAllSessions: () =>
    api.delete<{ revokedCount: number }>("/api/users/me/sessions"),
};
