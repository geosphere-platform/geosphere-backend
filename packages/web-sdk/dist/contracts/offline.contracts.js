/**
 * GeoSphere Offline Maps & Offline Data SDK Core Contracts
 * Framework-Neutral Offline Package Management, Storage Abstraction, Sync Queue & Connectivity Engine
 * Consumes GeoSphere GIS SDK Contracts (Step 8)
 */
export class GeoSphereInMemoryOfflineStorage {
    store = new Map();
    async save(key, data) {
        this.store.set(key, JSON.parse(JSON.stringify(data)));
    }
    async read(key) {
        const val = this.store.get(key);
        return val !== undefined ? JSON.parse(JSON.stringify(val)) : null;
    }
    async exists(key) {
        return this.store.has(key);
    }
    async delete(key) {
        this.store.delete(key);
    }
    async list() {
        return Array.from(this.store.keys());
    }
    async getSize() {
        let bytes = 0;
        this.store.forEach((v) => {
            bytes += JSON.stringify(v).length;
        });
        return bytes;
    }
    async clear() {
        this.store.clear();
    }
}
export class GeoSphereOfflineError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(`[OFFLINE_ERROR:${code}] ${message}`);
        this.code = code;
        this.details = details;
        this.name = "GeoSphereOfflineError";
    }
}
export class GeoSphereOfflineSDK {
    config;
    storage;
    packages = new Map();
    syncQueue = [];
    connectivity = "ONLINE";
    listeners = new Map();
    activeDownloads = new Map();
    constructor(config = {}, storage) {
        this.config = config;
        this.storage = storage || new GeoSphereInMemoryOfflineStorage();
        this.config.maxStorageBytes = this.config.maxStorageBytes ?? 1024 * 1024 * 1024; // 1GB default
        this.config.autoSync = this.config.autoSync ?? true;
        this.config.conflictStrategy = this.config.conflictStrategy ?? "SERVER_WINS";
    }
    async initialize() {
        const savedPkgs = await this.storage.read("geo_offline_packages");
        if (savedPkgs) {
            savedPkgs.forEach((p) => this.packages.set(p.id, p));
        }
    }
    getCapabilities() {
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
    hasCapability(capability) {
        return this.getCapabilities().includes(capability);
    }
    setConnectivityState(state) {
        this.connectivity = state;
        this.notifyListeners("offline.connectivityChanged", { connectivity: state });
    }
    getConnectivityState() {
        return this.connectivity;
    }
    async createMapPackage(name, bounds, estimatedSizeBytes = 50 * 1024 * 1024) {
        const used = await this.storage.getSize();
        const maxStorage = this.config.maxStorageBytes || 1024 * 1024 * 1024;
        if (used + estimatedSizeBytes > maxStorage) {
            throw new GeoSphereOfflineError("OFFLINE_STORAGE_LIMIT_EXCEEDED", `Requested download size (${estimatedSizeBytes} bytes) exceeds available offline quota limit.`);
        }
        const pkgId = `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const nowIso = new Date().toISOString();
        const pkg = {
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
    async startDownload(packageId) {
        const pkg = this.packages.get(packageId);
        if (!pkg) {
            throw new GeoSphereOfflineError("PACKAGE_NOT_FOUND", `Package ID ${packageId} does not exist.`);
        }
        pkg.status = "DOWNLOADING";
        pkg.updatedAt = new Date().toISOString();
        const progress = {
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
    pauseDownload(packageId) {
        const pkg = this.packages.get(packageId);
        if (pkg && pkg.status === "DOWNLOADING") {
            pkg.status = "PAUSED";
            const prog = this.activeDownloads.get(packageId);
            if (prog)
                prog.status = "PAUSED";
            this.notifyListeners("offline.downloadPaused", { packageId });
        }
    }
    resumeDownload(packageId) {
        const pkg = this.packages.get(packageId);
        if (pkg && pkg.status === "PAUSED") {
            this.startDownload(packageId);
        }
    }
    cancelDownload(packageId) {
        const pkg = this.packages.get(packageId);
        if (pkg) {
            pkg.status = "CANCELLED";
            this.activeDownloads.delete(packageId);
            this.notifyListeners("offline.downloadCancelled", { packageId });
        }
    }
    async verifyPackage(packageId) {
        const pkg = this.packages.get(packageId);
        if (!pkg)
            return false;
        return pkg.status === "COMPLETED" && !!pkg.checksum;
    }
    async deletePackage(packageId) {
        const pkg = this.packages.get(packageId);
        if (!pkg)
            return;
        this.packages.delete(packageId);
        this.activeDownloads.delete(packageId);
        await this.persistPackages();
        this.notifyListeners("offline.packageDeleted", { packageId });
    }
    async listPackages() {
        return Array.from(this.packages.values());
    }
    async enqueueSync(type, payload) {
        const item = {
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
    async processSyncQueue() {
        if (this.connectivity === "OFFLINE")
            return 0;
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
    getPendingSyncCount() {
        return this.syncQueue.filter((i) => i.state === "PENDING" || i.state === "RETRYING").length;
    }
    async getStatus() {
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
    subscribe(onEvent) {
        const subId = `off_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        this.listeners.set(subId, onEvent);
        return {
            id: subId,
            unsubscribe: () => {
                this.listeners.delete(subId);
            }
        };
    }
    destroy() {
        this.listeners.clear();
        this.packages.clear();
        this.activeDownloads.clear();
        this.syncQueue = [];
    }
    async persistPackages() {
        await this.storage.save("geo_offline_packages", Array.from(this.packages.values()));
    }
    notifyListeners(type, payload) {
        this.listeners.forEach((listener) => {
            try {
                listener({ type, payload });
            }
            catch (err) {
                console.error("[OFFLINE_LISTENER_ERROR] Listener error:", err);
            }
        });
    }
}
//# sourceMappingURL=offline.contracts.js.map