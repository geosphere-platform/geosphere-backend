import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";

export const POST = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const body = await ctx.request.json();

  const { deviceId, metrics } = body;

  if (!deviceId || !Array.isArray(metrics)) {
    return ApiResponse.error(
      "Missing deviceId or metrics array",
      400,
      "BAD_REQUEST",
    );
  }

  return ApiResponse.success(
    {
      tenantId,
      deviceId,
      receivedMetricsCount: metrics.length,
      status: "RECORDED",
    },
    202,
  );
});
