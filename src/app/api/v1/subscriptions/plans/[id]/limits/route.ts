/**
 * GET  /api/v1/subscriptions/plans/[id]/limits - Get plan limits
 * POST /api/v1/subscriptions/plans/[id]/limits - Set/update a plan limit
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, withPermission, AuthContext } from "@/core/auth/guards";
import { planService } from "@/core/subscription/plan.service";
import { PERMISSIONS } from "@/core/constants";

export const GET = withAuth(
  async (ctx: AuthContext, context?: Record<string, unknown>) => {
    const id = (context?.params as Record<string, string>)?.id;
    const limits = await planService.getPlanLimits(id);
    return ApiResponse.success(limits);
  },
);

export const POST = withAuth(
  withPermission(PERMISSIONS.PLAN_MANAGE)(
    async (ctx: AuthContext, context?: Record<string, unknown>) => {
      const id = (context?.params as Record<string, string>)?.id;
      const body = await ctx.request.json();
      const result = await planService.setPlanLimit(id, body);
      return ApiResponse.success(result);
    },
  ),
);
