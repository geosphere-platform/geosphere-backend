import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { ruleExecutionService } from "../../../rules-shared";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const POST = withAuth(
  async (ctx: AuthContext, routeCtx?: Record<string, unknown>) => {
    const tenantId = ctx.user.orgId ?? "default-tenant-0000";
    const { id } = await (routeCtx as unknown as RouteContext).params;

    const rule = await ruleExecutionService.deactivateRule(
      { tenantId, userId: ctx.user.sub, role: ctx.user.role },
      id,
    );

    return ApiResponse.success(rule, 200);
  },
);
