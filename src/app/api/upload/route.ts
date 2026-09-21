import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile, UPLOAD_CONFIG, PPTX_MIME_TYPE } from "@/lib/upload";
import {
  successResponse,
  Errors,
  withErrorHandler,
} from "@/lib/api-utils";
import { isIfpcTenantId } from "@/lib/ifpc-tenant";

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

  // Folder-level permission check
  const userRole = session.user.role;
  const REGULAR_USER_ALLOWED_FOLDERS = ["general", "avatars", "events"];
  if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
    if (!REGULAR_USER_ALLOWED_FOLDERS.includes(folder)) {
      return Errors.forbidden("You do not have permission to upload to this folder");
    }
  }

  // Determine allowed types based on folder
  let allowedTypes = UPLOAD_CONFIG.allowedImageTypes;
  if (folder === "documents" || folder === "events/brochures") {
    allowedTypes = [...UPLOAD_CONFIG.allowedImageTypes, ...UPLOAD_CONFIG.allowedDocumentTypes];
    // IFPC (apollo-medical) documents may also be PowerPoint.
    if (await isIfpcTenantId(session.user.tenantId)) allowedTypes = [...allowedTypes, PPTX_MIME_TYPE];
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
    allowedDocumentTypes: (await isIfpcTenantId(session.user.tenantId))
      ? [...UPLOAD_CONFIG.allowedDocumentTypes, PPTX_MIME_TYPE]
      : UPLOAD_CONFIG.allowedDocumentTypes,
  });
});
