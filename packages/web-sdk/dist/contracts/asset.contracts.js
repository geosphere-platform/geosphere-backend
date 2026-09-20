/**
 * GeoSphere Asset & Resource Management SDK Core Contracts
 * Framework-Neutral Versioned Templates, Lifecycle State Machine, Ownership, Allocation, Hierarchy & Audit Engine
 */
export class GeoSphereAssetError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(`[ASSET_ERROR:${code}] ${message}`);
        this.code = code;
        this.details = details;
        this.name = "GeoSphereAssetError";
    }
}
export class GeoSphereMockAssetProvider {
    assets = new Map();
    history = new Map();
    constructor() {
        const seedAsset = {
            assetId: "asset_seed_001",
            name: "Generic High-Capacity Generator Unit",
            description: "Standard industrial physical resource asset.",
            type: "EQUIPMENT",
            category: "POWER_GENERATION",
            status: "ACTIVE",
            availability: "AVAILABLE",
            identifiers: [
                { id: "id_primary_01", type: "PRIMARY", value: "AST-GEN-2026-001" },
                { id: "id_sn_01", type: "SERIAL_NUMBER", value: "SN-987654321" }
            ],
            attributes: [
                { key: "powerRatingKw", label: "Power Rating (kW)", dataType: "NUMBER", value: 250 },
                { key: "fuelType", label: "Fuel Type", dataType: "STRING", value: "Diesel" }
            ],
            location: {
                latitude: 21.1458,
                longitude: 79.0882,
                timestamp: new Date().toISOString(),
                addressReference: "Nagpur Power Hub, India"
            },
            capacity: {
                capacityValue: 250,
                unit: "kW",
                currentUsage: 50,
                remainingCapacity: 200
            },
            owner: {
                ownerId: "org_acme_corp",
                ownerType: "ORGANIZATION"
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            versionNumber: 1
        };
        this.assets.set(seedAsset.assetId, seedAsset);
    }
    getProviderInfo() {
        return { name: "GeoSphereMockAssetProvider", version: "1.0.0" };
    }
    getCapabilities() {
        return [
            "ASSET_LIFECYCLE",
            "TEMPLATE_MANAGEMENT",
            "ASSIGNMENT_ALLOCATION",
            "CAPACITY_AVAILABILITY",
            "HIERARCHY_RELATIONSHIPS",
            "LOCATION_INTEGRATION",
            "MAP_VISUALIZATION",
            "FORM_INTEGRATION",
            "WORKFLOW_INTEGRATION",
            "TASK_INTEGRATION",
            "AUDIT_HISTORY",
            "OFFLINE_SYNC",
            "REALTIME_NOTIFICATIONS"
        ];
    }
    async createAsset(assetData) {
        const nowIso = new Date().toISOString();
        const asset = {
            assetId: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: assetData.name || "Untitled Resource Asset",
            description: assetData.description,
            type: assetData.type || "PHYSICAL",
            category: assetData.category || "GENERAL",
            status: assetData.status || "ACTIVE",
            availability: assetData.availability || "AVAILABLE",
            identifiers: assetData.identifiers || [{ id: `id_${Date.now()}`, type: "PRIMARY", value: `AST-${Date.now()}` }],
            attributes: assetData.attributes || [],
            location: assetData.location,
            capacity: assetData.capacity,
            owner: assetData.owner,
            parentId: assetData.parentId,
            createdAt: nowIso,
            updatedAt: nowIso,
            versionNumber: 1
        };
        this.assets.set(asset.assetId, asset);
        this.recordHistory(asset.assetId, "ASSET_CREATED", "system", { status: asset.status });
        return JSON.parse(JSON.stringify(asset));
    }
    async getAsset(assetId) {
        const asset = this.assets.get(assetId);
        if (!asset)
            throw new GeoSphereAssetError("ASSET_NOT_FOUND", `Asset ID ${assetId} not found.`);
        return JSON.parse(JSON.stringify(asset));
    }
    async listAssets(filter) {
        let list = Array.from(this.assets.values());
        if (filter?.type)
            list = list.filter((a) => a.type === filter.type);
        if (filter?.status)
            list = list.filter((a) => a.status === filter.status);
        if (filter?.category)
            list = list.filter((a) => a.category === filter.category);
        return JSON.parse(JSON.stringify(list));
    }
    async updateAssetStatus(assetId, status) {
        const asset = this.assets.get(assetId);
        if (!asset)
            throw new GeoSphereAssetError("ASSET_NOT_FOUND", `Asset ID ${assetId} not found.`);
        const prevStatus = asset.status;
        asset.status = status;
        asset.updatedAt = new Date().toISOString();
        asset.versionNumber += 1;
        if (status === "MAINTENANCE")
            asset.availability = "MAINTENANCE";
        if (status === "ASSIGNED")
            asset.availability = "ALLOCATED";
        if (status === "ACTIVE" || status === "AVAILABLE")
            asset.availability = "AVAILABLE";
        this.recordHistory(assetId, "STATUS_CHANGED", "user", { fromStatus: prevStatus, toStatus: status });
        return JSON.parse(JSON.stringify(asset));
    }
    async assignAsset(assetId, ownerId, ownerType) {
        const asset = this.assets.get(assetId);
        if (!asset)
            throw new GeoSphereAssetError("ASSET_NOT_FOUND", `Asset ID ${assetId} not found.`);
        asset.owner = { ownerId, ownerType };
        asset.status = "ASSIGNED";
        asset.availability = "ALLOCATED";
        asset.updatedAt = new Date().toISOString();
        asset.versionNumber += 1;
        this.recordHistory(assetId, "ASSIGNMENT_CHANGED", "user", { ownerId, ownerType });
        return JSON.parse(JSON.stringify(asset));
    }
    async allocateAsset(assetId, startTime, endTime, reference) {
        const asset = this.assets.get(assetId);
        if (!asset)
            throw new GeoSphereAssetError("ASSET_NOT_FOUND", `Asset ID ${assetId} not found.`);
        if (asset.availability === "ALLOCATED" || asset.availability === "MAINTENANCE") {
            throw new GeoSphereAssetError("ALLOCATION_CONFLICT", `Asset ID ${assetId} is currently unavailable for allocation.`);
        }
        asset.availability = "ALLOCATED";
        asset.updatedAt = new Date().toISOString();
        asset.versionNumber += 1;
        this.recordHistory(assetId, "RESOURCE_ALLOCATED", "user", { startTime, endTime, reference });
        return JSON.parse(JSON.stringify(asset));
    }
    async searchAssets(query) {
        const q = query.toLowerCase();
        const list = Array.from(this.assets.values()).filter((a) => a.name.toLowerCase().includes(q) ||
            a.category.toLowerCase().includes(q) ||
            a.identifiers.some((i) => i.value.toLowerCase().includes(q)));
        return JSON.parse(JSON.stringify(list));
    }
    async getAssetHistory(assetId) {
        return this.history.get(assetId) || [];
    }
    recordHistory(assetId, type, actorId, details) {
        const list = this.history.get(assetId) || [];
        list.push({
            eventId: `evt_ast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            assetId,
            type,
            actorId,
            timestamp: new Date().toISOString(),
            details
        });
        this.history.set(assetId, list);
    }
}
export class GeoSphereAssetSDK {
    config;
    provider;
    listeners = new Map();
    constructor(config = {}, provider) {
        this.config = config;
        this.provider = provider || new GeoSphereMockAssetProvider();
    }
    async initialize() { }
    getProviderInfo() {
        return this.provider.getProviderInfo();
    }
    getCapabilities() {
        return this.provider.getCapabilities();
    }
    hasCapability(capability) {
        return this.getCapabilities().includes(capability);
    }
    async createAsset(assetData) {
        const asset = await this.provider.createAsset(assetData);
        this.notifyListeners("assets.created", { asset });
        return asset;
    }
    async getAsset(assetId) {
        return this.provider.getAsset(assetId);
    }
    async listAssets(filter) {
        return this.provider.listAssets(filter);
    }
    async updateAssetStatus(assetId, status) {
        const asset = await this.provider.updateAssetStatus(assetId, status);
        this.notifyListeners("assets.statusChanged", { asset });
        return asset;
    }
    async assignAsset(assetId, ownerId, ownerType) {
        const asset = await this.provider.assignAsset(assetId, ownerId, ownerType);
        this.notifyListeners("assets.assigned", { asset });
        return asset;
    }
    async allocateAsset(assetId, startTime, endTime, reference) {
        const asset = await this.provider.allocateAsset(assetId, startTime, endTime, reference);
        this.notifyListeners("assets.allocated", { asset });
        return asset;
    }
    async searchAssets(query) {
        return this.provider.searchAssets(query);
    }
    async getAssetHistory(assetId) {
        return this.provider.getAssetHistory(assetId);
    }
    // Embedded Mode Presentation Methods
    presentAsset(assetId) {
        return { componentId: "assets.detail-screen", props: { assetId } };
    }
    presentAssetList() {
        return { componentId: "assets.list-screen", props: {} };
    }
    presentAssetMap() {
        return { componentId: "assets.map-screen", props: {} };
    }
    presentAssetDetails(assetId) {
        return { componentId: "assets.detail-screen", props: { assetId } };
    }
    subscribe(onEvent) {
        const subId = `asset_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
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
    }
    notifyListeners(type, payload) {
        this.listeners.forEach((listener) => {
            try {
                listener({ type, payload });
            }
            catch (err) {
                console.error("[ASSET_LISTENER_ERROR] Listener error:", err);
            }
        });
    }
}
//# sourceMappingURL=asset.contracts.js.map