// Event publish validation utilities

export interface EventForValidation {
    title?: string | null;
    description?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    registrationDeadline?: string | null;
    location?: string | null;
    capacity?: number | null;
    organizer?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    price?: number | null;
    speakers?: unknown[] | null;
    eventSpeakers?: unknown[] | null;
    sessions?: unknown[] | null;
    eventSessions?: unknown[] | null;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export function validateEventForPublish(event: EventForValidation): ValidationResult {
    const errors: string[] = [];

    // Basic Details
    if (!event.title?.trim()) errors.push("Event title is required");
    if (!event.description?.trim()) errors.push("Event description is required");

    // Date & Time - all fields mandatory
    if (!event.startDate) errors.push("Start date is required");
    if (!event.endDate) errors.push("End date is required");
    if (!event.startTime?.trim()) errors.push("Start time is required");
    if (!event.endTime?.trim()) errors.push("End time is required");
    if (!event.registrationDeadline) errors.push("Registration deadline is required");

    // Location & Capacity
    if (!event.location?.trim() || event.location === "TBA") errors.push("Event location is required");
    if (!event.capacity || event.capacity <= 0) errors.push("Event capacity must be set");

    // Contact Information
    if (!event.organizer?.trim()) errors.push("Organizer name is required");
    if (!event.contactEmail?.trim()) errors.push("Contact email is required");
    if (!event.contactPhone?.trim()) errors.push("Contact phone number is required");

    // Sessions - at least one session (with or without speaker)
    const sessionsCount = event.sessions?.length || event.eventSessions?.length || event.speakers?.length || event.eventSpeakers?.length || 0;
    if (sessionsCount === 0) {
        errors.push("At least one session is required");
    }

    // Pricing - price must be set (can be 0 for free events)
    if (event.price === null || event.price === undefined) {
        errors.push("Event pricing must be set");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

// Calculate event status based on dates
export function calculateEventStatus(startDate: string, endDate: string): string {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return "UPCOMING";
    if (now >= start && now <= end) return "ACTIVE";
    return "COMPLETED";
}
