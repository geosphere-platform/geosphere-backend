/**
 * GET    /api/v1/subscriptions/features/[code] - Get feature by code
 * PATCH  /api/v1/subscriptions/features/[code] - Update feature
 * DELETE /api/v1/subscriptions/features/[code] - Archive feature
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, withPermission, AuthContext } from "@/core/auth/guards";
import { featureService } from "@/core/subscription/feature.service";
import { PERMISSIONS } from "@/core/constants";

export const GET = withAuth(
  async (ctx: AuthContext, context?: Record<string, unknown>) => {
    const code = (context?.params as Record<string, string>)?.code;
    const feature = await featureService.getFeature(code);
    return ApiResponse.success(feature);
  },
);

export const PATCH = withAuth(
  withPermission(PERMISSIONS.PLAN_MANAGE)(
    async (ctx: AuthContext, context?: Record<string, unknown>) => {
      const code = (context?.params as Record<string, string>)?.code;
      const body = await ctx.request.json();
      const feature = await featureService.updateFeature(code, body);
      return ApiResponse.success(feature);
    },
  ),
);

export const DELETE = withAuth(
  withPermission(PERMISSIONS.PLAN_MANAGE)(
    async (ctx: AuthContext, context?: Record<string, unknown>) => {
      const code = (context?.params as Record<string, string>)?.code;
      const feature = await featureService.archiveFeature(code);
      return ApiResponse.success(feature);
    },
  ),
);
