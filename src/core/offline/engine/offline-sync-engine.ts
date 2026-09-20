/**
 * Framework-Independent OfflineSyncEngine Class
 *
 * Provides offline record creation with idempotency keys (clientOperationId),
 * sync queue state machine transitions, optimistic concurrency conflict resolution,
 * delta sync calculation, offline map tile region caching metadata, and status event broadcasting.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, SQLite, Android/iOS UI, or vehicle PII.
 */

import { BoundingBoxTuple } from "../../gis/types/geometry";
import {
  OfflineRecord,
  SyncStatus,
  ConflictResolutionStrategy,
  SyncConflict,
  OfflineMapRegion,
  DeltaSyncBatch,
  OfflineError,
  SyncStatusListener,
} from "../types/offline.types";
import { IOfflineStorageAdapter, InMemoryOfflineStorageAdapter } from "../storage/offline-storage.interface";

export interface OfflineSyncEngineOptions {
  storageAdapter?: IOfflineStorageAdapter;
  conflictStrategy?: ConflictResolutionStrategy; // Default: SERVER_WINS
  maxRetries?: number; // Default: 5
}

export class OfflineSyncEngine {
  private readonly storage: IOfflineStorageAdapter;
  private readonly conflictStrategy: ConflictResolutionStrategy;
  private readonly maxRetries: number;
  private readonly syncListeners = new Set<SyncStatusListener>();

  constructor(options: OfflineSyncEngineOptions = {}) {
    this.storage = options.storageAdapter ?? new InMemoryOfflineStorageAdapter();
    this.conflictStrategy = options.conflictStrategy ?? "SERVER_WINS";
    this.maxRetries = options.maxRetries ?? 5;
  }

  public getStorageAdapter(): IOfflineStorageAdapter {
    return this.storage;
  }

  public subscribeSyncStatus(listener: SyncStatusListener): () => void {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  private notifySyncListeners(record: OfflineRecord): void {
    for (const listener of this.syncListeners) {
      try {
        listener(record);
      } catch (err) {
        console.error("[OFFLINE-ENGINE:ERR] Sync status listener error:", err);
      }
    }
  }

  /**
   * Create offline record with clientOperationId idempotency header tracking
   */
  public async createOfflineRecord<T = unknown>(
    entityType: string,
    operationType: "CREATE" | "UPDATE" | "DELETE",
    payload: T,
    customOperationId?: string,
  ): Promise<OfflineRecord<T>> {
    const clientOperationId = customOperationId ?? `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Check idempotency duplicate
    const existing = await this.storage.getRecordByOperationId(clientOperationId);
    if (existing) {
      return existing as OfflineRecord<T>;
    }

    const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const record: OfflineRecord<T> = {
      id,
      entityType,
      clientOperationId,
      operationType,
      payload,
      syncStatus: "PENDING",
      version: 1,
      retryCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await this.storage.saveRecord(record as OfflineRecord);
    this.notifySyncListeners(record as OfflineRecord);
    return record;
  }

  /**
   * Extract pending delta sync batch for background network upload
   */
  public async getPendingDeltaSyncBatch(entityType?: string): Promise<DeltaSyncBatch> {
    const pendingRecords = await this.storage.listPendingRecords(entityType);
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return {
      batchId,
      records: pendingRecords,
      totalCount: pendingRecords.length,
      extractedAt: new Date().toISOString(),
    };
  }

  /**
   * Mark record sync status in state machine
   */
  public async markRecordSyncStatus(id: string, status: SyncStatus, error?: string): Promise<OfflineRecord> {
    const record = await this.storage.getRecord(id);
    if (!record) {
      throw new OfflineError("RECORD_NOT_FOUND", `OfflineRecord '${id}' not found`);
    }

    await this.storage.updateSyncStatus(id, status, error);
    const updated = (await this.storage.getRecord(id))!;
    this.notifySyncListeners(updated);
    return updated;
  }

  /**
   * Resolve Optimistic Concurrency Conflict (SERVER_WINS vs CLIENT_WINS)
   */
  public async resolveConflict<T = unknown>(
    clientRecord: OfflineRecord<T>,
    serverRecord: Record<string, unknown>,
    overrideStrategy?: ConflictResolutionStrategy,
  ): Promise<{ resolvedRecord: OfflineRecord<T>; conflict: SyncConflict<T> }> {
    const strategy = overrideStrategy ?? this.conflictStrategy;
    const conflictId = `cnf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const conflict: SyncConflict<T> = {
      conflictId,
      recordId: clientRecord.id,
      clientRecord,
      serverRecord,
      conflictReason: "Version mismatch between local offline edit and server state",
      resolved: true,
      createdAt: new Date().toISOString(),
    };

    if (strategy === "SERVER_WINS") {
      clientRecord.payload = serverRecord as T;
      clientRecord.syncStatus = "SYNCED";
      clientRecord.version = ((serverRecord.version as number) ?? clientRecord.version) + 1;
    } else if (strategy === "CLIENT_WINS") {
      clientRecord.syncStatus = "PENDING";
      clientRecord.version += 1;
    } else {
      clientRecord.syncStatus = "CONFLICT";
      conflict.resolved = false;
    }

    await this.storage.saveRecord(clientRecord as OfflineRecord);
    this.notifySyncListeners(clientRecord as OfflineRecord);

    return { resolvedRecord: clientRecord, conflict };
  }

  /**
   * Retry failed pending sync records
   */
  public async retryPendingSyncs(): Promise<OfflineRecord[]> {
    const pending = await this.storage.listPendingRecords();
    const retried: OfflineRecord[] = [];

    for (const record of pending) {
      if (record.retryCount >= this.maxRetries) {
        await this.markRecordSyncStatus(record.id, "FAILED", `Exceeded max retries of ${this.maxRetries}`);
        continue;
      }

      await this.markRecordSyncStatus(record.id, "SYNCING");
      retried.push(record);
    }

    return retried;
  }

  /**
   * Register and track offline map region tile caching metadata
   */
  public async downloadMapRegion(
    name: string,
    bounds: BoundingBoxTuple,
    minZoom: number = 10,
    maxZoom: number = 16,
  ): Promise<OfflineMapRegion> {
    const regionId = `region_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Estimate total tiles (simple model)
    const totalTiles = Math.round((maxZoom - minZoom + 1) * 25);
    const sizeBytes = totalTiles * 15000; // ~15KB per tile

    const region: OfflineMapRegion = {
      regionId,
      name,
      bounds,
      minZoom,
      maxZoom,
      totalTiles,
      downloadedTiles: totalTiles,
      isDownloaded: true,
      sizeBytes,
      createdAt: new Date().toISOString(),
    };

    await this.storage.saveMapRegion(region);
    return region;
  }

  public async listMapRegions(): Promise<OfflineMapRegion[]> {
    return await this.storage.listMapRegions();
  }
}
