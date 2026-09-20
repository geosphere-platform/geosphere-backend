import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { operationService } from "@/app/api/v1/spatial/operations-shared";

export const POST = withAuth(async (ctx: AuthContext) => {
  const body = await ctx.request.json();
  const buffered = await operationService.buffer(
    body.geometry,
    body.distance,
    body.unit ?? "meters",
  );
  return ApiResponse.success(buffered, 200);
});
