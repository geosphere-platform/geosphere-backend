/**
 * GET  /api/v1/subscriptions/features - List features
 * POST /api/v1/subscriptions/features - Create feature (platform admin)
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, withPermission, AuthContext } from "@/core/auth/guards";
import { featureService } from "@/core/subscription/feature.service";
import { PERMISSIONS } from "@/core/constants";

export const GET = withAuth(async (ctx: AuthContext) => {
  const { searchParams } = new URL(ctx.request.url);
  const statusFilter = searchParams.get("status") ?? undefined;

  const isAdmin =
    ctx.user.role === "PLATFORM_ADMIN" || ctx.user.role === "SUPER_ADMIN";

  const features = isAdmin
    ? await featureService.listFeatures(statusFilter)
    : await featureService.listActiveFeatures();

  return ApiResponse.success(features);
});

export const POST = withAuth(
  withPermission(PERMISSIONS.PLAN_MANAGE)(async (ctx: AuthContext) => {
    const body = await ctx.request.json();
    const feature = await featureService.createFeature(body);
    return ApiResponse.success(feature, 201);
  }),
);
