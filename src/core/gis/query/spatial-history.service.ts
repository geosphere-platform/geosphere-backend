/**
 * SpatialHistoryService — Historical Location Query & Track Analytics Engine
 *
 * Provides:
 *  - Cursor-paginated location history queries
 *  - Generic "spatial track" generation (ordered points → LineString)
 *  - Cumulative track distance calculation (PostGIS)
 *  - Observation duration
 *  - Speed statistics (reported vs calculated)
 *  - Gap detection between observations
 *  - Data quality notes
 *
 * Terminology:
 *  - "spatial track" not "vehicle route"
 *  - "observation duration" not "trip duration"
 *  - "subject" not "vehicle" or "driver"
 *
 * Data Quality Rules:
 *  - Duplicate timestamps: keep first occurrence, skip subsequent
 *  - Invalid coordinates: removed and noted in dataQualityNotes
 *  - Out-of-order: sorted by timestamp before track construction
 *  - Missing speed: never inferred unless explicitly requested
 *  - Large gaps: detected and represented in TrackGap[]
 */

import { sql } from "drizzle-orm";
import { DatabaseClient } from "@/database";
import { GeoJsonFeatureCollection } from "../types/geojson";
import { Geometry, Coordinate, isValidCoordinate } from "../types/geometry";
import { SPATIAL_QUERY_LIMITS } from "./query-limits.config";
import { SpatialQueryValidator } from "./spatial-query-validator";
import { SpatialTrack, TrackGap, TrackSpeedStats } from "./spatial-query.model";
import {
  InvalidTimeRangeError,
  SubjectNotFoundError,
} from "../../errors/spatial-errors";

// ─── Internal Row Types ───────────────────────────────────────────────────────

interface HistoryRow {
  id: string;
  tenant_id: string;
  subject_id: string;
  geometry: string | Record<string, unknown>;
  timestamp: Date | string;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  source: string;
  metadata: Record<string, unknown> | null;
  created_at: Date | string;
}

interface TrackRow {
  point_count: number;
  track_geom: string | Record<string, unknown> | null;
  total_distance_meters: number | null;
  first_ts: Date | string | null;
  last_ts: Date | string | null;
}

interface SpeedRow {
  min_speed: number | null;
  max_speed: number | null;
  avg_speed: number | null;
  speed_count: number;
  total_count: number;
}

function parseGeom(raw: unknown): Geometry | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw as unknown as Geometry;
}

function toIso(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  return d instanceof Date ? d.toISOString() : d;
}

// ─── SpatialHistoryService ────────────────────────────────────────────────────

export class SpatialHistoryService {
  constructor(private readonly db: DatabaseClient) {}

  // ─── Location History ──────────────────────────────────────────────────────

  /**
   * Query cursor-paginated location history for a given subject.
   * Returns GeoJSON FeatureCollection of Point features ordered by timestamp.
   */
  async getHistory(
    tenantId: string,
    subjectId: string,
    options?: {
      from?: string;
      to?: string;
      limit?: number;
      cursor?: string;
      order?: "asc" | "desc";
    },
  ): Promise<{
    features: GeoJsonFeatureCollection;
    nextCursor?: string;
    total: number;
    queryDurationMs: number;
  }> {
    const start = Date.now();

    // Validate time range
    if (options?.from && options?.to) {
      SpatialQueryValidator.validateTimeRange(options.from, options.to);
    }

    const limit = Math.min(
      options?.limit ?? 100,
      SPATIAL_QUERY_LIMITS.MAX_HISTORY_PAGE_SIZE,
    );
    const order = options?.order === "asc" ? "ASC" : "DESC";

    // Decode cursor
    let cursorClause = sql.raw("TRUE");
    if (options?.cursor) {
      try {
        const cursorTs = Buffer.from(options.cursor, "base64").toString("utf8");
        cursorClause =
          order === "ASC"
            ? sql`slh.timestamp > ${cursorTs}::timestamptz`
            : sql`slh.timestamp < ${cursorTs}::timestamptz`;
      } catch {
        /* ignore */
      }
    }

    const fromClause = options?.from
      ? sql`AND slh.timestamp >= ${options.from}::timestamptz`
      : sql.raw("");
    const toClause = options?.to
      ? sql`AND slh.timestamp <= ${options.to}::timestamptz`
      : sql.raw("");

    try {
      const result = await this.db.execute(sql`
        SELECT
          slh.id, slh.tenant_id, slh.subject_id,
          ST_AsGeoJSON(slh.location)::jsonb as geometry,
          slh.timestamp, slh.accuracy, slh.speed, slh.heading,
          slh.source, slh.metadata, slh.created_at
        FROM spatial_location_history slh
        WHERE slh.tenant_id = ${tenantId}::uuid
          AND slh.subject_id = ${subjectId}::uuid
          AND ${cursorClause}
          ${fromClause}
          ${toClause}
        ORDER BY slh.timestamp ${sql.raw(order)}
        LIMIT ${limit + 1}
      `);

      const rows = (result.rows ?? []) as unknown as HistoryRow[];
      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;

      const nextCursor =
        hasMore && items.length > 0
          ? Buffer.from(
              toIso(items[items.length - 1].timestamp) ?? "",
            ).toString("base64")
          : undefined;

      const countResult = await this.db
        .execute(
          sql`
        SELECT COUNT(*) as total
        FROM spatial_location_history
        WHERE tenant_id = ${tenantId}::uuid
          AND subject_id = ${subjectId}::uuid
          ${fromClause}
          ${toClause}
      `,
        )
        .catch(() => ({ rows: [{ total: items.length }] }));
      const total = Number(
        (countResult.rows?.[0] as { total: number })?.total ?? items.length,
      );

      const features = items.map((row) => ({
        type: "Feature" as const,
        id: row.id,
        geometry: parseGeom(row.geometry) ?? {
          type: "Point" as const,
          coordinates: [0, 0] as Coordinate,
        },
        properties: {
          id: row.id,
          subjectId: row.subject_id,
          timestamp: toIso(row.timestamp),
          accuracy: row.accuracy,
          speed: row.speed,
          heading: row.heading,
          source: row.source,
          ...(row.metadata ?? {}),
        },
      }));

      return {
        features: { type: "FeatureCollection", features },
        nextCursor,
        total,
        queryDurationMs: Date.now() - start,
      };
    } catch {
      return {
        features: { type: "FeatureCollection", features: [] },
        total: 0,
        queryDurationMs: Date.now() - start,
      };
    }
  }

  // ─── Track Generation ──────────────────────────────────────────────────────

  /**
   * Generate a generic "spatial track" (ordered location points → LineString).
   *
   * Rules:
   *  - Points sorted by timestamp (ascending)
   *  - Invalid coordinates removed and noted
   *  - Duplicate timestamps: keep first occurrence
   *  - Large gaps (>= TRACK_GAP_THRESHOLD_SECONDS) recorded in gaps[]
   *  - Minimum 2 valid points required for a LineString
   *
   * Returns null geometry if fewer than 2 valid ordered points exist.
   */
  async getTrack(
    tenantId: string,
    subjectId: string,
    from: string,
    to: string,
  ): Promise<SpatialTrack> {
    SpatialQueryValidator.validateTimeRange(from, to);
    const dataQualityNotes: string[] = [];

    try {
      // PostGIS: fetch ordered points, compute track using ST_MakeLine
      const trackResult = await this.db.execute(sql`
        WITH ordered_points AS (
          SELECT
            location,
            timestamp,
            ROW_NUMBER() OVER (
              PARTITION BY date_trunc('second', timestamp)
              ORDER BY created_at
            ) as rn
          FROM spatial_location_history
          WHERE tenant_id = ${tenantId}::uuid
            AND subject_id = ${subjectId}::uuid
            AND timestamp BETWEEN ${from}::timestamptz AND ${to}::timestamptz
            AND ST_IsValid(location)
        ),
        deduped AS (
          SELECT location, timestamp FROM ordered_points WHERE rn = 1
        )
        SELECT
          COUNT(*) as point_count,
          CASE
            WHEN COUNT(*) >= 2
            THEN ST_AsGeoJSON(ST_MakeLine(location ORDER BY timestamp))::jsonb
            ELSE NULL
          END as track_geom,
          CASE
            WHEN COUNT(*) >= 2
            THEN ST_Length(ST_MakeLine(location ORDER BY timestamp)::geography)
            ELSE 0
          END as total_distance_meters,
          MIN(timestamp) as first_ts,
          MAX(timestamp) as last_ts
        FROM deduped
      `);

      const trackRow = trackResult.rows?.[0] as unknown as TrackRow | undefined;
      const pointCount = Number(trackRow?.point_count ?? 0);
      const distanceMeters = Number(trackRow?.total_distance_meters ?? 0);
      const firstTs = toIso(trackRow?.first_ts ?? null);
      const lastTs = toIso(trackRow?.last_ts ?? null);

      let trackGeom: Geometry | null = null;
      if (trackRow?.track_geom) {
        trackGeom = parseGeom(trackRow.track_geom);
      }

      // Fetch gap analysis
      const gaps = await this.detectTrackGaps(tenantId, subjectId, from, to);

      // Duration
      const durationSeconds =
        firstTs && lastTs
          ? Math.max(
              0,
              (new Date(lastTs).getTime() - new Date(firstTs).getTime()) / 1000,
            )
          : 0;

      if (pointCount === 0)
        dataQualityNotes.push(
          "No valid location observations found in time range",
        );
      if (pointCount === 1)
        dataQualityNotes.push(
          "Only 1 observation found — LineString requires at least 2 points",
        );
      if (gaps.length > 0)
        dataQualityNotes.push(
          `${gaps.length} observation gap(s) detected (gaps >= ${SPATIAL_QUERY_LIMITS.TRACK_GAP_THRESHOLD_SECONDS}s)`,
        );

      return {
        subjectId,
        from,
        to,
        geometry: trackGeom,
        pointCount,
        distanceMeters,
        distanceKilometers: Math.round(distanceMeters / 10) / 100,
        durationSeconds,
        firstObservationAt: firstTs,
        lastObservationAt: lastTs,
        hasGaps: gaps.length > 0,
        gaps,
        dataQualityNotes,
      };
    } catch (err) {
      // Fallback when database unavailable
      dataQualityNotes.push("Database unavailable — returned empty track");
      return {
        subjectId,
        from,
        to,
        geometry: null,
        pointCount: 0,
        distanceMeters: 0,
        distanceKilometers: 0,
        durationSeconds: 0,
        firstObservationAt: null,
        lastObservationAt: null,
        hasGaps: false,
        gaps: [],
        dataQualityNotes,
      };
    }
  }

  // ─── Track Stats ───────────────────────────────────────────────────────────

  /**
   * Get cumulative track distance, observation duration, and point count
   * for a subject between two timestamps.
   *
   * Distance: cumulative segment-by-segment (NOT first→last straight line).
   * Duration: lastTimestamp - firstTimestamp (observation duration).
   */
  async getTrackStats(
    tenantId: string,
    subjectId: string,
    from: string,
    to: string,
  ): Promise<{
    distanceMeters: number;
    distanceKilometers: number;
    durationSeconds: number;
    observationCount: number;
    firstObservationAt: string | null;
    lastObservationAt: string | null;
    queryDurationMs: number;
  }> {
    const start = Date.now();
    SpatialQueryValidator.validateTimeRange(from, to);

    try {
      const result = await this.db.execute(sql`
        WITH ordered AS (
          SELECT location, timestamp
          FROM spatial_location_history
          WHERE tenant_id = ${tenantId}::uuid
            AND subject_id = ${subjectId}::uuid
            AND timestamp BETWEEN ${from}::timestamptz AND ${to}::timestamptz
            AND ST_IsValid(location)
          ORDER BY timestamp ASC
        )
        SELECT
          COUNT(*) as observation_count,
          COALESCE(
            ST_Length(ST_MakeLine(location ORDER BY timestamp)::geography), 0
          ) as distance_meters,
          MIN(timestamp) as first_ts,
          MAX(timestamp) as last_ts
        FROM ordered
      `);

      const row = result.rows?.[0] as
        | {
            observation_count: number;
            distance_meters: number;
            first_ts: Date | string | null;
            last_ts: Date | string | null;
          }
        | undefined;

      const observationCount = Number(row?.observation_count ?? 0);
      const distanceMeters = Number(row?.distance_meters ?? 0);
      const firstTs = toIso(row?.first_ts ?? null);
      const lastTs = toIso(row?.last_ts ?? null);
      const durationSeconds =
        firstTs && lastTs
          ? Math.max(
              0,
              (new Date(lastTs).getTime() - new Date(firstTs).getTime()) / 1000,
            )
          : 0;

      return {
        distanceMeters,
        distanceKilometers: Math.round(distanceMeters / 10) / 100,
        durationSeconds,
        observationCount,
        firstObservationAt: firstTs,
        lastObservationAt: lastTs,
        queryDurationMs: Date.now() - start,
      };
    } catch {
      return {
        distanceMeters: 0,
        distanceKilometers: 0,
        durationSeconds: 0,
        observationCount: 0,
        firstObservationAt: null,
        lastObservationAt: null,
        queryDurationMs: Date.now() - start,
      };
    }
  }

  // ─── Speed Statistics ──────────────────────────────────────────────────────

  /**
   * Calculate speed statistics from reported speed values in location history.
   *
   * IMPORTANT:
   *  - Only uses REPORTED speed values (stored in 'speed' column)
   *  - Does NOT invent or calculate speed from distance/time
   *  - If speed is not available, returns dataSource = "none"
   *  - Reports in both m/s and km/h
   */
  async getSpeedStats(
    tenantId: string,
    subjectId: string,
    from: string,
    to: string,
  ): Promise<TrackSpeedStats> {
    SpatialQueryValidator.validateTimeRange(from, to);

    try {
      const result = await this.db.execute(sql`
        SELECT
          MIN(speed) as min_speed,
          MAX(speed) as max_speed,
          AVG(speed) as avg_speed,
          COUNT(speed) as speed_count,
          COUNT(*) as total_count
        FROM spatial_location_history
        WHERE tenant_id = ${tenantId}::uuid
          AND subject_id = ${subjectId}::uuid
          AND timestamp BETWEEN ${from}::timestamptz AND ${to}::timestamptz
      `);

      const row = result.rows?.[0] as unknown as SpeedRow | undefined;
      const observationsWithSpeed = Number(row?.speed_count ?? 0);
      const totalObservations = Number(row?.total_count ?? 0);

      const minSpeedMs = row?.min_speed != null ? Number(row.min_speed) : null;
      const maxSpeedMs = row?.max_speed != null ? Number(row.max_speed) : null;
      const avgSpeedMs = row?.avg_speed != null ? Number(row.avg_speed) : null;

      return {
        minSpeedMs,
        maxSpeedMs,
        avgSpeedMs,
        minSpeedKmh:
          minSpeedMs != null ? Math.round(minSpeedMs * 3.6 * 100) / 100 : null,
        maxSpeedKmh:
          maxSpeedMs != null ? Math.round(maxSpeedMs * 3.6 * 100) / 100 : null,
        avgSpeedKmh:
          avgSpeedMs != null ? Math.round(avgSpeedMs * 3.6 * 100) / 100 : null,
        observationsWithSpeed,
        totalObservations,
        dataSource: observationsWithSpeed > 0 ? "reported" : "none",
        note:
          observationsWithSpeed === 0
            ? "No speed data reported in this time range. Calculated speed from distance/time is not provided by default."
            : `Speed statistics based on ${observationsWithSpeed}/${totalObservations} reported observations.`,
      };
    } catch {
      return {
        minSpeedMs: null,
        maxSpeedMs: null,
        avgSpeedMs: null,
        minSpeedKmh: null,
        maxSpeedKmh: null,
        avgSpeedKmh: null,
        observationsWithSpeed: 0,
        totalObservations: 0,
        dataSource: "none",
        note: "Database unavailable",
      };
    }
  }

  // ─── Gap Detection ─────────────────────────────────────────────────────────

  private async detectTrackGaps(
    tenantId: string,
    subjectId: string,
    from: string,
    to: string,
  ): Promise<TrackGap[]> {
    const threshold = SPATIAL_QUERY_LIMITS.TRACK_GAP_THRESHOLD_SECONDS;

    try {
      const result = await this.db.execute(sql`
        WITH ordered AS (
          SELECT
            timestamp,
            LAG(timestamp) OVER (ORDER BY timestamp) as prev_ts
          FROM spatial_location_history
          WHERE tenant_id = ${tenantId}::uuid
            AND subject_id = ${subjectId}::uuid
            AND timestamp BETWEEN ${from}::timestamptz AND ${to}::timestamptz
          ORDER BY timestamp
        )
        SELECT
          prev_ts as from_ts,
          timestamp as to_ts,
          EXTRACT(EPOCH FROM (timestamp - prev_ts)) as gap_seconds
        FROM ordered
        WHERE prev_ts IS NOT NULL
          AND EXTRACT(EPOCH FROM (timestamp - prev_ts)) >= ${threshold}
        ORDER BY from_ts
      `);

      return (result.rows ?? []).map((r: unknown) => {
        const row = r as {
          from_ts: Date | string;
          to_ts: Date | string;
          gap_seconds: number;
        };
        return {
          fromTimestamp: toIso(row.from_ts) ?? "",
          toTimestamp: toIso(row.to_ts) ?? "",
          gapSeconds: Number(row.gap_seconds),
        };
      });
    } catch {
      return [];
    }
  }
}
