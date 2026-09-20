/**
 * SpatialAnalyticsService — Generic Geofence, Event & Time-Series Analytics
 *
 * Provides:
 *  - Geofence analytics (entries, exits, time inside, open intervals)
 *  - Event analytics (count by type/subject/geofence/time period)
 *  - Time series aggregation (hourly, daily, weekly, monthly buckets)
 *
 * Event Correctness Rules (ENTER/EXIT intervals):
 *  - ENTER without EXIT → marked as "open interval" (still inside)
 *  - EXIT without ENTER → skipped with a data quality note
 *  - Duplicate ENTER → only first ENTER used per interval
 *  - Duplicate EXIT → only first EXIT after ENTER used
 *  - Out-of-order events → sorted by timestamp before processing
 *
 * Terminology: Generic — not vehicle/fleet-specific.
 *  - SpatialGeofenceAnalytics (not vehicleGeofenceAnalytics)
 *  - SPATIAL_ENTER / SPATIAL_EXIT events from Phase 9
 */

import { sql } from "drizzle-orm";
import { DatabaseClient } from "@/database";
import { SPATIAL_QUERY_LIMITS } from "./query-limits.config";
import { SpatialQueryValidator } from "./spatial-query-validator";
import {
  GeofenceAnalyticsResult,
  GeofenceInterval,
  EventAnalyticsResult,
  TimeSeriesResult,
  TimeSeriesPoint,
  TimeBucket,
} from "./spatial-query.model";
import { createAnalyticsResult } from "./analytics-result.model";
import {
  InvalidFilterError,
  InvalidTimeRangeError,
} from "../../errors/spatial-errors";

// ─── Internal Row Types ───────────────────────────────────────────────────────

interface SpatialEventRow {
  id: string;
  type: string;
  subject_id: string;
  timestamp: Date | string;
  metadata: Record<string, unknown> | null;
}

function toIso(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  return d instanceof Date ? d.toISOString() : d;
}

// ─── SpatialAnalyticsService ──────────────────────────────────────────────────

export class SpatialAnalyticsService {
  constructor(private readonly db: DatabaseClient) {}

  // ─── Geofence Analytics ────────────────────────────────────────────────────

  /**
   * Compute analytics for SPATIAL_ENTER / SPATIAL_EXIT events
   * for a specific geofence in a time range.
   *
   * Algorithm:
   * 1. Fetch all ENTER/EXIT events for the geofence, sorted by timestamp
   * 2. Build intervals: ENTER → EXIT pairs
   * 3. Handle edge cases: open intervals, duplicate events, out-of-order
   * 4. Sum time inside (closed intervals only)
   * 5. Return structured analytics
   */
  async getGeofenceAnalytics(
    tenantId: string,
    geofenceId: string,
    from: string,
    to: string,
  ): Promise<GeofenceAnalyticsResult> {
    SpatialQueryValidator.validateTimeRange(from, to);

    const dataQualityNotes: string[] = [];
    const intervals: GeofenceInterval[] = [];

    try {
      // Fetch all ENTER/EXIT events for this geofence, ordered by timestamp
      const result = await this.db.execute(sql`
        SELECT id, type, subject_id, timestamp, metadata
        FROM spatial_events
        WHERE tenant_id = ${tenantId}::uuid
          AND type IN ('SPATIAL_ENTER', 'SPATIAL_EXIT')
          AND timestamp BETWEEN ${from}::timestamptz AND ${to}::timestamptz
          AND (
            metadata->>'geofenceId' = ${geofenceId}
            OR metadata->>'geofence_id' = ${geofenceId}
          )
        ORDER BY timestamp ASC
      `);

      const events = (result.rows ?? []) as unknown as SpatialEventRow[];

      // ── Build ENTER/EXIT intervals ─────────────────────────────────────────
      let pendingEnter: string | null = null; // timestamp of open ENTER
      let entryCount = 0;
      let exitCount = 0;
      let firstEntryAt: string | null = null;
      let lastExitAt: string | null = null;

      for (const event of events) {
        const ts = toIso(event.timestamp) ?? "";
        const type = event.type;

        if (type === "SPATIAL_ENTER") {
          if (pendingEnter !== null) {
            // Duplicate ENTER — previous interval was open
            dataQualityNotes.push(
              `Duplicate ENTER at ${ts} without preceding EXIT — closing previous open interval`,
            );
            intervals.push({
              enterTimestamp: pendingEnter,
              exitTimestamp: null,
              durationSeconds: null,
              isOpen: true,
            });
          }
          pendingEnter = ts;
          entryCount++;
          if (!firstEntryAt) firstEntryAt = ts;
        } else if (type === "SPATIAL_EXIT") {
          if (pendingEnter === null) {
            // EXIT without preceding ENTER
            dataQualityNotes.push(
              `EXIT at ${ts} without preceding ENTER — skipped`,
            );
            exitCount++;
            continue;
          }
          const enterMs = new Date(pendingEnter).getTime();
          const exitMs = new Date(ts).getTime();
          const durationSeconds = Math.max(0, (exitMs - enterMs) / 1000);

          intervals.push({
            enterTimestamp: pendingEnter,
            exitTimestamp: ts,
            durationSeconds,
            isOpen: false,
          });

          lastExitAt = ts;
          exitCount++;
          pendingEnter = null;
        }
      }

      // Handle trailing open interval (ENTER without EXIT at query boundary)
      if (pendingEnter !== null) {
        intervals.push({
          enterTimestamp: pendingEnter,
          exitTimestamp: null,
          durationSeconds: null,
          isOpen: true,
        });
        dataQualityNotes.push(
          "One or more intervals are open (ENTER recorded but no EXIT within time range)",
        );
      }

      const timeInsideSeconds = intervals
        .filter((i) => !i.isOpen && i.durationSeconds != null)
        .reduce((acc, i) => acc + (i.durationSeconds ?? 0), 0);

      const openIntervals = intervals.filter((i) => i.isOpen).length;

      return {
        geofenceId,
        tenantId,
        from,
        to,
        entryCount,
        exitCount,
        totalEventCount: events.length,
        firstEntryAt,
        lastExitAt,
        timeInsideSeconds,
        openIntervals,
        intervals,
        dataQualityNotes,
      };
    } catch {
      dataQualityNotes.push("Database unavailable — returned empty analytics");
      return {
        geofenceId,
        tenantId,
        from,
        to,
        entryCount: 0,
        exitCount: 0,
        totalEventCount: 0,
        firstEntryAt: null,
        lastExitAt: null,
        timeInsideSeconds: 0,
        openIntervals: 0,
        intervals: [],
        dataQualityNotes,
      };
    }
  }

  // ─── Event Analytics ───────────────────────────────────────────────────────

  /**
   * Aggregate spatial events by type, subject, and geofence.
   * Does not assume business meaning of events.
   */
  async getEventAnalytics(
    tenantId: string,
    options?: {
      eventType?: string;
      subjectId?: string;
      geofenceId?: string;
      from?: string;
      to?: string;
      limit?: number;
    },
  ): Promise<EventAnalyticsResult> {
    const start = Date.now();

    if (options?.from && options?.to) {
      SpatialQueryValidator.validateTimeRange(options.from, options.to);
    }

    const typeFilter = options?.eventType
      ? sql`AND type = ${options.eventType}`
      : sql.raw("");
    const subjectFilter = options?.subjectId
      ? sql`AND subject_id = ${options.subjectId}::uuid`
      : sql.raw("");
    const geofenceFilter = options?.geofenceId
      ? sql`AND (metadata->>'geofenceId' = ${options.geofenceId} OR metadata->>'geofence_id' = ${options.geofenceId})`
      : sql.raw("");
    const fromClause = options?.from
      ? sql`AND timestamp >= ${options.from}::timestamptz`
      : sql.raw("");
    const toClause = options?.to
      ? sql`AND timestamp <= ${options.to}::timestamptz`
      : sql.raw("");

    try {
      // Total count
      const totalResult = await this.db.execute(sql`
        SELECT COUNT(*) as total
        FROM spatial_events
        WHERE tenant_id = ${tenantId}::uuid
          ${typeFilter}
          ${subjectFilter}
          ${geofenceFilter}
          ${fromClause}
          ${toClause}
      `);
      const totalCount = Number(
        (totalResult.rows?.[0] as { total: number })?.total ?? 0,
      );

      // Count by type
      const byTypeResult = await this.db.execute(sql`
        SELECT type, COUNT(*) as count
        FROM spatial_events
        WHERE tenant_id = ${tenantId}::uuid
          ${subjectFilter}
          ${geofenceFilter}
          ${fromClause}
          ${toClause}
        GROUP BY type
        ORDER BY count DESC
        LIMIT 50
      `);
      const countByType: Record<string, number> = {};
      for (const r of (byTypeResult.rows ?? []) as Array<{
        type: string;
        count: number;
      }>) {
        countByType[r.type] = Number(r.count);
      }

      // Count by subject
      const bySubjectResult = await this.db.execute(sql`
        SELECT subject_id, COUNT(*) as count
        FROM spatial_events
        WHERE tenant_id = ${tenantId}::uuid
          ${typeFilter}
          ${geofenceFilter}
          ${fromClause}
          ${toClause}
        GROUP BY subject_id
        ORDER BY count DESC
        LIMIT 50
      `);
      const countBySubject: Record<string, number> = {};
      for (const r of (bySubjectResult.rows ?? []) as Array<{
        subject_id: string;
        count: number;
      }>) {
        countBySubject[r.subject_id] = Number(r.count);
      }

      // Count by geofence (from metadata)
      const byGeofenceResult = await this.db.execute(sql`
        SELECT
          COALESCE(metadata->>'geofenceId', metadata->>'geofence_id', 'unknown') as geofence_id,
          COUNT(*) as count
        FROM spatial_events
        WHERE tenant_id = ${tenantId}::uuid
          ${typeFilter}
          ${subjectFilter}
          ${fromClause}
          ${toClause}
        GROUP BY geofence_id
        ORDER BY count DESC
        LIMIT 50
      `);
      const countByGeofence: Record<string, number> = {};
      for (const r of (byGeofenceResult.rows ?? []) as Array<{
        geofence_id: string;
        count: number;
      }>) {
        countByGeofence[r.geofence_id] = Number(r.count);
      }

      // Daily timeline
      const timelineResult = await this.db.execute(sql`
        SELECT
          DATE_TRUNC('day', timestamp) as ts,
          COUNT(*) as count
        FROM spatial_events
        WHERE tenant_id = ${tenantId}::uuid
          ${typeFilter}
          ${subjectFilter}
          ${geofenceFilter}
          ${fromClause}
          ${toClause}
        GROUP BY ts
        ORDER BY ts
        LIMIT ${SPATIAL_QUERY_LIMITS.MAX_TIMESERIES_POINTS}
      `);
      const timeline: TimeSeriesPoint[] = (timelineResult.rows ?? []).map(
        (r: unknown) => {
          const row = r as { ts: Date | string; count: number };
          return { timestamp: toIso(row.ts) ?? "", value: Number(row.count) };
        },
      );

      return {
        totalCount,
        countByType,
        countBySubject,
        countByGeofence,
        timeline,
        queryDurationMs: Date.now() - start,
      };
    } catch {
      return {
        totalCount: 0,
        countByType: {},
        countBySubject: {},
        countByGeofence: {},
        timeline: [],
        queryDurationMs: Date.now() - start,
      };
    }
  }

  // ─── Time Series ───────────────────────────────────────────────────────────

  /**
   * Time-bucket aggregation of events or location history.
   * Supported metrics: "event_count" | "location_count"
   * Supported buckets: hour, day, week, month
   */
  async getTimeSeries(
    tenantId: string,
    metric: "event_count" | "location_count",
    from: string,
    to: string,
    bucket: TimeBucket,
    options?: {
      eventType?: string;
      subjectId?: string;
    },
  ): Promise<TimeSeriesResult> {
    const start = Date.now();
    SpatialQueryValidator.validateTimeRange(from, to);

    const validBuckets: TimeBucket[] = ["hour", "day", "week", "month"];
    if (!validBuckets.includes(bucket)) {
      throw new InvalidFilterError(
        `Invalid time bucket '${bucket}'. Must be one of: ${validBuckets.join(", ")}`,
      );
    }

    // Prevent excessive granularity
    const rangeDays =
      (new Date(to).getTime() - new Date(from).getTime()) /
      (1000 * 60 * 60 * 24);
    if (bucket === "hour" && rangeDays > 30) {
      throw new InvalidTimeRangeError(
        "Hourly bucket is limited to 30-day time ranges. Use 'day' for longer periods.",
      );
    }

    const bucketExpr = sql.raw(`DATE_TRUNC('${bucket}', timestamp)`);
    let tableClause: ReturnType<typeof sql>;
    let filterClauses = sql.raw("");

    if (metric === "event_count") {
      const typeFilter = options?.eventType
        ? sql`AND type = ${options.eventType}`
        : sql.raw("");
      const subjectFilter = options?.subjectId
        ? sql`AND subject_id = ${options.subjectId}::uuid`
        : sql.raw("");
      filterClauses = sql`${typeFilter} ${subjectFilter}`;

      tableClause = sql`
        SELECT ${bucketExpr} as ts, COUNT(*) as value
        FROM spatial_events
        WHERE tenant_id = ${tenantId}::uuid
          AND timestamp BETWEEN ${from}::timestamptz AND ${to}::timestamptz
          ${filterClauses}
        GROUP BY ts
        ORDER BY ts
        LIMIT ${SPATIAL_QUERY_LIMITS.MAX_TIMESERIES_POINTS}
      `;
    } else {
      const subjectFilter = options?.subjectId
        ? sql`AND subject_id = ${options.subjectId}::uuid`
        : sql.raw("");

      tableClause = sql`
        SELECT ${bucketExpr} as ts, COUNT(*) as value
        FROM spatial_location_history
        WHERE tenant_id = ${tenantId}::uuid
          AND timestamp BETWEEN ${from}::timestamptz AND ${to}::timestamptz
          ${subjectFilter}
        GROUP BY ts
        ORDER BY ts
        LIMIT ${SPATIAL_QUERY_LIMITS.MAX_TIMESERIES_POINTS}
      `;
    }

    try {
      const result = await this.db.execute(tableClause);
      const points: TimeSeriesPoint[] = (result.rows ?? []).map(
        (r: unknown) => {
          const row = r as { ts: Date | string; value: number };
          return { timestamp: toIso(row.ts) ?? "", value: Number(row.value) };
        },
      );

      return {
        metric,
        bucket,
        from,
        to,
        points,
        totalPoints: points.length,
        queryDurationMs: Date.now() - start,
      };
    } catch {
      return {
        metric,
        bucket,
        from,
        to,
        points: [],
        totalPoints: 0,
        queryDurationMs: Date.now() - start,
      };
    }
  }

  // ─── Movement Statistics ───────────────────────────────────────────────────

  /**
   * Get generic movement statistics for a subject in a time range.
   * Returns: distance, duration, observation count, speed stats.
   * Does NOT return fleet utilization or driver productivity — those are business modules.
   */
  async getMovementStatistics(
    tenantId: string,
    subjectId: string,
    from: string,
    to: string,
  ) {
    SpatialQueryValidator.validateTimeRange(from, to);

    try {
      const result = await this.db.execute(sql`
        WITH ordered AS (
          SELECT location, timestamp, speed
          FROM spatial_location_history
          WHERE tenant_id = ${tenantId}::uuid
            AND subject_id = ${subjectId}::uuid
            AND timestamp BETWEEN ${from}::timestamptz AND ${to}::timestamptz
            AND ST_IsValid(location)
          ORDER BY timestamp ASC
        )
        SELECT
          COUNT(*) as observation_count,
          COALESCE(ST_Length(ST_MakeLine(location ORDER BY timestamp)::geography), 0) as distance_meters,
          MIN(timestamp) as first_ts,
          MAX(timestamp) as last_ts,
          AVG(speed) as avg_speed_ms,
          MAX(speed) as max_speed_ms
        FROM ordered
      `);

      const row = result.rows?.[0] as
        | {
            observation_count: number;
            distance_meters: number;
            first_ts: Date | string | null;
            last_ts: Date | string | null;
            avg_speed_ms: number | null;
            max_speed_ms: number | null;
          }
        | undefined;

      const firstTs = toIso(row?.first_ts ?? null);
      const lastTs = toIso(row?.last_ts ?? null);
      const durationSeconds =
        firstTs && lastTs
          ? Math.max(
              0,
              (new Date(lastTs).getTime() - new Date(firstTs).getTime()) / 1000,
            )
          : 0;
      const distanceMeters = Number(row?.distance_meters ?? 0);

      return {
        subjectId,
        distanceTraveledMeters: distanceMeters,
        distanceTraveledKilometers: Math.round(distanceMeters / 10) / 100,
        observationDurationSeconds: durationSeconds,
        numberOfObservations: Number(row?.observation_count ?? 0),
        averageSpeedMs:
          row?.avg_speed_ms != null ? Number(row.avg_speed_ms) : null,
        averageSpeedKmh:
          row?.avg_speed_ms != null
            ? Math.round(Number(row.avg_speed_ms) * 3.6 * 100) / 100
            : null,
        maximumSpeedMs:
          row?.max_speed_ms != null ? Number(row.max_speed_ms) : null,
        maximumSpeedKmh:
          row?.max_speed_ms != null
            ? Math.round(Number(row.max_speed_ms) * 3.6 * 100) / 100
            : null,
        from,
        to,
      };
    } catch {
      return {
        subjectId,
        distanceTraveledMeters: 0,
        distanceTraveledKilometers: 0,
        observationDurationSeconds: 0,
        numberOfObservations: 0,
        averageSpeedMs: null,
        averageSpeedKmh: null,
        maximumSpeedMs: null,
        maximumSpeedKmh: null,
        from,
        to,
      };
    }
  }
}
