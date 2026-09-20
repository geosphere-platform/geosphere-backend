import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { realtimeEngine } from "../realtime-shared";

export const GET = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const { searchParams } = new URL(ctx.request.url);

  const subjectId = searchParams.get("subjectId") || undefined;
  const type = searchParams.get("type") || undefined;
  const fromTimestamp = searchParams.get("from") || undefined;
  const toTimestamp = searchParams.get("to") || undefined;
  const limit = parseInt(searchParams.get("limit") || "100", 10);

  const result = await realtimeEngine.querySpatialEvents(
    { tenantId, userId: ctx.user.sub, role: ctx.user.role },
    { subjectId, type, fromTimestamp, toTimestamp, limit },
  );

  return ApiResponse.success(result, 200);
});
