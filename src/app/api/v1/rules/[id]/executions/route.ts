import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { ruleExecutionService } from "../../../rules-shared";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withAuth(
  async (ctx: AuthContext, routeCtx?: Record<string, unknown>) => {
    const tenantId = ctx.user.orgId ?? "default-tenant-0000";
    const { id } = await (routeCtx as unknown as RouteContext).params;
    const { searchParams } = new URL(ctx.request.url);

    const status = searchParams.get("status") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const result = await ruleExecutionService.listExecutions(
      { tenantId, userId: ctx.user.sub, role: ctx.user.role },
      { ruleId: id, status: status as any, limit, offset },
    );

    return ApiResponse.success(result, 200);
  },
);
