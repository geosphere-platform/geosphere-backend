import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { measurementService } from "@/app/api/v1/spatial/operations-shared";

export const POST = withAuth(async (ctx: AuthContext) => {
  const body = await ctx.request.json();
  const centroid = await measurementService.centroid(body.geometry);
  const representativePoint = await measurementService.representativePoint(
    body.geometry,
  );

  return ApiResponse.success(
    {
      centroid,
      representativePoint,
    },
    200,
  );
});
