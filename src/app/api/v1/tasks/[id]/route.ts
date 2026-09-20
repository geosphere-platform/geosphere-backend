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

    const task = await rulesRepo.getTask(id, tenantId);
    if (!task) {
      return ApiResponse.error("Task not found", 404, "TASK_NOT_FOUND");
    }

    return ApiResponse.success(task, 200);
  },
);

export const PATCH = withAuth(
  async (ctx: AuthContext, routeCtx?: Record<string, unknown>) => {
    const tenantId = ctx.user.orgId ?? "default-tenant-0000";
    const { id } = await (routeCtx as unknown as RouteContext).params;
    const body = await ctx.request.json();

    const updated = await ruleExecutionService.updateTask(
      { tenantId, userId: ctx.user.sub, role: ctx.user.role },
      id,
      {
        ...body,
        dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
      },
    );

    return ApiResponse.success(updated, 200);
  },
);
