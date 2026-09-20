/**
 * GET    /api/v1/subscriptions/plans/[id] - Get plan by ID
 * PATCH  /api/v1/subscriptions/plans/[id] - Update plan (platform admin)
 * DELETE /api/v1/subscriptions/plans/[id] - Archive plan (platform admin)
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, withPermission, AuthContext } from "@/core/auth/guards";
import { planService } from "@/core/subscription/plan.service";
import { PERMISSIONS } from "@/core/constants";
import { auditLogsTable } from "@/database/schema";
import { db } from "@/database";

export const GET = withAuth(
  async (ctx: AuthContext, context?: Record<string, unknown>) => {
    const id = (context?.params as Record<string, string>)?.id;
    const plan = await planService.getPlan(id);
    const features = await planService.getPlanFeatures(id);
    const limits = await planService.getPlanLimits(id);
    return ApiResponse.success({ ...plan, features, limits });
  },
);

export const PATCH = withAuth(
  withPermission(PERMISSIONS.PLAN_MANAGE)(
    async (ctx: AuthContext, context?: Record<string, unknown>) => {
      const id = (context?.params as Record<string, string>)?.id;
      const body = await ctx.request.json();
      const plan = await planService.updatePlan(id, body);

      await db.insert(auditLogsTable).values({
        userId: ctx.user.sub,
        action: "plan.updated",
        entityType: "plan",
        entityId: id,
        metadata: body,
      });

      return ApiResponse.success(plan);
    },
  ),
);

export const DELETE = withAuth(
  withPermission(PERMISSIONS.PLAN_MANAGE)(
    async (ctx: AuthContext, context?: Record<string, unknown>) => {
      const id = (context?.params as Record<string, string>)?.id;
      const plan = await planService.archivePlan(id);

      await db.insert(auditLogsTable).values({
        userId: ctx.user.sub,
        action: "plan.archived",
        entityType: "plan",
        entityId: id,
        metadata: { code: plan.code },
      });

      return ApiResponse.success(plan);
    },
  ),
);
