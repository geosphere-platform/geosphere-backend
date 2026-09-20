import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { geofenceEngine } from "@/app/api/v1/spatial/operations-shared";

export const POST = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const body = await ctx.request.json();

  if (body.geofence) {
    const res = await geofenceEngine.evaluatePointAgainstGeofence(
      body.point || body.location || [body.lng, body.lat],
      body.geofence,
    );
    return ApiResponse.success(res, 200);
  }

  const results = await geofenceEngine.evaluatePointAgainstAllGeofences(
    {
      tenantId,
      userId: ctx.user.sub,
      role: ctx.user.role,
    },
    body.point || body.location || [body.lng, body.lat],
  );

  return ApiResponse.success({ evaluations: results }, 200);
});
