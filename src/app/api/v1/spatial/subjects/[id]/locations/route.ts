import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { realtimeEngine } from "../../../realtime-shared";

export const GET = withAuth(
  async (ctx: AuthContext, context?: Record<string, unknown>) => {
    const params = (await context?.params) as { id: string } | undefined;
    const id = params?.id ?? "";
    const tenantId = ctx.user.orgId ?? "default-tenant-0000";
    const { searchParams } = new URL(ctx.request.url);

    const fromTimestamp = searchParams.get("from") || undefined;
    const toTimestamp = searchParams.get("to") || undefined;
    const source = searchParams.get("source") || undefined;
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const cursor = searchParams.get("cursor") || undefined;

    const history = await realtimeEngine.queryLocationHistory(
      { tenantId, userId: ctx.user.sub, role: ctx.user.role },
      id,
      { fromTimestamp, toTimestamp, source, limit, cursor },
    );

    return ApiResponse.success(history, 200);
  },
);
