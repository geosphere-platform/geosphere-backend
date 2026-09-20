import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { realtimeEngine } from "../../realtime-shared";

export const POST = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const body = await ctx.request.json();

  const updates = Array.isArray(body) ? body : body.updates;

  const result = await realtimeEngine.ingestBatch(
    { tenantId, userId: ctx.user.sub, role: ctx.user.role },
    updates,
  );

  return ApiResponse.success(result, 200);
});
