import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { proximityService } from "@/app/api/v1/spatial/operations-shared";
import { spatialFeaturesToFeatureCollection } from "@/core/gis/types/feature";

export const POST = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const body = await ctx.request.json();

  const features = await proximityService.withinDistance(
    {
      tenantId,
      userId: ctx.user.sub,
      role: ctx.user.role,
    },
    body.location || body.point || [body.lng, body.lat],
    body.distance || body.radius,
    body.unit ?? "meters",
    {
      type: body.type,
      limit: body.limit,
      offset: body.offset,
    },
  );

  const featureCollection = spatialFeaturesToFeatureCollection(features);

  return ApiResponse.success(
    {
      ...featureCollection,
      total: features.length,
    },
    200,
  );
});
