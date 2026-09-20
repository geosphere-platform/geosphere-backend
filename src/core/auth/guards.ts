/**
 * Auth Guards — Higher-Order Functions for Route Handler Protection.
 *
 * These are composable wrappers for Next.js Route Handlers that enforce:
 * - Authentication (valid access token)
 * - Role-based access control
 * - Permission-based access control
 *
 * Pattern: withAuth(withPermission("vehicle:read")(handler))
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, AccessTokenPayload } from "./jwt";
import { hasPermission, hasAnyPermission } from "./permissions";
import { extractBearerToken } from "./session";
import { ApiResponse } from "../http/api-response";
import { UnauthorizedError, ForbiddenError } from "../errors/errors";
import { Permission, UserRole } from "../constants";

// The typed context passed to guarded route handlers
export interface AuthContext {
  user: AccessTokenPayload;
  request: NextRequest;
}

type RouteHandler = (
  req: NextRequest,
  context?: Record<string, unknown>,
) => Promise<NextResponse>;

type GuardedHandler = (
  ctx: AuthContext,
  context?: Record<string, unknown>,
) => Promise<NextResponse>;

// ─── withAuth ─────────────────────────────────────────────────────────────────

/**
 * Requires a valid JWT access token in the Authorization: Bearer header.
 * Injects the decoded user payload into the handler context.
 */
export function withAuth(handler: GuardedHandler): RouteHandler {
  return async (req, context) => {
    try {
      const token = extractBearerToken(req);
      if (!token) throw new UnauthorizedError("Missing authorization token");

      const user = await verifyAccessToken(token);
      return handler({ user, request: req }, context);
    } catch (err) {
      return ApiResponse.handle(err);
    }
  };
}

// ─── withRole ────────────────────────────────────────────────────────────────

/**
 * Requires the authenticated user to have one of the allowed roles.
 * Must be composed with withAuth.
 */
export function withRole(...allowedRoles: UserRole[]) {
  return function (handler: GuardedHandler): GuardedHandler {
    return async (ctx, context) => {
      if (!allowedRoles.includes(ctx.user.role)) {
        return ApiResponse.handle(
          new ForbiddenError(
            `Role '${ctx.user.role}' is not permitted for this action`,
          ),
        );
      }
      return handler(ctx, context);
    };
  };
}

// ─── withPermission ───────────────────────────────────────────────────────────

/**
 * Requires the authenticated user's role to have the specified permission.
 * This is the preferred guard — always prefer permissions over raw role checks.
 */
export function withPermission(permission: Permission) {
  return function (handler: GuardedHandler): GuardedHandler {
    return async (ctx, context) => {
      if (!hasPermission(ctx.user.role, permission)) {
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

// ─── withAnyPermission ────────────────────────────────────────────────────────

/**
 * Requires the user's role to have at least ONE of the specified permissions.
 */
export function withAnyPermission(permissions: Permission[]) {
  return function (handler: GuardedHandler): GuardedHandler {
    return async (ctx, context) => {
      if (!hasAnyPermission(ctx.user.role, permissions)) {
        return ApiResponse.handle(
          new ForbiddenError("Insufficient permissions for this action"),
        );
      }
      return handler(ctx, context);
    };
  };
}
