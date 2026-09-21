/**
 * Shared between client (guard.ts) and server (ifpc-automation.ts) code, so
 * the "apollo-medical only" rule lives in exactly one place.
 */
export const IFPC_TENANT_SLUG = "apollo-medical";

// ponytail: every new delegate account gets this same known password instead
// of an unrecoverable random one, because no email channel is active yet to
// ever deliver a random one. Delegates are expected to change it after their
// first login (Dashboard > Profile > Change Password). Switch back to a
// per-account generatePassword() in ifpc-automation.ts once email works.
export const IFPC_DEFAULT_PASSWORD = "IFPC@2026";
