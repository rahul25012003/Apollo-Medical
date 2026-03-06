/**
 * Authentication API Services
 */

import { api, ApiResponse } from "@/lib/api-client";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatar: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface OTPRequest {
  email: string;
  purpose: "REGISTRATION" | "LOGIN" | "PASSWORD_RESET" | "EMAIL_VERIFICATION";
}

export interface OTPVerify {
  email: string;
  code: string;
  purpose: "REGISTRATION" | "LOGIN" | "PASSWORD_RESET" | "EMAIL_VERIFICATION";
}

export interface ResetPassword {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePassword {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const authService = {
  /**
   * Register a new user
   */
  register: (data: RegisterData) =>
    api.post<AuthUser>("/api/auth/register", data),

  /**
   * Send OTP to email
   */
  sendOTP: (data: OTPRequest) =>
    api.post<{ message: string }>("/api/auth/otp/send", data),

  /**
   * Verify OTP
   */
  verifyOTP: (data: OTPVerify) =>
    api.post<{ verified: boolean; token?: string }>("/api/auth/otp/verify", data),

  /**
   * Request password reset
   */
  forgotPassword: (email: string) =>
    api.post<{ message: string }>("/api/auth/forgot-password", { email }),

  /**
   * Reset password with token
   */
  resetPassword: (data: ResetPassword) =>
    api.post<{ message: string }>("/api/auth/reset-password", data),

  /**
   * Change password (authenticated)
   */
  changePassword: (data: ChangePassword) =>
    api.patch<{ message: string }>("/api/users/me", data),

  /**
   * Get current user profile
   */
  getProfile: () =>
    api.get<AuthUser>("/api/users/me"),

  /**
   * Update current user profile
   */
  updateProfile: (data: Partial<AuthUser>) =>
    api.put<AuthUser>("/api/users/me", data),
};
