import assert from "node:assert";
import { db } from "../../database";
import { SpatialQueryService } from "../../core/gis/query/spatial-query.service";
import { SpatialSearchService } from "../../core/gis/query/spatial-search.service";
import { SpatialHistoryService } from "../../core/gis/query/spatial-history.service";
import { SpatialAggregationService } from "../../core/gis/query/spatial-aggregation.service";
import { SpatialAnalyticsService } from "../../core/gis/query/spatial-analytics.service";
import { SpatialStatisticsService } from "../../core/gis/query/spatial-statistics.service";

export async function runSpatialQueryIntegrationTests() {
  console.log(
    "  [Integration] Testing PostGIS Spatial Query & Analytics Engine Integration...",
  );

  const queryService = new SpatialQueryService(db);
  const searchService = new SpatialSearchService(db);
  const historyService = new SpatialHistoryService(db);
  const aggService = new SpatialAggregationService(db);
  const analyticsService = new SpatialAnalyticsService(db);
  const statsService = new SpatialStatisticsService(db);

  const testTenant = "00000000-0000-0000-0000-000000000000";

  // 1. Spatial Radius Query
  const radiusResult = await queryService.queryRadius(
    testTenant,
    [73.8567, 18.5204],
    10000,
  );
  assert.strictEqual(radiusResult.type, "FeatureCollection");

  // 2. Nearest Neighbor Query
  const nearestResult = await queryService.queryNearest(
    testTenant,
    [73.8567, 18.5204],
    5,
  );
  assert.ok(Array.isArray(nearestResult.items));

  // 3. Combined Text + Spatial Search
  const searchResult = await searchService.textSearch(testTenant, "Hub");
  assert.strictEqual(searchResult.type, "FeatureCollection");

  // 4. Track Stats
  const trackStats = await historyService.getTrackStats(
    testTenant,
    "00000000-0000-0000-0000-000000000001",
    "2026-01-01T00:00:00Z",
    "2026-06-01T00:00:00Z",
  );
  assert.strictEqual(typeof trackStats.distanceMeters, "number");

  // 5. Area Statistics
  const areaStats = await statsService.areaStats(testTenant);
  assert.strictEqual(typeof areaStats.totalSqMeters, "number");

  // 6. Geofence Analytics
  const geofenceAnalytics = await analyticsService.getGeofenceAnalytics(
    testTenant,
    "geofence-test-01",
    "2026-01-01T00:00:00Z",
    "2026-06-01T00:00:00Z",
  );
  assert.strictEqual(geofenceAnalytics.tenantId, testTenant);

  console.log("  ✅ SpatialQueryIntegrationTests Passed");
}
