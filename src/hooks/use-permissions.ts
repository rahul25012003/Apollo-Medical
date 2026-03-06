"use client";

import { useSession } from "next-auth/react";
import { Permission, hasPermission, hasAnyPermission, hasAllPermissions, getPermissions, getRoleDisplayName, UserRole } from "@/lib/permissions";

/**
 * Hook for checking user permissions
 */
export function usePermissions() {
  const { data: session, status } = useSession();
  const role = session?.user?.role as UserRole | undefined;
  const isLoading = status === "loading";

  return {
    role,
    isLoading,
    isAuthenticated: !!session,

    /**
     * Check if user has a specific permission
     */
    can: (permission: Permission) => hasPermission(role, permission),

    /**
     * Check if user has any of the specified permissions
     */
    canAny: (permissions: Permission[]) => hasAnyPermission(role, permissions),

    /**
     * Check if user has all of the specified permissions
     */
    canAll: (permissions: Permission[]) => hasAllPermissions(role, permissions),

    /**
     * Get all permissions for current user
     */
    permissions: getPermissions(role),

    /**
     * Get role display name
     */
    roleDisplayName: getRoleDisplayName(role),

    /**
     * Check if user is super admin
     */
    isSuperAdmin: role === "SUPER_ADMIN",

    /**
     * Check if user is event manager or higher
     */
    isEventManager: role === "SUPER_ADMIN" || role === "EVENT_MANAGER",

    /**
     * Check if user is registration manager or higher
     */
    isRegistrationManager: role === "SUPER_ADMIN" || role === "EVENT_MANAGER" || role === "REGISTRATION_MANAGER",

    /**
     * Check if user is certificate manager or higher
     */
    isCertificateManager: role === "SUPER_ADMIN" || role === "CERTIFICATE_MANAGER",
  };
}
