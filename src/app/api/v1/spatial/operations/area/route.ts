import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { measurementService } from "@/app/api/v1/spatial/operations-shared";

export const POST = withAuth(async (ctx: AuthContext) => {
  const body = await ctx.request.json();
  const res = await measurementService.area(
    body.geometry,
    body.unit ?? "sq_meters",
  );
  return ApiResponse.success(res, 200);
});
