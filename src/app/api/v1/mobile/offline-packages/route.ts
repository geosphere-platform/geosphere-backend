import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";

export const GET = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";

  const packages = [
    {
      id: "pkg_district_north",
      tenantId,
      areaName: "North District Sector A",
      boundingBox: [-74.1, 40.6, -73.9, 40.8],
      minZoom: 10,
      maxZoom: 16,
      layerIds: ["assets_layer", "parcels_layer", "routes_layer"],
      version: 1,
      packageSizeBytes: 14500000, // ~14.5 MB
      downloadUrl: `/api/v1/mobile/offline-packages/download/pkg_district_north.mbtiles`,
      checksum:
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "pkg_district_south",
      tenantId,
      areaName: "South District Sector B",
      boundingBox: [-74.2, 40.4, -74.0, 40.6],
      minZoom: 10,
      maxZoom: 16,
      layerIds: ["assets_layer", "routes_layer"],
      version: 2,
      packageSizeBytes: 18200000,
      downloadUrl: `/api/v1/mobile/offline-packages/download/pkg_district_south.mbtiles`,
      checksum:
        "a123c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b899",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  return ApiResponse.success({ tenantId, packages }, 200);
});
