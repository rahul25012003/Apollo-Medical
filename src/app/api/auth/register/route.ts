import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-utils";
import { registerSchema } from "@/lib/validations/auth";
import {
  successResponse,
  Errors,
  withErrorHandler,
  parseBody,
} from "@/lib/api-utils";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

const registerLimiter = createRateLimiter("register", {
  maxRequests: 5,
  windowSeconds: 900, // 15 minutes
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Rate limit: 5 requests per 15 minutes per IP
  const ip = getClientIp(request);
  const rateLimitResult = registerLimiter.check(ip);
  if (!rateLimitResult.allowed) {
    return Errors.badRequest(rateLimitResult.message);
  }

  const body = await parseBody(request);

  if (!body) {
    return Errors.badRequest("Invalid request body");
  }

  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return Errors.validationError(parsed.error);
  }

  const { email, password, name, firstName, lastName, phone } = parsed.data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    return Errors.conflict("An account with this email already exists");
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      firstName,
      lastName,
      phone,
      role: "ATTENDEE",
    },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
    },
  });

  return successResponse(user, "Account created successfully", 201);
});
