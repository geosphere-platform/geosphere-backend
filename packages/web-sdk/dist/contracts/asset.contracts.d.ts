/**
 * GeoSphere Asset & Resource Management SDK Core Contracts
 * Framework-Neutral Versioned Templates, Lifecycle State Machine, Ownership, Allocation, Hierarchy & Audit Engine
 */
export type GeoSphereAssetType = "PHYSICAL" | "DIGITAL" | "LOGICAL" | "FACILITY" | "EQUIPMENT" | "DEVICE" | "CUSTOM";
export type GeoSphereAssetStatus = "ACTIVE" | "INACTIVE" | "AVAILABLE" | "ASSIGNED" | "UNAVAILABLE" | "MAINTENANCE" | "RETIRED" | "ARCHIVED";
export type GeoSphereAssetAvailability = "AVAILABLE" | "UNAVAILABLE" | "RESERVED" | "ALLOCATED" | "MAINTENANCE" | "UNKNOWN";
export type GeoSphereAssetIdentifierType = "PRIMARY" | "SECONDARY" | "SERIAL_NUMBER" | "EXTERNAL_REF" | "QR" | "BARCODE" | "RFID";
export type GeoSphereAssetRelationshipType = "PARENT" | "CHILD" | "RELATED" | "DEPENDS_ON" | "CONNECTED_TO" | "LOCATED_AT" | "ASSIGNED_TO";
export type GeoSphereAttributeDataType = "STRING" | "NUMBER" | "BOOLEAN" | "DATE" | "DATETIME" | "ENUM" | "REFERENCE";
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
export type GeoSphereAssetCapability = "ASSET_LIFECYCLE" | "TEMPLATE_MANAGEMENT" | "ASSIGNMENT_ALLOCATION" | "CAPACITY_AVAILABILITY" | "HIERARCHY_RELATIONSHIPS" | "LOCATION_INTEGRATION" | "MAP_VISUALIZATION" | "FORM_INTEGRATION" | "WORKFLOW_INTEGRATION" | "TASK_INTEGRATION" | "AUDIT_HISTORY" | "OFFLINE_SYNC" | "REALTIME_NOTIFICATIONS";
export interface GeoSphereAssetProviderInfo {
    name: string;
    version: string;
}
export interface GeoSphereAssetProvider {
    getProviderInfo(): GeoSphereAssetProviderInfo;
    getCapabilities(): GeoSphereAssetCapability[];
    createAsset(assetData: Partial<GeoSphereAssetInstance>): Promise<GeoSphereAssetInstance>;
    getAsset(assetId: string): Promise<GeoSphereAssetInstance>;
    listAssets(filter?: {
        type?: GeoSphereAssetType;
        status?: GeoSphereAssetStatus;
        category?: string;
    }): Promise<GeoSphereAssetInstance[]>;
    updateAssetStatus(assetId: string, status: GeoSphereAssetStatus): Promise<GeoSphereAssetInstance>;
    assignAsset(assetId: string, ownerId: string, ownerType: GeoSphereAssetOwner["ownerType"]): Promise<GeoSphereAssetInstance>;
    allocateAsset(assetId: string, startTime: string, endTime: string, reference: string): Promise<GeoSphereAssetInstance>;
    searchAssets(query: string): Promise<GeoSphereAssetInstance[]>;
    getAssetHistory(assetId: string): Promise<GeoSphereAssetHistory[]>;
}
export declare class GeoSphereAssetError extends Error {
    readonly code: "TEMPLATE_INVALID" | "ASSET_NOT_FOUND" | "STATUS_TRANSITION_INVALID" | "ALLOCATION_CONFLICT" | "CIRCULAR_HIERARCHY" | "PERMISSION_DENIED" | "CONCURRENCY_CONFLICT" | "UNKNOWN_ERROR";
    readonly details?: unknown | undefined;
    constructor(code: "TEMPLATE_INVALID" | "ASSET_NOT_FOUND" | "STATUS_TRANSITION_INVALID" | "ALLOCATION_CONFLICT" | "CIRCULAR_HIERARCHY" | "PERMISSION_DENIED" | "CONCURRENCY_CONFLICT" | "UNKNOWN_ERROR", message: string, details?: unknown | undefined);
}
export declare class GeoSphereMockAssetProvider implements GeoSphereAssetProvider {
    private assets;
    private history;
    constructor();
    getProviderInfo(): GeoSphereAssetProviderInfo;
    getCapabilities(): GeoSphereAssetCapability[];
    createAsset(assetData: Partial<GeoSphereAssetInstance>): Promise<GeoSphereAssetInstance>;
    getAsset(assetId: string): Promise<GeoSphereAssetInstance>;
    listAssets(filter?: {
        type?: GeoSphereAssetType;
        status?: GeoSphereAssetStatus;
        category?: string;
    }): Promise<GeoSphereAssetInstance[]>;
    updateAssetStatus(assetId: string, status: GeoSphereAssetStatus): Promise<GeoSphereAssetInstance>;
    assignAsset(assetId: string, ownerId: string, ownerType: GeoSphereAssetOwner["ownerType"]): Promise<GeoSphereAssetInstance>;
    allocateAsset(assetId: string, startTime: string, endTime: string, reference: string): Promise<GeoSphereAssetInstance>;
    searchAssets(query: string): Promise<GeoSphereAssetInstance[]>;
    getAssetHistory(assetId: string): Promise<GeoSphereAssetHistory[]>;
    private recordHistory;
}
export interface GeoSphereAssetConfig {
    embeddedMode?: boolean;
}
export declare class GeoSphereAssetSDK {
    private config;
    private provider;
    private listeners;
    constructor(config?: GeoSphereAssetConfig, provider?: GeoSphereAssetProvider);
    initialize(): Promise<void>;
    getProviderInfo(): GeoSphereAssetProviderInfo;
    getCapabilities(): GeoSphereAssetCapability[];
    hasCapability(capability: GeoSphereAssetCapability): boolean;
    createAsset(assetData: Partial<GeoSphereAssetInstance>): Promise<GeoSphereAssetInstance>;
    getAsset(assetId: string): Promise<GeoSphereAssetInstance>;
    listAssets(filter?: {
        type?: GeoSphereAssetType;
        status?: GeoSphereAssetStatus;
        category?: string;
    }): Promise<GeoSphereAssetInstance[]>;
    updateAssetStatus(assetId: string, status: GeoSphereAssetStatus): Promise<GeoSphereAssetInstance>;
    assignAsset(assetId: string, ownerId: string, ownerType: GeoSphereAssetOwner["ownerType"]): Promise<GeoSphereAssetInstance>;
    allocateAsset(assetId: string, startTime: string, endTime: string, reference: string): Promise<GeoSphereAssetInstance>;
    searchAssets(query: string): Promise<GeoSphereAssetInstance[]>;
    getAssetHistory(assetId: string): Promise<GeoSphereAssetHistory[]>;
    presentAsset(assetId: string): {
        componentId: string;
        props: {
            assetId: string;
        };
    };
    presentAssetList(): {
        componentId: string;
        props: {};
    };
    presentAssetMap(): {
        componentId: string;
        props: {};
    };
    presentAssetDetails(assetId: string): {
        componentId: string;
        props: {
            assetId: string;
        };
    };
    subscribe(onEvent: (event: {
        type: string;
        payload: unknown;
    }) => void): {
        id: string;
        unsubscribe: () => void;
    };
    destroy(): void;
    private notifyListeners;
}
//# sourceMappingURL=asset.contracts.d.ts.map