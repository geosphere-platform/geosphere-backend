import assert from "node:assert";
import { AnalyticsExportService } from "../../core/gis/query/analytics-export.service";
import { createAnalyticsResult } from "../../core/gis/query/analytics-result.model";

export function runSpatialAnalyticsUnitTests() {
  console.log("  [Unit] Testing SpatialAnalytics & Export model...");

  // 1. Create generic AnalyticsResult container
  const result = createAnalyticsResult({
    queryType: "GEOFENCE_ANALYTICS",
    tenantId: "tenant-test-01",
    queryDurationMs: 12,
    rows: [
      { id: "zone-1", enterCount: 4, exitCount: 4, totalDurationSeconds: 1200 },
    ],
    summary: { totalEntries: 4 },
  });

  assert.strictEqual(result.metadata.tenantId, "tenant-test-01");
  assert.strictEqual(result.rows.length, 1);

  // 2. Export to JSON
  const jsonExport = AnalyticsExportService.export(result, { format: "json" });
  assert.strictEqual(jsonExport.format, "json");
  assert.ok(jsonExport.content.includes("tenant-test-01"));

  // 3. Export to CSV
  const csvExport = AnalyticsExportService.export(result, { format: "csv" });
  assert.strictEqual(csvExport.format, "csv");
  assert.ok(csvExport.content.includes("enterCount"));

  console.log("  ✅ SpatialAnalyticsUnitTests Passed");
}
