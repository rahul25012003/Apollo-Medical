import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> extends ApiSuccessResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = { success: true, data };
  if (message) {
    response.message = message;
  }
  return NextResponse.json(response, { status });
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: { page: number; limit: number; total: number }
): NextResponse<PaginatedResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  });
}

/**
 * Create an error response
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const error: ApiErrorResponse["error"] = { code, message };
  if (details !== undefined) {
    error.details = details;
  }
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

// ============================================================================
// Common Error Responses
// ============================================================================

export const Errors = {
  badRequest: (message: string = "Bad request", details?: unknown) =>
    errorResponse("BAD_REQUEST", message, 400, details),

  unauthorized: (message: string = "Unauthorized") =>
    errorResponse("UNAUTHORIZED", message, 401),

  forbidden: (message: string = "Forbidden") =>
    errorResponse("FORBIDDEN", message, 403),

  notFound: (resource: string = "Resource") =>
    errorResponse("NOT_FOUND", `${resource} not found`, 404),

  conflict: (message: string = "Resource already exists") =>
    errorResponse("CONFLICT", message, 409),

  validationError: (error: ZodError) =>
    errorResponse(
      "VALIDATION_ERROR",
      "Validation failed",
      400,
      error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }))
    ),

  internalError: (message: string = "Internal server error") =>
    errorResponse("INTERNAL_ERROR", message, 500),
};

// ============================================================================
// Request Helpers
// ============================================================================

/**
 * Parse pagination params from URL
 */
export function getPaginationParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "10", 10))
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Parse sort params from URL
 */
export function getSortParams(
  searchParams: URLSearchParams,
  allowedFields: string[],
  defaultField: string = "createdAt"
): { field: string; order: "asc" | "desc" } {
  const sortBy = searchParams.get("sortBy") || defaultField;
  const sortOrder = searchParams.get("sortOrder") || "desc";

  return {
    field: allowedFields.includes(sortBy) ? sortBy : defaultField,
    order: sortOrder === "asc" ? "asc" : "desc",
  };
}

/**
 * Safe JSON parse with error handling
 */
export async function parseBody<T = Record<string, unknown>>(request: NextRequest | Request): Promise<T | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// ============================================================================
// Error Handler Wrapper
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler<TContext = any> = (
  request: NextRequest,
  context?: TContext
) => Promise<NextResponse>;

/**
 * Wrap route handlers with error handling
 */
export function withErrorHandler<TContext>(
  handler: RouteHandler<TContext>
): RouteHandler<TContext> {
  return async (request: NextRequest, context?: TContext) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error("API Error:", error);

      if (error instanceof ZodError) {
        return Errors.validationError(error);
      }

      if (error instanceof Error) {
        // Prisma errors
        if (error.message.includes("Unique constraint")) {
          return Errors.conflict("A record with this value already exists");
        }
        if (error.message.includes("Record to update not found")) {
          return Errors.notFound("Record");
        }
        if (error.message.includes("Foreign key constraint")) {
          return Errors.badRequest("Invalid reference to related record");
        }
      }

      return Errors.internalError();
    }
  };
}
