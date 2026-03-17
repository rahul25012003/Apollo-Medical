import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  successResponse,
  paginatedResponse,
  Errors,
  withErrorHandler,
  parseBody,
  getPaginationParams,
} from "@/lib/api-utils";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string; engId: string }> };

const submitResponseSchema = z.object({
  response: z.record(z.string(), z.unknown()),
});

// GET /api/events/[id]/engagements/[engId]/responses - Fetch responses
export const GET = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    const { id: eventId, engId: engagementId } = await context!.params;

    // Verify engagement exists and belongs to event
    const engagement = await prisma.eventEngagement.findFirst({
      where: { id: engagementId, eventId },
    });

    if (!engagement) {
      return Errors.notFound("Engagement");
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const sort = searchParams.get("sort") || "newest"; // newest, upvoted

    // For POLL type, return aggregated vote counts
    if (engagement.type === "POLL") {
      const responses = await prisma.engagementResponse.findMany({
        where: { engagementId },
        select: { response: true, userId: true, userName: true, createdAt: true },
      });

      // Aggregate votes by option
      const voteCounts: Record<string, number> = {};
      let userVote: string | null = null;

      for (const r of responses) {
        const resp = r.response as { answer?: string };
        const answer = resp?.answer;
        if (answer) {
          voteCounts[answer] = (voteCounts[answer] || 0) + 1;
        }
        if (r.userId === session.user.id && answer) {
          userVote = answer;
        }
      }

      return successResponse({
        type: "POLL",
        totalVotes: responses.length,
        voteCounts,
        userVote,
      });
    }

    // For WORDCLOUD type, return word frequency
    if (engagement.type === "WORDCLOUD") {
      const responses = await prisma.engagementResponse.findMany({
        where: { engagementId },
        select: { id: true, response: true, userId: true, userName: true, createdAt: true },
      });

      const wordFrequency: Record<string, number> = {};
      let userWord: string | null = null;

      for (const r of responses) {
        const resp = r.response as { word?: string };
        const word = resp?.word?.toLowerCase()?.trim();
        if (word) {
          wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
        if (r.userId === session.user.id && resp?.word) {
          userWord = resp.word;
        }
      }

      return successResponse({
        type: "WORDCLOUD",
        totalResponses: responses.length,
        wordFrequency,
        userWord,
        words: responses.map((r) => ({
          id: r.id,
          word: (r.response as { word?: string })?.word || "",
          userName: r.userName,
          createdAt: r.createdAt,
        })),
      });
    }

    // For QA and FEEDBACK types, return paginated responses
    const orderBy =
      sort === "upvoted"
        ? [{ createdAt: "desc" as const }] // We'll sort by upvotes client-side since it's in JSON
        : [{ createdAt: "desc" as const }];

    const [responses, total] = await Promise.all([
      prisma.engagementResponse.findMany({
        where: { engagementId },
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          userId: true,
          userName: true,
          response: true,
          createdAt: true,
        },
      }),
      prisma.engagementResponse.count({ where: { engagementId } }),
    ]);

    // Check if user has already responded (for FEEDBACK)
    let userResponded = false;
    if (engagement.type === "FEEDBACK") {
      const existing = await prisma.engagementResponse.findFirst({
        where: { engagementId, userId: session.user.id },
      });
      userResponded = !!existing;
    }

    return paginatedResponse(
      responses.map((r) => ({
        ...r,
        _meta: { userResponded },
      })),
      { page, limit, total }
    );
  }
);

// POST /api/events/[id]/engagements/[engId]/responses - Submit a response
export const POST = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    const { id: eventId, engId: engagementId } = await context!.params;

    // Verify engagement exists, belongs to event, and is active
    const engagement = await prisma.eventEngagement.findFirst({
      where: { id: engagementId, eventId },
    });

    if (!engagement) {
      return Errors.notFound("Engagement");
    }

    if (!engagement.isActive) {
      return Errors.badRequest("This engagement is not currently active");
    }

    const body = await parseBody(request);

    if (!body) {
      return Errors.badRequest("Invalid request body");
    }

    const parsed = submitResponseSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validationError(parsed.error);
    }

    const { response } = parsed.data;

    // For POLL type, ensure one vote per user
    if (engagement.type === "POLL") {
      const existing = await prisma.engagementResponse.findFirst({
        where: { engagementId, userId: session.user.id },
      });

      if (existing) {
        return Errors.conflict("You have already voted in this poll");
      }

      // Validate the answer is one of the valid options
      const content = engagement.content as { options?: string[] } | null;
      const answer = (response as { answer?: string })?.answer;
      if (content?.options && answer && !content.options.includes(answer)) {
        return Errors.badRequest("Invalid poll option");
      }
    }

    // For FEEDBACK type, ensure one response per user
    if (engagement.type === "FEEDBACK") {
      const existing = await prisma.engagementResponse.findFirst({
        where: { engagementId, userId: session.user.id },
      });

      if (existing) {
        return Errors.conflict("You have already submitted feedback");
      }
    }

    const engagementResponse = await prisma.engagementResponse.create({
      data: {
        engagementId,
        userId: session.user.id,
        userName: session.user.name || session.user.email,
        response: response as any,
      },
    });

    return successResponse(engagementResponse, "Response submitted", 201);
  }
);

// DELETE /api/events/[id]/engagements/[engId]/responses - Delete a response (admin only)
export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await auth();

    if (!session) {
      return Errors.unauthorized();
    }

    const { id: eventId, engId: engagementId } = await context!.params;

    const { searchParams } = new URL(request.url);
    const responseId = searchParams.get("responseId");

    if (!responseId) {
      return Errors.badRequest("Response ID is required");
    }

    // Verify engagement exists and belongs to event
    const engagement = await prisma.eventEngagement.findFirst({
      where: { id: engagementId, eventId },
      include: { event: { select: { tenantId: true } } },
    });

    if (!engagement) {
      return Errors.notFound("Engagement");
    }

    const response = await prisma.engagementResponse.findFirst({
      where: { id: responseId, engagementId },
    });

    if (!response) {
      return Errors.notFound("Response");
    }

    // Allow admin or the response owner to delete
    const isOwner = response.userId === session.user.id;
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER"].includes(session.user.role);

    if (!isOwner && !isAdmin) {
      return Errors.forbidden("You don't have permission to delete this response");
    }

    await prisma.engagementResponse.delete({
      where: { id: responseId },
    });

    return successResponse({ id: responseId }, "Response deleted");
  }
);
