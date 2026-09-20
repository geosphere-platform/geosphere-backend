/**
 * GET  /api/v1/admin/overrides?orgId=... - List overrides for an org
 * POST /api/v1/admin/overrides - Set an entitlement override (platform admin)
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, withPermission, AuthContext } from "@/core/auth/guards";
import { overrideService } from "@/core/subscription/override.service";
import { PERMISSIONS } from "@/core/constants";
import { auditLogsTable } from "@/database/schema";
import { db } from "@/database";

export const GET = withAuth(
  withPermission(PERMISSIONS.OVERRIDE_MANAGE)(async (ctx: AuthContext) => {
    const { searchParams } = new URL(ctx.request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return ApiResponse.error(
        "orgId query param is required",
        400,
        "BAD_REQUEST",
      );
    }

    const overrides = await overrideService.getOrganizationOverrides(orgId);
    return ApiResponse.success(overrides);
  }),
);

export const POST = withAuth(
  withPermission(PERMISSIONS.OVERRIDE_MANAGE)(async (ctx: AuthContext) => {
    const body = await ctx.request.json();
    const override = await overrideService.setOverride(body, ctx.user.sub);

    await db.insert(auditLogsTable).values({
      userId: ctx.user.sub,
      action: "override.set",
      entityType: "entitlement_override",
      entityId: override.id,
      metadata: body,
    });

    return ApiResponse.success(override, 201);
  }),
);
