/**
 * GET /api/v1/usage/[metric]
 * Returns usage count for a specific metric.
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, withPermission, AuthContext } from "@/core/auth/guards";
import { usageService } from "@/core/subscription/usage.service";
import { PERMISSIONS } from "@/core/constants";

export const GET = withAuth(
  withPermission(PERMISSIONS.USAGE_READ)(
    async (ctx: AuthContext, context?: Record<string, unknown>) => {
      const metric = (context?.params as Record<string, string>)?.metric;
      const organizationId = ctx.user.orgId;

      if (!organizationId) {
        return ApiResponse.error(
          "Organization context required",
          400,
          "BAD_REQUEST",
        );
      }

      const count = await usageService.getCountFromSource(
        organizationId,
        metric.toUpperCase(),
      );

      return ApiResponse.success({
        metric: metric.toUpperCase(),
        organizationId,
        count,
      });
    },
  ),
);
