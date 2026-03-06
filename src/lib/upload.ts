/**
 * File Upload Utility
 *
 * This module provides a cloud-ready abstraction for file uploads.
 * Currently supports local storage with easy migration to S3/Cloudinary.
 */

import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

// Upload configuration
export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  allowedDocumentTypes: ["application/pdf"],
  uploadDir: "public/uploads",
};

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface UploadOptions {
  folder?: string; // Sub-folder for organization (e.g., "speakers", "sponsors")
  allowedTypes?: string[];
  maxSize?: number;
}

/**
 * Get the storage provider based on environment
 */
function getStorageProvider(): "local" | "s3" | "cloudinary" {
  if (process.env.AWS_S3_BUCKET) {
    return "s3";
  }
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    return "cloudinary";
  }
  return "local";
}

/**
 * Upload a file to local storage
 */
async function uploadToLocal(
  buffer: Buffer,
  fileName: string,
  folder: string
): Promise<string> {
  const uploadPath = join(process.cwd(), UPLOAD_CONFIG.uploadDir, folder);

  // Ensure directory exists
  await mkdir(uploadPath, { recursive: true });

  const filePath = join(uploadPath, fileName);
  await writeFile(filePath, buffer);

  // Return public URL
  return `/uploads/${folder}/${fileName}`;
}

/**
 * Upload a file to S3
 * Note: Implement when AWS SDK is added
 */
async function uploadToS3(
  buffer: Buffer,
  fileName: string,
  folder: string,
  mimeType: string
): Promise<string> {
  // TODO: Implement S3 upload when needed
  // const s3 = new S3Client({ region: process.env.AWS_REGION });
  // const key = `${folder}/${fileName}`;
  // await s3.send(new PutObjectCommand({
  //   Bucket: process.env.AWS_S3_BUCKET,
  //   Key: key,
  //   Body: buffer,
  //   ContentType: mimeType,
  // }));
  // return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`;

  throw new Error("S3 upload not implemented. Add AWS SDK and configure.");
}

/**
 * Upload a file to Cloudinary
 * Note: Implement when Cloudinary SDK is added
 */
async function uploadToCloudinary(
  buffer: Buffer,
  fileName: string,
  folder: string
): Promise<string> {
  // TODO: Implement Cloudinary upload when needed
  // const cloudinary = require('cloudinary').v2;
  // cloudinary.config({
  //   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  //   api_key: process.env.CLOUDINARY_API_KEY,
  //   api_secret: process.env.CLOUDINARY_API_SECRET,
  // });
  // const result = await cloudinary.uploader.upload_stream({ folder });
  // return result.secure_url;

  throw new Error(
    "Cloudinary upload not implemented. Add Cloudinary SDK and configure."
  );
}

/**
 * Generate a unique file name
 */
function generateFileName(originalName: string): string {
  const extension = originalName.split(".").pop() || "";
  const uniqueId = randomUUID();
  const timestamp = Date.now();
  return `${timestamp}-${uniqueId}.${extension}`;
}

/**
 * Validate file type and size
 */
function validateFile(
  file: File,
  options: UploadOptions
): { valid: boolean; error?: string } {
  const { allowedTypes = UPLOAD_CONFIG.allowedImageTypes, maxSize = UPLOAD_CONFIG.maxFileSize } =
    options;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(", ")}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

/**
 * Upload a file
 */
export async function uploadFile(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { folder = "general" } = options;

  // Validate file
  const validation = validateFile(file, options);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = generateFileName(file.name);
    const provider = getStorageProvider();

    let url: string;

    switch (provider) {
      case "s3":
        url = await uploadToS3(buffer, fileName, folder, file.type);
        break;
      case "cloudinary":
        url = await uploadToCloudinary(buffer, fileName, folder);
        break;
      default:
        url = await uploadToLocal(buffer, fileName, folder);
    }

    return {
      success: true,
      url,
      fileName,
      fileSize: file.size,
      mimeType: file.type,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Delete a file
 */
export async function deleteFile(url: string): Promise<boolean> {
  const provider = getStorageProvider();

  try {
    if (provider === "local") {
      // Extract path from URL
      const relativePath = url.replace(/^\/uploads\//, "");
      const fullPath = join(
        process.cwd(),
        UPLOAD_CONFIG.uploadDir,
        relativePath
      );
      await unlink(fullPath);
    }
    // TODO: Implement S3/Cloudinary deletion when needed

    return true;
  } catch (error) {
    console.error("Delete error:", error);
    return false;
  }
}

/**
 * Get upload URL for client-side direct uploads (presigned URLs)
 * Useful for large files or direct browser-to-storage uploads
 */
export async function getPresignedUploadUrl(
  fileName: string,
  mimeType: string,
  folder: string = "general"
): Promise<{ uploadUrl: string; publicUrl: string } | null> {
  const provider = getStorageProvider();

  if (provider === "s3") {
    // TODO: Generate presigned URL for S3
    // const s3 = new S3Client({ region: process.env.AWS_REGION });
    // const key = `${folder}/${generateFileName(fileName)}`;
    // const command = new PutObjectCommand({
    //   Bucket: process.env.AWS_S3_BUCKET,
    //   Key: key,
    //   ContentType: mimeType,
    // });
    // const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    // const publicUrl = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`;
    // return { uploadUrl, publicUrl };
  }

  // Local storage doesn't support presigned URLs
  return null;
}
