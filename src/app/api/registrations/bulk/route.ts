import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import { bulkRegistrationActionSchema } from "@/lib/validations/registration";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";
import { sendEmail } from "@/lib/notifications";
import { isTenantOwner } from "@/lib/tenant-scope";
import { findOrCreateUserAccount, sendAccountCreatedEmail } from "@/lib/auto-account";

// POST /api/registrations/bulk - Perform bulk actions on registrations
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  if (!canAccess(session.user.role, "registrations")) {
    return Errors.forbidden("You don't have permission to manage registrations");
  }

  const body = await parseBody(request);

  if (!body) {
    return Errors.badRequest("Invalid request body");
  }

  const parsed = bulkRegistrationActionSchema.safeParse(body);

  if (!parsed.success) {
    return Errors.validationError(parsed.error);
  }

  const { registrationIds, action, data } = parsed.data;

  // Verify all registrations exist and belong to user's tenant
  const existingRegistrations = await prisma.registration.findMany({
    where: { id: { in: registrationIds } },
    select: {
      id: true, status: true, paymentStatus: true, email: true,
      name: true, phone: true, userId: true, participantRole: true,
      event: { select: { tenantId: true, title: true } },
    },
  });

  if (existingRegistrations.length !== registrationIds.length) {
    return Errors.badRequest("Some registration IDs are invalid");
  }

  // Tenant isolation check — ensure all registrations belong to user's tenant
  const unauthorized = existingRegistrations.some(r => !isTenantOwner(session, r.event.tenantId));
  if (unauthorized) {
    return Errors.forbidden("You don't have permission to modify some of these registrations");
  }

  let result;

  switch (action) {
    case "confirm": {
      result = await prisma.registration.updateMany({
        where: { id: { in: registrationIds } },
        data: { status: "CONFIRMED" },
      });

      // Auto-create accounts for newly confirmed registrations
      const baseUrl = request.headers.get("origin") || request.headers.get("host") || "";
      const loginUrl = `${baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`}/auth/login`;
      const toConfirm = existingRegistrations.filter(r => r.status !== "CONFIRMED");
      // Process in parallel and await so admin knows the result
      const accountResults = await Promise.allSettled(
        toConfirm.map(async (reg) => {
          try {
            const { userId, isNew } = await findOrCreateUserAccount({
              email: reg.email,
              name: reg.name,
              phone: reg.phone,
              tenantId: reg.event.tenantId,
            });
            if (!reg.userId) {
              await prisma.registration.update({
                where: { id: reg.id },
                data: { userId },
              });
            }
            if (isNew) {
              sendAccountCreatedEmail({
                email: reg.email,
                name: reg.name,
                eventTitle: reg.event.title,
                role: reg.participantRole || "delegate",
                loginUrl,
                tenantId: reg.event.tenantId,
              });
            }
          } catch (err) {
            console.error(`Auto-account failed for ${reg.email}:`, err);
            throw err;
          }
        })
      );
      const accountsCreated = accountResults.filter(r => r.status === "fulfilled").length;
      return successResponse(
        { updated: result.count, accountsCreated },
        `${result.count} registrations confirmed, ${accountsCreated} accounts created`
      );
    }

    case "cancel":
      result = await prisma.registration.updateMany({
        where: { id: { in: registrationIds } },
        data: { status: "CANCELLED" },
      });
      break;

    case "mark_attended":
      result = await prisma.registration.updateMany({
        where: { id: { in: registrationIds } },
        data: {
          status: "ATTENDED",
          attendanceStatus: "checked_in",
          checkedInAt: new Date(),
        },
      });
      break;

    case "mark_paid":
      result = await prisma.registration.updateMany({
        where: { id: { in: registrationIds } },
        data: {
          paymentStatus: "PAID",
          paidAt: new Date(),
        },
      });
      break;

    case "send_email": {
      const emails = existingRegistrations.map((r) => r.email);
      const subject = (data as Record<string, string>)?.subject || "Update from ICMS";
      const body = (data as Record<string, string>)?.body || "You have an update regarding your registration.";
      // Send emails in parallel (non-blocking per email)
      const results = await Promise.allSettled(
        emails.map((email) =>
          sendEmail({ to: email, subject, html: `<div style="font-family:Arial;padding:20px;"><p>${body}</p></div>` })
        )
      );
      const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;
      return successResponse(
        { sent, total: emails.length },
        `${sent}/${emails.length} emails sent`
      );
    }

    default:
      return Errors.badRequest("Invalid action");
  }

  return successResponse(
    { updated: result.count },
    `${result.count} registrations updated`
  );
});
