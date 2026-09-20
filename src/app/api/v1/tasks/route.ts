import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { ruleExecutionService, rulesRepo } from "../rules-shared";
import { TaskStatus, TaskPriority } from "@/core/gis/rules/types/rule.types";

export const GET = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const { searchParams } = new URL(ctx.request.url);

  const status = (searchParams.get("status") as TaskStatus) || undefined;
  const priority = (searchParams.get("priority") as TaskPriority) || undefined;
  const assignedTo = searchParams.get("assignedTo") || undefined;
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const result = await ruleExecutionService.listTasks(
    { tenantId, userId: ctx.user.sub, role: ctx.user.role },
    { status, priority, assignedTo, limit, offset },
  );

  return ApiResponse.success(result, 200);
});

export const POST = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const body = await ctx.request.json();

  if (!body.title) {
    return ApiResponse.error("Missing title parameter", 400, "BAD_REQUEST");
  }

  const created = await rulesRepo.createTask({
    tenantId,
    title: body.title,
    description: body.description,
    priority: body.priority,
    assignedTo: body.assignedTo,
    dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
    metadata: body.metadata,
  });

  return ApiResponse.success(created, 201);
});
