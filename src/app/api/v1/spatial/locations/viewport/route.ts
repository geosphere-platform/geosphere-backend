import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { realtimeEngine } from "../../realtime-shared";
import { BoundingBox } from "@/core/gis/bbox/bounding-box";
import { InvalidBBoxError } from "@/core/errors/spatial-errors";

export const GET = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const { searchParams } = new URL(ctx.request.url);

  const bboxParam = searchParams.get("bbox");
  if (!bboxParam) {
    throw new InvalidBBoxError(
      "Query parameter 'bbox' is required (format: minLng,minLat,maxLng,maxLat)",
    );
  }

  const parts = bboxParam.split(",").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) {
    throw new InvalidBBoxError(
      "Bounding box must contain 4 valid numbers: minLng,minLat,maxLng,maxLat",
    );
  }

  const bbox = new BoundingBox(parts[0], parts[1], parts[2], parts[3]);
  const limit = parseInt(searchParams.get("limit") || "200", 10);

  const { featureCollection, count } =
    await realtimeEngine.queryViewportPositions(
      { tenantId, userId: ctx.user.sub, role: ctx.user.role },
      bbox,
      limit,
    );

  return ApiResponse.success({ ...featureCollection, total: count }, 200);
});
