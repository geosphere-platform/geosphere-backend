import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";

const tasksStore: Map<string, any> = new Map([
  [
    "task_001",
    {
      id: "task_001",
      tenantId: "default-tenant-0000",
      assignedUserId: "user_001",
      title: "Inspect Hydrant Valve #42",
      description: "Perform pressure testing and check seal integrity",
      status: "ASSIGNED",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      locationGeom: { type: "Point", coordinates: [-74.006, 40.7128] },
      formId: "form_asset_inspection",
      metadata: { zone: "North Sector", critical: true },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
]);

export const GET = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const { searchParams } = new URL(ctx.request.url);
  const statusFilter = searchParams.get("status");

  const tasksList = Array.from(tasksStore.values()).filter(
    (t) =>
      t.tenantId === tenantId && (!statusFilter || t.status === statusFilter),
  );

  return ApiResponse.success(
    { tenantId, tasks: tasksList, total: tasksList.length },
    200,
  );
});

export const PATCH = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const body = await ctx.request.json();

  const { taskId, status, metadata } = body;

  if (!taskId || !status) {
    return ApiResponse.error("Missing taskId or status", 400, "BAD_REQUEST");
  }

  const validStatuses = [
    "ASSIGNED",
    "ACCEPTED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "FAILED",
  ];
  if (!validStatuses.includes(status)) {
    return ApiResponse.error(
      `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      400,
      "BAD_REQUEST",
    );
  }

  const task = tasksStore.get(taskId) || {
    id: taskId,
    tenantId,
    title: "Mobile Field Task",
    assignedUserId: ctx.user.sub,
    priority: "MEDIUM",
  };

  task.status = status;
  task.updatedAt = new Date().toISOString();
  if (metadata) {
    task.metadata = { ...task.metadata, ...metadata };
  }

  tasksStore.set(taskId, task);

  return ApiResponse.success(task, 200);
});
