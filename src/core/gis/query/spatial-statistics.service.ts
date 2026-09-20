/**
 * SpatialStatisticsService — Generic Geometry & Proximity Statistics
 *
 * Provides:
 *  - Area statistics (total, avg, min, max) for polygon features
 *  - Length statistics (total, avg, min, max) for line features
 *  - Proximity statistics (count within radius, nearest, avg/min/max distance)
 *  - Spatial density analysis (points per sq km)
 *
 * All calculations use PostGIS geography type for accurate ellipsoidal results.
 * Returns meters internally; kilometers provided as convenience.
 */

import { sql } from "drizzle-orm";
import { DatabaseClient } from "@/database";
import { Coordinate } from "../types/geometry";
import { BoundingBox } from "../bbox/bounding-box";
import { SPATIAL_QUERY_LIMITS } from "./query-limits.config";
import { SpatialQueryValidator } from "./spatial-query-validator";
import { AreaStats, LengthStats, ProximityStats } from "./spatial-query.model";

// ─── SpatialStatisticsService ─────────────────────────────────────────────────

export class SpatialStatisticsService {
  constructor(private readonly db: DatabaseClient) {}

  // ─── Area Statistics ───────────────────────────────────────────────────────

  /**
   * Calculate area statistics for polygon features.
   * Uses PostGIS ST_Area with geography type (accurate ellipsoidal).
   * Returns square meters internally.
   *
   * @param layerId Optional feature type filter
   */
  async areaStats(
    tenantId: string,
    options?: { layerId?: string; from?: string; to?: string },
  ): Promise<AreaStats & { queryDurationMs: number }> {
    const start = Date.now();
    const layerFilter = options?.layerId
      ? sql`AND type = ${options.layerId}`
      : sql.raw("");
    const fromFilter = options?.from
      ? sql`AND created_at >= ${options.from}::timestamptz`
      : sql.raw("");
    const toFilter = options?.to
      ? sql`AND created_at <= ${options.to}::timestamptz`
      : sql.raw("");

    try {
      const result = await this.db.execute(sql`
        SELECT
          COUNT(*) as feature_count,
          COALESCE(SUM(ST_Area(geometry::geography)), 0) as total_sq_meters,
          COALESCE(AVG(ST_Area(geometry::geography)), 0) as avg_sq_meters,
          COALESCE(MIN(ST_Area(geometry::geography)), 0) as min_sq_meters,
          COALESCE(MAX(ST_Area(geometry::geography)), 0) as max_sq_meters
        FROM spatial_features
        WHERE tenant_id = ${tenantId}::uuid
          AND GeometryType(geometry) IN ('POLYGON', 'MULTIPOLYGON')
          ${layerFilter}
          ${fromFilter}
          ${toFilter}
      `);

      const row = result.rows?.[0] as
        | {
            feature_count: number;
            total_sq_meters: number;
            avg_sq_meters: number;
            min_sq_meters: number;
            max_sq_meters: number;
          }
        | undefined;

      return {
        totalSqMeters: Number(row?.total_sq_meters ?? 0),
        avgSqMeters: Number(row?.avg_sq_meters ?? 0),
        minSqMeters: Number(row?.min_sq_meters ?? 0),
        maxSqMeters: Number(row?.max_sq_meters ?? 0),
        featureCount: Number(row?.feature_count ?? 0),
        queryDurationMs: Date.now() - start,
      };
    } catch {
      return {
        totalSqMeters: 0,
        avgSqMeters: 0,
        minSqMeters: 0,
        maxSqMeters: 0,
        featureCount: 0,
        queryDurationMs: Date.now() - start,
      };
    }
  }

  // ─── Length Statistics ─────────────────────────────────────────────────────

  /**
   * Calculate length statistics for line features.
   * Uses PostGIS ST_Length with geography type.
   * Returns meters internally.
   */
  async lengthStats(
    tenantId: string,
    options?: { layerId?: string; from?: string; to?: string },
  ): Promise<LengthStats & { queryDurationMs: number }> {
    const start = Date.now();
    const layerFilter = options?.layerId
      ? sql`AND type = ${options.layerId}`
      : sql.raw("");
    const fromFilter = options?.from
      ? sql`AND created_at >= ${options.from}::timestamptz`
      : sql.raw("");
    const toFilter = options?.to
      ? sql`AND created_at <= ${options.to}::timestamptz`
      : sql.raw("");

    try {
      const result = await this.db.execute(sql`
        SELECT
          COUNT(*) as feature_count,
          COALESCE(SUM(ST_Length(geometry::geography)), 0) as total_meters,
          COALESCE(AVG(ST_Length(geometry::geography)), 0) as avg_meters,
          COALESCE(MIN(ST_Length(geometry::geography)), 0) as min_meters,
          COALESCE(MAX(ST_Length(geometry::geography)), 0) as max_meters
        FROM spatial_features
        WHERE tenant_id = ${tenantId}::uuid
          AND GeometryType(geometry) IN ('LINESTRING', 'MULTILINESTRING')
          ${layerFilter}
          ${fromFilter}
          ${toFilter}
      `);

      const row = result.rows?.[0] as
        | {
            feature_count: number;
            total_meters: number;
            avg_meters: number;
            min_meters: number;
            max_meters: number;
          }
        | undefined;

      return {
        totalMeters: Number(row?.total_meters ?? 0),
        avgMeters: Number(row?.avg_meters ?? 0),
        minMeters: Number(row?.min_meters ?? 0),
        maxMeters: Number(row?.max_meters ?? 0),
        featureCount: Number(row?.feature_count ?? 0),
        queryDurationMs: Date.now() - start,
      };
    } catch {
      return {
        totalMeters: 0,
        avgMeters: 0,
        minMeters: 0,
        maxMeters: 0,
        featureCount: 0,
        queryDurationMs: Date.now() - start,
      };
    }
  }

  // ─── Proximity Statistics ──────────────────────────────────────────────────

  /**
   * Compute proximity statistics for current positions within a radius.
   * Returns: count, nearest distance, avg/min/max distance to center point.
   */
  async proximityStats(
    tenantId: string,
    center: Coordinate,
    radiusMeters: number,
    options?: { subjectType?: string },
  ): Promise<ProximityStats & { queryDurationMs: number }> {
    const start = Date.now();
    SpatialQueryValidator.validateRadius(radiusMeters);

    const [lng, lat] = center;
    const typeFilter = options?.subjectType
      ? sql`AND ss.type = ${options.subjectType}`
      : sql.raw("");

    try {
      const result = await this.db.execute(sql`
        SELECT
          COUNT(*) as subject_count,
          MIN(ST_Distance(cp.location::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography)) as nearest_meters,
          AVG(ST_Distance(cp.location::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography)) as avg_meters,
          MIN(ST_Distance(cp.location::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography)) as min_meters,
          MAX(ST_Distance(cp.location::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography)) as max_meters
        FROM spatial_current_positions cp
        JOIN spatial_subjects ss ON ss.id = cp.subject_id
        WHERE cp.tenant_id = ${tenantId}::uuid
          AND ST_DWithin(
            cp.location::geography,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
            ${radiusMeters}
          )
          ${typeFilter}
      `);

      const row = result.rows?.[0] as
        | {
            subject_count: number;
            nearest_meters: number | null;
            avg_meters: number | null;
            min_meters: number | null;
            max_meters: number | null;
          }
        | undefined;

      return {
        subjectsWithinRadius: Number(row?.subject_count ?? 0),
        nearestDistanceMeters:
          row?.nearest_meters != null ? Number(row.nearest_meters) : null,
        avgDistanceMeters:
          row?.avg_meters != null ? Number(row.avg_meters) : null,
        minDistanceMeters:
          row?.min_meters != null ? Number(row.min_meters) : null,
        maxDistanceMeters:
          row?.max_meters != null ? Number(row.max_meters) : null,
        queryDurationMs: Date.now() - start,
      };
    } catch {
      return {
        subjectsWithinRadius: 0,
        nearestDistanceMeters: null,
        avgDistanceMeters: null,
        minDistanceMeters: null,
        maxDistanceMeters: null,
        queryDurationMs: Date.now() - start,
      };
    }
  }

  // ─── Spatial Density ───────────────────────────────────────────────────────

  /**
   * Calculate spatial density: observations (location history points)
   * per square kilometer within a bounding box.
   *
   * Returns: pointCount, bboxAreaSqKm, pointsPerSqKm
   */
  async densityAnalysis(
    tenantId: string,
    bbox: BoundingBox,
    options?: { from?: string; to?: string; subjectType?: string },
  ): Promise<{
    pointCount: number;
    bboxAreaSqKm: number;
    pointsPerSqKm: number;
    queryDurationMs: number;
  }> {
    const start = Date.now();
    const { minLng, minLat, maxLng, maxLat } = bbox;

    const fromFilter = options?.from
      ? sql`AND slh.timestamp >= ${options.from}::timestamptz`
      : sql.raw("");
    const toFilter = options?.to
      ? sql`AND slh.timestamp <= ${options.to}::timestamptz`
      : sql.raw("");

    try {
      const result = await this.db.execute(sql`
        SELECT
          COUNT(*) as point_count,
          ST_Area(ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)::geography) / 1000000 as bbox_area_sq_km
        FROM spatial_location_history slh
        WHERE slh.tenant_id = ${tenantId}::uuid
          AND slh.location && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
          ${fromFilter}
          ${toFilter}
      `);

      const row = result.rows?.[0] as
        { point_count: number; bbox_area_sq_km: number } | undefined;
      const pointCount = Number(row?.point_count ?? 0);
      const bboxAreaSqKm = Number(row?.bbox_area_sq_km ?? 0);
      const pointsPerSqKm =
        bboxAreaSqKm > 0
          ? Math.round((pointCount / bboxAreaSqKm) * 100) / 100
          : 0;

      return {
        pointCount,
        bboxAreaSqKm,
        pointsPerSqKm,
        queryDurationMs: Date.now() - start,
      };
    } catch {
      return {
        pointCount: 0,
        bboxAreaSqKm: 0,
        pointsPerSqKm: 0,
        queryDurationMs: Date.now() - start,
      };
    }
  }

  // ─── Distance Statistics ───────────────────────────────────────────────────

  /**
   * Calculate distance statistics between features and a reference point.
   * Returns min, max, average distance in meters.
   */
  async distanceStats(
    tenantId: string,
    referencePoint: Coordinate,
    options?: { layerId?: string; limit?: number },
  ): Promise<{
    minDistanceMeters: number;
    maxDistanceMeters: number;
    avgDistanceMeters: number;
    featureCount: number;
    queryDurationMs: number;
  }> {
    const start = Date.now();
    const [lng, lat] = referencePoint;
    const layerFilter = options?.layerId
      ? sql`AND type = ${options.layerId}`
      : sql.raw("");

    try {
      const result = await this.db.execute(sql`
        SELECT
          COUNT(*) as feature_count,
          MIN(ST_Distance(geometry::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography)) as min_meters,
          MAX(ST_Distance(geometry::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography)) as max_meters,
          AVG(ST_Distance(geometry::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography)) as avg_meters
        FROM spatial_features
        WHERE tenant_id = ${tenantId}::uuid
          ${layerFilter}
      `);

      const row = result.rows?.[0] as
        | {
            feature_count: number;
            min_meters: number | null;
            max_meters: number | null;
            avg_meters: number | null;
          }
        | undefined;

      return {
        minDistanceMeters: Number(row?.min_meters ?? 0),
        maxDistanceMeters: Number(row?.max_meters ?? 0),
        avgDistanceMeters: Number(row?.avg_meters ?? 0),
        featureCount: Number(row?.feature_count ?? 0),
        queryDurationMs: Date.now() - start,
      };
    } catch {
      return {
        minDistanceMeters: 0,
        maxDistanceMeters: 0,
        avgDistanceMeters: 0,
        featureCount: 0,
        queryDurationMs: Date.now() - start,
      };
    }
  }
}
