/**
 * Phase 18 — Spatial Clustering Unit Tests
 */

import { SpatialClusterService } from "@/core/gis/clustering/spatial-cluster.service";

function assertStrict(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

export function runSpatialClusteringUnitTests() {
  console.log("🧪 Running Phase 18 Spatial Clustering Unit Tests...");

  // 1. Grid size calculation by zoom level
  assertStrict(
    SpatialClusterService.getGridSizeDegrees(2) === 2.0,
    "Zoom 2 grid size should be 2.0 degrees",
  );
  assertStrict(
    SpatialClusterService.getGridSizeDegrees(5) === 0.5,
    "Zoom 5 grid size should be 0.5 degrees",
  );
  assertStrict(
    SpatialClusterService.getGridSizeDegrees(12) === 0.02,
    "Zoom 12 grid size should be 0.02 degrees",
  );
  assertStrict(
    SpatialClusterService.getGridSizeDegrees(18) === 0.001,
    "Zoom 18 grid size should be 0.001 degrees",
  );

  console.log("  ✅ Spatial Clustering Unit Tests Passed!");
}
