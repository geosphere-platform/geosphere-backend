/**
 * GeoSphere Asset & Resource Management SDK Core Contracts
 * Framework-Neutral Versioned Templates, Lifecycle State Machine, Ownership, Allocation, Hierarchy & Audit Engine
 */

export type GeoSphereAssetType =
  | "PHYSICAL"
  | "DIGITAL"
  | "LOGICAL"
  | "FACILITY"
  | "EQUIPMENT"
  | "DEVICE"
  | "CUSTOM";

export type GeoSphereAssetStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "AVAILABLE"
  | "ASSIGNED"
  | "UNAVAILABLE"
  | "MAINTENANCE"
  | "RETIRED"
  | "ARCHIVED";

export type GeoSphereAssetAvailability =
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "RESERVED"
  | "ALLOCATED"
  | "MAINTENANCE"
  | "UNKNOWN";

export type GeoSphereAssetIdentifierType =
  | "PRIMARY"
  | "SECONDARY"
  | "SERIAL_NUMBER"
  | "EXTERNAL_REF"
  | "QR"
  | "BARCODE"
  | "RFID";

export type GeoSphereAssetRelationshipType =
  | "PARENT"
  | "CHILD"
  | "RELATED"
  | "DEPENDS_ON"
  | "CONNECTED_TO"
  | "LOCATED_AT"
  | "ASSIGNED_TO";

export type GeoSphereAttributeDataType =
  | "STRING"
  | "NUMBER"
  | "BOOLEAN"
  | "DATE"
  | "DATETIME"
  | "ENUM"
  | "REFERENCE";

export interface GeoSphereAssetIdentifier {
  id: string;
  type: GeoSphereAssetIdentifierType;
  value: string;
}

export interface GeoSphereAssetOwner {
  ownerId: string;
  ownerType: "USER" | "ORGANIZATION" | "TEAM" | "GROUP" | "EXTERNAL";
}

export interface GeoSphereAssetLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  heading?: number;
  accuracyMeters?: number;
  timestamp: string;
  addressReference?: string;
}

export interface GeoSphereAssetCapacity {
  capacityValue: number;
  unit: string;
  currentUsage: number;
  remainingCapacity: number;
}

export interface GeoSphereAssetRelationship {
  relationshipId: string;
  targetAssetId: string;
  type: GeoSphereAssetRelationshipType;
  metadata?: Record<string, unknown>;
}

export interface GeoSphereAssetAttribute {
  key: string;
  label: string;
  dataType: GeoSphereAttributeDataType;
  value: unknown;
}

export interface GeoSphereAssetTemplate {
  assetTemplateId: string;
  version: string;
  name: string;
  description?: string;
  type: GeoSphereAssetType;
  category: string;
  attributes: GeoSphereAssetAttribute[];
  defaultStatus?: GeoSphereAssetStatus;
  metadata?: Record<string, unknown>;
}

export interface GeoSphereAssetAttachment {
  attachmentId: string;
  assetId: string;
  fileName: string;
  mimeType: string;
  size: number;
  url?: string;
  createdAt: string;
}

export interface GeoSphereAssetHistory {
  eventId: string;
  assetId: string;
  type: string;
  actorId: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface GeoSphereAssetInstance {
  assetId: string;
  templateId?: string;
  templateVersion?: string;
  name: string;
  description?: string;
  type: GeoSphereAssetType;
  category: string;
  status: GeoSphereAssetStatus;
  availability: GeoSphereAssetAvailability;
  identifiers: GeoSphereAssetIdentifier[];
  attributes: GeoSphereAssetAttribute[];
  location?: GeoSphereAssetLocation;
  capacity?: GeoSphereAssetCapacity;
  owner?: GeoSphereAssetOwner;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
  versionNumber: number;
}

export type GeoSphereAssetCapability =
  | "ASSET_LIFECYCLE"
  | "TEMPLATE_MANAGEMENT"
  | "ASSIGNMENT_ALLOCATION"
  | "CAPACITY_AVAILABILITY"
  | "HIERARCHY_RELATIONSHIPS"
  | "LOCATION_INTEGRATION"
  | "MAP_VISUALIZATION"
  | "FORM_INTEGRATION"
  | "WORKFLOW_INTEGRATION"
  | "TASK_INTEGRATION"
  | "AUDIT_HISTORY"
  | "OFFLINE_SYNC"
  | "REALTIME_NOTIFICATIONS";

export interface GeoSphereAssetProviderInfo {
  name: string;
  version: string;
}

export interface GeoSphereAssetProvider {
  getProviderInfo(): GeoSphereAssetProviderInfo;
  getCapabilities(): GeoSphereAssetCapability[];
  createAsset(assetData: Partial<GeoSphereAssetInstance>): Promise<GeoSphereAssetInstance>;
  getAsset(assetId: string): Promise<GeoSphereAssetInstance>;
  listAssets(filter?: { type?: GeoSphereAssetType; status?: GeoSphereAssetStatus; category?: string }): Promise<GeoSphereAssetInstance[]>;
  updateAssetStatus(assetId: string, status: GeoSphereAssetStatus): Promise<GeoSphereAssetInstance>;
  assignAsset(assetId: string, ownerId: string, ownerType: GeoSphereAssetOwner["ownerType"]): Promise<GeoSphereAssetInstance>;
  allocateAsset(assetId: string, startTime: string, endTime: string, reference: string): Promise<GeoSphereAssetInstance>;
  searchAssets(query: string): Promise<GeoSphereAssetInstance[]>;
  getAssetHistory(assetId: string): Promise<GeoSphereAssetHistory[]>;
}

export class GeoSphereAssetError extends Error {
  constructor(
    public readonly code:
      | "TEMPLATE_INVALID"
      | "ASSET_NOT_FOUND"
      | "STATUS_TRANSITION_INVALID"
      | "ALLOCATION_CONFLICT"
      | "CIRCULAR_HIERARCHY"
      | "PERMISSION_DENIED"
      | "CONCURRENCY_CONFLICT"
      | "UNKNOWN_ERROR",
    message: string,
    public readonly details?: unknown
  ) {
    super(`[ASSET_ERROR:${code}] ${message}`);
    this.name = "GeoSphereAssetError";
  }
}

export class GeoSphereMockAssetProvider implements GeoSphereAssetProvider {
  private assets = new Map<string, GeoSphereAssetInstance>();
  private history = new Map<string, GeoSphereAssetHistory[]>();

  constructor() {
    const seedAsset: GeoSphereAssetInstance = {
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

  public getProviderInfo(): GeoSphereAssetProviderInfo {
    return { name: "GeoSphereMockAssetProvider", version: "1.0.0" };
  }

  public getCapabilities(): GeoSphereAssetCapability[] {
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

  public async createAsset(assetData: Partial<GeoSphereAssetInstance>): Promise<GeoSphereAssetInstance> {
    const nowIso = new Date().toISOString();
    const asset: GeoSphereAssetInstance = {
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

  public async getAsset(assetId: string): Promise<GeoSphereAssetInstance> {
    const asset = this.assets.get(assetId);
    if (!asset) throw new GeoSphereAssetError("ASSET_NOT_FOUND", `Asset ID ${assetId} not found.`);
    return JSON.parse(JSON.stringify(asset));
  }

  public async listAssets(filter?: { type?: GeoSphereAssetType; status?: GeoSphereAssetStatus; category?: string }): Promise<GeoSphereAssetInstance[]> {
    let list = Array.from(this.assets.values());
    if (filter?.type) list = list.filter((a) => a.type === filter.type);
    if (filter?.status) list = list.filter((a) => a.status === filter.status);
    if (filter?.category) list = list.filter((a) => a.category === filter.category);
    return JSON.parse(JSON.stringify(list));
  }

  public async updateAssetStatus(assetId: string, status: GeoSphereAssetStatus): Promise<GeoSphereAssetInstance> {
    const asset = this.assets.get(assetId);
    if (!asset) throw new GeoSphereAssetError("ASSET_NOT_FOUND", `Asset ID ${assetId} not found.`);

    const prevStatus = asset.status;
    asset.status = status;
    asset.updatedAt = new Date().toISOString();
    asset.versionNumber += 1;

    if (status === "MAINTENANCE") asset.availability = "MAINTENANCE";
    if (status === "ASSIGNED") asset.availability = "ALLOCATED";
    if (status === "ACTIVE" || status === "AVAILABLE") asset.availability = "AVAILABLE";

    this.recordHistory(assetId, "STATUS_CHANGED", "user", { fromStatus: prevStatus, toStatus: status });
    return JSON.parse(JSON.stringify(asset));
  }

  public async assignAsset(assetId: string, ownerId: string, ownerType: GeoSphereAssetOwner["ownerType"]): Promise<GeoSphereAssetInstance> {
    const asset = this.assets.get(assetId);
    if (!asset) throw new GeoSphereAssetError("ASSET_NOT_FOUND", `Asset ID ${assetId} not found.`);

    asset.owner = { ownerId, ownerType };
    asset.status = "ASSIGNED";
    asset.availability = "ALLOCATED";
    asset.updatedAt = new Date().toISOString();
    asset.versionNumber += 1;

    this.recordHistory(assetId, "ASSIGNMENT_CHANGED", "user", { ownerId, ownerType });
    return JSON.parse(JSON.stringify(asset));
  }

  public async allocateAsset(assetId: string, startTime: string, endTime: string, reference: string): Promise<GeoSphereAssetInstance> {
    const asset = this.assets.get(assetId);
    if (!asset) throw new GeoSphereAssetError("ASSET_NOT_FOUND", `Asset ID ${assetId} not found.`);

    if (asset.availability === "ALLOCATED" || asset.availability === "MAINTENANCE") {
      throw new GeoSphereAssetError("ALLOCATION_CONFLICT", `Asset ID ${assetId} is currently unavailable for allocation.`);
    }

    asset.availability = "ALLOCATED";
    asset.updatedAt = new Date().toISOString();
    asset.versionNumber += 1;

    this.recordHistory(assetId, "RESOURCE_ALLOCATED", "user", { startTime, endTime, reference });
    return JSON.parse(JSON.stringify(asset));
  }

  public async searchAssets(query: string): Promise<GeoSphereAssetInstance[]> {
    const q = query.toLowerCase();
    const list = Array.from(this.assets.values()).filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.identifiers.some((i) => i.value.toLowerCase().includes(q))
    );
    return JSON.parse(JSON.stringify(list));
  }

  public async getAssetHistory(assetId: string): Promise<GeoSphereAssetHistory[]> {
    return this.history.get(assetId) || [];
  }

  private recordHistory(assetId: string, type: string, actorId: string, details?: Record<string, unknown>): void {
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

export interface GeoSphereAssetConfig {
  embeddedMode?: boolean;
}

export class GeoSphereAssetSDK {
  private provider: GeoSphereAssetProvider;
  private listeners: Map<string, (event: { type: string; payload: unknown }) => void> = new Map();

  constructor(
    private config: GeoSphereAssetConfig = {},
    provider?: GeoSphereAssetProvider
  ) {
    this.provider = provider || new GeoSphereMockAssetProvider();
  }

  public async initialize(): Promise<void> {}

  public getProviderInfo(): GeoSphereAssetProviderInfo {
    return this.provider.getProviderInfo();
  }

  public getCapabilities(): GeoSphereAssetCapability[] {
    return this.provider.getCapabilities();
  }

  public hasCapability(capability: GeoSphereAssetCapability): boolean {
    return this.getCapabilities().includes(capability);
  }

  public async createAsset(assetData: Partial<GeoSphereAssetInstance>): Promise<GeoSphereAssetInstance> {
    const asset = await this.provider.createAsset(assetData);
    this.notifyListeners("assets.created", { asset });
    return asset;
  }

  public async getAsset(assetId: string): Promise<GeoSphereAssetInstance> {
    return this.provider.getAsset(assetId);
  }

  public async listAssets(filter?: { type?: GeoSphereAssetType; status?: GeoSphereAssetStatus; category?: string }): Promise<GeoSphereAssetInstance[]> {
    return this.provider.listAssets(filter);
  }

  public async updateAssetStatus(assetId: string, status: GeoSphereAssetStatus): Promise<GeoSphereAssetInstance> {
    const asset = await this.provider.updateAssetStatus(assetId, status);
    this.notifyListeners("assets.statusChanged", { asset });
    return asset;
  }

  public async assignAsset(assetId: string, ownerId: string, ownerType: GeoSphereAssetOwner["ownerType"]): Promise<GeoSphereAssetInstance> {
    const asset = await this.provider.assignAsset(assetId, ownerId, ownerType);
    this.notifyListeners("assets.assigned", { asset });
    return asset;
  }

  public async allocateAsset(assetId: string, startTime: string, endTime: string, reference: string): Promise<GeoSphereAssetInstance> {
    const asset = await this.provider.allocateAsset(assetId, startTime, endTime, reference);
    this.notifyListeners("assets.allocated", { asset });
    return asset;
  }

  public async searchAssets(query: string): Promise<GeoSphereAssetInstance[]> {
    return this.provider.searchAssets(query);
  }

  public async getAssetHistory(assetId: string): Promise<GeoSphereAssetHistory[]> {
    return this.provider.getAssetHistory(assetId);
  }

  // Embedded Mode Presentation Methods
  public presentAsset(assetId: string): { componentId: string; props: { assetId: string } } {
    return { componentId: "assets.detail-screen", props: { assetId } };
  }

  public presentAssetList(): { componentId: string; props: {} } {
    return { componentId: "assets.list-screen", props: {} };
  }

  public presentAssetMap(): { componentId: string; props: {} } {
    return { componentId: "assets.map-screen", props: {} };
  }

  public presentAssetDetails(assetId: string): { componentId: string; props: { assetId: string } } {
    return { componentId: "assets.detail-screen", props: { assetId } };
  }

  public subscribe(onEvent: (event: { type: string; payload: unknown }) => void): { id: string; unsubscribe: () => void } {
    const subId = `asset_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
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
  }

  private notifyListeners(type: string, payload: unknown): void {
    this.listeners.forEach((listener) => {
      try {
        listener({ type, payload });
      } catch (err) {
        console.error("[ASSET_LISTENER_ERROR] Listener error:", err);
      }
    });
  }
}
