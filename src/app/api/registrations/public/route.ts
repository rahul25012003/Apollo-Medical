import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
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
import { issueAttendeeBadgeAndCertificate } from "@/lib/ifpc-automation";

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

  // Capacity/waitlist and the duplicate-email check are decided later,
  // atomically with the insert (see the transaction below) — deciding them
  // here from this snapshot count would race with concurrent requests near
  // the capacity boundary and could let more than event.capacity delegates
  // land as CONFIRMED instead of WAITLIST.
  const requestedStatus = data.status || "PENDING";
  const isDelegate = !data.participantRole || data.participantRole === "DELEGATE";

  // SERVER-SIDE amount calculation - never trust client amount
  let amount: number;
  const now = new Date();

  if (data.categoryId && event.pricingCategories.length > 0) {
    // Reliable path: match by EventPricing id. Reject rather than silently
    // falling back to a different (possibly cheaper) price if the id the
    // client sent doesn't actually belong to this event's categories.
    const matchedCategory = event.pricingCategories.find((pc) => pc.id === data.categoryId);
    if (!matchedCategory) {
      return Errors.badRequest("Selected pricing category not found for this event");
    }
    const isEarlyBird =
      matchedCategory.earlyBirdPrice &&
      matchedCategory.earlyBirdDeadline &&
      now <= matchedCategory.earlyBirdDeadline;
    amount = isEarlyBird
      ? Number(matchedCategory.earlyBirdPrice)
      : Number(matchedCategory.price);
  } else if (data.category && event.pricingCategories.length > 0) {
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

  // Link to logged-in user if session exists
  const userId = session?.user?.id || null;

  // Duplicate check, capacity/waitlist decision, and the insert must be one
  // atomic transaction — deciding them from an earlier snapshot count would
  // let concurrent requests near the capacity boundary all read the same
  // stale count and all land as CONFIRMED, overselling the event.
  type TxOutcome =
    | { ok: false }
    | {
        ok: true;
        status: "PENDING" | "CONFIRMED" | "WAITLIST" | "ATTENDED" | "CANCELLED";
        paymentStatus: "PENDING" | "PAID" | "REFUNDED" | "FAILED" | "FREE";
        registration: Prisma.RegistrationGetPayload<{ include: { event: { select: { id: true; title: true; startDate: true } } } }>;
      };

  let outcome: TxOutcome;
  try {
    outcome = await prisma.$transaction(
      async (tx): Promise<TxOutcome> => {
        const existingRegistration = await tx.registration.findUnique({
          where: { email_eventId: { email: data.email.toLowerCase(), eventId: data.eventId } },
        });
        if (existingRegistration) return { ok: false };

        let resolvedStatus = requestedStatus;
        if (isDelegate) {
          const delegateCount = await tx.registration.count({
            where: { eventId: data.eventId, OR: [{ participantRole: "DELEGATE" }, { participantRole: null }] },
          });
          if (event.capacity - delegateCount <= 0) resolvedStatus = "WAITLIST";
        }

        let resolvedPaymentStatus: "PENDING" | "PAID" | "REFUNDED" | "FAILED" | "FREE";
        if (amount === 0) {
          resolvedPaymentStatus = "FREE";
          resolvedStatus = resolvedStatus === "WAITLIST" ? "WAITLIST" : "CONFIRMED";
        } else {
          resolvedPaymentStatus = "PENDING";
        }

        const registration = await tx.registration.create({
          data: {
            name: data.name,
            email: data.email.toLowerCase(),
            phone: data.phone,
            organization: data.organization,
            designation: data.designation,
            category: data.category,
            participantRole: data.participantRole,
            eventId: data.eventId,
            status: resolvedStatus,
            paymentStatus: resolvedPaymentStatus,
            amount,
            currency: event.currency,
            notes: data.notes,
            specialRequests: data.specialRequests,
            userId,
            registeredById: null,
          },
          include: {
            event: { select: { id: true, title: true, startDate: true } },
          },
        });

        return { ok: true, status: resolvedStatus, paymentStatus: resolvedPaymentStatus, registration };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2002" || e.code === "P2034")) {
      outcome = { ok: false };
    } else {
      throw e;
    }
  }

  if (!outcome.ok) {
    return Errors.conflict("You are already registered for this event");
  }
  const { status, paymentStatus, registration } = outcome;

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

  // Free registrations are CONFIRMED immediately — issue registration ID/badge/certificate now.
  // (No-ops for every tenant except apollo-medical — see ifpc-automation.ts.)
  if (status === "CONFIRMED") {
    issueAttendeeBadgeAndCertificate(registration.id).catch((err) => console.error("Badge/certificate automation error:", err));
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
