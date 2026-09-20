/**
 * POST /api/v1/subscriptions/assign
 * Platform admin: Assign a plan to an organization.
 * Previous active subscription is cancelled (history retained).
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
    const {
      organizationId,
      planId,
      startsAt,
      endsAt,
      billingInterval,
      currency,
    } = body;

    if (!organizationId || !planId) {
      return ApiResponse.error(
        "organizationId and planId are required",
        400,
        "BAD_REQUEST",
      );
    }

    const subscription = await subscriptionService.assignPlan({
      organizationId,
      planId,
      startsAt: startsAt ? new Date(startsAt) : undefined,
      endsAt: endsAt ? new Date(endsAt) : undefined,
      billingInterval,
      currency,
    });

    await db.insert(auditLogsTable).values({
      userId: ctx.user.sub,
      action: "subscription.assigned",
      entityType: "subscription",
      entityId: subscription.id,
      metadata: { organizationId, planId },
    });

    return ApiResponse.success(subscription, 201);
  }),
);
