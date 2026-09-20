/**
 * Password hashing and strength validation.
 *
 * OWASP Compliance:
 * - A02: bcrypt with cost factor 12 (OWASP minimum is 10; 12 is recommended for 2025)
 * - A07: Strong password policy enforced via Zod schema
 * - Never log, store, or transmit plaintext passwords
 */

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { z } from "zod";
import { AUTH_CONSTANTS } from "../constants";

// ─── Password Strength Schema (OWASP compliant) ───────────────────────────────

export const passwordStrengthSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password must not exceed 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

// ─── Hash & Verify ────────────────────────────────────────────────────────────

/**
 * Hash a plaintext password using bcrypt.
 * Cost factor 12 provides ~400ms hashing time on modern hardware —
 * sufficient to slow brute-force attacks without impacting UX.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, AUTH_CONSTANTS.BCRYPT_COST_FACTOR);
}

/**
 * Verify a plaintext password against a stored bcrypt hash.
 * Uses constant-time comparison to prevent timing attacks.
 */
export async function verifyPassword(
  plaintext: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

/**
 * Validate password strength using OWASP-compliant rules.
 * Returns parsed value or throws ZodError.
 */
export function validatePasswordStrength(password: string): string {
  return passwordStrengthSchema.parse(password);
}

/**
 * Generate a cryptographically secure random token for
 * email verification and password reset flows.
 * Returns a 64-character hex string (256-bit entropy).
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}
