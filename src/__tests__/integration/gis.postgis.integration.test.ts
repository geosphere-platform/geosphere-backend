import assert from "node:assert";
import { SpatialDataService } from "../../core/gis/services/spatial-data.service";
import { PostGisSpatialRepository } from "../../core/gis/infrastructure/postgis-spatial.repository";
import { PolygonGeometry } from "../../core/gis/types/geometry";
import { db } from "../../database";
import { USER_ROLES } from "../../core/constants";

export async function runPostGisIntegrationTests() {
  const repo = new PostGisSpatialRepository(db);
  const service = new SpatialDataService(repo);

  const tenantA = "11111111-1111-4111-a111-111111111111";
  const tenantB = "22222222-2222-4222-a222-222222222222";
  const ctxTenantA = {
    tenantId: tenantA,
    userId: "user-a",
    role: USER_ROLES.TENANT_ADMIN,
  };
  const ctxTenantB = {
    tenantId: tenantB,
    userId: "user-b",
    role: USER_ROLES.TENANT_ADMIN,
  };

  console.log("   --> 1. Testing Feature Creation...");
  const featA = await service.createFeature(ctxTenantA, {
    id: "33333333-3333-4333-a333-333333333333",
    type: "point_of_interest",
    geometry: { type: "Point", coordinates: [73.8567, 18.5204] },
    properties: { name: "Tenant A Point 1", category: "Hub" },
  });

  assert.strictEqual(featA.id, "33333333-3333-4333-a333-333333333333");
  assert.strictEqual(featA.tenantId, tenantA);

  console.log("   --> 2. Testing Feature Read & Tenant Isolation...");
  const readA = await service.getFeatureById(ctxTenantA, featA.id);
  assert.strictEqual(readA.properties.name, "Tenant A Point 1");

  // Tenant B cannot access Tenant A feature
  await assert.rejects(
    async () => service.getFeatureById(ctxTenantB, featA.id),
    (err: any) =>
      err.errorCode === "SPATIAL_FEATURE_NOT_FOUND" || err.statusCode === 404,
  );

  console.log("   --> 3. Testing Feature Update...");
  const updatedA = await service.updateFeature(ctxTenantA, featA.id, {
    properties: { name: "Tenant A Point 1 Updated", category: "Hub Super" },
  });
  assert.strictEqual(updatedA.properties.name, "Tenant A Point 1 Updated");

  console.log(
    "   --> 4. Testing PostGIS Bounding Box (ST_Intersects) Query...",
  );
  const bboxResult = await service.searchByBoundingBox(
    ctxTenantA,
    73.0,
    18.0,
    74.0,
    19.0,
  );
  assert.ok(bboxResult.items.length >= 1);
  assert.strictEqual(bboxResult.items[0].id, featA.id);

  console.log("   --> 5. Testing PostGIS Radius (ST_DWithin) Query...");
  const radiusResult = await service.searchByRadius(
    ctxTenantA,
    73.8567,
    18.5204,
    5000,
    "meters",
  );
  assert.ok(radiusResult.items.length >= 1);

  console.log("   --> 6. Testing PostGIS KNN Nearest Neighbor (<->) Query...");
  const nearestResult = await service.searchNearest(ctxTenantA, 73.85, 18.52, {
    limit: 5,
  });
  assert.ok(nearestResult.items.length >= 1);

  console.log(
    "   --> 7. Testing PostGIS Intersects & Containment (ST_Intersects / ST_Contains)...",
  );
  const polyArea: PolygonGeometry = {
    type: "Polygon",
    coordinates: [
      [
        [73.8, 18.55],
        [73.9, 18.55],
        [73.9, 18.5],
        [73.8, 18.5],
        [73.8, 18.55],
      ],
    ],
  };

  const intersectsResult = await service.searchIntersects(ctxTenantA, polyArea);
  assert.ok(intersectsResult.items.length >= 1);

  console.log("   --> 8. Testing PostGIS Distance Sorting (ST_Distance)...");
  const distResult = await service.searchByDistance(
    ctxTenantA,
    73.8567,
    18.5204,
    { order: "asc" },
  );
  assert.ok(distResult.items.length >= 1);
  assert.strictEqual(distResult.items[0].distanceMeters, 0);

  console.log("   --> 9. Testing Feature Deletion...");
  const deleted = await service.deleteFeature(ctxTenantA, featA.id);
  assert.strictEqual(deleted, true);

  await assert.rejects(
    async () => service.getFeatureById(ctxTenantA, featA.id),
    (err: any) =>
      err.errorCode === "SPATIAL_FEATURE_NOT_FOUND" || err.statusCode === 404,
  );
}
