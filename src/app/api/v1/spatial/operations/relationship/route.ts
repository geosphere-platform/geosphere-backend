import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { operationService } from "@/app/api/v1/spatial/operations-shared";

export const POST = withAuth(async (ctx: AuthContext) => {
  const body = await ctx.request.json();
  const relation = body.relation ?? "intersects";
  const result = await operationService.spatialRelation(
    body.geometryA,
    body.geometryB,
    relation,
  );
  return ApiResponse.success({ relation, result }, 200);
});
