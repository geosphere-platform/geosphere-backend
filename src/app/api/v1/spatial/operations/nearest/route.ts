import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { proximityService } from "@/app/api/v1/spatial/operations-shared";

export const POST = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const body = await ctx.request.json();

  const N = body.limit ?? body.N ?? 10;
  const results = await proximityService.nearestN(
    {
      tenantId,
      userId: ctx.user.sub,
      role: ctx.user.role,
    },
    body.location || body.point || [body.lng, body.lat],
    N,
    { type: body.type },
  );

  return ApiResponse.success(results, 200);
});
