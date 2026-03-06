/**
 * ICMS API Services
 *
 * Centralized exports for all API services
 */

export * from "./auth";
export * from "./events";
export * from "./registrations";
export * from "./speakers";
export * from "./sponsors";
export * from "./certificates";
export * from "./users";
export * from "./dashboard";
export * from "./tenants";

// Re-export API client utilities
export { api, uploadFile } from "@/lib/api-client";
export type { ApiResponse } from "@/lib/api-client";
