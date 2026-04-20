import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRegistrationSchema } from "@/lib/validations/registration";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import { sendEmail, getActiveChannel, registrationConfirmationHtml, registrationReceivedHtml, adminNewRegistrationHtml } from "@/lib/notifications";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications-db";

const rateLimiter = createRateLimiter("registrations-public", { maxRequests: 10, windowSeconds: 60 });

// POST /api/registrations/public - Public registration (no auth required, but links user if logged in)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const rl = rateLimiter.check(getClientIp(request));
  if (!rl.allowed) {
    return Errors.badRequest(rl.message);
  }

  // Optionally get session to link logged-in user
  const session = await auth().catch(() => null);

  const body = await parseBody(request);

  if (!body) {
    return Errors.badRequest("Invalid request body");
  }

  const parsed = createRegistrationSchema.safeParse(body);

  if (!parsed.success) {
    return Errors.validationError(parsed.error);
  }

  const data = parsed.data;

  // Check if event exists and is open for registration
  const event = await prisma.event.findUnique({
    where: { id: data.eventId },
    select: {
      id: true,
      title: true,
      tenantId: true,
      capacity: true,
      isRegistrationOpen: true,
      registrationOpensDate: true,
      registrationDeadline: true,
      isPublished: true,
      price: true,
      earlyBirdPrice: true,
      earlyBirdDeadline: true,
      currency: true,
      pricingCategories: {
        select: {
          id: true,
          name: true,
          price: true,
          earlyBirdPrice: true,
          earlyBirdDeadline: true,
        },
      },
      _count: {
        select: {
          // Only DELEGATE (and legacy null) registrations count toward capacity.
          // Speakers, faculty, organizers, etc. don't consume public spots.
          registrations: {
            where: { OR: [{ participantRole: "DELEGATE" }, { participantRole: null }] },
          },
        },
      },
    },
  });

  if (!event) {
    return Errors.notFound("Event");
  }

  // Only allow registration for published events
  if (!event.isPublished) {
    return Errors.badRequest("Event is not available for registration");
  }

  if (!event.isRegistrationOpen) {
    return Errors.badRequest("Registration is closed for this event");
  }

  if (event.registrationOpensDate && new Date() < event.registrationOpensDate) {
    return Errors.badRequest("Registration has not opened yet");
  }

  if (event.registrationDeadline && new Date() > event.registrationDeadline) {
    return Errors.badRequest("Registration deadline has passed");
  }

  // Check capacity — only applies to DELEGATE registrations.
  // Speakers, faculty, organizers etc. never consume a delegate spot.
  let status = data.status || "PENDING";
  const isDelegate = !data.participantRole || data.participantRole === "DELEGATE";
  const delegateCount = event._count.registrations;
  if (isDelegate && event.capacity - delegateCount <= 0) {
    status = "WAITLIST";
  }

  // Check for duplicate registration
  const existingRegistration = await prisma.registration.findUnique({
    where: {
      email_eventId: {
        email: data.email.toLowerCase(),
        eventId: data.eventId,
      },
    },
  });

  if (existingRegistration) {
    return Errors.conflict("You are already registered for this event");
  }

  // SERVER-SIDE amount calculation - never trust client amount
  let amount: number;
  const now = new Date();

  if (data.category && event.pricingCategories.length > 0) {
    // Find matching pricing category by name
    const matchedCategory = event.pricingCategories.find(
      (pc) => pc.name === data.category
    );
    if (matchedCategory) {
      const isEarlyBird =
        matchedCategory.earlyBirdPrice &&
        matchedCategory.earlyBirdDeadline &&
        now <= matchedCategory.earlyBirdDeadline;
      amount = isEarlyBird
        ? Number(matchedCategory.earlyBirdPrice)
        : Number(matchedCategory.price);
    } else {
      // Category name doesn't match any pricing category - use event-level price
      const isEarlyBird =
        event.earlyBirdPrice &&
        event.earlyBirdDeadline &&
        now <= event.earlyBirdDeadline;
      amount = isEarlyBird
        ? Number(event.earlyBirdPrice)
        : Number(event.price);
    }
  } else {
    // No category or no pricing categories - use event-level price
    const isEarlyBird =
      event.earlyBirdPrice &&
      event.earlyBirdDeadline &&
      now <= event.earlyBirdDeadline;
    amount = isEarlyBird
      ? Number(event.earlyBirdPrice)
      : Number(event.price);
  }

  // Determine payment status based on server-calculated amount
  let paymentStatus: "PENDING" | "PAID" | "REFUNDED" | "FAILED" | "FREE";
  if (amount === 0) {
    paymentStatus = "FREE";
    status = status === "WAITLIST" ? "WAITLIST" : "CONFIRMED";
  } else {
    paymentStatus = "PENDING";
  }

  // Link to logged-in user if session exists
  const userId = session?.user?.id || null;

  const registration = await prisma.registration.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      organization: data.organization,
      designation: data.designation,
      category: data.category,
      participantRole: data.participantRole,
      eventId: data.eventId,
      status,
      paymentStatus,
      amount,
      currency: event.currency,
      notes: data.notes,
      specialRequests: data.specialRequests,
      userId,
      registeredById: null,
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
        },
      },
    },
  });

  // Send "registration received" email to registrant
  sendEmail({
    to: registration.email,
    subject: status === "CONFIRMED"
      ? `Registration Confirmed — ${registration.event.title}`
      : `Registration Received — ${registration.event.title}`,
    html: status === "CONFIRMED"
      ? registrationConfirmationHtml({
          name: registration.name,
          eventTitle: registration.event.title,
          eventDate: registration.event.startDate
            ? new Date(registration.event.startDate).toLocaleDateString("en-IN", { dateStyle: "long" })
            : undefined,
          registrationId: registration.id,
          amount: Number(registration.amount),
          currency: registration.currency,
          status,
        })
      : registrationReceivedHtml({
          name: registration.name,
          eventTitle: registration.event.title,
          role: data.participantRole || "DELEGATE",
          registrationId: registration.id,
        }),
    tenantId: event.tenantId,
  }).catch((err) => console.error("Registration email error:", err));

  // Send email to admin — use the email configured in notification channel
  const adminChannel = await getActiveChannel("EMAIL", event.tenantId);
  if (adminChannel) {
    const channelConfig = adminChannel.config as Record<string, string>;
    const adminEmail = channelConfig.email || channelConfig.fromEmail;
    if (adminEmail) {
      const totalRegs = await prisma.registration.count({ where: { eventId: data.eventId } });
      sendEmail({
        to: adminEmail,
        subject: `New Registration: ${registration.name} — ${registration.event.title}`,
        html: adminNewRegistrationHtml({
          registrantName: registration.name,
          registrantEmail: registration.email,
          registrantPhone: data.phone || undefined,
          registrantOrg: data.organization || undefined,
          registrantDesignation: data.designation || undefined,
          eventTitle: registration.event.title,
          role: data.participantRole || "DELEGATE",
          amount: Number(registration.amount),
          currency: registration.currency,
          paymentStatus,
          totalRegistrations: totalRegs,
        }),
        tenantId: event.tenantId,
      }).catch((err) => console.error("Admin notification email error:", err));
    }
  }

  // Create in-app notification for admins (non-blocking)
  createNotification({
    type: "NEW_REGISTRATION",
    title: "New Registration",
    message: `${registration.name} registered for "${registration.event.title}".`,
    link: `/dashboard/registrations`,
    tenantId: event.tenantId,
  });

  return successResponse(registration, "Registration successful", 201);
});
