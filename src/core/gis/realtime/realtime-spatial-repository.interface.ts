/**
 * IRealtimeSpatialRepository Interface
 *
 * Defines contract for PostgreSQL + PostGIS real-time persistence:
 * subject CRUD, atomic current position upserts with out-of-order suppression,
 * location history ledger, geofence state management, viewport spatial queries, and events.
 */

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
import { BoundingBox } from "../bbox/bounding-box";

export interface HistoryQueryOptions {
  fromTimestamp?: string;
  toTimestamp?: string;
  source?: string;
  limit?: number;
  cursor?: string;
  order?: "asc" | "desc";
}

export interface ViewportQueryOptions {
  bbox: BoundingBox;
  type?: string;
  limit?: number;
}

export interface EventQueryOptions {
  subjectId?: string;
  type?: string;
  fromTimestamp?: string;
  toTimestamp?: string;
  limit?: number;
}

export interface IRealtimeSpatialRepository {
  // Spatial Subjects
  createSubject(input: CreateSpatialSubjectInput): Promise<SpatialSubject>;
  findSubjectById(id: string, tenantId: string): Promise<SpatialSubject | null>;
  findSubjectByExternalId(
    externalId: string,
    tenantId: string,
  ): Promise<SpatialSubject | null>;
  listSubjects(
    tenantId: string,
    options?: {
      type?: string;
      activeOnly?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ items: SpatialSubject[]; total: number }>;
  updateSubject(
    id: string,
    tenantId: string,
    input: UpdateSpatialSubjectInput,
  ): Promise<SpatialSubject | null>;
  deleteSubject(id: string, tenantId: string): Promise<boolean>;

  // Current Position Store (Atomic Upsert & Out-of-order check)
  upsertCurrentPosition(update: NormalizedLocationUpdate): Promise<{
    position: SpatialCurrentPosition;
    updated: boolean;
    stale: boolean;
  }>;
  getCurrentPosition(
    subjectId: string,
    tenantId: string,
  ): Promise<SpatialCurrentPosition | null>;
  listCurrentPositions(
    tenantId: string,
    options?: { type?: string; limit?: number; offset?: number },
  ): Promise<{ items: SpatialCurrentPosition[]; total: number }>;
  queryViewportPositions(
    tenantId: string,
    options: ViewportQueryOptions,
  ): Promise<SpatialCurrentPosition[]>;

  // Location History
  appendLocationHistory(
    update: NormalizedLocationUpdate,
  ): Promise<LocationHistoryRecord>;
  queryLocationHistory(
    subjectId: string,
    tenantId: string,
    options?: HistoryQueryOptions,
  ): Promise<{
    items: LocationHistoryRecord[];
    nextCursor?: string;
    total: number;
  }>;

  // Geofence Subject State
  getGeofenceState(
    tenantId: string,
    subjectId: string,
    geofenceId: string,
  ): Promise<GeofenceState | null>;
  setGeofenceState(
    tenantId: string,
    subjectId: string,
    geofenceId: string,
    state: GeofenceState,
    locationId?: string,
  ): Promise<void>;
  listGeofenceStates(
    tenantId: string,
    subjectId: string,
  ): Promise<
    Array<{ geofenceId: string; state: GeofenceState; lastEvaluatedAt: string }>
  >;

  // Spatial Events
  saveSpatialEvent(
    event: Omit<SpatialEvent, "id" | "createdAt">,
  ): Promise<SpatialEvent>;
  querySpatialEvents(
    tenantId: string,
    options?: EventQueryOptions,
  ): Promise<{ items: SpatialEvent[]; total: number }>;
}
