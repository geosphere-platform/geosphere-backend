import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { geofenceEngine } from "@/app/api/v1/spatial/operations-shared";

export const GET = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const geofences = await geofenceEngine.listGeofences({
    tenantId,
    userId: ctx.user.sub,
    role: ctx.user.role,
  });
  return ApiResponse.success(
    { items: geofences, total: geofences.length },
    200,
  );
});

export const POST = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const body = await ctx.request.json();

  const created = await geofenceEngine.createGeofence(
    {
      tenantId,
      userId: ctx.user.sub,
      role: ctx.user.role,
    },
    body.name,
    body.geometry,
    body.properties ?? {},
  );

  return ApiResponse.success(created, 201);
});
