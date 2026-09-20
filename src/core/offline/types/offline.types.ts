/**
 * GeoSphere Core Offline & Synchronization Engine — Framework-Independent Domain Models
 *
 * Defines pure TypeScript models for offline records, sync status state machines,
 * conflict resolution strategies, delta sync batches, offline map region metadata, and typed errors.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, SQLite, Android/iOS UI, database ORMs, or vehicle PII.
 */

import { BoundingBoxTuple } from "../../gis/types/geometry";

export type SyncStatus = "PENDING" | "SYNCING" | "SYNCED" | "CONFLICT" | "FAILED";

export type ConflictResolutionStrategy = "SERVER_WINS" | "CLIENT_WINS" | "MANUAL";

export interface OfflineRecord<T = unknown> {
  id: string;
  entityType: string; // e.g. "form_submission", "field_task", "location_point", "media_attachment"
  clientOperationId: string; // UUID / Idempotency header key
  operationType: "CREATE" | "UPDATE" | "DELETE";
  payload: T;
  syncStatus: SyncStatus;
  version: number;
  retryCount: number;
  lastError?: string;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
}

export interface SyncConflict<T = unknown> {
  conflictId: string;
  recordId: string;
  clientRecord: OfflineRecord<T>;
  serverRecord: Record<string, unknown>;
  conflictReason: string;
  resolved: boolean;
  createdAt: string; // ISO 8601 UTC
}

export interface OfflineMapRegion {
  regionId: string;
  name: string;
  bounds: BoundingBoxTuple; // [minLng, minLat, maxLng, maxLat]
  minZoom: number;
  maxZoom: number;
  totalTiles: number;
  downloadedTiles: number;
  isDownloaded: boolean;
  sizeBytes: number;
  createdAt: string; // ISO 8601 UTC
}

export interface DeltaSyncBatch<T = unknown> {
  batchId: string;
  tenantId?: string;
  records: OfflineRecord<T>[];
  totalCount: number;
  extractedAt: string; // ISO 8601 UTC
}

export type OfflineErrorCode =
  | "RECORD_NOT_FOUND"
  | "DUPLICATE_OPERATION"
  | "INVALID_RECORD"
  | "CONFLICT_DETECTED"
  | "SYNC_FAILED"
  | "STORAGE_ERROR";

export class OfflineError extends Error {
  constructor(
    public readonly code: OfflineErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(`[OFFLINE_ERROR:${code}] ${message}`);
    this.name = "OfflineError";
  }
}

export type SyncStatusListener = (record: OfflineRecord) => void;
