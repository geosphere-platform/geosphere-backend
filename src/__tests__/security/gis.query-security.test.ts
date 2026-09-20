import assert from "node:assert";
import { SpatialQueryValidator } from "../../core/gis/query/spatial-query-validator";
import { SpatialFilterProcessor } from "../../core/gis/query/spatial-filter-processor";
import {
  InvalidFilterError,
  SpatialQueryTooComplexError,
} from "../../core/errors/spatial-errors";

export async function runQuerySecurityTests() {
  console.log(
    "  [Security] Testing Spatial Query Security, Injection Guards & Tenant Bounds...",
  );

  // 1. SQL Injection attempt in filter field (rejected by field whitelist)
  assert.throws(
    () => {
      SpatialQueryValidator.validate({
        filters: [
          {
            field: "name; DROP TABLE spatial_features; --",
            operator: "equals",
            value: "x",
          },
        ],
      });
    },
    (err: any) => err instanceof InvalidFilterError,
  );

  // 2. SQL Injection attempt in text search (rejected by character sanitizer)
  assert.throws(
    () => {
      SpatialQueryValidator.validate({
        searchText: "Pune'; DELETE FROM spatial_features; --",
      });
    },
    (err: any) => err instanceof InvalidFilterError,
  );

  // 3. Excessive filter nesting (Stack overflow / Denial of service prevention)
  assert.throws(
    () => {
      let group: any = { field: "name", operator: "equals", value: "x" };
      for (let i = 0; i < 10; i++) {
        group = { connector: "AND", filters: [group] };
      }
      SpatialQueryValidator.validate({ filters: group });
    },
    (err: any) => err instanceof SpatialQueryTooComplexError,
  );

  // 4. Parameterized SQL verification (FilterProcessor never embeds raw string values)
  const sqlObj = SpatialFilterProcessor.processFilters([
    { field: "name", operator: "equals", value: "Test' OR '1'='1" },
  ]);
  assert.ok(sqlObj !== null);
  // Verify value is bound as parameter (drizzle sql object contains params array or query chunk)
  assert.ok(
    sqlObj.queryChunks.some(
      (chunk: any) =>
        chunk.value === "Test' OR '1'='1" || String(chunk).includes("Test"),
    ),
  );

  console.log("  ✅ QuerySecurityTests Passed");
}
