/**
 * POST /api/v1/subscriptions/suspend
 * Platform admin: Suspend an organization's subscription.
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, withPermission, AuthContext } from "@/core/auth/guards";
import { subscriptionService } from "@/core/subscription/subscription.service";
import { PERMISSIONS } from "@/core/constants";
import { auditLogsTable } from "@/database/schema";
import { db } from "@/database";

export const POST = withAuth(
  withPermission(PERMISSIONS.SUBSCRIPTION_MANAGE)(async (ctx: AuthContext) => {
    const { organizationId } = await ctx.request.json();

    if (!organizationId) {
      return ApiResponse.error(
        "organizationId is required",
        400,
        "BAD_REQUEST",
      );
    }

    const subscription =
      await subscriptionService.suspendSubscription(organizationId);

    await db.insert(auditLogsTable).values({
      userId: ctx.user.sub,
      action: "subscription.suspended",
      entityType: "subscription",
      entityId: subscription.id,
      metadata: { organizationId },
    });

    return ApiResponse.success(subscription);
  }),
);
