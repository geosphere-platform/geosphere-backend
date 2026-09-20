/**
 * Phase 13 — Entitlement Guards
 *
 * Reusable higher-order function guards for entitlement enforcement.
 * Follows the existing withAuth/withPermission pattern in core/auth/guards.ts.
 *
 * These guards compose with the existing auth pipeline:
 *   withAuth(
 *     withPermission("gis:realtime:subscribe")(
 *       withFeature("REALTIME")(
 *         handler
 *       )
 *     )
 *   )
 *
 * Authorization pipeline (per spec section 27):
 *   Authentication
 *     ↓
 *   Tenant Context
 *     ↓
 *   RBAC (withPermission)
 *     ↓
 *   Entitlement (withFeature / withLimit / withEntitlement)
 *     ↓
 *   Business Operation
 *
 * IMPORTANT: These guards use the organizationId from the JWT payload (orgId).
 * Platform admins bypass entitlement checks (same as tenant isolation bypass).
 *
 * Security: Subscription state is NEVER trusted from frontend headers.
 * The backend resolves entitlements from the database.
 */

import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "../http/api-response";
import { entitlementService } from "./entitlement.service";
import {
  FeatureNotAvailableError,
  EntitlementLimitExceededError,
} from "./errors";
import type { AuthContext } from "../auth/guards";

type GuardedHandler = (
  ctx: AuthContext,
  context?: Record<string, unknown>,
) => Promise<NextResponse>;

// ─── withFeature ──────────────────────────────────────────────────────────────

/**
 * Requires the organization to have a specific feature enabled.
 *
 * Usage:
 *   withAuth(withFeature("REALTIME")(handler))
 *
 * Bypass: PLATFORM_ADMIN and SUPER_ADMIN roles bypass this check.
 *
 * @param featureCode - The feature code to check (e.g., "REALTIME")
 */
export function withFeature(featureCode: string) {
  return function (handler: GuardedHandler): GuardedHandler {
    return async (ctx, context) => {
      try {
        // Platform admins bypass entitlement checks
        if (
          ctx.user.role === "PLATFORM_ADMIN" ||
          ctx.user.role === "SUPER_ADMIN"
        ) {
          return handler(ctx, context);
        }

        const organizationId = ctx.user.orgId;
        if (!organizationId) {
          return ApiResponse.error(
            "Organization context is required for entitlement check",
            403,
            "SUBSCRIPTION_REQUIRED",
          );
        }

        const result = await entitlementService.checkFeature(
          organizationId,
          featureCode,
        );

        if (!result.allowed) {
          return ApiResponse.handle(
            new FeatureNotAvailableError(
              featureCode,
              organizationId,
              result.planCode,
              `Feature '${featureCode}' is not available on your current plan (${result.planCode ?? "None"})`,
            ),
          );
        }

        return handler(ctx, context);
      } catch (err) {
        return ApiResponse.handle(err);
      }
    };
  };
}

// ─── withLimit ────────────────────────────────────────────────────────────────

/**
 * Requires the organization to have sufficient quota for a resource.
 *
 * Usage:
 *   withAuth(withLimit("MAX_LAYERS", 1)(handler))
 *
 * Bypass: PLATFORM_ADMIN and SUPER_ADMIN roles bypass this check.
 *
 * @param metricCode - The limit metric to check (e.g., "MAX_LAYERS")
 * @param requestedAmount - Amount being requested (default: 1)
 */
export function withLimit(metricCode: string, requestedAmount = 1) {
  return function (handler: GuardedHandler): GuardedHandler {
    return async (ctx, context) => {
      try {
        // Platform admins bypass entitlement checks
        if (
          ctx.user.role === "PLATFORM_ADMIN" ||
          ctx.user.role === "SUPER_ADMIN"
        ) {
          return handler(ctx, context);
        }

        const organizationId = ctx.user.orgId;
        if (!organizationId) {
          return ApiResponse.error(
            "Organization context is required for entitlement check",
            403,
            "SUBSCRIPTION_REQUIRED",
          );
        }

        const result = await entitlementService.checkLimit(
          organizationId,
          metricCode,
          requestedAmount,
        );

        if (!result.allowed) {
          return ApiResponse.handle(
            new EntitlementLimitExceededError(
              metricCode,
              result.currentUsage,
              result.limit,
              requestedAmount,
            ),
          );
        }

        return handler(ctx, context);
      } catch (err) {
        return ApiResponse.handle(err);
      }
    };
  };
}

// ─── withEntitlement ─────────────────────────────────────────────────────────

/**
 * Combined feature + optional limit check guard.
 *
 * Usage:
 *   withAuth(withEntitlement("REALTIME", "MAX_REALTIME_CONNECTIONS", 1)(handler))
 *
 * Checks feature first, then limit. Both must pass.
 *
 * @param featureCode - Required feature
 * @param metricCode - Optional limit metric to also check
 * @param requestedAmount - Amount for limit check (default: 1)
 */
export function withEntitlement(
  featureCode: string,
  metricCode?: string,
  requestedAmount = 1,
) {
  return function (handler: GuardedHandler): GuardedHandler {
    // Apply feature check, then optional limit check
    if (metricCode) {
      return withFeature(featureCode)(
        withLimit(metricCode, requestedAmount)(handler),
      );
    }
    return withFeature(featureCode)(handler);
  };
}
