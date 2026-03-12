import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { isTenantOwner } from "@/lib/tenant-scope";
import { generateUniqueSlug } from "@/lib/auth-utils";
import {
  successResponse,
  Errors,
  withErrorHandler,
} from "@/lib/api-utils";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Add months to a date
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Calculate date offset (difference in days between two dates)
 */
function getDaysDiff(date1: Date, date2: Date): number {
  const diffTime = date2.getTime() - date1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Apply day offset to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// POST /api/events/[id]/duplicate - Duplicate an event
export const POST = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to create events");
    }

    const { id } = await context!.params;

    // Fetch the original event with all related data
    const originalEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        pricingCategories: true,
        eventSpeakers: true,
        eventSessions: true,
        eventSponsors: true,
      },
    });

    if (!originalEvent) {
      return Errors.notFound("Event");
    }

    if (!isTenantOwner(session, originalEvent.tenantId)) {
      return Errors.forbidden("You don't have access to this event");
    }

    // Calculate new dates (original end date + 3 months)
    const baseDate = originalEvent.endDate || originalEvent.startDate || new Date();
    const newStartDate = addMonths(baseDate, 3);

    // Calculate the day offset between original start and end dates
    let newEndDate = newStartDate;
    if (originalEvent.startDate && originalEvent.endDate) {
      const daysDiff = getDaysDiff(originalEvent.startDate, originalEvent.endDate);
      newEndDate = addDays(newStartDate, daysDiff);
    }

    // Calculate offset for shifting all date-related fields
    const dateOffset = originalEvent.startDate
      ? getDaysDiff(originalEvent.startDate, newStartDate)
      : 0;

    // Calculate new registration deadline (same offset from start date)
    let newRegistrationDeadline = null;
    if (originalEvent.registrationDeadline && originalEvent.startDate) {
      const regOffset = getDaysDiff(originalEvent.startDate, originalEvent.registrationDeadline);
      newRegistrationDeadline = addDays(newStartDate, regOffset);
    }

    // Calculate new registration opens date
    let newRegistrationOpensDate = null;
    if (originalEvent.registrationOpensDate && originalEvent.startDate) {
      const regOpensOffset = getDaysDiff(originalEvent.startDate, originalEvent.registrationOpensDate);
      newRegistrationOpensDate = addDays(newStartDate, regOpensOffset);
    }

    // Calculate new early bird deadline
    let newEarlyBirdDeadline = null;
    if (originalEvent.earlyBirdDeadline && originalEvent.startDate) {
      const ebOffset = getDaysDiff(originalEvent.startDate, originalEvent.earlyBirdDeadline);
      newEarlyBirdDeadline = addDays(newStartDate, ebOffset);
    }

    // Generate new unique slug
    const newSlug = generateUniqueSlug(`${originalEvent.title} Copy`);

    // Create the duplicated event in a transaction
    const duplicatedEvent = await prisma.$transaction(async (tx) => {
      // Create the new event
      const newEvent = await tx.event.create({
        data: {
          title: `${originalEvent.title} (Copy)`,
          slug: newSlug,
          shortDescription: originalEvent.shortDescription,
          description: originalEvent.description,
          startDate: newStartDate,
          endDate: newEndDate,
          startTime: originalEvent.startTime,
          endTime: originalEvent.endTime,
          timezone: originalEvent.timezone,
          location: originalEvent.location,
          address: originalEvent.address,
          city: originalEvent.city,
          state: originalEvent.state,
          country: originalEvent.country,
          mapLink: originalEvent.mapLink,
          isVirtual: originalEvent.isVirtual,
          virtualLink: originalEvent.virtualLink,
          capacity: originalEvent.capacity,
          registrationOpensDate: newRegistrationOpensDate,
          registrationDeadline: newRegistrationDeadline,
          isRegistrationOpen: false, // Keep closed until they publish
          price: originalEvent.price,
          earlyBirdPrice: originalEvent.earlyBirdPrice,
          earlyBirdDeadline: newEarlyBirdDeadline,
          currency: originalEvent.currency,
          status: "DRAFT", // Always start as draft
          type: originalEvent.type,
          category: originalEvent.category,
          tags: originalEvent.tags,
          cmeCredits: originalEvent.cmeCredits,
          organizer: originalEvent.organizer,
          contactEmail: originalEvent.contactEmail,
          contactPhone: originalEvent.contactPhone,
          website: originalEvent.website,
          includes: originalEvent.includes,
          bannerImage: originalEvent.bannerImage,
          thumbnailImage: originalEvent.thumbnailImage,
          signatory1Name: originalEvent.signatory1Name,
          signatory1Title: originalEvent.signatory1Title,
          signatory2Name: originalEvent.signatory2Name,
          signatory2Title: originalEvent.signatory2Title,
          isPublished: false, // Always unpublished
          isFeatured: false, // Reset featured status
          tenantId: originalEvent.tenantId, // Preserve tenant ownership
        },
      });

      // Duplicate pricing categories
      if (originalEvent.pricingCategories.length > 0) {
        await tx.eventPricing.createMany({
          data: originalEvent.pricingCategories.map((category) => {
            // Calculate new early bird deadline for category
            let categoryEarlyBirdDeadline = null;
            if (category.earlyBirdDeadline && originalEvent.startDate) {
              const catEbOffset = getDaysDiff(originalEvent.startDate, category.earlyBirdDeadline);
              categoryEarlyBirdDeadline = addDays(newStartDate, catEbOffset);
            }

            return {
              eventId: newEvent.id,
              name: category.name,
              description: category.description,
              totalSlots: category.totalSlots,
              price: category.price,
              earlyBirdPrice: category.earlyBirdPrice,
              earlyBirdDeadline: categoryEarlyBirdDeadline,
              displayOrder: category.displayOrder,
            };
          }),
        });
      }

      // Duplicate event speakers
      if (originalEvent.eventSpeakers.length > 0) {
        await tx.eventSpeaker.createMany({
          data: originalEvent.eventSpeakers.map((speaker) => {
            // Calculate new session date
            let newSessionDate = null;
            if (speaker.sessionDate && originalEvent.startDate) {
              const sessionOffset = getDaysDiff(originalEvent.startDate, speaker.sessionDate);
              newSessionDate = addDays(newStartDate, sessionOffset);
            }

            return {
              eventId: newEvent.id,
              speakerId: speaker.speakerId,
              topic: speaker.topic,
              sessionDescription: speaker.sessionDescription,
              sessionDate: newSessionDate,
              sessionTime: speaker.sessionTime,
              sessionEndTime: speaker.sessionEndTime,
              sessionVenue: speaker.sessionVenue,
              sessionOrder: speaker.sessionOrder,
              status: "pending", // Reset status
              isPublished: false, // Unpublished until review
            };
          }),
        });
      }

      // Duplicate event sessions
      if (originalEvent.eventSessions.length > 0) {
        await tx.eventSession.createMany({
          data: originalEvent.eventSessions.map((session) => {
            // Calculate new session date
            let newSessionDate = null;
            if (session.sessionDate && originalEvent.startDate) {
              const sessionOffset = getDaysDiff(originalEvent.startDate, session.sessionDate);
              newSessionDate = addDays(newStartDate, sessionOffset);
            }

            return {
              eventId: newEvent.id,
              title: session.title,
              description: session.description,
              sessionDate: newSessionDate,
              startTime: session.startTime,
              endTime: session.endTime,
              venue: session.venue,
              sessionOrder: session.sessionOrder,
              speakerId: session.speakerId,
              status: "scheduled", // Reset status
              isPublished: false, // Unpublished until review
            };
          }),
        });
      }

      // Duplicate event sponsors
      if (originalEvent.eventSponsors.length > 0) {
        await tx.eventSponsor.createMany({
          data: originalEvent.eventSponsors.map((sponsor) => ({
            eventId: newEvent.id,
            sponsorId: sponsor.sponsorId,
            tier: sponsor.tier,
            displayOrder: sponsor.displayOrder,
            isPublished: false, // Unpublished until review
          })),
        });
      }

      // Return the new event with all relations
      return tx.event.findUnique({
        where: { id: newEvent.id },
        include: {
          pricingCategories: {
            orderBy: { displayOrder: "asc" },
          },
          eventSpeakers: {
            include: { speaker: true },
            orderBy: { sessionOrder: "asc" },
          },
          eventSessions: {
            include: { speaker: true },
            orderBy: { sessionOrder: "asc" },
          },
          eventSponsors: {
            include: { sponsor: true },
            orderBy: { displayOrder: "asc" },
          },
          _count: {
            select: { registrations: true },
          },
        },
      });
    });

    return successResponse(
      duplicatedEvent,
      "Event duplicated successfully. Please review and update the dates before publishing.",
      201
    );
  }
);
