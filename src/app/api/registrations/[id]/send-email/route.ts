import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, canAccess } from "@/lib/auth";
import {
  successResponse,
  Errors,
  withErrorHandler,
} from "@/lib/api-utils";
import {
  sendEmail,
  registrationConfirmationHtml,
  registrationReceivedHtml,
} from "@/lib/notifications";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/registrations/[id]/send-email
// Resends the registration confirmation email to a single registrant.
// Uses the same template as the original confirmation flow.
export const POST = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    if (!canAccess(session.user.role, "registrations")) {
      return Errors.forbidden("You don't have permission to send registration emails");
    }

    const { id } = await context!.params;

    const registration = await prisma.registration.findUnique({
      where: { id },
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

    if (!registration) {
      return Errors.notFound("Registration");
    }

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

      return successResponse({ sent: true, email: registration.email });
    } catch (err) {
      console.error("Send email error:", err);
      return Errors.badRequest("Failed to send email");
    }
  }
);
