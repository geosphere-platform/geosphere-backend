import assert from "node:assert";
import { SpatialQueryValidator } from "../../core/gis/query/spatial-query-validator";
import { SPATIAL_QUERY_LIMITS } from "../../core/gis/query/query-limits.config";

export function runSpatialHistoryUnitTests() {
  console.log("  [Unit] Testing SpatialHistory logic & quality bounds...");

  // 1. Pagination size clamp
  const clamped = SpatialQueryValidator.clampLimit(1000);
  assert.strictEqual(
    clamped,
    SPATIAL_QUERY_LIMITS.MAX_RESULT_LIMIT,
    "Should clamp pagination limit to MAX_RESULT_LIMIT",
  );

  // 2. Track gap threshold constant
  assert.strictEqual(
    SPATIAL_QUERY_LIMITS.TRACK_GAP_THRESHOLD_SECONDS,
    3600,
    "Track gap threshold should be 3600s",
  );

  // 3. Time range limit validation (max 365 days)
  assert.doesNotThrow(() => {
    SpatialQueryValidator.validateTimeRange(
      "2026-01-01T00:00:00Z",
      "2026-06-01T00:00:00Z",
    );
  });

  console.log("  ✅ SpatialHistoryUnitTests Passed");
}
