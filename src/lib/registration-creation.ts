/**
 * Shared core for every admin-authored registration (single "Add
 * Registration" form and bulk upload) — one place for the atomic
 * duplicate/capacity transaction and the post-create automation, so a new
 * entry point can't repeat the "forgot to call issueAttendeeBadgeAndCertificate"
 * bug already found and fixed once for the bulk-confirm action.
 */
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createNotification } from "@/lib/notifications-db";
import { findOrCreateUserAccount, sendAccountCreatedEmail } from "@/lib/auto-account";
import { sendEmail, registrationReceivedHtml, registrationApprovedHtml } from "@/lib/notifications";
import { issueAttendeeBadgeAndCertificate } from "@/lib/ifpc-automation";

export type RegistrationEventContext = {
  id: string;
  title: string;
  tenantId: string | null;
  capacity: number;
  currency: string;
  price: Prisma.Decimal | number;
  earlyBirdPrice: Prisma.Decimal | number | null;
  earlyBirdDeadline: Date | null;
  pricingCategories: {
    id: string;
    name: string;
    price: Prisma.Decimal | number;
    earlyBirdPrice: Prisma.Decimal | number | null;
    earlyBirdDeadline: Date | null;
  }[];
};

export interface AdminRegistrationInput {
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  designation?: string;
  category?: string;
  categoryId?: string;
  participantRole?: string;
  foodPreference?: "VEG" | "NON_VEG";
  notes?: string;
  specialRequests?: string;
  /** Explicit amount override — skips category price lookup. */
  amount?: number;
  status?: "PENDING" | "CONFIRMED" | "WAITLIST" | "ATTENDED" | "CANCELLED";
  paymentStatus?: "PENDING" | "PAID" | "REFUNDED" | "FAILED" | "FREE";
  userId?: string | null;
}

type CreatedRegistration = Prisma.RegistrationGetPayload<{
  include: {
    event: { select: { id: true; title: true; startDate: true } };
    registeredBy: { select: { id: true; name: true; email: true } };
  };
}>;

export type AdminRegistrationResult =
  | { ok: true; status: string; registration: CreatedRegistration }
  | { ok: false; reason: "duplicate" | "invalid-category" };

function resolveAmount(event: RegistrationEventContext, input: AdminRegistrationInput): number | { error: string } {
  if (input.amount !== undefined) return input.amount;

  const now = new Date();
  if (input.categoryId && event.pricingCategories.length > 0) {
    const matched = event.pricingCategories.find((pc) => pc.id === input.categoryId);
    if (!matched) return { error: "Selected pricing category not found for this event" };
    const isEarlyBird = matched.earlyBirdPrice && matched.earlyBirdDeadline && now <= matched.earlyBirdDeadline;
    return Number(isEarlyBird ? matched.earlyBirdPrice : matched.price);
  }
  if (input.category && event.pricingCategories.length > 0) {
    const matched = event.pricingCategories.find((pc) => pc.name === input.category);
    if (matched) {
      const isEarlyBird = matched.earlyBirdPrice && matched.earlyBirdDeadline && now <= matched.earlyBirdDeadline;
      return Number(isEarlyBird ? matched.earlyBirdPrice : matched.price);
    }
  }
  const isEarlyBird = event.earlyBirdPrice && event.earlyBirdDeadline && now <= event.earlyBirdDeadline;
  return Number(isEarlyBird ? event.earlyBirdPrice : event.price);
}

/**
 * Creates one registration on behalf of an admin (bypasses the public
 * registration-window checks, same as the existing "Add Registration" form).
 * Atomic duplicate-email + capacity/waitlist decision, then the same
 * notification + badge/QR/account automation every other confirm path uses.
 */
export async function createAdminRegistration(
  event: RegistrationEventContext,
  input: AdminRegistrationInput,
  registeredById: string | null
): Promise<AdminRegistrationResult> {
  const amount = resolveAmount(event, input);
  if (typeof amount === "object") return { ok: false, reason: "invalid-category" };

  const requestedStatus = input.status || "PENDING";
  const isDelegate = !input.participantRole || input.participantRole === "DELEGATE";
  const email = input.email.toLowerCase();

  type TxOutcome =
    | { ok: false }
    | {
        ok: true;
        status: "PENDING" | "CONFIRMED" | "WAITLIST" | "ATTENDED" | "CANCELLED";
        paymentStatus: "PENDING" | "PAID" | "REFUNDED" | "FAILED" | "FREE";
        registration: Prisma.RegistrationGetPayload<{
          include: {
            event: { select: { id: true; title: true; startDate: true } };
            registeredBy: { select: { id: true; name: true; email: true } };
          };
        }>;
      };

  let outcome: TxOutcome;
  try {
    outcome = await prisma.$transaction(
      async (tx): Promise<TxOutcome> => {
        const existing = await tx.registration.findUnique({
          where: { email_eventId: { email, eventId: event.id } },
        });
        if (existing) return { ok: false };

        let resolvedStatus = requestedStatus;
        if (isDelegate) {
          const delegateCount = await tx.registration.count({
            where: { eventId: event.id, OR: [{ participantRole: "DELEGATE" }, { participantRole: null }] },
          });
          if (event.capacity - delegateCount <= 0) resolvedStatus = "WAITLIST";
        }

        let resolvedPaymentStatus = input.paymentStatus || "PENDING";
        if (amount === 0) {
          resolvedPaymentStatus = "FREE";
          if (resolvedStatus !== "WAITLIST") resolvedStatus = "CONFIRMED";
        }

        const registration = await tx.registration.create({
          data: {
            name: input.name,
            email,
            phone: input.phone,
            organization: input.organization,
            designation: input.designation,
            category: input.category,
            participantRole: input.participantRole,
            foodPreference: input.foodPreference,
            eventId: event.id,
            status: resolvedStatus,
            paymentStatus: resolvedPaymentStatus,
            amount,
            currency: event.currency,
            notes: input.notes,
            specialRequests: input.specialRequests,
            userId: input.userId ?? undefined,
            registeredById,
          },
          include: {
            event: { select: { id: true, title: true, startDate: true } },
            registeredBy: { select: { id: true, name: true, email: true } },
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

  if (!outcome.ok) return { ok: false, reason: "duplicate" };
  const { status, registration } = outcome;

  createNotification({
    type: "NEW_REGISTRATION",
    title: "New Registration",
    message: `${registration.name} registered for "${registration.event.title}".`,
    link: `/dashboard/registrations`,
    tenantId: event.tenantId,
    excludeUserId: registeredById,
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  if (status === "CONFIRMED") {
    const loginUrl = `${baseUrl}/auth/login`;
    sendEmail({
      to: registration.email,
      subject: `Registration Approved — ${registration.event.title}`,
      html: registrationApprovedHtml({
        name: registration.name,
        eventTitle: registration.event.title,
        role: input.participantRole || "DELEGATE",
        loginUrl,
      }),
      tenantId: event.tenantId,
    }).catch((err) => console.error("Approval email error:", err));
  } else {
    sendEmail({
      to: registration.email,
      subject: `Registration Received — ${registration.event.title}`,
      html: registrationReceivedHtml({
        name: registration.name,
        eventTitle: registration.event.title,
        role: input.participantRole || "DELEGATE",
        registrationId: registration.id,
      }),
      tenantId: event.tenantId,
    }).catch((err) => console.error("Registration email error:", err));
  }

  // Issue registration ID/badge/certificate + delegate login account.
  // (No-op for every tenant except apollo-medical — see ifpc-automation.ts.)
  if (status === "CONFIRMED") {
    issueAttendeeBadgeAndCertificate(registration.id).catch((err) => console.error("Badge/certificate automation error:", err));

    try {
      const { userId, isNew } = await findOrCreateUserAccount({
        email: registration.email,
        name: registration.name,
        phone: input.phone,
        tenantId: event.tenantId,
      });
      if (!registration.userId) {
        await prisma.registration.update({ where: { id: registration.id }, data: { userId } });
      }
      if (isNew) {
        sendAccountCreatedEmail({
          email: registration.email,
          name: registration.name,
          eventTitle: registration.event.title,
          role: input.participantRole || "delegate",
          loginUrl: `${baseUrl}/auth/login`,
          tenantId: event.tenantId,
        });
      }
    } catch (err) {
      console.error("Auto-account creation failed:", err);
    }
  }

  return { ok: true, status, registration };
}
