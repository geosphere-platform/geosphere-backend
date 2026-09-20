import assert from "node:assert";
import { SpatialDataService } from "../../core/gis/services/spatial-data.service";
import { PostGisSpatialRepository } from "../../core/gis/infrastructure/postgis-spatial.repository";
import { db } from "../../database";
import { USER_ROLES } from "../../core/constants";

export async function runPostGisPerformanceTests() {
  const repo = new PostGisSpatialRepository(db);
  const service = new SpatialDataService(repo);

  const perfTenant = "99999999-9999-4999-a999-999999999999";
  const ctx = {
    tenantId: perfTenant,
    userId: "perf-user",
    role: USER_ROLES.TENANT_ADMIN,
  };

  const FEATURE_COUNT = 1000;
  console.log(
    `   --> Populating dataset with ${FEATURE_COUNT} generic spatial features...`,
  );

  const startTime = performance.now();
  for (let i = 0; i < FEATURE_COUNT; i++) {
    const id = `00000000-0000-4000-b000-${i.toString(16).padStart(12, "0")}`;
    const lng = 73.0 + (i % 100) * 0.01;
    const lat = 18.0 + Math.floor(i / 100) * 0.01;

    await repo.create({
      id,
      tenantId: perfTenant,
      type: "spatial_node",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: { index: i, category: "PerformanceTest" },
      metadata: { seed: true },
      srid: "EPSG:4326",
    });
  }
  const populateDuration = Math.round(performance.now() - startTime);
  console.log(
    `   --> Inserted ${FEATURE_COUNT} features in ${populateDuration}ms.`,
  );

  // 1. Measure BBox Query
  const t0 = performance.now();
  const bboxResult = await service.searchByBoundingBox(
    ctx,
    73.1,
    18.1,
    73.5,
    18.5,
    { limit: 100 },
  );
  const bboxTime = Math.round(performance.now() - t0);
  console.log(
    `   --> BBox Search (${bboxResult.items.length} items): ${bboxTime}ms`,
  );
  assert.ok(bboxTime < 500, "BBox query should execute in under 500ms");

  // 2. Measure Radius Query
  const t1 = performance.now();
  const radiusResult = await service.searchByRadius(
    ctx,
    73.5,
    18.5,
    15000,
    "meters",
    { limit: 100 },
  );
  const radiusTime = Math.round(performance.now() - t1);
  console.log(
    `   --> Radius Search (${radiusResult.items.length} items): ${radiusTime}ms`,
  );
  assert.ok(radiusTime < 500, "Radius query should execute in under 500ms");

  // 3. Measure Nearest KNN Query
  const t2 = performance.now();
  const nearestResult = await service.searchNearest(ctx, 73.5, 18.5, {
    limit: 10,
  });
  const nearestTime = Math.round(performance.now() - t2);
  console.log(
    `   --> KNN Nearest Search (${nearestResult.items.length} items): ${nearestTime}ms`,
  );
  assert.ok(nearestTime < 500, "Nearest query should execute in under 500ms");
}
