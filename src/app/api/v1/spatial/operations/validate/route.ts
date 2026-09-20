import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { validationService } from "@/app/api/v1/spatial/operations-shared";

export const POST = withAuth(async (ctx: AuthContext) => {
  const body = await ctx.request.json();
  const report = await validationService.validateDetailed(
    body.geometry,
    body.srid,
  );
  return ApiResponse.success(report, 200);
});
