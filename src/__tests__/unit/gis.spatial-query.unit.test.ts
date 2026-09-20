import assert from "node:assert";
import { SpatialQueryValidator } from "../../core/gis/query/spatial-query-validator";
import { SpatialFilterProcessor } from "../../core/gis/query/spatial-filter-processor";
import { SPATIAL_QUERY_LIMITS } from "../../core/gis/query/query-limits.config";
import {
  InvalidFilterError,
  SpatialQueryTooComplexError,
  QueryLimitExceededError,
  InvalidRadiusError,
  InvalidTimeRangeError,
} from "../../core/errors/spatial-errors";

export function runSpatialQueryUnitTests() {
  console.log(
    "  [Unit] Testing SpatialQueryValidator & SpatialFilterProcessor...",
  );

  // 1. Whitelisted field validation
  assert.doesNotThrow(() => {
    SpatialQueryValidator.validate({
      filters: [{ field: "name", operator: "equals", value: "Central Hub" }],
    });
  });

  // 2. Reject non-whitelisted field
  assert.throws(
    () => {
      SpatialQueryValidator.validate({
        filters: [
          { field: "DROP TABLE users;--", operator: "equals", value: "test" },
        ],
      });
    },
    (err: any) => err instanceof InvalidFilterError,
  );

  // 3. Reject invalid operator
  assert.throws(
    () => {
      SpatialQueryValidator.validate({
        filters: [{ field: "name", operator: "LIKE" as any, value: "test" }],
      });
    },
    (err: any) => err instanceof InvalidFilterError,
  );

  // 4. Enforce max filter limit
  assert.throws(
    () => {
      const filters = Array.from({ length: 25 }, (_, i) => ({
        field: "name",
        operator: "equals" as const,
        value: `val-${i}`,
      }));
      SpatialQueryValidator.validate({ filters });
    },
    (err: any) => err instanceof SpatialQueryTooComplexError,
  );

  // 5. Enforce nesting depth limit
  assert.throws(
    () => {
      const deeplyNested: any = {
        connector: "AND",
        filters: [
          {
            connector: "OR",
            filters: [
              {
                connector: "AND",
                filters: [
                  {
                    connector: "OR",
                    filters: [
                      {
                        connector: "AND",
                        filters: [
                          { field: "name", operator: "equals", value: "x" },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      SpatialQueryValidator.validate({ filters: deeplyNested });
    },
    (err: any) => err instanceof SpatialQueryTooComplexError,
  );

  // 6. Enforce max radius limit (100km)
  assert.throws(
    () => {
      SpatialQueryValidator.validateRadius(150_000);
    },
    (err: any) => err instanceof InvalidRadiusError,
  );

  // 7. Enforce time range limits
  assert.throws(
    () => {
      SpatialQueryValidator.validateTimeRange(
        "2026-01-01T00:00:00Z",
        "2024-01-01T00:00:00Z",
      );
    },
    (err: any) => err instanceof InvalidTimeRangeError,
  );

  // 8. Filter processor converts to parameterized SQL
  const sqlFragment = SpatialFilterProcessor.processFilters([
    { field: "name", operator: "startsWith", value: "Test" },
    { field: "type", operator: "equals", value: "poi" },
  ]);
  assert.ok(sqlFragment !== null, "SQL fragment should be generated");

  console.log("  ✅ SpatialQueryUnitTests Passed");
}
