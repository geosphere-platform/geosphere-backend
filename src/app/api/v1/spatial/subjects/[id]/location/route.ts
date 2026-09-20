import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { realtimeEngine } from "../../../realtime-shared";

export const GET = withAuth(
  async (ctx: AuthContext, context?: Record<string, unknown>) => {
    const params = (await context?.params) as { id: string } | undefined;
    const id = params?.id ?? "";
    const tenantId = ctx.user.orgId ?? "default-tenant-0000";

    const currentPos = await realtimeEngine.getCurrentPosition(
      { tenantId, userId: ctx.user.sub, role: ctx.user.role },
      id,
    );

    return ApiResponse.success(currentPos, 200);
  },
);
