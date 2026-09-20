import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { ruleExecutionService } from "../../rules-shared";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withAuth(
  async (ctx: AuthContext, routeCtx?: Record<string, unknown>) => {
    const tenantId = ctx.user.orgId ?? "default-tenant-0000";
    const { id } = await (routeCtx as unknown as RouteContext).params;

    const rule = await ruleExecutionService.getRule(
      { tenantId, userId: ctx.user.sub, role: ctx.user.role },
      id,
    );

    return ApiResponse.success(rule, 200);
  },
);

export const PATCH = withAuth(
  async (ctx: AuthContext, routeCtx?: Record<string, unknown>) => {
    const tenantId = ctx.user.orgId ?? "default-tenant-0000";
    const { id } = await (routeCtx as unknown as RouteContext).params;
    const body = await ctx.request.json();

    const result = await ruleExecutionService.updateRule(
      { tenantId, userId: ctx.user.sub, role: ctx.user.role },
      id,
      body,
    );

    return ApiResponse.success(result, 200);
  },
);

export const DELETE = withAuth(
  async (ctx: AuthContext, routeCtx?: Record<string, unknown>) => {
    const tenantId = ctx.user.orgId ?? "default-tenant-0000";
    const { id } = await (routeCtx as unknown as RouteContext).params;

    const result = await ruleExecutionService.updateRule(
      { tenantId, userId: ctx.user.sub, role: ctx.user.role },
      id,
      { name: undefined },
    );

    return ApiResponse.success(result, 200);
  },
);
