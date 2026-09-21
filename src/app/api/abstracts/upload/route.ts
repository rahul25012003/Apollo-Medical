import { NextRequest } from "next/server";
import { uploadFile, UPLOAD_CONFIG, PPTX_MIME_TYPE } from "@/lib/upload";
import { successResponse, Errors, withErrorHandler } from "@/lib/api-utils";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { isIfpcEvent } from "@/lib/ifpc-tenant";

// Public (no auth) — abstract submission is a public form. Tightly scoped:
// PDF/PPTX only, 10MB cap, rate-limited, written to its own "abstracts" folder.
const rateLimiter = createRateLimiter("abstracts-upload", { maxRequests: 5, windowSeconds: 60 });

// POST /api/abstracts/upload — supporting file for symposia/workshop submissions
export const POST = withErrorHandler(async (request: NextRequest) => {
  const rl = rateLimiter.check(getClientIp(request));
  if (!rl.allowed) return Errors.badRequest(rl.message);

  const formData = await request.formData();
  // IFPC (apollo-medical) only — this route doesn't exist for other tenants.
  if (!(await isIfpcEvent(formData.get("eventId") as string | null))) return Errors.notFound("Page");
  const file = formData.get("file") as File | null;
  if (!file) return Errors.badRequest("No file provided");

  const result = await uploadFile(file, {
    folder: "abstracts",
    allowedTypes: [...UPLOAD_CONFIG.allowedDocumentTypes, PPTX_MIME_TYPE],
    maxSize: UPLOAD_CONFIG.maxFileSize,
  });

  if (!result.success) return Errors.badRequest(result.error || "Upload failed");

  return successResponse({ url: result.url, fileName: result.fileName }, "File uploaded successfully");
});
