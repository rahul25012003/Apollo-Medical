import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile, UPLOAD_CONFIG } from "@/lib/upload";
import {
  successResponse,
  Errors,
  withErrorHandler,
} from "@/lib/api-utils";

// POST /api/upload - Upload file
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "general";

  if (!file) {
    return Errors.badRequest("No file provided");
  }

  // Determine allowed types based on folder
  let allowedTypes = UPLOAD_CONFIG.allowedImageTypes;
  if (folder === "documents") {
    allowedTypes = [...UPLOAD_CONFIG.allowedImageTypes, ...UPLOAD_CONFIG.allowedDocumentTypes];
  }

  const result = await uploadFile(file, {
    folder,
    allowedTypes,
    maxSize: UPLOAD_CONFIG.maxFileSize,
  });

  if (!result.success) {
    return Errors.badRequest(result.error || "Upload failed");
  }

  return successResponse({
    url: result.url,
    fileName: result.fileName,
    fileSize: result.fileSize,
    mimeType: result.mimeType,
  }, "File uploaded successfully");
});

// GET /api/upload - Get upload config (for client-side validation)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session) {
    return Errors.unauthorized();
  }

  return successResponse({
    maxFileSize: UPLOAD_CONFIG.maxFileSize,
    allowedImageTypes: UPLOAD_CONFIG.allowedImageTypes,
    allowedDocumentTypes: UPLOAD_CONFIG.allowedDocumentTypes,
  });
});
