/**
 * Spatial Query Limits Configuration
 *
 * Configurable safety limits for the GIS Query & Analytics Engine.
 * These limits prevent resource exhaustion, expensive spatial joins,
 * and protect against query abuse while keeping the system healthy
 * for approximately 600 concurrent production users.
 */

export const SPATIAL_QUERY_LIMITS = {
  /** Maximum number of attribute/spatial/temporal filters per query */
  MAX_FILTERS: 20,

  /** Maximum nesting depth for AND/OR filter groups */
  MAX_NESTING_DEPTH: 4,

  /** Maximum features returned per page (hard ceiling) */
  MAX_RESULT_LIMIT: 500,

  /** Default features returned per page */
  DEFAULT_RESULT_LIMIT: 50,

  /** Maximum radius for spatial radius queries (meters) — 100 km */
  MAX_RADIUS_METERS: 100_000,

  /** Maximum time range for historical queries (days) */
  MAX_TIME_RANGE_DAYS: 365,

  /** Maximum coordinate vertices in a query polygon */
  MAX_POLYGON_VERTICES: 1_000,

  /** Maximum number of aggregation dimensions in a single query */
  MAX_AGGREGATION_DIMENSIONS: 5,

  /** Query execution timeout in milliseconds (30 seconds) */
  QUERY_TIMEOUT_MS: 30_000,

  /** Maximum nearest-neighbor count per query */
  MAX_NEAREST_N: 100,

  /** Maximum number of zone polygons in a single countByPolygon call */
  MAX_ZONE_POLYGONS: 50,

  /** Maximum time-series data points returned */
  MAX_TIMESERIES_POINTS: 1_000,

  /** Maximum text search results */
  MAX_TEXT_SEARCH_RESULTS: 200,

  /** Maximum cursor pagination history records per page */
  MAX_HISTORY_PAGE_SIZE: 200,

  /** Gap threshold between consecutive observations for track gap detection (seconds) */
  TRACK_GAP_THRESHOLD_SECONDS: 3_600, // 1 hour gap = significant gap
} as const;

export type SpatialQueryLimitsType = typeof SPATIAL_QUERY_LIMITS;
