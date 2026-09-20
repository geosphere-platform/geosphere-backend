import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { realtimeEngine } from "../../realtime-shared";

export const GET = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const { searchParams } = new URL(ctx.request.url);

  const type = searchParams.get("type") || undefined;
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const result = await realtimeEngine.listCurrentPositions(
    { tenantId, userId: ctx.user.sub, role: ctx.user.role },
    { type, limit, offset },
  );

  return ApiResponse.success(result, 200);
});
