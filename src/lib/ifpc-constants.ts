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

/** Accommodation sharing preferences (value stored on Registration.accommodationSharing). */
export const ACCOMMODATION_SHARING = [
  { value: "SINGLE", label: "Single occupancy" },
  { value: "TWO_SHARING", label: "Two-sharing" },
  { value: "THREE_SHARING", label: "Three-sharing" },
] as const;
export type AccommodationSharing = (typeof ACCOMMODATION_SHARING)[number]["value"];
export const sharingLabel = (v: string | null | undefined) =>
  ACCOMMODATION_SHARING.find((s) => s.value === v)?.label ?? null;
