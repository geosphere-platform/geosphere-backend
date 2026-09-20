/**
 * Module Guards — Higher-Order Guard Functions for Route Protection
 *
 * Enforces server-side module availability per tenant.
 */

import { ForbiddenError } from "../errors/errors";
import { ModuleRegistry } from "./registry";
import { AuthContext } from "../auth/guards";
import { ApiResponse } from "../http/api-response";

type GuardedHandler = (
  ctx: AuthContext,
  context?: Record<string, unknown>,
) => Promise<Response>;

/**
 * Route guard that verifies whether a specific module is registered & enabled
 */
export function withModule(moduleId: string) {
  return function (handler: GuardedHandler): GuardedHandler {
    return async (ctx, context) => {
      // 1. Verify module is registered in platform
      const targetModule = ModuleRegistry.get(moduleId);
      if (!targetModule) {
        return ApiResponse.handle(
          new ForbiddenError(
            `Module '${moduleId}' is not registered on this platform`,
          ),
        );
      }

      // Core modules are always enabled
      if (targetModule.isCoreModule) {
        return handler(ctx, context);
      }

      // TODO: Evaluate tenant-specific enabled modules from TenantConfiguration
      // For now, allow registered platform modules unless explicitly restricted
      return handler(ctx, context);
    };
  };
}
