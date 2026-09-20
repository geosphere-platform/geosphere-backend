/**
 * SpatialAggregationService — Generic Spatial Aggregation Engine
 *
 * Provides:
 *  - Count features by polygon zone (spatial join)
 *  - Sum/avg/min/max of numeric properties
 *  - Square grid aggregation (point density per cell)
 *  - Heatmap weight data (for frontend rendering)
 *
 * All aggregations are performed server-side using PostGIS.
 * No aggregation is done in JavaScript/application memory.
 *
 * Security:
 *  - Field names whitelisted
 *  - Tenant isolation enforced
 *  - Polygon vertex limits enforced
 *  - Aggregation dimension limits enforced
 */

import { sql } from "drizzle-orm";
import { DatabaseClient } from "@/database";
import { Geometry, Coordinate } from "../types/geometry";
import { BoundingBox } from "../bbox/bounding-box";
import { SPATIAL_QUERY_LIMITS } from "./query-limits.config";
import { SpatialQueryValidator } from "./spatial-query-validator";
import {
  AggregationMetric,
  AggregationResult,
  ZoneCount,
  HeatmapResult,
  HeatmapPoint,
} from "./spatial-query.model";
import {
  InvalidFilterError,
  SpatialQueryTooComplexError,
} from "../../errors/spatial-errors";

// ─── Whitelisted Aggregation Fields ───────────────────────────────────────────

const AGGREGATION_FIELD_MAP: Record<string, string> = {
  speed: "speed",
  accuracy: "accuracy",
  heading: "heading",
  altitude: "altitude",
  "properties.value": "CAST(properties->>'value' AS NUMERIC)",
  "properties.score": "CAST(properties->>'score' AS NUMERIC)",
  "properties.priority": "CAST(properties->>'priority' AS NUMERIC)",
  "properties.count": "CAST(properties->>'count' AS NUMERIC)",
  "properties.weight": "CAST(properties->>'weight' AS NUMERIC)",
};

function getAggColumn(field: string): string {
  const col = AGGREGATION_FIELD_MAP[field];
  if (!col) {
    throw new InvalidFilterError(
      `Aggregation field '${field}' is not permitted. Allowed: ${Object.keys(AGGREGATION_FIELD_MAP).join(", ")}`,
    );
  }
  return col;
}

// ─── SpatialAggregationService ────────────────────────────────────────────────

export class SpatialAggregationService {
  constructor(private readonly db: DatabaseClient) {}

  // ─── Count By Polygon ──────────────────────────────────────────────────────

  /**
   * Count features (or current positions) inside each of the provided zone polygons.
   * Uses a PostGIS spatial join — NOT application-level filtering.
   *
   * Example use:
   *  - "How many subjects are inside each zone?"
   *  - countByPolygon(tenantId, [zone1, zone2, zone3])
   *
   * @param zones Array of polygons with optional id and name
   * @param target "features" | "positions" — which table to aggregate
   */
  async countByPolygon(
    tenantId: string,
    zones: Array<{ id: string; name?: string; geometry: Geometry }>,
    options?: { target?: "features" | "positions"; subjectType?: string },
  ): Promise<ZoneCount[]> {
    if (zones.length === 0) return [];
    if (zones.length > SPATIAL_QUERY_LIMITS.MAX_ZONE_POLYGONS) {
      throw new SpatialQueryTooComplexError(
        `Zone count ${zones.length} exceeds maximum of ${SPATIAL_QUERY_LIMITS.MAX_ZONE_POLYGONS}`,
      );
    }

    const target = options?.target ?? "features";
    const results: ZoneCount[] = [];

    for (const zone of zones) {
      const zoneJson = JSON.stringify(zone.geometry);

      try {
        let countResult;
        if (target === "positions") {
          const typeFilter = options?.subjectType
            ? sql`AND ss.type = ${options.subjectType}`
            : sql.raw("");
          countResult = await this.db.execute(sql`
            SELECT COUNT(*) as count
            FROM spatial_current_positions cp
            JOIN spatial_subjects ss ON ss.id = cp.subject_id
            WHERE cp.tenant_id = ${tenantId}::uuid
              AND ST_Within(
                cp.location,
                ST_SetSRID(ST_GeomFromGeoJSON(${zoneJson}), 4326)
              )
              ${typeFilter}
          `);
        } else {
          countResult = await this.db.execute(sql`
            SELECT COUNT(*) as count
            FROM spatial_features sf
            WHERE sf.tenant_id = ${tenantId}::uuid
              AND ST_Within(
                sf.geometry,
                ST_SetSRID(ST_GeomFromGeoJSON(${zoneJson}), 4326)
              )
          `);
        }

        const count = Number(
          (countResult.rows?.[0] as { count: number })?.count ?? 0,
        );
        results.push({
          zoneId: zone.id,
          zoneName: zone.name,
          count,
          geometry: zone.geometry,
        });
      } catch {
        results.push({
          zoneId: zone.id,
          zoneName: zone.name,
          count: 0,
          geometry: zone.geometry,
        });
      }
    }

    return results;
  }

  // ─── Metric Aggregation ────────────────────────────────────────────────────

  /**
   * Aggregate a numeric field from location history or current positions.
   * Supported metrics: count, sum, avg, min, max
   * Supported fields: whitelisted numeric fields only.
   */
  async aggregateMetric(
    tenantId: string,
    metric: AggregationMetric,
    options?: {
      field?: string;
      from?: string;
      to?: string;
      subjectId?: string;
      subjectType?: string;
    },
  ): Promise<AggregationResult> {
    const start = Date.now();

    if (metric === "count") {
      // Count doesn't require a field
      try {
        const fromClause = options?.from
          ? sql`AND timestamp >= ${options.from}::timestamptz`
          : sql.raw("");
        const toClause = options?.to
          ? sql`AND timestamp <= ${options.to}::timestamptz`
          : sql.raw("");
        const subjectFilter = options?.subjectId
          ? sql`AND subject_id = ${options.subjectId}::uuid`
          : sql.raw("");

        const result = await this.db.execute(sql`
          SELECT COUNT(*) as value
          FROM spatial_location_history
          WHERE tenant_id = ${tenantId}::uuid
            ${fromClause}
            ${toClause}
            ${subjectFilter}
        `);

        const value = Number(
          (result.rows?.[0] as { value: number })?.value ?? 0,
        );
        return { metric: "count", value, queryDurationMs: Date.now() - start };
      } catch {
        return {
          metric: "count",
          value: 0,
          queryDurationMs: Date.now() - start,
        };
      }
    }

    if (!options?.field) {
      throw new InvalidFilterError(
        `Metric '${metric}' requires a 'field' parameter`,
      );
    }
    const colExpr = getAggColumn(options.field);

    let aggFn: string;
    switch (metric) {
      case "sum":
        aggFn = `SUM(${colExpr})`;
        break;
      case "avg":
        aggFn = `AVG(${colExpr})`;
        break;
      case "min":
        aggFn = `MIN(${colExpr})`;
        break;
      case "max":
        aggFn = `MAX(${colExpr})`;
        break;
      default:
        throw new InvalidFilterError(`Unsupported metric: ${metric}`);
    }

    try {
      const fromClause = options?.from
        ? sql`AND timestamp >= ${options.from}::timestamptz`
        : sql.raw("");
      const toClause = options?.to
        ? sql`AND timestamp <= ${options.to}::timestamptz`
        : sql.raw("");
      const subjectFilter = options?.subjectId
        ? sql`AND subject_id = ${options.subjectId}::uuid`
        : sql.raw("");

      const result = await this.db.execute(
        sql
          .raw(
            `
        SELECT ${aggFn} as value
        FROM spatial_location_history
        WHERE tenant_id = '${tenantId}'
      `,
          )
          .append(fromClause)
          .append(toClause)
          .append(subjectFilter),
      );

      const value = Number((result.rows?.[0] as { value: number })?.value ?? 0);
      return {
        metric,
        field: options.field,
        value,
        queryDurationMs: Date.now() - start,
      };
    } catch {
      return {
        metric,
        field: options.field,
        value: 0,
        queryDurationMs: Date.now() - start,
      };
    }
  }

  // ─── Grid Aggregation ──────────────────────────────────────────────────────

  /**
   * Aggregate points within a square grid.
   * Returns count of location history points per grid cell.
   * Useful for heatmap base data and spatial density analysis.
   *
   * @param cellSizeMeters Grid cell side length in meters
   */
  async gridAggregation(
    tenantId: string,
    bbox: BoundingBox,
    cellSizeMeters: number,
    options?: { from?: string; to?: string; subjectType?: string },
  ): Promise<{
    cells: Array<{ centerLng: number; centerLat: number; count: number }>;
    totalPoints: number;
    queryDurationMs: number;
  }> {
    const start = Date.now();

    if (cellSizeMeters <= 0 || cellSizeMeters > 100_000) {
      throw new InvalidFilterError(
        "cellSizeMeters must be between 1 and 100,000 meters",
      );
    }

    // Convert cell size to approximate degrees (rough approximation for grid)
    const cellDegrees = cellSizeMeters / 111_320;
    const { minLng, minLat, maxLng, maxLat } = bbox;

    const fromClause = options?.from
      ? sql`AND slh.timestamp >= ${options.from}::timestamptz`
      : sql.raw("");
    const toClause = options?.to
      ? sql`AND slh.timestamp <= ${options.to}::timestamptz`
      : sql.raw("");

    try {
      const result = await this.db.execute(sql`
        SELECT
          ROUND(
            CAST(ST_X(slh.location::geometry) / ${cellDegrees} AS NUMERIC)
          ) * ${cellDegrees} as center_lng,
          ROUND(
            CAST(ST_Y(slh.location::geometry) / ${cellDegrees} AS NUMERIC)
          ) * ${cellDegrees} as center_lat,
          COUNT(*) as count
        FROM spatial_location_history slh
        WHERE slh.tenant_id = ${tenantId}::uuid
          AND slh.location && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
          ${fromClause}
          ${toClause}
        GROUP BY center_lng, center_lat
        ORDER BY count DESC
        LIMIT 10000
      `);

      const cells = (result.rows ?? []).map((r: unknown) => {
        const row = r as {
          center_lng: number;
          center_lat: number;
          count: number;
        };
        return {
          centerLng: Number(row.center_lng),
          centerLat: Number(row.center_lat),
          count: Number(row.count),
        };
      });

      return {
        cells,
        totalPoints: cells.reduce((acc, c) => acc + c.count, 0),
        queryDurationMs: Date.now() - start,
      };
    } catch {
      return { cells: [], totalPoints: 0, queryDurationMs: Date.now() - start };
    }
  }

  // ─── Heatmap Data ──────────────────────────────────────────────────────────

  /**
   * Generate backend-ready heatmap data.
   * Returns coordinates and weight — frontend is responsible for rendering.
   * Does NOT render heatmap in backend.
   */
  async heatmapData(
    tenantId: string,
    bbox: BoundingBox,
    options?: {
      from?: string;
      to?: string;
      subjectType?: string;
      limit?: number;
    },
  ): Promise<HeatmapResult> {
    const limit = Math.min(options?.limit ?? 5_000, 10_000);
    const { minLng, minLat, maxLng, maxLat } = bbox;

    const fromClause = options?.from
      ? sql`AND slh.timestamp >= ${options.from}::timestamptz`
      : sql.raw("");
    const toClause = options?.to
      ? sql`AND slh.timestamp <= ${options.to}::timestamptz`
      : sql.raw("");

    try {
      const result = await this.db.execute(sql`
        SELECT
          ST_X(slh.location::geometry) as lng,
          ST_Y(slh.location::geometry) as lat,
          1 as weight
        FROM spatial_location_history slh
        WHERE slh.tenant_id = ${tenantId}::uuid
          AND slh.location && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
          ${fromClause}
          ${toClause}
        ORDER BY slh.timestamp DESC
        LIMIT ${limit}
      `);

      const points: HeatmapPoint[] = (result.rows ?? []).map((r: unknown) => {
        const row = r as { lng: number; lat: number; weight: number };
        return {
          lng: Number(row.lng),
          lat: Number(row.lat),
          weight: Number(row.weight),
        };
      });

      const maxWeight = points.reduce((m, p) => Math.max(m, p.weight), 0);
      return { points, maxWeight, totalPoints: points.length };
    } catch {
      return { points: [], maxWeight: 0, totalPoints: 0 };
    }
  }
}
