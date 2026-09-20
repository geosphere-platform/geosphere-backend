/**
 * GET    /api/v1/subscriptions/plans/[id]/features - Get plan features
 * POST   /api/v1/subscriptions/plans/[id]/features - Add feature to plan
 * DELETE /api/v1/subscriptions/plans/[id]/features - Remove feature from plan
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, withPermission, AuthContext } from "@/core/auth/guards";
import { planService } from "@/core/subscription/plan.service";
import { PERMISSIONS } from "@/core/constants";

export const GET = withAuth(
  async (ctx: AuthContext, context?: Record<string, unknown>) => {
    const id = (context?.params as Record<string, string>)?.id;
    const features = await planService.getPlanFeatures(id);
    return ApiResponse.success(features);
  },
);

export const POST = withAuth(
  withPermission(PERMISSIONS.PLAN_MANAGE)(
    async (ctx: AuthContext, context?: Record<string, unknown>) => {
      const id = (context?.params as Record<string, string>)?.id;
      const { featureCode, isEnabled } = await ctx.request.json();
      const result = await planService.addFeatureToPlan(
        id,
        featureCode,
        isEnabled !== false,
      );
      return ApiResponse.success(result, 201);
    },
  ),
);

export const DELETE = withAuth(
  withPermission(PERMISSIONS.PLAN_MANAGE)(
    async (ctx: AuthContext, context?: Record<string, unknown>) => {
      const id = (context?.params as Record<string, string>)?.id;
      const { featureCode } = await ctx.request.json();
      await planService.removeFeatureFromPlan(id, featureCode);
      return ApiResponse.success({ removed: true });
    },
  ),
);
