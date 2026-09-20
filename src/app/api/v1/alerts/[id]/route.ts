import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { ruleExecutionService, rulesRepo } from "../../rules-shared";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withAuth(
  async (ctx: AuthContext, routeCtx?: Record<string, unknown>) => {
    const tenantId = ctx.user.orgId ?? "default-tenant-0000";
    const { id } = await (routeCtx as unknown as RouteContext).params;

    const alert = await rulesRepo.getAlert(id, tenantId);
    if (!alert) {
      return ApiResponse.error("Alert not found", 404, "ALERT_NOT_FOUND");
    }

    return ApiResponse.success(alert, 200);
  },
);

export const PATCH = withAuth(
  async (ctx: AuthContext, routeCtx?: Record<string, unknown>) => {
    const tenantId = ctx.user.orgId ?? "default-tenant-0000";
    const { id } = await (routeCtx as unknown as RouteContext).params;
    const body = await ctx.request.json();

    if (!body.status) {
      return ApiResponse.error("Missing status field", 400, "BAD_REQUEST");
    }

    const updated = await ruleExecutionService.updateAlertStatus(
      { tenantId, userId: ctx.user.sub, role: ctx.user.role },
      id,
      body.status,
    );

    return ApiResponse.success(updated, 200);
  },
);
