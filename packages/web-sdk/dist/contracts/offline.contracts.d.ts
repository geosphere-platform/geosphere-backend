/**
 * GeoSphere Offline Maps & Offline Data SDK Core Contracts
 * Framework-Neutral Offline Package Management, Storage Abstraction, Sync Queue & Connectivity Engine
 * Consumes GeoSphere GIS SDK Contracts (Step 8)
 */
import { BoundingBoxTuple } from "./gis.contracts.js";
export type GeoSphereConnectivityState = "ONLINE" | "OFFLINE" | "UNKNOWN" | "LIMITED";
export type GeoSphereOfflinePackageType = "MAP" | "GIS_DATA" | "ROUTING_DATA" | "SEARCH_DATA";
export type GeoSphereOfflineDownloadState = "IDLE" | "QUEUED" | "DOWNLOADING" | "PAUSED" | "VERIFYING" | "COMPLETED" | "FAILED" | "CANCELLED" | "EXPIRED" | "UPDATING" | "DELETING";
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
    percentage: number;
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
export declare class GeoSphereInMemoryOfflineStorage implements GeoSphereOfflineStorage {
    private store;
    save(key: string, data: unknown): Promise<void>;
    read<T = unknown>(key: string): Promise<T | null>;
    exists(key: string): Promise<boolean>;
    delete(key: string): Promise<void>;
    list(): Promise<string[]>;
    getSize(): Promise<number>;
    clear(): Promise<void>;
}
export type GeoSphereOfflineSyncState = "PENDING" | "PROCESSING" | "SYNCED" | "FAILED" | "RETRYING" | "CONFLICT" | "CANCELLED";
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
export type GeoSphereOfflineCapability = "MAP_PACKAGES" | "REGION_SELECTION" | "MAP_DOWNLOAD" | "DOWNLOAD_PROGRESS" | "PACKAGE_MANAGEMENT" | "OFFLINE_GIS" | "OFFLINE_FEATURE_QUERY" | "LOCAL_STORAGE" | "SYNC_QUEUE" | "CONNECTIVITY_AWARENESS" | "STORAGE_QUOTAS";
export declare class GeoSphereOfflineError extends Error {
    readonly code: "OFFLINE_STORAGE_LIMIT_EXCEEDED" | "PACKAGE_NOT_FOUND" | "PACKAGE_CORRUPTED" | "DOWNLOAD_FAILED" | "VALIDATION_FAILED" | "SYNC_FAILED" | "OFFLINE_SEARCH_UNAVAILABLE" | "OFFLINE_ROUTING_UNAVAILABLE" | "UNKNOWN_ERROR";
    readonly details?: unknown | undefined;
    constructor(code: "OFFLINE_STORAGE_LIMIT_EXCEEDED" | "PACKAGE_NOT_FOUND" | "PACKAGE_CORRUPTED" | "DOWNLOAD_FAILED" | "VALIDATION_FAILED" | "SYNC_FAILED" | "OFFLINE_SEARCH_UNAVAILABLE" | "OFFLINE_ROUTING_UNAVAILABLE" | "UNKNOWN_ERROR", message: string, details?: unknown | undefined);
}
export interface GeoSphereOfflineConfig {
    maxStorageBytes?: number;
    autoSync?: boolean;
    conflictStrategy?: GeoSphereOfflineConflictStrategy;
    units?: "metric" | "imperial";
    embeddedMode?: boolean;
}
export declare class GeoSphereOfflineSDK {
    private config;
    private storage;
    private packages;
    private syncQueue;
    private connectivity;
    private listeners;
    private activeDownloads;
    constructor(config?: GeoSphereOfflineConfig, storage?: GeoSphereOfflineStorage);
    initialize(): Promise<void>;
    getCapabilities(): GeoSphereOfflineCapability[];
    hasCapability(capability: GeoSphereOfflineCapability): boolean;
    setConnectivityState(state: GeoSphereConnectivityState): void;
    getConnectivityState(): GeoSphereConnectivityState;
    createMapPackage(name: string, bounds: BoundingBoxTuple, estimatedSizeBytes?: number): Promise<GeoSphereOfflinePackage>;
    startDownload(packageId: string): Promise<void>;
    pauseDownload(packageId: string): void;
    resumeDownload(packageId: string): void;
    cancelDownload(packageId: string): void;
    verifyPackage(packageId: string): Promise<boolean>;
    deletePackage(packageId: string): Promise<void>;
    listPackages(): Promise<GeoSphereOfflinePackage[]>;
    enqueueSync(type: string, payload: unknown): Promise<GeoSphereOfflineSyncItem>;
    processSyncQueue(): Promise<number>;
    getPendingSyncCount(): number;
    getStatus(): Promise<GeoSphereOfflineStatus>;
    subscribe(onEvent: (event: {
        type: string;
        payload: unknown;
    }) => void): {
        id: string;
        unsubscribe: () => void;
    };
    destroy(): void;
    private persistPackages;
    private notifyListeners;
}
//# sourceMappingURL=offline.contracts.d.ts.map