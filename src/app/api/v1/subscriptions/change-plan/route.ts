/**
 * POST /api/v1/subscriptions/change-plan
 * Platform admin: Upgrade or downgrade an organization's plan.
 * Returns downgrade warnings if usage exceeds new plan limits.
 * Existing resources are NEVER deleted on downgrade.
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, withPermission, AuthContext } from "@/core/auth/guards";
import { subscriptionService } from "@/core/subscription/subscription.service";
import { PERMISSIONS } from "@/core/constants";
import { auditLogsTable } from "@/database/schema";
import { db } from "@/database";

export const POST = withAuth(
  withPermission(PERMISSIONS.SUBSCRIPTION_MANAGE)(async (ctx: AuthContext) => {
    const body = await ctx.request.json();
    const { organizationId, newPlanId, forceDowngrade } = body;

    if (!organizationId || !newPlanId) {
      return ApiResponse.error(
        "organizationId and newPlanId are required",
        400,
        "BAD_REQUEST",
      );
    }

    const { subscription, downgradeWarnings } =
      await subscriptionService.changePlan({
        organizationId,
        newPlanId,
        forceDowngrade: forceDowngrade === true,
      });

    await db.insert(auditLogsTable).values({
      userId: ctx.user.sub,
      action: "subscription.plan_changed",
      entityType: "subscription",
      entityId: subscription.id,
      metadata: { organizationId, newPlanId, downgradeWarnings },
    });

    return ApiResponse.success({
      subscription,
      downgradeWarnings,
      // POLICY: Existing resources are NOT deleted. Only new creation is blocked.
      policy:
        "Existing resources are retained. Only new resource creation beyond limits is blocked.",
    });
  }),
);
