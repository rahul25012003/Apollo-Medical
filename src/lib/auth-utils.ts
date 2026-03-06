import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a 6-digit OTP code (Edge Runtime compatible)
 */
export function generateOTP(): string {
  // Use crypto.getRandomValues for Edge Runtime compatibility
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const otp = 100000 + (array[0] % 900000);
  return otp.toString();
}

/**
 * Generate OTP expiry time (default: 10 minutes)
 */
export function getOTPExpiry(minutes: number = 10): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Generate a unique certificate code
 */
export function generateCertificateCode(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ICMS-${timestamp}-${random}`.toUpperCase();
}

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a unique slug with random suffix
 */
export function generateUniqueSlug(text: string): string {
  const baseSlug = generateSlug(text);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${baseSlug}-${suffix}`;
}
