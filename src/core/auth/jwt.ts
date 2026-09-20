/**
 * JWT Utility — Sign and Verify Access and Refresh Tokens.
 * Edge Runtime & Node.js Runtime Compatible (using 'jose' Web Crypto).
 *
 * OWASP Compliance:
 * - Access tokens: 15-minute TTL (short-lived to limit blast radius)
 * - Refresh tokens: 7-day TTL stored server-side (revocable)
 * - Token payload contains only non-sensitive identifiers (userId, role)
 * - Never embed passwords, full PII, or permissions in JWT payload
 */

import { SignJWT, jwtVerify, decodeJwt, errors } from "jose";
import { env } from "../config/env";
import { UserRole } from "../constants";
import { UnauthorizedError } from "../errors/errors";

export interface AccessTokenPayload {
  sub: string; // userId
  role: UserRole;
  orgId: string | null;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string; // userId
  family: string; // token family UUID for rotation chain detection
  type: "refresh";
}

const getAccessSecret = () => {
  const secret = env.JWT_SECRET;
  if (!secret || secret.trim().length < 16) {
    throw new Error(
      "CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing or insecure (min 16 characters required).",
    );
  }
  return new TextEncoder().encode(secret);
};

const getRefreshSecret = () => {
  const secret = env.JWT_SECRET;
  if (!secret || secret.trim().length < 16) {
    throw new Error(
      "CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing or insecure (min 16 characters required).",
    );
  }
  return new TextEncoder().encode(`${secret}_refresh`);
};

// ─── Sign ─────────────────────────────────────────────────────────────────────

export async function signAccessToken(
  payload: Omit<AccessTokenPayload, "type">,
): Promise<string> {
  return await new SignJWT({ ...payload, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .setIssuer("geosphere-platform")
    .setAudience("gis-web-client")
    .sign(getAccessSecret());
}

export async function signRefreshToken(
  payload: Omit<RefreshTokenPayload, "type">,
): Promise<string> {
  return await new SignJWT({ ...payload, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setIssuer("geosphere-platform")
    .setAudience("gis-web-client")
    .sign(getRefreshSecret());
}

// ─── Verify ───────────────────────────────────────────────────────────────────

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, getAccessSecret(), {
      issuer: "geosphere-platform",
      audience: "gis-web-client",
    });

    if (payload.type !== "access") {
      throw new UnauthorizedError("Invalid token type");
    }
    return payload as unknown as AccessTokenPayload;
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    if (err instanceof errors.JWTExpired) {
      throw new UnauthorizedError("Access token has expired");
    }
    throw new UnauthorizedError("Invalid or malformed access token");
  }
}

export async function verifyRefreshToken(
  token: string,
): Promise<RefreshTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, getRefreshSecret(), {
      issuer: "geosphere-platform",
      audience: "gis-web-client",
    });

    if (payload.type !== "refresh") {
      throw new UnauthorizedError("Invalid token type");
    }
    return payload as unknown as RefreshTokenPayload;
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    if (err instanceof errors.JWTExpired) {
      throw new UnauthorizedError("Refresh token has expired");
    }
    throw new UnauthorizedError("Invalid or malformed refresh token");
  }
}

/**
 * Decode a JWT without verifying the signature.
 * Used ONLY for logging/debugging expired tokens — never for authorization.
 */
export function decodeTokenUnsafe(
  token: string,
): Record<string, unknown> | null {
  try {
    return decodeJwt(token) as Record<string, unknown>;
  } catch {
    return null;
  }
}
