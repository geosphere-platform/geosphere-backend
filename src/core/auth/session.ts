/**
 * Session / Cookie Management
 *
 * OWASP Compliance:
 * - Refresh token stored in HttpOnly cookie (JavaScript cannot access it → XSS-safe)
 * - Access token stored in cookie (lax, path /) for seamless Next.js API & UI routing
 * - Secure flag: only sent over HTTPS in production
 * - SameSite=Strict / Lax CSRF protection
 */

import { NextRequest, NextResponse } from "next/server";
import { AUTH_CONSTANTS } from "../constants";

const REFRESH_COOKIE_NAME = AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE_NAME;
const ACCESS_COOKIE_NAME = "gis_access_token";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// ─── Set Cookies ──────────────────────────────────────────────────────────────

/**
 * Sets the refresh token in an HttpOnly cookie on the response.
 */
export function setRefreshTokenCookie(
  response: NextResponse,
  token: string,
): void {
  response.cookies.set(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "strict",
    path: "/api/v1/auth",
    maxAge: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRES_MS / 1000, // in seconds
  });
}

/**
 * Sets the access token cookie on the response for seamless Next.js route access.
 */
export function setAccessTokenCookie(
  response: NextResponse,
  token: string,
): void {
  response.cookies.set(ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60, // 15 minutes in seconds
  });
}

// ─── Clear Cookies ────────────────────────────────────────────────────────────

/**
 * Clears all auth cookies — used on logout.
 */
export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set(REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "strict",
    path: "/api/v1/auth",
    maxAge: 0,
  });

  response.cookies.set(ACCESS_COOKIE_NAME, "", {
    httpOnly: false,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

// ─── Read Cookies ─────────────────────────────────────────────────────────────

export function getRefreshTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get(REFRESH_COOKIE_NAME)?.value ?? null;
}

export function getAccessTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get(ACCESS_COOKIE_NAME)?.value ?? null;
}

// ─── Extract Bearer Token ─────────────────────────────────────────────────────

/**
 * Extracts the Bearer token from the Authorization header or fallback access token cookie.
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token.length > 0) return token;
  }

  // Fallback to access token cookie
  const cookieToken = request.cookies?.get(ACCESS_COOKIE_NAME)?.value;
  if (cookieToken && cookieToken.trim().length > 0) {
    return cookieToken.trim();
  }

  // Fallback to query parameter token (used by browser EventSource / WebSocket)
  const queryToken = request.nextUrl?.searchParams?.get("token");
  if (queryToken && queryToken.trim().length > 0) {
    return queryToken.trim();
  }

  return null;
}
