import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { isTenantOwner } from "@/lib/tenant-scope";
import { successResponse, Errors, withErrorHandler, parseBody } from "@/lib/api-utils";
import { parseCsv } from "@/lib/csv";
import { createAdminRegistration, type RegistrationEventContext } from "@/lib/registration-creation";
import { z } from "zod";
import { isIfpcEvent } from "@/lib/ifpc-tenant";

// Keeps one request well within Render's free-tier request/memory limits —
// larger lists should be split into multiple uploads.
const MAX_ROWS = 500;

const bodySchema = z.object({
  eventId: z.string().cuid(),
  csv: z.string().min(1),
});

function normalizeFoodPreference(raw: string | undefined): "VEG" | "NON_VEG" | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase();
  if (v === "veg" || v === "vegetarian") return "VEG";
  if (v === "non-veg" || v === "nonveg" || v === "non vegetarian" || v === "non-vegetarian") return "NON_VEG";
  return undefined;
}

const STATUS_VALUES = new Set(["PENDING", "CONFIRMED", "WAITLIST", "ATTENDED", "CANCELLED"]);
const PAYMENT_STATUS_VALUES = new Set(["PENDING", "PAID", "REFUNDED", "FAILED", "FREE"]);
const PARTICIPANT_ROLE_VALUES = new Set(["DELEGATE", "SPEAKER", "ORGANIZER", "VOLUNTEER", "CHAIRPERSON"]);
// Free-text synonyms admins naturally type in a CSV instead of the exact
// enum value — every event's capacity/slot count only recognizes DELEGATE
// (or null), so an unrecognized role here silently vanishes from every
// "remaining seats" count across the app.
const PARTICIPANT_ROLE_SYNONYMS: Record<string, string> = { PARTICIPANT: "DELEGATE", ATTENDEE: "DELEGATE" };
function normalizeParticipantRole(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toUpperCase();
  if (PARTICIPANT_ROLE_VALUES.has(v)) return v;
  if (PARTICIPANT_ROLE_SYNONYMS[v]) return PARTICIPANT_ROLE_SYNONYMS[v];
  return "DELEGATE"; // unrecognized role text — default to the role that counts toward capacity
}

// POST /api/registrations/bulk-upload — admin bulk-imports already-registered
// candidates from a CSV. Each row goes through the exact same creation path
// (atomic duplicate/capacity check, unique registrationCode+QR, delegate
// login account, password) as a single "Add Registration" — see
// src/lib/registration-creation.ts.
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (!canAccess(session.user.role, "registrations")) {
    return Errors.forbidden("You don't have permission to create registrations");
  }

  const body = await parseBody(request);
  if (!body) return Errors.badRequest("Invalid request body");

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return Errors.validationError(parsed.error);
  // IFPC (apollo-medical) only — this route doesn't exist for other tenants.
  if (!(await isIfpcEvent(parsed.data.eventId))) return Errors.notFound("Page");

  const event = await prisma.event.findUnique({
    where: { id: parsed.data.eventId },
    select: {
      id: true,
      title: true,
      tenantId: true,
      capacity: true,
      currency: true,
      price: true,
      earlyBirdPrice: true,
      earlyBirdDeadline: true,
      pricingCategories: {
        select: { id: true, name: true, price: true, earlyBirdPrice: true, earlyBirdDeadline: true },
      },
    },
  });
  if (!event) return Errors.notFound("Event");
  if (!isTenantOwner(session, event.tenantId)) {
    return Errors.forbidden("You can only create registrations for your own tenant's events");
  }

  const rows = parseCsv(parsed.data.csv);
  if (rows.length === 0) return Errors.badRequest("CSV has no data rows");
  if (rows.length > MAX_ROWS) {
    return Errors.badRequest(`CSV has ${rows.length} rows — split into batches of ${MAX_ROWS} or fewer`);
  }

  const eventContext: RegistrationEventContext = event;
  let created = 0;
  let skipped = 0;
  const failed: { row: number; email: string; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2; // account for the header row, 1-indexed for the admin reading the CSV

    const name = r.name?.trim();
    const email = r.email?.trim();
    if (!name || !email) {
      failed.push({ row: rowNum, email: email || "", reason: "Missing name or email" });
      continue;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      failed.push({ row: rowNum, email, reason: "Invalid email address" });
      continue;
    }

    const statusRaw = r.status?.trim().toUpperCase();
    const status = statusRaw && STATUS_VALUES.has(statusRaw) ? (statusRaw as "PENDING" | "CONFIRMED" | "WAITLIST" | "ATTENDED" | "CANCELLED") : "CONFIRMED";

    const paymentStatusRaw = r.paymentstatus?.trim().toUpperCase();
    // Bulk upload means "these people are already registered" — default to
    // PAID rather than PENDING, since nobody is going to pay through this
    // system for a row that was imported after the fact. createAdminRegistration
    // still demotes this to FREE for any row whose resolved amount is 0.
    const paymentStatus = paymentStatusRaw && PAYMENT_STATUS_VALUES.has(paymentStatusRaw)
      ? (paymentStatusRaw as "PENDING" | "PAID" | "REFUNDED" | "FAILED" | "FREE")
      : "PAID";

    const amountRaw = r.amount?.trim();
    const amount = amountRaw && !Number.isNaN(Number(amountRaw)) ? Number(amountRaw) : undefined;

    try {
      const result = await createAdminRegistration(
        eventContext,
        {
          name,
          email,
          phone: r.phone || undefined,
          organization: r.organization || undefined,
          designation: r.designation || undefined,
          category: r.category || undefined,
          participantRole: normalizeParticipantRole(r.participantrole),
          foodPreference: normalizeFoodPreference(r.foodpreference),
          amount,
          status,
          paymentStatus,
        },
        session.user.id
      );

      if (!result.ok) {
        if (result.reason === "duplicate") skipped++;
        else failed.push({ row: rowNum, email, reason: "Pricing category not found for this event" });
        continue;
      }
      created++;
    } catch (err) {
      failed.push({ row: rowNum, email, reason: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  return successResponse(
    { total: rows.length, created, skipped, failed },
    `${created} registration(s) created, ${skipped} already registered, ${failed.length} failed`
  );
});
