import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { geofenceEngine } from "@/app/api/v1/spatial/operations-shared";

export const GET = withAuth(
  async (ctx: AuthContext, context?: Record<string, unknown>) => {
    const params = (await context?.params) as { id: string } | undefined;
    const id = params?.id ?? "";
    const tenantId = ctx.user.orgId ?? "default-tenant-0000";

    const geofence = await geofenceEngine.getGeofenceById(
      {
        tenantId,
        userId: ctx.user.sub,
        role: ctx.user.role,
      },
      id,
    );

    return ApiResponse.success(geofence, 200);
  },
);

export const DELETE = withAuth(
  async (ctx: AuthContext, context?: Record<string, unknown>) => {
    const params = (await context?.params) as { id: string } | undefined;
    const id = params?.id ?? "";
    const tenantId = ctx.user.orgId ?? "default-tenant-0000";

    await geofenceEngine.deleteGeofence(
      {
        tenantId,
        userId: ctx.user.sub,
        role: ctx.user.role,
      },
      id,
    );

    return ApiResponse.success({ deleted: true, id }, 200);
  },
);
