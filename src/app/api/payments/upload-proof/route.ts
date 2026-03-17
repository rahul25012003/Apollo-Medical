import { NextRequest } from "next/server";
import { uploadFile, UPLOAD_CONFIG } from "@/lib/upload";
import {
  successResponse,
  Errors,
  withErrorHandler,
} from "@/lib/api-utils";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

const rateLimiter = createRateLimiter("payment-proof-upload", { maxRequests: 10, windowSeconds: 300 });

// POST /api/payments/upload-proof - Public upload for payment proof screenshots
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Rate limit to prevent abuse
  const rl = rateLimiter.check(getClientIp(request));
  if (!rl.allowed) {
    return Errors.badRequest(rl.message);
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Errors.badRequest("No file provided");
  }

  // Only allow image files for payment proofs
  const result = await uploadFile(file, {
    folder: "payment-proofs",
    allowedTypes: UPLOAD_CONFIG.allowedImageTypes,
    maxSize: 5 * 1024 * 1024, // 5MB max for payment proofs
  });

  if (!result.success) {
    return Errors.badRequest(result.error || "Upload failed");
  }

  return successResponse({
    url: result.url,
    fileName: result.fileName,
    fileSize: result.fileSize,
    mimeType: result.mimeType,
  }, "Payment proof uploaded successfully");
});
