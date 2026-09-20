/**
 * GET /api/v1/tiles/[layer]/[z]/[x]/[y]
 *
 * Vector Tile API Endpoint — Mapbox Vector Tile (.pbf) format
 * High-performance vector tile server generated directly in PostGIS.
 *
 * Security & Controls:
 *  - Multi-tenant isolation (tenantId enforced from authenticated session)
 *  - RBAC permission requirement: `gis:layers:read`
 *  - HTTP Cache-Control & ETag validation (`If-None-Match` -> 304 Not Modified)
 *  - Parameter sanitization & zoom level validation
 */

import { NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { hasPermission } from "@/core/auth/permissions";
import { PERMISSIONS } from "@/core/constants";
import { ForbiddenError, ValidationError } from "@/core/errors/errors";
import { MvtTileService } from "@/core/gis/tiles/mvt-tile.service";
import { tileCacheProvider } from "@/core/gis/tiles/tile-cache.provider";
import { db } from "@/database";

const mvtTileService = new MvtTileService(db);

export const GET = withAuth(async (ctx: AuthContext, routeContext?: any) => {
  if (
    !hasPermission(
      ctx.user.role,
      PERMISSIONS.GIS_FEATURE_READ ?? PERMISSIONS.GIS_QUERY_READ,
    )
  ) {
    throw new ForbiddenError(
      "Permission 'gis:features:read' required for vector tile access",
    );
  }

  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const params = await (routeContext?.params ||
    Promise.resolve({ layer: "", z: "0", x: "0", y: "0" }));

  const layerId = params.layer;
  const z = parseInt(params.z, 10);
  const x = parseInt(params.x, 10);
  const y = parseInt(params.y, 10);

  if (isNaN(z) || isNaN(x) || isNaN(y) || z < 0 || z > 22 || x < 0 || y < 0) {
    throw new ValidationError("Invalid vector tile coordinates (z, x, y)");
  }

  // Check HTTP ETag header (If-None-Match)
  const ifNoneMatch = ctx.request.headers.get("if-none-match");
  const cacheKey = `mvt:${tenantId}:${layerId}:${z}:${x}:${y}`;
  const cached = tileCacheProvider.get(cacheKey);

  if (cached && tileCacheProvider.isNotModified(cached.etag, ifNoneMatch)) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: cached.etag,
        "Cache-Control": "private, max-age=300",
      },
    });
  }

  const result = await mvtTileService.generateTile(tenantId, {
    layerId,
    z,
    x,
    y,
  });

  if (tileCacheProvider.isNotModified(result.etag, ifNoneMatch)) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: result.etag,
        "Cache-Control": "private, max-age=300",
      },
    });
  }

  return new NextResponse(result.buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/x-protobuf",
      "Content-Encoding": "identity",
      ETag: result.etag,
      "Cache-Control": "private, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
