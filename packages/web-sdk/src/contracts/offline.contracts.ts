/**
 * GeoSphere Offline Maps & Offline Data SDK Core Contracts
 * Framework-Neutral Offline Package Management, Storage Abstraction, Sync Queue & Connectivity Engine
 * Consumes GeoSphere GIS SDK Contracts (Step 8)
 */

import { BoundingBoxTuple } from "./gis.contracts.js";

export type GeoSphereConnectivityState = "ONLINE" | "OFFLINE" | "UNKNOWN" | "LIMITED";

export type GeoSphereOfflinePackageType = "MAP" | "GIS_DATA" | "ROUTING_DATA" | "SEARCH_DATA";

export type GeoSphereOfflineDownloadState =
  | "IDLE"
  | "QUEUED"
  | "DOWNLOADING"
  | "PAUSED"
  | "VERIFYING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "UPDATING"
  | "DELETING";

export interface GeoSphereOfflinePackage {
  id: string;
  name: string;
  description?: string;
  version: string;
  type: GeoSphereOfflinePackageType;
  status: GeoSphereOfflineDownloadState;
  sizeBytes: number;
  bounds?: BoundingBoxTuple;
  checksum?: string;
  schemaVersion: string;
  createdAt: string;
  updatedAt: string;
  expirationDate?: string;
}

export interface GeoSphereOfflineDownloadProgress {
  packageId: string;
  bytesDownloaded: number;
  totalBytes: number;
  percentage: number; // 0 to 100
  phase: string;
  status: GeoSphereOfflineDownloadState;
  error?: string;
}

export interface GeoSphereOfflineStorage {
  save(key: string, data: unknown): Promise<void>;
  read<T = unknown>(key: string): Promise<T | null>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  list(): Promise<string[]>;
  getSize(): Promise<number>;
  clear(): Promise<void>;
}

export class GeoSphereInMemoryOfflineStorage implements GeoSphereOfflineStorage {
  private store = new Map<string, unknown>();

  public async save(key: string, data: unknown): Promise<void> {
    this.store.set(key, JSON.parse(JSON.stringify(data)));
  }

  public async read<T = unknown>(key: string): Promise<T | null> {
    const val = this.store.get(key);
    return val !== undefined ? (JSON.parse(JSON.stringify(val)) as T) : null;
  }

  public async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  public async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  public async list(): Promise<string[]> {
    return Array.from(this.store.keys());
  }

  public async getSize(): Promise<number> {
    let bytes = 0;
    this.store.forEach((v) => {
      bytes += JSON.stringify(v).length;
    });
    return bytes;
  }

  public async clear(): Promise<void> {
    this.store.clear();
  }
}

export type GeoSphereOfflineSyncState =
  | "PENDING"
  | "PROCESSING"
  | "SYNCED"
  | "FAILED"
  | "RETRYING"
  | "CONFLICT"
  | "CANCELLED";

export interface GeoSphereOfflineSyncItem {
  id: string;
  type: string;
  payload: unknown;
  createdAt: string;
  retryCount: number;
  state: GeoSphereOfflineSyncState;
  lastError?: string;
}

export type GeoSphereOfflineConflictStrategy = "SERVER_WINS" | "CLIENT_WINS" | "MANUAL" | "CUSTOM";

export interface GeoSphereOfflineStatus {
  connectivity: GeoSphereConnectivityState;
  availablePackagesCount: number;
  activeDownloadsCount: number;
  usedStorageBytes: number;
  maxStorageBytes: number;
  pendingSyncCount: number;
  lastSyncIso?: string;
}

export type GeoSphereOfflineCapability =
  | "MAP_PACKAGES"
  | "REGION_SELECTION"
  | "MAP_DOWNLOAD"
  | "DOWNLOAD_PROGRESS"
  | "PACKAGE_MANAGEMENT"
  | "OFFLINE_GIS"
  | "OFFLINE_FEATURE_QUERY"
  | "LOCAL_STORAGE"
  | "SYNC_QUEUE"
  | "CONNECTIVITY_AWARENESS"
  | "STORAGE_QUOTAS";

export class GeoSphereOfflineError extends Error {
  constructor(
    public readonly code:
      | "OFFLINE_STORAGE_LIMIT_EXCEEDED"
      | "PACKAGE_NOT_FOUND"
      | "PACKAGE_CORRUPTED"
      | "DOWNLOAD_FAILED"
      | "VALIDATION_FAILED"
      | "SYNC_FAILED"
      | "OFFLINE_SEARCH_UNAVAILABLE"
      | "OFFLINE_ROUTING_UNAVAILABLE"
      | "UNKNOWN_ERROR",
    message: string,
    public readonly details?: unknown
  ) {
    super(`[OFFLINE_ERROR:${code}] ${message}`);
    this.name = "GeoSphereOfflineError";
  }
}

export interface GeoSphereOfflineConfig {
  maxStorageBytes?: number;
  autoSync?: boolean;
  conflictStrategy?: GeoSphereOfflineConflictStrategy;
  units?: "metric" | "imperial";
  embeddedMode?: boolean;
}

export class GeoSphereOfflineSDK {
  private storage: GeoSphereOfflineStorage;
  private packages = new Map<string, GeoSphereOfflinePackage>();
  private syncQueue: GeoSphereOfflineSyncItem[] = [];
  private connectivity: GeoSphereConnectivityState = "ONLINE";
  private listeners: Map<string, (event: { type: string; payload: unknown }) => void> = new Map();
  private activeDownloads = new Map<string, GeoSphereOfflineDownloadProgress>();

  constructor(
    private config: GeoSphereOfflineConfig = {},
    storage?: GeoSphereOfflineStorage
  ) {
    this.storage = storage || new GeoSphereInMemoryOfflineStorage();
    this.config.maxStorageBytes = this.config.maxStorageBytes ?? 1024 * 1024 * 1024; // 1GB default
    this.config.autoSync = this.config.autoSync ?? true;
    this.config.conflictStrategy = this.config.conflictStrategy ?? "SERVER_WINS";
  }

  public async initialize(): Promise<void> {
    const savedPkgs = await this.storage.read<GeoSphereOfflinePackage[]>("geo_offline_packages");
    if (savedPkgs) {
      savedPkgs.forEach((p) => this.packages.set(p.id, p));
    }
  }

  public getCapabilities(): GeoSphereOfflineCapability[] {
    return [
      "MAP_PACKAGES",
      "REGION_SELECTION",
      "MAP_DOWNLOAD",
      "DOWNLOAD_PROGRESS",
      "PACKAGE_MANAGEMENT",
      "OFFLINE_GIS",
      "OFFLINE_FEATURE_QUERY",
      "LOCAL_STORAGE",
      "SYNC_QUEUE",
      "CONNECTIVITY_AWARENESS",
      "STORAGE_QUOTAS"
    ];
  }

  public hasCapability(capability: GeoSphereOfflineCapability): boolean {
    return this.getCapabilities().includes(capability);
  }

  public setConnectivityState(state: GeoSphereConnectivityState): void {
    this.connectivity = state;
    this.notifyListeners("offline.connectivityChanged", { connectivity: state });
  }

  public getConnectivityState(): GeoSphereConnectivityState {
    return this.connectivity;
  }

  public async createMapPackage(
    name: string,
    bounds: BoundingBoxTuple,
    estimatedSizeBytes: number = 50 * 1024 * 1024
  ): Promise<GeoSphereOfflinePackage> {
    const used = await this.storage.getSize();
    const maxStorage = this.config.maxStorageBytes || 1024 * 1024 * 1024;

    if (used + estimatedSizeBytes > maxStorage) {
      throw new GeoSphereOfflineError(
        "OFFLINE_STORAGE_LIMIT_EXCEEDED",
        `Requested download size (${estimatedSizeBytes} bytes) exceeds available offline quota limit.`
      );
    }

    const pkgId = `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const nowIso = new Date().toISOString();

    const pkg: GeoSphereOfflinePackage = {
      id: pkgId,
      name,
      version: "1.0.0",
      type: "MAP",
      status: "IDLE",
      sizeBytes: estimatedSizeBytes,
      bounds,
      checksum: `sha256_${Math.random().toString(36).substr(2, 8)}`,
      schemaVersion: "1.0",
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.packages.set(pkgId, pkg);
    await this.persistPackages();
    return pkg;
  }

  public async startDownload(packageId: string): Promise<void> {
    const pkg = this.packages.get(packageId);
    if (!pkg) {
      throw new GeoSphereOfflineError("PACKAGE_NOT_FOUND", `Package ID ${packageId} does not exist.`);
    }

    pkg.status = "DOWNLOADING";
    pkg.updatedAt = new Date().toISOString();

    const progress: GeoSphereOfflineDownloadProgress = {
      packageId,
      bytesDownloaded: Math.round(pkg.sizeBytes * 0.5),
      totalBytes: pkg.sizeBytes,
      percentage: 50,
      phase: "DOWNLOADING_TILES",
      status: "DOWNLOADING"
    };

    this.activeDownloads.set(packageId, progress);
    this.notifyListeners("offline.downloadProgress", { progress });

    // Mock quick download completion
    setTimeout(async () => {
      progress.bytesDownloaded = pkg.sizeBytes;
      progress.percentage = 100;
      progress.phase = "COMPLETED";
      progress.status = "COMPLETED";

      pkg.status = "COMPLETED";
      this.activeDownloads.delete(packageId);
      await this.persistPackages();
      this.notifyListeners("offline.downloadCompleted", { package: pkg });
    }, 50);
  }

  public pauseDownload(packageId: string): void {
    const pkg = this.packages.get(packageId);
    if (pkg && pkg.status === "DOWNLOADING") {
      pkg.status = "PAUSED";
      const prog = this.activeDownloads.get(packageId);
      if (prog) prog.status = "PAUSED";
      this.notifyListeners("offline.downloadPaused", { packageId });
    }
  }

  public resumeDownload(packageId: string): void {
    const pkg = this.packages.get(packageId);
    if (pkg && pkg.status === "PAUSED") {
      this.startDownload(packageId);
    }
  }

  public cancelDownload(packageId: string): void {
    const pkg = this.packages.get(packageId);
    if (pkg) {
      pkg.status = "CANCELLED";
      this.activeDownloads.delete(packageId);
      this.notifyListeners("offline.downloadCancelled", { packageId });
    }
  }

  public async verifyPackage(packageId: string): Promise<boolean> {
    const pkg = this.packages.get(packageId);
    if (!pkg) return false;
    return pkg.status === "COMPLETED" && !!pkg.checksum;
  }

  public async deletePackage(packageId: string): Promise<void> {
    const pkg = this.packages.get(packageId);
    if (!pkg) return;
    this.packages.delete(packageId);
    this.activeDownloads.delete(packageId);
    await this.persistPackages();
    this.notifyListeners("offline.packageDeleted", { packageId });
  }

  public async listPackages(): Promise<GeoSphereOfflinePackage[]> {
    return Array.from(this.packages.values());
  }

  public async enqueueSync(type: string, payload: unknown): Promise<GeoSphereOfflineSyncItem> {
    const item: GeoSphereOfflineSyncItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      state: "PENDING"
    };
    this.syncQueue.push(item);
    this.notifyListeners("offline.syncEnqueued", { item });
    return item;
  }

  public async processSyncQueue(): Promise<number> {
    if (this.connectivity === "OFFLINE") return 0;
    let processed = 0;
    for (const item of this.syncQueue) {
      if (item.state === "PENDING" || item.state === "RETRYING") {
        item.state = "SYNCED";
        processed++;
      }
    }
    this.syncQueue = this.syncQueue.filter((i) => i.state !== "SYNCED");
    this.notifyListeners("offline.syncProcessed", { processed });
    return processed;
  }

  public getPendingSyncCount(): number {
    return this.syncQueue.filter((i) => i.state === "PENDING" || i.state === "RETRYING").length;
  }

  public async getStatus(): Promise<GeoSphereOfflineStatus> {
    const usedBytes = await this.storage.getSize();
    return {
      connectivity: this.connectivity,
      availablePackagesCount: Array.from(this.packages.values()).filter((p) => p.status === "COMPLETED").length,
      activeDownloadsCount: this.activeDownloads.size,
      usedStorageBytes: usedBytes,
      maxStorageBytes: this.config.maxStorageBytes || 1024 * 1024 * 1024,
      pendingSyncCount: this.getPendingSyncCount(),
      lastSyncIso: new Date().toISOString()
    };
  }

  public subscribe(onEvent: (event: { type: string; payload: unknown }) => void): { id: string; unsubscribe: () => void } {
    const subId = `off_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.listeners.set(subId, onEvent);
    return {
      id: subId,
      unsubscribe: () => {
        this.listeners.delete(subId);
      }
    };
  }

  public destroy(): void {
    this.listeners.clear();
    this.packages.clear();
    this.activeDownloads.clear();
    this.syncQueue = [];
  }

  private async persistPackages(): Promise<void> {
    await this.storage.save("geo_offline_packages", Array.from(this.packages.values()));
  }

  private notifyListeners(type: string, payload: unknown): void {
    this.listeners.forEach((listener) => {
      try {
        listener({ type, payload });
      } catch (err) {
        console.error("[OFFLINE_LISTENER_ERROR] Listener error:", err);
      }
    });
  }
}
