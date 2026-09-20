import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";

export const GET = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";

  const notifications = [
    {
      id: "notif_001",
      tenantId,
      title: "New High Priority Task Assigned",
      body: "Inspect Hydrant Valve #42 in North Sector",
      priority: "HIGH",
      payload: { taskId: "task_001" },
      timestamp: new Date().toISOString(),
      isRead: false,
    },
  ];

  return ApiResponse.success({ tenantId, notifications }, 200);
});
