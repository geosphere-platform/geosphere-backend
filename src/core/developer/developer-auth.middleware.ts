/**
 * Phase 15 — Developer Auth & API Authorization Middleware / Guard
 *
 * Enforces API Key verification, environment matching, tenant boundary validation,
 * CORS origin checks, API scope enforcement, rate limits, and usage metering.
 */

import { NextRequest, NextResponse } from "next/server";
import { apiKeyService } from "./api-key.service";
import { applicationService } from "./application.service";
import { entitlementService } from "../subscription/entitlement.service";
import { usageService } from "../subscription/usage.service";
import {
  ApiKeyRow,
  ApplicationRow,
} from "../../database/schema/developer-portal";

export interface DeveloperRequestContext {
  organizationId: string;
  workspaceId: string | null;
  applicationId: string;
  environment: string;
  clientId: string;
  authenticationMethod: "API_KEY" | "CLIENT_SECRET" | "USER_TOKEN";
  grantedScopes: string[];
  sdkName?: string;
  sdkVersion?: string;
  apiKeyRecord?: ApiKeyRow;
  applicationRecord?: ApplicationRow;
}

export interface DeveloperAuthOptions {
  requiredScope?: string;
  requiredEnvironment?: string;
  allowLocalhostInDev?: boolean;
}

// In-memory rate limiting counter store (per application/minute)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export class DeveloperAuthMiddleware {
  /**
   * Authenticate incoming HTTP request using X-API-Key or Authorization Bearer header
   */
  async authenticateRequest(
    req: NextRequest | Request,
    options?: DeveloperAuthOptions,
  ): Promise<
    | { success: true; context: DeveloperRequestContext }
    | {
        success: false;
        status: number;
        error: string;
        code: string;
        headers?: Record<string, string>;
      }
  > {
    // 1. Extract API Key header
    const apiKeyHeader =
      req.headers.get("x-api-key") ||
      this.extractBearerToken(req.headers.get("authorization"));

    if (!apiKeyHeader) {
      return {
        success: false,
        status: 401,
        code: "INVALID_CREDENTIAL",
        error:
          "Missing API Key. Provide 'X-API-Key' header or 'Authorization: Bearer <key>'.",
      };
    }

    // 2. Verify API Key cryptographic hash & status
    const verifyResult = await apiKeyService.verifyApiKey(apiKeyHeader);
    if (
      !verifyResult.isValid ||
      !verifyResult.apiKey ||
      !verifyResult.application
    ) {
      const code = verifyResult.reason || "INVALID_CREDENTIAL";
      const status = code === "APPLICATION_SUSPENDED" ? 403 : 401;
      return {
        success: false,
        status,
        code,
        error: `Authentication failed: ${code}`,
      };
    }

    const key = verifyResult.apiKey;
    const app = verifyResult.application;

    // 3. Environment matching check
    if (
      options?.requiredEnvironment &&
      key.environment !== options.requiredEnvironment
    ) {
      return {
        success: false,
        status: 403,
        code: "ENVIRONMENT_MISMATCH",
        error: `Credential environment '${key.environment}' cannot access '${options.requiredEnvironment}' resources`,
      };
    }

    // 4. CORS Allowed Origins Validation
    const origin = req.headers.get("origin");
    if (origin && app.type === "WEB") {
      const isOriginAllowed = this.validateOrigin(
        origin,
        app.allowedOrigins as string[],
        app.environment,
        options?.allowLocalhostInDev ?? true,
      );

      if (!isOriginAllowed) {
        return {
          success: false,
          status: 403,
          code: "ORIGIN_NOT_ALLOWED",
          error: `Origin '${origin}' is not allowed for application '${app.name}'`,
        };
      }
    }

    // 5. Subscription Status Check
    const subEntitlements = await entitlementService.getEffectiveEntitlements(
      app.organizationId,
    );

    const isSubActive =
      subEntitlements.hasActiveSubscription ||
      subEntitlements.subscriptionStatus === "ACTIVE" ||
      subEntitlements.subscriptionStatus === "TRIALING";

    if (!isSubActive) {
      return {
        success: false,
        status: 403,
        code: "SUBSCRIPTION_SUSPENDED",
        error: `Organization subscription status '${subEntitlements.subscriptionStatus}' blocks API access`,
      };
    }

    // 6. Fetch Application Details to resolve granted API scopes
    const appDetails = await applicationService.getApplicationDetails(
      app.id,
      app.organizationId,
    );

    // 7. API Scope Check
    if (options?.requiredScope) {
      const hasScope = appDetails.grantedScopes.includes(options.requiredScope);
      if (!hasScope) {
        return {
          success: false,
          status: 403,
          code: "SCOPE_REQUIRED",
          error: `Application lacks required API scope '${options.requiredScope}'`,
        };
      }
    }

    // 8. Rate Limiting Check (requests / minute)
    const rateLimitMax = app.environment === "PRODUCTION" ? 10000 : 1000;
    const now = Date.now();
    const windowMs = 60 * 1000;
    const storeKey = `${app.id}:${Math.floor(now / windowMs)}`;

    const currentRate = rateLimitStore.get(storeKey) ?? {
      count: 0,
      resetAt: now + windowMs,
    };
    if (currentRate.count >= rateLimitMax) {
      const retryAfterSec = Math.ceil((currentRate.resetAt - now) / 1000);
      return {
        success: false,
        status: 429,
        code: "RATE_LIMIT_EXCEEDED",
        error: "Application rate limit exceeded",
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(rateLimitMax),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(currentRate.resetAt / 1000)),
        },
      };
    }

    currentRate.count += 1;
    rateLimitStore.set(storeKey, currentRate);

    // Clean up old entries
    if (rateLimitStore.size > 5000) {
      for (const [k, v] of rateLimitStore.entries()) {
        if (v.resetAt < now) rateLimitStore.delete(k);
      }
    }

    // 9. Metering & Usage Recording (Async)
    const sdkName = req.headers.get("x-sdk-name") ?? undefined;
    const sdkVersion = req.headers.get("x-sdk-version") ?? undefined;

    usageService
      ?.recordUsage(app.organizationId, "API_REQUESTS", 1)
      ?.catch((err) =>
        console.error("Failed to record API request usage meter:", err),
      );

    return {
      success: true,
      context: {
        organizationId: app.organizationId,
        workspaceId: app.workspaceId,
        applicationId: app.id,
        environment: key.environment,
        clientId: app.clientId,
        authenticationMethod: "API_KEY",
        grantedScopes: appDetails.grantedScopes,
        sdkName,
        sdkVersion,
        apiKeyRecord: key,
        applicationRecord: app,
      },
    };
  }

  /**
   * Helper to extract Bearer token from header
   */
  private extractBearerToken(authHeader: string | null): string | null {
    if (!authHeader) return null;
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      return parts[1];
    }
    return null;
  }

  /**
   * Validate CORS Origin
   */

  private validateOrigin(
    origin: string,
    allowedOrigins: string[],
    environment: string,
    allowLocalhostInDev: boolean,
  ): boolean {
    if (allowedOrigins.includes("*")) return true;
    if (allowedOrigins.includes(origin)) return true;

    if (
      environment === "DEVELOPMENT" &&
      allowLocalhostInDev &&
      (origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:"))
    ) {
      return true;
    }

    return false;
  }
}

export const developerAuthMiddleware = new DeveloperAuthMiddleware();
