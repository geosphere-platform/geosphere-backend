/**
 * Phase 12 — Multi-Tenant SaaS Tenant Guard Wrapper
 *
 * Route guard wrapper that extracts JWT user context, resolves active Organization
 * & Workspace TenantContext, validates user membership, and injects context into handlers.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "../auth/jwt";
import { extractBearerToken } from "../auth/session";
import { TenantContext, TenantContextService } from "./tenant-context";
import { ApiResponse } from "../http/api-response";
import { UnauthorizedError, ForbiddenError } from "../errors/errors";
import { Permission, UserRole } from "../constants";
import { hasPermission } from "../auth/permissions";

export interface GuardedTenantHandlerContext {
  tenant: TenantContext;
  request: NextRequest;
}

type RouteHandler = (
  req: NextRequest,
  context?: Record<string, unknown>,
) => Promise<NextResponse>;

type GuardedTenantHandler = (
  ctx: GuardedTenantHandlerContext,
  context?: Record<string, unknown>,
) => Promise<NextResponse>;

/**
 * Higher-order guard that enforces JWT authentication + TenantContext resolution.
 */
export function withTenantContext(handler: GuardedTenantHandler): RouteHandler {
  return async (req, context) => {
    try {
      const token = extractBearerToken(req);
      if (!token) throw new UnauthorizedError("Missing authorization token");

      const userPayload = await verifyAccessToken(token);
      const tenantContext = await TenantContextService.resolveTenantContext(
        userPayload.sub,
        userPayload.role as UserRole,
        req,
      );

      return handler({ tenant: tenantContext, request: req }, context);
    } catch (err) {
      return ApiResponse.handle(err);
    }
  };
}

/**
 * Requires a specific tenant permission within the resolved TenantContext.
 */
export function withTenantPermission(permission: Permission) {
  return function (handler: GuardedTenantHandler): GuardedTenantHandler {
    return async (ctx, context) => {
      const effectiveRole =
        (ctx.tenant.membership.role as UserRole) || ctx.tenant.userRole;

      if (
        !hasPermission(effectiveRole, permission) &&
        !ctx.tenant.isPlatformAdmin
      ) {
        return ApiResponse.handle(
          new ForbiddenError(
            `Permission '${permission}' is required for this action`,
          ),
        );
      }
      return handler(ctx, context);
    };
  };
}
