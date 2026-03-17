import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { isTenantOwner } from "@/lib/tenant-scope";
import { updateEventSchema } from "@/lib/validations/event";
import { generateUniqueSlug } from "@/lib/auth-utils";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/events/[id] - Get single event (public access for published events)
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();
    const { id } = await context!.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        eventSpeakers: {
          where: session ? {} : { isPublished: true },
          include: {
            speaker: true,
          },
          orderBy: { sessionOrder: "asc" },
        },
        eventSessions: {
          where: session ? {} : { isPublished: true },
          include: {
            speaker: {
              select: {
                id: true,
                name: true,
                designation: true,
                institution: true,
                photo: true,
              },
            },
            sessionSpeakers: {
              include: {
                speaker: {
                  select: {
                    id: true,
                    name: true,
                    designation: true,
                    institution: true,
                    photo: true,
                  },
                },
              },
              orderBy: { displayOrder: "asc" },
            },
            hall: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: [{ sessionDate: "asc" }, { sessionOrder: "asc" }],
        },
        engagements: {
          where: session ? {} : { isActive: true },
          orderBy: { displayOrder: "asc" },
        },
        halls: {
          orderBy: { displayOrder: "asc" },
        },
        eventSponsors: {
          where: session ? {} : { isPublished: true },
          include: {
            sponsor: true,
          },
          orderBy: { displayOrder: "asc" },
        },
        pricingCategories: {
          orderBy: { displayOrder: "asc" },
        },
        _count: {
          select: { registrations: true, certificates: true },
        },
      },
    });

    if (!event) {
      return Errors.notFound("Event");
    }

    // Public users can only view published events
    if (!session && !event.isPublished) {
      return Errors.notFound("Event");
    }

    // Authenticated non-public access: verify tenant ownership
    if (session && !event.isPublished && !isTenantOwner(session, event.tenantId)) {
      return Errors.notFound("Event");
    }

    return successResponse(event);
  }
);

// PUT /api/events/[id] - Update event
export const PUT = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to update events");
    }

    const { id } = await context!.params;

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return Errors.notFound("Event");
    }

    if (!isTenantOwner(session, existingEvent.tenantId)) {
      return Errors.forbidden("You don't have access to this event");
    }

    const body = await parseBody(request);

    if (!body) {
      return Errors.badRequest("Invalid request body");
    }

    const parsed = updateEventSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const { pricingCategories, ...data } = parsed.data;

    // Extract dynamic config fields (JSON columns not in zod schema)
    const participantRoles = body.participantRoles;
    const sessionTypes = body.sessionTypes;
    const certificateConfig = body.certificateConfig;

    // If slug is being changed, check for uniqueness
    if (data.slug && data.slug !== existingEvent.slug) {
      const slugExists = await prisma.event.findUnique({
        where: { slug: data.slug },
      });

      if (slugExists) {
        return Errors.conflict("An event with this slug already exists");
      }
    }

    // If title changed but no slug provided, regenerate slug
    if (data.title && !data.slug && data.title !== existingEvent.title) {
      data.slug = generateUniqueSlug(data.title);
    }

    const updateData: Record<string, unknown> = { ...data };

    // Convert date strings to Date objects
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      updateData.endDate = new Date(data.endDate);
    }
    // Save dynamic config JSON fields if provided
    if (participantRoles !== undefined) {
      updateData.participantRoles = participantRoles;
    }
    if (sessionTypes !== undefined) {
      updateData.sessionTypes = sessionTypes;
    }
    if (certificateConfig !== undefined) {
      updateData.certificateConfig = certificateConfig;
    }

    // Handle optional date fields - empty string means null
    if (data.registrationDeadline !== undefined) {
      updateData.registrationDeadline = data.registrationDeadline
        ? new Date(data.registrationDeadline)
        : null;
    }
    if (data.earlyBirdDeadline !== undefined) {
      updateData.earlyBirdDeadline = data.earlyBirdDeadline
        ? new Date(data.earlyBirdDeadline)
        : null;
    }

    // Update event and pricing categories in a transaction
    const event = await prisma.$transaction(async (tx) => {
      // Update the event
      await tx.event.update({
        where: { id },
        data: updateData,
      });

      // Update pricing categories if provided
      if (pricingCategories !== undefined) {
        // Delete existing pricing categories
        await tx.eventPricing.deleteMany({
          where: { eventId: id },
        });

        // Create new pricing categories
        if (pricingCategories && pricingCategories.length > 0) {
          await tx.eventPricing.createMany({
            data: pricingCategories.map((category, index) => ({
              eventId: id,
              name: category.name,
              description: category.description || null,
              totalSlots: category.totalSlots || 20,
              price: category.price,
              earlyBirdPrice: category.earlyBirdPrice || null,
              earlyBirdDeadline: category.earlyBirdDeadline
                ? new Date(category.earlyBirdDeadline)
                : null,
              displayOrder: category.displayOrder ?? index,
            })),
          });
        }
      }

      // Return updated event with pricing categories
      return tx.event.findUnique({
        where: { id },
        include: {
          _count: {
            select: { registrations: true },
          },
          pricingCategories: {
            orderBy: { displayOrder: "asc" },
          },
        },
      });
    });

    return successResponse(event, "Event updated successfully");
  }
);

// DELETE /api/events/[id] - Delete event
export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "events")) {
      return Errors.forbidden("You don't have permission to delete events");
    }

    const { id } = await context!.params;

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            registrations: true,
            eventSpeakers: true,
            eventSponsors: true,
          },
        },
      },
    });

    if (!existingEvent) {
      return Errors.notFound("Event");
    }

    if (!isTenantOwner(session, existingEvent.tenantId)) {
      return Errors.forbidden("You don't have access to this event");
    }

    // Delete all related records and the event in a transaction
    const [deletedRegistrations, deletedSpeakers, deletedSponsors, deletedSessions, deletedPricing, deletedEvent] = await prisma.$transaction([
      prisma.registration.deleteMany({
        where: { eventId: id },
      }),
      prisma.eventSpeaker.deleteMany({
        where: { eventId: id },
      }),
      prisma.eventSponsor.deleteMany({
        where: { eventId: id },
      }),
      prisma.eventSession.deleteMany({
        where: { eventId: id },
      }),
      prisma.eventPricing.deleteMany({
        where: { eventId: id },
      }),
      prisma.event.delete({
        where: { id },
      }),
    ]);

    return successResponse(
      {
        id: deletedEvent.id,
        deletedRegistrations: deletedRegistrations.count,
        unlinkedSpeakers: deletedSpeakers.count,
        unlinkedSponsors: deletedSponsors.count,
        deletedSessions: deletedSessions.count,
        deletedPricing: deletedPricing.count,
      },
      "Event deleted successfully"
    );
  }
);
