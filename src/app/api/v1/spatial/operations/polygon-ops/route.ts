import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { operationService } from "@/app/api/v1/spatial/operations-shared";
import { InvalidGeometryError } from "@/core/errors/spatial-errors";

export const POST = withAuth(async (ctx: AuthContext) => {
  const body = await ctx.request.json();
  const operation = body.operation;

  let resultGeometry;
  switch (operation) {
    case "union":
      resultGeometry = await operationService.unionGeometries(body.geometries);
      break;
    case "difference":
      resultGeometry = await operationService.difference(
        body.geometryA,
        body.geometryB,
      );
      break;
    case "symmetricDifference":
      resultGeometry = await operationService.symmetricDifference(
        body.geometryA,
        body.geometryB,
      );
      break;
    case "convexHull":
      resultGeometry = await operationService.convexHull(body.geometry);
      break;
    default:
      throw new InvalidGeometryError(
        `Unsupported polygon operation '${operation}'. Valid ops: union, difference, symmetricDifference, convexHull`,
      );
  }

  return ApiResponse.success({ operation, geometry: resultGeometry }, 200);
});
