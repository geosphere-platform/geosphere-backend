/**
 * Framework-Independent Offline Storage Adapter Abstraction
 *
 * Defines the contract for persisting, querying, and updating OfflineRecord queues.
 * Includes an InMemoryOfflineStorageAdapter for deterministic testing and headless execution.
 */

import { OfflineRecord, SyncStatus, OfflineMapRegion } from "../types/offline.types";

export interface IOfflineStorageAdapter<T = unknown> {
  saveRecord(record: OfflineRecord<T>): Promise<void>;
  getRecord(id: string): Promise<OfflineRecord<T> | null>;
  getRecordByOperationId(clientOperationId: string): Promise<OfflineRecord<T> | null>;
  listPendingRecords(entityType?: string): Promise<OfflineRecord<T>[]>;
  updateSyncStatus(id: string, status: SyncStatus, error?: string): Promise<void>;
  deleteRecord(id: string): Promise<void>;
  saveMapRegion(region: OfflineMapRegion): Promise<void>;
  getMapRegion(regionId: string): Promise<OfflineMapRegion | null>;
  listMapRegions(): Promise<OfflineMapRegion[]>;
}

export class InMemoryOfflineStorageAdapter<T = unknown> implements IOfflineStorageAdapter<T> {
  private readonly records = new Map<string, OfflineRecord<T>>();
  private readonly mapRegions = new Map<string, OfflineMapRegion>();

  async saveRecord(record: OfflineRecord<T>): Promise<void> {
    this.records.set(record.id, { ...record });
  }

  async getRecord(id: string): Promise<OfflineRecord<T> | null> {
    const r = this.records.get(id);
    return r ? ({ ...r } as OfflineRecord<T>) : null;
  }

  async getRecordByOperationId(clientOperationId: string): Promise<OfflineRecord<T> | null> {
    for (const r of this.records.values()) {
      if (r.clientOperationId === clientOperationId) {
        return { ...r } as OfflineRecord<T>;
      }
    }
    return null;
  }

  async listPendingRecords(entityType?: string): Promise<OfflineRecord<T>[]> {
    const pending = Array.from(this.records.values()).filter(
      (r) => r.syncStatus === "PENDING" || r.syncStatus === "FAILED",
    );
    if (!entityType) return pending.map((r) => ({ ...r } as OfflineRecord<T>));
    return pending.filter((r) => r.entityType === entityType).map((r) => ({ ...r } as OfflineRecord<T>));
  }

  async updateSyncStatus(id: string, status: SyncStatus, error?: string): Promise<void> {
    const r = this.records.get(id);
    if (r) {
      r.syncStatus = status;
      r.updatedAt = new Date().toISOString();
      if (error) r.lastError = error;
      if (status === "FAILED") r.retryCount += 1;
    }
  }

  async deleteRecord(id: string): Promise<void> {
    this.records.delete(id);
  }

  async saveMapRegion(region: OfflineMapRegion): Promise<void> {
    this.mapRegions.set(region.regionId, { ...region });
  }

  async getMapRegion(regionId: string): Promise<OfflineMapRegion | null> {
    const reg = this.mapRegions.get(regionId);
    return reg ? { ...reg } : null;
  }

  async listMapRegions(): Promise<OfflineMapRegion[]> {
    return Array.from(this.mapRegions.values()).map((r) => ({ ...r }));
  }

  public clear(): void {
    this.records.clear();
    this.mapRegions.clear();
  }
}
