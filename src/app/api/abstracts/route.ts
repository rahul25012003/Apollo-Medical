import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, Errors, withErrorHandler, parseBody } from "@/lib/api-utils";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { sendEmail, abstractSubmittedHtml } from "@/lib/notifications";
import { z } from "zod";

const rateLimiter = createRateLimiter("abstracts-public", { maxRequests: 5, windowSeconds: 60 });

const WORD_LIMITS: Record<string, number> = {
  UNSTRUCTURED: 200,
  ORAL_POSTER: 250,
};

const submitSchema = z.object({
  eventId: z.string(),
  title: z.string().min(3).max(300),
  authors: z.string().min(1).max(500),
  affiliations: z.string().max(500).optional(),
  topic: z.string().min(1).max(200),
  submissionType: z.enum(["UNSTRUCTURED", "ORAL_POSTER", "SYMPOSIUM_WORKSHOP"]),
  abstractText: z.string().min(1).max(5000),
  fileUrl: z.string().optional().nullable(),
  presentingAuthorName: z.string().min(1).max(200),
  presentingAuthorEmail: z.string().email(),
  presentingAuthorPhone: z.string().max(30).optional(),
});

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// POST /api/abstracts — public abstract submission
export const POST = withErrorHandler(async (request: NextRequest) => {
  const rl = rateLimiter.check(getClientIp(request));
  if (!rl.allowed) return Errors.badRequest(rl.message);

  const body = await parseBody(request);
  if (!body) return Errors.badRequest("Invalid request body");

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) return Errors.validationError(parsed.error);
  const data = parsed.data;

  const event = await prisma.event.findUnique({
    where: { id: data.eventId },
    select: { id: true, title: true, tenantId: true },
  });
  if (!event) return Errors.notFound("Event");

  const limit = WORD_LIMITS[data.submissionType];
  if (limit && wordCount(data.abstractText) > limit) {
    return Errors.badRequest(`Abstract text exceeds the ${limit}-word limit for this submission type`);
  }

  // Link to an existing registration for this event, if the presenter has already registered.
  const email = data.presentingAuthorEmail.toLowerCase();
  const existingRegistration = await prisma.registration.findUnique({
    where: { email_eventId: { email, eventId: data.eventId } },
    select: { id: true },
  });

  const abstract = await prisma.abstract.create({
    data: {
      eventId: data.eventId,
      title: data.title,
      authors: data.authors,
      affiliations: data.affiliations || null,
      topic: data.topic,
      submissionType: data.submissionType,
      abstractText: data.abstractText,
      fileUrl: data.fileUrl || null,
      presentingAuthorName: data.presentingAuthorName,
      presentingAuthorEmail: email,
      presentingAuthorPhone: data.presentingAuthorPhone || null,
      registrationId: existingRegistration?.id || null,
    },
  });

  sendEmail({
    to: email,
    subject: `Abstract Received — ${event.title}`,
    html: abstractSubmittedHtml({
      name: data.presentingAuthorName,
      eventTitle: event.title,
      title: data.title,
      submissionType: data.submissionType,
      topic: data.topic,
    }),
    tenantId: event.tenantId,
  }).catch((err) => console.error("Abstract submission email error:", err));

  return successResponse(abstract, "Abstract submitted successfully", 201);
});
