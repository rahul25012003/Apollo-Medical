import { NextRequest } from "next/server";
import { uploadFile, UPLOAD_CONFIG } from "@/lib/upload";
import { successResponse, Errors, withErrorHandler } from "@/lib/api-utils";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

// Public (no auth) — abstract submission is a public form. Tightly scoped:
// PDF/PPTX only, 10MB cap, rate-limited, written to its own "abstracts" folder.
const rateLimiter = createRateLimiter("abstracts-upload", { maxRequests: 5, windowSeconds: 60 });

// POST /api/abstracts/upload — supporting file for symposia/workshop submissions
export const POST = withErrorHandler(async (request: NextRequest) => {
  const rl = rateLimiter.check(getClientIp(request));
  if (!rl.allowed) return Errors.badRequest(rl.message);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return Errors.badRequest("No file provided");

  const result = await uploadFile(file, {
    folder: "abstracts",
    allowedTypes: UPLOAD_CONFIG.allowedDocumentTypes,
    maxSize: UPLOAD_CONFIG.maxFileSize,
  });

  if (!result.success) return Errors.badRequest(result.error || "Upload failed");

  return successResponse({ url: result.url, fileName: result.fileName }, "File uploaded successfully");
});
