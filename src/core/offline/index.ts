/**
 * GeoSphere Core Offline & Synchronization Engine — Domain Entrypoint
 *
 * Framework-independent Offline Engine providing idempotency tracking, queue state machines,
 * conflict resolution, delta sync batching, offline map region caching, and OfflineSyncEngine.
 */

export * from "./types/offline.types";
export * from "./storage/offline-storage.interface";
export * from "./engine/offline-sync-engine";
