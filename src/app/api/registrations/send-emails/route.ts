import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";
import {
  sendEmail,
  registrationConfirmationHtml,
  registrationReceivedHtml,
} from "@/lib/notifications";

// POST /api/registrations/send-emails
// Sends the registration confirmation email to a list of registrations.
// Body: { ids: string[] }
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  if (!canAccess(session.user.role, "registrations")) {
    return Errors.forbidden("You don't have permission to send registration emails");
  }

  const body = await parseBody<{ ids?: string[] }>(request);
  const ids = Array.isArray(body?.ids) ? body!.ids.filter((x) => typeof x === "string") : [];

  if (ids.length === 0) {
    return Errors.badRequest("No registration IDs provided");
  }

  const registrations = await prisma.registration.findMany({
    where: { id: { in: ids } },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          tenantId: true,
        },
      },
    },
  });

  let sent = 0;
  let failed = 0;
  const failures: { id: string; email: string; error: string }[] = [];

  for (const registration of registrations) {
    const status = registration.status === "CONFIRMED" || registration.status === "ATTENDED"
      ? "CONFIRMED"
      : "PENDING";

    try {
      await sendEmail({
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
              role: registration.participantRole || "DELEGATE",
              registrationId: registration.id,
            }),
        tenantId: registration.event.tenantId,
      });
      sent++;
    } catch (err) {
      failed++;
      failures.push({
        id: registration.id,
        email: registration.email,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return successResponse({
    sent,
    failed,
    total: registrations.length,
    failures,
  });
});
