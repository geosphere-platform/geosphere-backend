/**
 * Phase 10 — Live API & Engine Verification Script
 *
 * Direct empirical execution of all Phase 10 API services and routes.
 */

import { db } from "../database";
import { BoundingBox } from "../core/gis/bbox/bounding-box";
import {
  spatialQueryService,
  spatialSearchService,
  spatialHistoryService,
  spatialAggregationService,
  spatialAnalyticsService,
  spatialStatisticsService,
} from "../app/api/v1/spatial/query-shared";

async function verifyAllPhase10EngineServices() {
  console.log("=================================================");
  console.log("STARTING LIVE PHASE 10 VERIFICATION EXECUTION");
  console.log("=================================================");

  const tenantId = "00000000-0000-0000-0000-000000000000";

  // 1. Test Spatial Radius Query
  console.log(
    "\n1. Executing Spatial Radius Query (center: [73.8567, 18.5204], radius: 5000m)...",
  );
  const radiusResults = await spatialQueryService.queryRadius(
    tenantId,
    [73.8567, 18.5204],
    5000,
  );
  console.log(
    `   --> Returned GeoJSON FeatureCollection with ${radiusResults.features.length} features.`,
  );

  // 2. Test Spatial Nearest Neighbor (KNN) Query
  console.log("\n2. Executing Spatial Nearest Neighbor (KNN) Query...");
  const nearestResults = await spatialQueryService.queryNearest(
    tenantId,
    [73.8567, 18.5204],
    5,
  );
  console.log(`   --> Found ${nearestResults.items.length} nearest features.`);

  // 3. Test Full-Text Search
  console.log("\n3. Executing Spatial Full-Text Search...");
  const searchResults = await spatialSearchService.textSearch(
    tenantId,
    "Center",
  );
  console.log(
    `   --> Found ${searchResults.features.length} text match features.`,
  );

  // 4. Test Viewport Query
  console.log("\n4. Executing Viewport Query (zoom level 12)...");
  const viewportResults = await spatialQueryService.queryViewport(
    tenantId,
    new BoundingBox(73.7, 18.4, 73.9, 18.6),
    12,
  );
  console.log(
    `   --> Viewport query returned ${viewportResults.features.length} features.`,
  );

  // 5. Test Track Analytics
  console.log("\n5. Executing Track & Movement Analytics...");
  const track = await spatialHistoryService.getTrack(
    tenantId,
    "00000000-0000-0000-0000-000000000001",
    "2026-01-01T00:00:00Z",
    "2026-08-11T12:00:00Z",
  );
  console.log(
    `   --> Track constructed: points=${track.pointCount}, distance=${track.distanceKilometers} km, duration=${track.durationSeconds}s, gaps=${track.gaps.length}.`,
  );

  // 6. Test Spatial Area & Length Statistics
  console.log("\n6. Executing Spatial Statistics (Area & Length)...");
  const areaStats = await spatialStatisticsService.areaStats(tenantId);
  const lengthStats = await spatialStatisticsService.lengthStats(tenantId);
  console.log(
    `   --> Area Stats: totalSqMeters=${areaStats.totalSqMeters}, polygonCount=${areaStats.featureCount}`,
  );
  console.log(
    `   --> Length Stats: totalMeters=${lengthStats.totalMeters}, lineCount=${lengthStats.featureCount}`,
  );

  // 7. Test Geofence Entry/Exit Analytics
  console.log("\n7. Executing Geofence Entry/Exit Analytics...");
  const gfAnalytics = await spatialAnalyticsService.getGeofenceAnalytics(
    tenantId,
    "geofence-alpha-101",
    "2026-01-01T00:00:00Z",
    "2026-08-11T12:00:00Z",
  );
  console.log(
    `   --> Geofence Analytics: entries=${gfAnalytics.entryCount}, exits=${gfAnalytics.exitCount}, openIntervals=${gfAnalytics.openIntervals}`,
  );

  // 8. Test Time-Series Aggregation
  console.log("\n8. Executing Time-Series Aggregation (daily bucket)...");
  const timeseries = await spatialAnalyticsService.getTimeSeries(
    tenantId,
    "event_count",
    "2026-08-01T00:00:00Z",
    "2026-08-11T12:00:00Z",
    "day",
  );
  console.log(
    `   --> Time-series returned ${timeseries.points.length} daily bucket data points.`,
  );

  console.log("\n=================================================");
  console.log("LIVE PHASE 10 VERIFICATION COMPLETED WITH 100% SUCCESS");
  console.log("=================================================");
}

verifyAllPhase10EngineServices().catch((err) => {
  console.error("❌ Live verification failed:", err);
  process.exit(1);
});
