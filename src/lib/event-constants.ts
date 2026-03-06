// Shared event filter constants - used across all pages for consistency

// Event Types - stored in DB as uppercase
export const EVENT_TYPES = [
    { value: "CONFERENCE", label: "Conference" },
    { value: "WORKSHOP", label: "Workshop" },
    { value: "SYMPOSIUM", label: "Symposium" },
    { value: "SEMINAR", label: "Seminar" },
    { value: "CME", label: "CME Session" },
    { value: "WEBINAR", label: "Webinar" },
] as const;

// Event Categories - stored in DB as these values
export const EVENT_CATEGORIES = [
    { value: "Neurology", label: "Neurology" },
    { value: "Surgery", label: "Surgery" },
    { value: "General Medicine", label: "General Medicine" },
    { value: "Research", label: "Research" },
    { value: "Pediatrics", label: "Pediatrics" },
    { value: "Technology", label: "Technology" },
    { value: "Cardiology", label: "Cardiology" },
    { value: "Oncology", label: "Oncology" },
] as const;

// Event Statuses - stored in DB as uppercase
export const EVENT_STATUSES = [
    { value: "UPCOMING", label: "Upcoming" },
    { value: "ACTIVE", label: "Active" },
    { value: "COMPLETED", label: "Completed" },
    { value: "DRAFT", label: "Draft" },
    { value: "CANCELLED", label: "Cancelled" },
] as const;

// Public-facing status options (for public filter)
export const PUBLIC_STATUS_OPTIONS = [
    { value: "all", label: "All Events" },
    { value: "UPCOMING", label: "Upcoming" },
    { value: "ACTIVE", label: "Active" },
    { value: "COMPLETED", label: "Past Events" },
] as const;

// Type helpers for TypeScript
export type EventType = typeof EVENT_TYPES[number]["value"];
export type EventCategory = typeof EVENT_CATEGORIES[number]["value"];
export type EventStatus = typeof EVENT_STATUSES[number]["value"];
