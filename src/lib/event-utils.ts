/**
 * Event utility functions
 */

// Default images for each event type - high quality Unsplash images
export const eventTypeImages: Record<string, string> = {
    CONFERENCE: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop&q=80",
    WORKSHOP: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop&q=80",
    SEMINAR: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=600&fit=crop&q=80",
    WEBINAR: "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=800&h=600&fit=crop&q=80",
    CME: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&q=80",
    SYMPOSIUM: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=600&fit=crop&q=80",
};

// Fallback image when type is unknown
export const DEFAULT_EVENT_IMAGE = eventTypeImages.CONFERENCE;

/**
 * Get event image URL with type-based fallback
 * @param bannerImage - Primary banner image URL
 * @param thumbnailImage - Fallback thumbnail image URL
 * @param eventType - Event type for default image selection
 * @returns Image URL string
 */
export function getEventImage(
    bannerImage: string | null | undefined,
    thumbnailImage: string | null | undefined,
    eventType: string
): string {
    if (bannerImage) return bannerImage;
    if (thumbnailImage) return thumbnailImage;
    return eventTypeImages[eventType] || DEFAULT_EVENT_IMAGE;
}

/**
 * Get default image for an event type
 * @param eventType - Event type (CONFERENCE, WORKSHOP, etc.)
 * @returns Image URL string
 */
export function getDefaultEventImage(eventType: string): string {
    return eventTypeImages[eventType] || DEFAULT_EVENT_IMAGE;
}
