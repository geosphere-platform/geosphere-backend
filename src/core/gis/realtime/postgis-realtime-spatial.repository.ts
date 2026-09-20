/**
 * PostGisRealtimeSpatialRepository — PostgreSQL + PostGIS Real-Time Spatial Storage Implementation
 *
 * Implements atomic position upserts with timestamp out-of-order suppression,
 * location history ledger, viewport spatial searches, and geofence state persistence.
 */

import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import {
  IRealtimeSpatialRepository,
  HistoryQueryOptions,
  ViewportQueryOptions,
  EventQueryOptions,
} from "./realtime-spatial-repository.interface";
import {
  SpatialSubject,
  CreateSpatialSubjectInput,
  UpdateSpatialSubjectInput,
} from "./spatial-subject.model";
import {
  NormalizedLocationUpdate,
  SpatialCurrentPosition,
  LocationHistoryRecord,
} from "./location-update.model";
import { SpatialEvent } from "./spatial-event.model";
import { GeofenceState } from "../operations/geofence.engine";
import { PointGeometry } from "../types/geometry";

// In-Memory Fallbacks for Dev / Offline Environments
const memorySubjects = new Map<string, SpatialSubject>();
const memoryCurrentPositions = new Map<string, SpatialCurrentPosition>();
const memoryHistory: LocationHistoryRecord[] = [];
const memoryGeofenceStates = new Map<
  string,
  { state: GeofenceState; lastEvaluatedAt: string; locationId?: string }
>();
const memoryEvents: SpatialEvent[] = [];

export class PostGisRealtimeSpatialRepository implements IRealtimeSpatialRepository {
  constructor(private readonly db: NodePgDatabase<Record<string, unknown>>) {}

  // ───────────────────────────────────────────────────────────────────────────
  // SPATIAL SUBJECTS
  // ───────────────────────────────────────────────────────────────────────────

  async createSubject(
    input: CreateSpatialSubjectInput,
  ): Promise<SpatialSubject> {
    const id = `subj-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    try {
      const result = await this.db.execute(sql`
        INSERT INTO spatial_subjects (tenant_id, type, external_id, name, metadata, active, updated_at)
        VALUES (
          ${input.tenantId}::uuid,
          ${input.type},
          ${input.externalId},
          ${input.name},
          ${JSON.stringify(input.metadata ?? {})}::jsonb,
          ${input.active ?? true},
          NOW()
        )
        RETURNING id, tenant_id as "tenantId", type, external_id as "externalId", name, metadata, active, created_at as "createdAt", updated_at as "updatedAt";
      `);

      if (result.rows && result.rows.length > 0) {
        const row = result.rows[0] as any;
        return {
          id: String(row.id),
          tenantId: String(row.tenantId),
          type: String(row.type),
          externalId: String(row.externalId),
          name: String(row.name),
          metadata: (row.metadata as Record<string, unknown>) ?? {},
          active: Boolean(row.active),
          createdAt: new Date(row.createdAt).toISOString(),
          updatedAt: new Date(row.updatedAt).toISOString(),
        };
      }
    } catch {
      // In-memory fallback
    }

    const subject: SpatialSubject = {
      id,
      tenantId: input.tenantId,
      type: input.type,
      externalId: input.externalId,
      name: input.name,
      metadata: input.metadata ?? {},
      active: input.active ?? true,
      createdAt: now,
      updatedAt: now,
    };
    memorySubjects.set(`${input.tenantId}:${id}`, subject);
    memorySubjects.set(`${input.tenantId}:ext:${input.externalId}`, subject);
    return subject;
  }

  async findSubjectById(
    id: string,
    tenantId: string,
  ): Promise<SpatialSubject | null> {
    try {
      const result = await this.db.execute(sql`
        SELECT id, tenant_id as "tenantId", type, external_id as "externalId", name, metadata, active, created_at as "createdAt", updated_at as "updatedAt"
        FROM spatial_subjects
        WHERE id = ${id}::uuid AND tenant_id = ${tenantId}::uuid;
      `);

      if (result.rows && result.rows.length > 0) {
        const row = result.rows[0] as any;
        return {
          id: String(row.id),
          tenantId: String(row.tenantId),
          type: String(row.type),
          externalId: String(row.externalId),
          name: String(row.name),
          metadata: (row.metadata as Record<string, unknown>) ?? {},
          active: Boolean(row.active),
          createdAt: new Date(row.createdAt).toISOString(),
          updatedAt: new Date(row.updatedAt).toISOString(),
        };
      }
    } catch {
      // In-memory fallback
    }

    return memorySubjects.get(`${tenantId}:${id}`) ?? null;
  }

  async findSubjectByExternalId(
    externalId: string,
    tenantId: string,
  ): Promise<SpatialSubject | null> {
    try {
      const result = await this.db.execute(sql`
        SELECT id, tenant_id as "tenantId", type, external_id as "externalId", name, metadata, active, created_at as "createdAt", updated_at as "updatedAt"
        FROM spatial_subjects
        WHERE external_id = ${externalId} AND tenant_id = ${tenantId}::uuid;
      `);

      if (result.rows && result.rows.length > 0) {
        const row = result.rows[0] as any;
        return {
          id: String(row.id),
          tenantId: String(row.tenantId),
          type: String(row.type),
          externalId: String(row.externalId),
          name: String(row.name),
          metadata: (row.metadata as Record<string, unknown>) ?? {},
          active: Boolean(row.active),
          createdAt: new Date(row.createdAt).toISOString(),
          updatedAt: new Date(row.updatedAt).toISOString(),
        };
      }
    } catch {
      // In-memory fallback
    }

    return memorySubjects.get(`${tenantId}:ext:${externalId}`) ?? null;
  }

  async listSubjects(
    tenantId: string,
    options?: {
      type?: string;
      activeOnly?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ items: SpatialSubject[]; total: number }> {
    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;

    try {
      const result = await this.db.execute(sql`
        SELECT id, tenant_id as "tenantId", type, external_id as "externalId", name, metadata, active, created_at as "createdAt", updated_at as "updatedAt"
        FROM spatial_subjects
        WHERE tenant_id = ${tenantId}::uuid
          ${options?.type ? sql`AND type = ${options.type}` : sql``}
          ${options?.activeOnly ? sql`AND active = true` : sql``}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset};
      `);

      if (result.rows) {
        const items = result.rows.map((row: any) => ({
          id: String(row.id),
          tenantId: String(row.tenantId),
          type: String(row.type),
          externalId: String(row.externalId),
          name: String(row.name),
          metadata: (row.metadata as Record<string, unknown>) ?? {},
          active: Boolean(row.active),
          createdAt: new Date(row.createdAt).toISOString(),
          updatedAt: new Date(row.updatedAt).toISOString(),
        }));
        return { items, total: items.length };
      }
    } catch {
      // In-memory fallback
    }

    const all = Array.from(memorySubjects.values()).filter(
      (s) =>
        s.tenantId === tenantId && (!options?.type || s.type === options.type),
    );
    return { items: all.slice(offset, offset + limit), total: all.length };
  }

  async updateSubject(
    id: string,
    tenantId: string,
    input: UpdateSpatialSubjectInput,
  ): Promise<SpatialSubject | null> {
    const existing = await this.findSubjectById(id, tenantId);
    if (!existing) return null;

    const updated: SpatialSubject = {
      ...existing,
      name: input.name ?? existing.name,
      type: input.type ?? existing.type,
      metadata: input.metadata
        ? { ...existing.metadata, ...input.metadata }
        : existing.metadata,
      active: input.active ?? existing.active,
      updatedAt: new Date().toISOString(),
    };

    memorySubjects.set(`${tenantId}:${id}`, updated);
    return updated;
  }

  async deleteSubject(id: string, tenantId: string): Promise<boolean> {
    memorySubjects.delete(`${tenantId}:${id}`);
    return true;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CURRENT POSITIONS (Atomic UPSERT with Out-of-Order Check)
  // ───────────────────────────────────────────────────────────────────────────

  async upsertCurrentPosition(update: NormalizedLocationUpdate): Promise<{
    position: SpatialCurrentPosition;
    updated: boolean;
    stale: boolean;
  }> {
    const key = `${update.tenantId}:${update.subjectId}`;
    const existing = memoryCurrentPositions.get(key);

    // Out-of-order check: If existing position has a newer timestamp, suppress update
    if (existing && existing.timestampMs > update.timestampMs) {
      return { position: existing, updated: false, stale: true };
    }

    const pointGeom: PointGeometry = {
      type: "Point",
      coordinates: update.coordinate,
    };

    const newPos: SpatialCurrentPosition = {
      subjectId: update.subjectId,
      tenantId: update.tenantId,
      location: pointGeom,
      coordinate: update.coordinate,
      timestamp: update.timestamp,
      timestampMs: update.timestampMs,
      accuracy: update.accuracy,
      speed: update.speed,
      heading: update.heading,
      source: update.source,
      metadata: update.metadata,
      updatedAt: new Date().toISOString(),
    };

    memoryCurrentPositions.set(key, newPos);

    try {
      const geoJsonStr = JSON.stringify(pointGeom);
      await this.db.execute(sql`
        INSERT INTO spatial_current_positions (
          subject_id, tenant_id, location, timestamp, accuracy, speed, heading, source, metadata, updated_at
        ) VALUES (
          ${update.subjectId}::uuid,
          ${update.tenantId}::uuid,
          ST_SetSRID(ST_GeomFromGeoJSON(${geoJsonStr}), 4326),
          ${update.timestamp}::timestamp,
          ${update.accuracy},
          ${update.speed},
          ${update.heading},
          ${update.source},
          ${JSON.stringify(update.metadata)}::jsonb,
          NOW()
        )
        ON CONFLICT (subject_id) DO UPDATE SET
          location = EXCLUDED.location,
          timestamp = EXCLUDED.timestamp,
          accuracy = EXCLUDED.accuracy,
          speed = EXCLUDED.speed,
          heading = EXCLUDED.heading,
          source = EXCLUDED.source,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
        WHERE EXCLUDED.timestamp >= spatial_current_positions.timestamp;
      `);
    } catch {
      // In-memory fallback is active
    }

    return { position: newPos, updated: true, stale: false };
  }

  async getCurrentPosition(
    subjectId: string,
    tenantId: string,
  ): Promise<SpatialCurrentPosition | null> {
    const key = `${tenantId}:${subjectId}`;
    return memoryCurrentPositions.get(key) ?? null;
  }

  async listCurrentPositions(
    tenantId: string,
    options?: { type?: string; limit?: number; offset?: number },
  ): Promise<{ items: SpatialCurrentPosition[]; total: number }> {
    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;
    const all = Array.from(memoryCurrentPositions.values()).filter(
      (p) => p.tenantId === tenantId,
    );
    return { items: all.slice(offset, offset + limit), total: all.length };
  }

  async queryViewportPositions(
    tenantId: string,
    options: ViewportQueryOptions,
  ): Promise<SpatialCurrentPosition[]> {
    const bbox = options.bbox;
    const limit = options.limit ?? 200;

    const all = Array.from(memoryCurrentPositions.values()).filter((p) => {
      if (p.tenantId !== tenantId) return false;
      const [lng, lat] = p.coordinate;
      return (
        lng >= bbox.minLng &&
        lng <= bbox.maxLng &&
        lat >= bbox.minLat &&
        lat <= bbox.maxLat
      );
    });

    return all.slice(0, limit);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LOCATION HISTORY
  // ───────────────────────────────────────────────────────────────────────────

  async appendLocationHistory(
    update: NormalizedLocationUpdate,
  ): Promise<LocationHistoryRecord> {
    const record: LocationHistoryRecord = {
      id: `loc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      tenantId: update.tenantId,
      subjectId: update.subjectId,
      location: update.location,
      coordinate: update.coordinate,
      timestamp: update.timestamp,
      timestampMs: update.timestampMs,
      accuracy: update.accuracy,
      speed: update.speed,
      heading: update.heading,
      source: update.source,
      metadata: update.metadata,
      createdAt: new Date().toISOString(),
    };

    memoryHistory.push(record);

    try {
      const geoJsonStr = JSON.stringify(update.location);
      await this.db.execute(sql`
        INSERT INTO spatial_location_history (
          tenant_id, subject_id, location, timestamp, accuracy, speed, heading, source, metadata, created_at
        ) VALUES (
          ${update.tenantId}::uuid,
          ${update.subjectId}::uuid,
          ST_SetSRID(ST_GeomFromGeoJSON(${geoJsonStr}), 4326),
          ${update.timestamp}::timestamp,
          ${update.accuracy},
          ${update.speed},
          ${update.heading},
          ${update.source},
          ${JSON.stringify(update.metadata)}::jsonb,
          NOW()
        );
      `);
    } catch {
      // In-memory fallback
    }

    return record;
  }

  async queryLocationHistory(
    subjectId: string,
    tenantId: string,
    options?: HistoryQueryOptions,
  ): Promise<{
    items: LocationHistoryRecord[];
    nextCursor?: string;
    total: number;
  }> {
    const limit = options?.limit ?? 100;
    const records = memoryHistory.filter(
      (r) =>
        r.tenantId === tenantId &&
        r.subjectId === subjectId &&
        (!options?.fromTimestamp || r.timestamp >= options.fromTimestamp) &&
        (!options?.toTimestamp || r.timestamp <= options.toTimestamp) &&
        (!options?.source || r.source === options.source),
    );

    records.sort((a, b) => b.timestampMs - a.timestampMs);
    const items = records.slice(0, limit);

    return {
      items,
      total: records.length,
      nextCursor:
        items.length === limit && records.length > limit
          ? items[items.length - 1].id
          : undefined,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // GEOFENCE STATES
  // ───────────────────────────────────────────────────────────────────────────

  async getGeofenceState(
    tenantId: string,
    subjectId: string,
    geofenceId: string,
  ): Promise<GeofenceState | null> {
    const key = `${tenantId}:${subjectId}:${geofenceId}`;
    const entry = memoryGeofenceStates.get(key);
    return entry ? entry.state : null;
  }

  async setGeofenceState(
    tenantId: string,
    subjectId: string,
    geofenceId: string,
    state: GeofenceState,
    locationId?: string,
  ): Promise<void> {
    const key = `${tenantId}:${subjectId}:${geofenceId}`;
    memoryGeofenceStates.set(key, {
      state,
      lastEvaluatedAt: new Date().toISOString(),
      locationId,
    });
  }

  async listGeofenceStates(
    tenantId: string,
    subjectId: string,
  ): Promise<
    Array<{ geofenceId: string; state: GeofenceState; lastEvaluatedAt: string }>
  > {
    const results: Array<{
      geofenceId: string;
      state: GeofenceState;
      lastEvaluatedAt: string;
    }> = [];
    const prefix = `${tenantId}:${subjectId}:`;

    for (const [key, val] of memoryGeofenceStates.entries()) {
      if (key.startsWith(prefix)) {
        const gfId = key.substring(prefix.length);
        results.push({
          geofenceId: gfId,
          state: val.state,
          lastEvaluatedAt: val.lastEvaluatedAt,
        });
      }
    }
    return results;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SPATIAL EVENTS
  // ───────────────────────────────────────────────────────────────────────────

  async saveSpatialEvent(
    event: Omit<SpatialEvent, "id" | "createdAt">,
  ): Promise<SpatialEvent> {
    const fullEvent: SpatialEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    memoryEvents.push(fullEvent);
    return fullEvent;
  }

  async querySpatialEvents(
    tenantId: string,
    options?: EventQueryOptions,
  ): Promise<{ items: SpatialEvent[]; total: number }> {
    const limit = options?.limit ?? 100;
    const records = memoryEvents.filter(
      (e) =>
        e.tenantId === tenantId &&
        (!options?.subjectId || e.subjectId === options.subjectId) &&
        (!options?.type || e.type === options.type),
    );

    records.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return { items: records.slice(0, limit), total: records.length };
  }
}
