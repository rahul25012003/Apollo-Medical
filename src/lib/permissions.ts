/**
 * Role-Based Access Control (RBAC) Permissions
 */

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "EVENT_MANAGER" | "REGISTRATION_MANAGER" | "CERTIFICATE_MANAGER" | "ATTENDEE";

export type Permission =
  // Event permissions
  | "events.view"
  | "events.create"
  | "events.edit"
  | "events.delete"
  // Registration permissions
  | "registrations.view"
  | "registrations.create"
  | "registrations.edit"
  | "registrations.delete"
  | "registrations.approve"
  // Speaker permissions
  | "speakers.view"
  | "speakers.create"
  | "speakers.edit"
  | "speakers.delete"
  // Sponsor permissions
  | "sponsors.view"
  | "sponsors.create"
  | "sponsors.edit"
  | "sponsors.delete"
  // Certificate permissions
  | "certificates.view"
  | "certificates.create"
  | "certificates.edit"
  | "certificates.delete"
  | "certificates.issue"
  // User permissions
  | "users.view"
  | "users.create"
  | "users.edit"
  | "users.delete"
  // Dashboard permissions
  | "dashboard.view"
  | "dashboard.analytics"
  // Organization permissions
  | "organization.edit";

// Role-Permission mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    // Full access to everything
    "events.view", "events.create", "events.edit", "events.delete",
    "registrations.view", "registrations.create", "registrations.edit", "registrations.delete", "registrations.approve",
    "speakers.view", "speakers.create", "speakers.edit", "speakers.delete",
    "sponsors.view", "sponsors.create", "sponsors.edit", "sponsors.delete",
    "certificates.view", "certificates.create", "certificates.edit", "certificates.delete", "certificates.issue",
    "users.view", "users.create", "users.edit", "users.delete",
    "dashboard.view", "dashboard.analytics",
  ],
  ADMIN: [
    // Full access within own tenant
    "events.view", "events.create", "events.edit", "events.delete",
    "registrations.view", "registrations.create", "registrations.edit", "registrations.delete", "registrations.approve",
    "speakers.view", "speakers.create", "speakers.edit", "speakers.delete",
    "sponsors.view", "sponsors.create", "sponsors.edit", "sponsors.delete",
    "certificates.view", "certificates.create", "certificates.edit", "certificates.delete", "certificates.issue",
    "users.view", "users.create", "users.edit", "users.delete",
    "dashboard.view", "dashboard.analytics",
    "organization.edit",
  ],
  EVENT_MANAGER: [
    // Events, speakers, sponsors management
    "events.view", "events.create", "events.edit", "events.delete",
    "registrations.view", "registrations.create", "registrations.edit", "registrations.approve",
    "speakers.view", "speakers.create", "speakers.edit", "speakers.delete",
    "sponsors.view", "sponsors.create", "sponsors.edit", "sponsors.delete",
    "dashboard.view", "dashboard.analytics",
  ],
  REGISTRATION_MANAGER: [
    // Registrations management
    "events.view",
    "registrations.view", "registrations.create", "registrations.edit", "registrations.delete", "registrations.approve",
    "dashboard.view",
  ],
  CERTIFICATE_MANAGER: [
    // Certificates management
    "events.view",
    "registrations.view",
    "certificates.view", "certificates.create", "certificates.edit", "certificates.delete", "certificates.issue",
    "dashboard.view",
  ],
  ATTENDEE: [
    // View only, own profile
    "events.view",
    "registrations.view",
    "certificates.view",
    "dashboard.view",
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole | string | undefined, permission: Permission): boolean {
  if (!role) return false;
  const permissions = rolePermissions[role as UserRole];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole | string | undefined, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole | string | undefined, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole | string | undefined): Permission[] {
  if (!role) return [];
  return rolePermissions[role as UserRole] || [];
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole | string | undefined): string {
  const roleNames: Record<UserRole, string> = {
    SUPER_ADMIN: "Super Administrator",
    ADMIN: "Administrator",
    EVENT_MANAGER: "Event Manager",
    REGISTRATION_MANAGER: "Registration Manager",
    CERTIFICATE_MANAGER: "Certificate Manager",
    ATTENDEE: "Attendee",
  };
  return roleNames[role as UserRole] || role || "Unknown";
}
