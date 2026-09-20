/**
 * Spatial Query Domain Models
 *
 * Business-agnostic query model supporting attribute, spatial, temporal,
 * and combined filtering. The tenantId is NEVER accepted from client input —
 * it is always resolved from the authenticated JWT context.
 */

import { Geometry, Coordinate } from "../types/geometry";
import { GeoJsonFeatureCollection } from "../types/geojson";

// ─── Query Types ─────────────────────────────────────────────────────────────

export type QueryType =
  | "ATTRIBUTE"
  | "SPATIAL"
  | "TEMPORAL"
  | "SPATIAL_ATTRIBUTE"
  | "SPATIAL_TEMPORAL"
  | "ATTRIBUTE_TEMPORAL"
  | "SPATIAL_ATTRIBUTE_TEMPORAL";

// ─── Spatial Predicates ───────────────────────────────────────────────────────

export type SpatialPredicate =
  | "within"
  | "contains"
  | "intersects"
  | "covers"
  | "coveredBy"
  | "touches"
  | "overlaps"
  | "crosses"
  | "disjoint"
  | "dwithin"; // distance-based

// ─── Filter Operators ─────────────────────────────────────────────────────────

export type FilterOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual"
  | "in"
  | "notIn"
  | "isNull"
  | "isNotNull";

// ─── Logical Connectors ───────────────────────────────────────────────────────

export type LogicalConnector = "AND" | "OR";

// ─── Attribute Filter ─────────────────────────────────────────────────────────

export interface AttributeFilter {
  field: string; // Must match whitelisted field name
  operator: FilterOperator;
  value?: unknown; // Not accepted for isNull / isNotNull
  values?: unknown[]; // Used for "in" / "notIn"
}

// ─── Filter Group (supports nesting) ─────────────────────────────────────────

export interface FilterGroup {
  connector: LogicalConnector;
  filters: Array<AttributeFilter | FilterGroup>;
}

// ─── Spatial Filter ───────────────────────────────────────────────────────────

export interface BBoxFilter {
  type: "bbox";
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export interface RadiusFilter {
  type: "radius";
  center: Coordinate; // [lng, lat]
  radiusMeters: number;
}

export interface GeometryFilter {
  type: "geometry";
  geometry: Geometry;
  predicate: SpatialPredicate;
}

export type SpatialFilter = BBoxFilter | RadiusFilter | GeometryFilter;

// ─── Temporal Filter ──────────────────────────────────────────────────────────

export interface TemporalFilter {
  from?: string; // ISO 8601 UTC
  to?: string; // ISO 8601 UTC
  field?: string; // Defaults to 'timestamp'; must be whitelisted
}

// ─── Sort Options ─────────────────────────────────────────────────────────────

export type SortField =
  | "timestamp"
  | "distance"
  | "name"
  | "createdAt"
  | "updatedAt"
  | "area"
  | "length";

export type SortOrder = "asc" | "desc";

export interface SortOptions {
  field: SortField;
  order: SortOrder;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface CursorPagination {
  limit: number;
  cursor?: string; // Opaque cursor from previous page's last item
}

// ─── Master SpatialQuery ──────────────────────────────────────────────────────

export interface SpatialQuery {
  /** Query type — determines which filters are required */
  type?: QueryType;

  /** Optional layer/type filter (feature type constraint) */
  layerId?: string;

  /** Attribute filter group (top-level AND/OR group, or simple flat list) */
  filters?: FilterGroup | AttributeFilter[];

  /** Spatial constraint */
  spatialFilter?: SpatialFilter;

  /** Time range constraint */
  temporalFilter?: TemporalFilter;

  /** Sort options */
  sort?: SortOptions;

  /** Cursor-based pagination */
  pagination?: CursorPagination;

  /** Alias: direct limit shorthand (overrides pagination.limit) */
  limit?: number;

  /**
   * Optional text search term (applied to name, externalId, description)
   * Combined with other filters server-side.
   */
  searchText?: string;

  /**
   * Optional field selection (e.g. ['name', 'status']).
   * When provided, only specified properties will be returned in feature properties.
   */
  fields?: string[];

  /**
   * NOTE: tenantId is NEVER accepted from client input.
   * It is always injected by the server from the authenticated JWT context.
   */
}

// ─── Query Results ────────────────────────────────────────────────────────────

export interface SpatialQueryMeta {
  queryType: QueryType;
  totalCount: number;
  returnedCount: number;
  limit: number;
  nextCursor?: string;
  queryDurationMs: number;
  tenantId: string;
  appliedFilters: number;
}

export interface SpatialQueryResult {
  features: GeoJsonFeatureCollection;
  meta: SpatialQueryMeta;
}

export interface NearestFeatureResult {
  id: string;
  name?: string;
  geometry: Geometry;
  properties: Record<string, unknown>;
  distanceMeters: number;
}

export interface NearestQueryResult {
  items: NearestFeatureResult[];
  meta: {
    queryDurationMs: number;
    count: number;
    centerPoint: Coordinate;
    maxDistanceMeters: number;
  };
}

// ─── Track Models ─────────────────────────────────────────────────────────────

export interface SpatialTrack {
  subjectId: string;
  from: string;
  to: string;
  geometry: Geometry | null; // GeoJSON LineString or null if insufficient points
  pointCount: number;
  distanceMeters: number;
  distanceKilometers: number;
  durationSeconds: number;
  firstObservationAt: string | null;
  lastObservationAt: string | null;
  hasGaps: boolean;
  gaps: TrackGap[];
  dataQualityNotes: string[];
}

export interface TrackGap {
  fromTimestamp: string;
  toTimestamp: string;
  gapSeconds: number;
}

export interface TrackSpeedStats {
  minSpeedMs: number | null; // m/s reported
  maxSpeedMs: number | null;
  avgSpeedMs: number | null;
  minSpeedKmh: number | null;
  maxSpeedKmh: number | null;
  avgSpeedKmh: number | null;
  observationsWithSpeed: number;
  totalObservations: number;
  dataSource: "reported" | "calculated" | "mixed" | "none";
  note: string;
}

// ─── Geofence Analytics ───────────────────────────────────────────────────────

export interface GeofenceInterval {
  enterTimestamp: string;
  exitTimestamp: string | null; // null = open interval (no exit recorded)
  durationSeconds: number | null;
  isOpen: boolean; // true = ENTER without EXIT
}

export interface GeofenceAnalyticsResult {
  geofenceId: string;
  tenantId: string;
  from: string;
  to: string;
  entryCount: number;
  exitCount: number;
  totalEventCount: number;
  firstEntryAt: string | null;
  lastExitAt: string | null;
  timeInsideSeconds: number; // Sum of closed interval durations
  openIntervals: number; // ENTER without EXIT
  intervals: GeofenceInterval[];
  dataQualityNotes: string[];
}

// ─── Event Analytics ─────────────────────────────────────────────────────────

export interface EventAnalyticsResult {
  totalCount: number;
  countByType: Record<string, number>;
  countBySubject: Record<string, number>;
  countByGeofence: Record<string, number>;
  timeline: TimeSeriesPoint[];
  queryDurationMs: number;
}

// ─── Time Series ─────────────────────────────────────────────────────────────

export type TimeBucket = "hour" | "day" | "week" | "month";

export interface TimeSeriesPoint {
  timestamp: string; // Bucket start ISO UTC
  value: number;
  label?: string;
}

export interface TimeSeriesResult {
  metric: string;
  bucket: TimeBucket;
  from: string;
  to: string;
  points: TimeSeriesPoint[];
  totalPoints: number;
  queryDurationMs: number;
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

export type AggregationMetric = "count" | "sum" | "avg" | "min" | "max";

export interface ZoneCount {
  zoneId: string;
  zoneName?: string;
  count: number;
  geometry?: Geometry;
}

export interface AggregationResult {
  metric: AggregationMetric;
  field?: string;
  value: number | ZoneCount[];
  queryDurationMs: number;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
}

export interface HeatmapResult {
  points: HeatmapPoint[];
  maxWeight: number;
  totalPoints: number;
}

// ─── Statistics ───────────────────────────────────────────────────────────────

export interface AreaStats {
  totalSqMeters: number;
  avgSqMeters: number;
  minSqMeters: number;
  maxSqMeters: number;
  featureCount: number;
}

export interface LengthStats {
  totalMeters: number;
  avgMeters: number;
  minMeters: number;
  maxMeters: number;
  featureCount: number;
}

export interface ProximityStats {
  subjectsWithinRadius: number;
  nearestDistanceMeters: number | null;
  avgDistanceMeters: number | null;
  minDistanceMeters: number | null;
  maxDistanceMeters: number | null;
}
