import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { measurementService } from "@/app/api/v1/spatial/operations-shared";

export const POST = withAuth(async (ctx: AuthContext) => {
  const body = await ctx.request.json();
  const res = await measurementService.distance(
    body.geometryA || body.geometry1,
    body.geometryB || body.geometry2,
    body.unit ?? "meters",
  );
  return ApiResponse.success(res, 200);
});
