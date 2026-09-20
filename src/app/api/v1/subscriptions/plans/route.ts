/**
 * GET  /api/v1/subscriptions/plans - List active public plans
 * POST /api/v1/subscriptions/plans - Create a new plan (platform admin only)
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, withPermission, AuthContext } from "@/core/auth/guards";
import { planService } from "@/core/subscription/plan.service";
import { PERMISSIONS } from "@/core/constants";
import { auditLogsTable } from "@/database/schema";
import { db } from "@/database";

// GET /api/v1/subscriptions/plans — public list for all authenticated users
export const GET = withAuth(async (ctx: AuthContext) => {
  const { searchParams } = new URL(ctx.request.url);
  const showAll = searchParams.get("all") === "true";

  // Platform admins can see all plans including DRAFT/ARCHIVED
  if (
    showAll &&
    (ctx.user.role === "PLATFORM_ADMIN" || ctx.user.role === "SUPER_ADMIN")
  ) {
    const plans = await planService.listPlans();
    return ApiResponse.success(plans);
  }

  // All other users see only ACTIVE public plans
  const plans = await planService.listPublicPlans();
  return ApiResponse.success(plans);
});

// POST /api/v1/subscriptions/plans — platform admin only
export const POST = withAuth(
  withPermission(PERMISSIONS.PLAN_MANAGE)(async (ctx: AuthContext) => {
    const body = await ctx.request.json();
    const plan = await planService.createPlan(body);

    // Audit log
    await db.insert(auditLogsTable).values({
      userId: ctx.user.sub,
      action: "plan.created",
      entityType: "plan",
      entityId: plan.id,
      metadata: { code: plan.code, name: plan.name },
    });

    return ApiResponse.success(plan, 201);
  }),
);
