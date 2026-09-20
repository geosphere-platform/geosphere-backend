import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "./core/auth/jwt";
import { extractBearerToken } from "./core/auth/session";
import { rateLimiter } from "./core/rate-limit/rate-limiter";
import { env } from "./core/config/env";
// Note: Web Crypto API (globalThis.crypto) is used instead of Node.js crypto
// because Next.js middleware runs in the Edge Runtime.

// Public endpoints that bypass global JWT middleware check
const PUBLIC_PATHS = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/refresh",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
  "/api/v1/auth/verify-email",
  "/api/v1/telemetry/gps",
  "/api/v1/openapi",
  "/openapi.json",
  "/api/health",
  "/api/metrics",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Correlation ID propagation
  const correlationId =
    request.headers.get("x-correlation-id") ||
    request.headers.get("x-request-id") ||
    `req_${Date.now()}_${Array.from(
      globalThis.crypto.getRandomValues(new Uint8Array(4)),
    )
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}`;

  // Rate Limiting Check
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const apiKey = request.headers.get("x-api-key");
  const rateLimitKey = apiKey ? `api_key:${apiKey}` : `ip:${clientIp}`;

  const rlResult = rateLimiter.consume({ key: rateLimitKey });

  if (!rlResult.allowed) {
    const res = NextResponse.json(
      {
        success: false,
        error: {
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded. Please retry after window reset.",
        },
      },
      { status: 429 },
    );
    applySecurityHeaders(res, correlationId, rlResult);
    return res;
  }

  // Handle CORS Preflight
  if (request.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    applyCorsHeaders(res, request);
    applySecurityHeaders(res, correlationId, rlResult);
    return res;
  }

  // Only protect API routes under /api/v1/
  if (!pathname.startsWith("/api/v1/")) {
    const res = NextResponse.next();
    applySecurityHeaders(res, correlationId, rlResult);
    return res;
  }

  // Allow public endpoints
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    const res = NextResponse.next();
    applyCorsHeaders(res, request);
    applySecurityHeaders(res, correlationId, rlResult);
    return res;
  }

  const token = extractBearerToken(request);
  if (!token) {
    const res = NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Missing authorization token header",
        },
      },
      { status: 401 },
    );
    applySecurityHeaders(res, correlationId, rlResult);
    return res;
  }

  try {
    const payload = await verifyAccessToken(token);

    // Forward request with injected user context headers & correlation ID
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-correlation-id", correlationId);
    requestHeaders.set("x-user-id", payload.sub);
    requestHeaders.set("x-user-role", payload.role);
    if (payload.orgId) {
      requestHeaders.set("x-user-org-id", payload.orgId);
    }
    requestHeaders.set("Authorization", `Bearer ${token}`);

    const res = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    applyCorsHeaders(res, request);
    applySecurityHeaders(res, correlationId, rlResult);
    return res;
  } catch (err) {
    const res = NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: err instanceof Error ? err.message : "Invalid token",
        },
      },
      { status: 401 },
    );
    applySecurityHeaders(res, correlationId, rlResult);
    return res;
  }
}

function applySecurityHeaders(
  res: NextResponse,
  correlationId: string,
  rlResult: any,
) {
  res.headers.set("X-Correlation-ID", correlationId);
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: ws: wss:;",
  );

  // Rate Limiting Headers
  if (rlResult) {
    res.headers.set("X-RateLimit-Limit", String(rlResult.limit));
    res.headers.set("X-RateLimit-Remaining", String(rlResult.remaining));
    res.headers.set(
      "X-RateLimit-Reset",
      String(Math.ceil(rlResult.resetTimeMs / 1000)),
    );
  }
}

function applyCorsHeaders(res: NextResponse, request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowedOrigins = (env.CORS_ALLOWED_ORIGINS ?? "*").split(",");

  if (
    origin &&
    (allowedOrigins.includes("*") || allowedOrigins.includes(origin))
  ) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  } else {
    res.headers.set("Access-Control-Allow-Origin", allowedOrigins[0] || "*");
  }

  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, X-Api-Key, X-Correlation-ID, X-Tenant-ID, X-Organization-ID, X-Workspace-ID",
  );
}

export const config = {
  matcher: ["/api/:path*"],
};
