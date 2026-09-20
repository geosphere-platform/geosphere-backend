export type Environment = "development" | "staging" | "production";
export interface GeoSphereSDKConfig {
    baseUrl: string;
    accessToken?: string;
    tenantId?: string;
    applicationId?: string;
    timeoutMs?: number;
    environment?: Environment;
    maxRetries?: number;
    headers?: Record<string, string>;
}
export interface User {
    id: string;
    tenantId: string;
    email: string;
    name: string;
    role: string;
    status: "active" | "inactive" | "suspended";
    permissions: string[];
    createdAt: string;
    updatedAt: string;
}
export interface Tenant {
    id: string;
    name: string;
    slug: string;
    status: "active" | "suspended" | "trial";
    planId: string;
    createdAt: string;
    updatedAt: string;
}
export interface Application {
    id: string;
    tenantId: string;
    name: string;
    code: string;
    modules: string[];
    version: string;
    status: "active" | "draft" | "deprecated";
    configuration: Record<string, unknown>;
}
export interface Role {
    id: string;
    name: string;
    tenantId: string;
    permissions: string[];
    isSystem: boolean;
}
export interface Permission {
    id: string;
    code: string;
    resource: string;
    action: "create" | "read" | "update" | "delete" | "manage";
    description: string;
}
export interface Coordinates {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    timestamp?: string;
}
export interface BoundingBox {
    minLongitude: number;
    minLatitude: number;
    maxLongitude: number;
    maxLatitude: number;
}
export type GeometryType = "Point" | "LineString" | "Polygon" | "MultiPoint" | "MultiLineString" | "MultiPolygon" | "GeometryCollection";
export interface GeoJSONGeometry {
    type: GeometryType;
    coordinates: unknown;
}
export interface GeoJSONFeature<P = Record<string, unknown>> {
    type: "Feature";
    id?: string | number;
    geometry: GeoJSONGeometry;
    properties: P;
}
export interface GeoJSONFeatureCollection<P = Record<string, unknown>> {
    type: "FeatureCollection";
    features: GeoJSONFeature<P>[];
}
export interface GISMap {
    id: string;
    tenantId: string;
    applicationId: string;
    name: string;
    center: [number, number];
    zoom: number;
    projection: string;
    baseLayer: string;
    activeLayers: string[];
}
export interface GISLayer {
    id: string;
    mapId: string;
    name: string;
    type: "vector" | "raster" | "tile" | "geojson" | "cluster";
    url?: string;
    visible: boolean;
    opacity: number;
    zIndex: number;
    style?: Record<string, unknown>;
    minZoom?: number;
    maxZoom?: number;
}
export interface Geofence {
    id: string;
    tenantId: string;
    name: string;
    type: "polygon" | "circle";
    geometry: GeoJSONGeometry;
    radiusMeters?: number;
    metadata?: Record<string, unknown>;
    status: "active" | "inactive";
    createdAt: string;
}
export interface LocationTelemetry {
    id: string;
    tenantId: string;
    entityId: string;
    entityType: string;
    coordinates: Coordinates;
    batteryLevel?: number;
    deviceId?: string;
    timestamp: string;
}
export interface DynamicForm {
    id: string;
    tenantId: string;
    title: string;
    schema: Record<string, unknown>;
    version: number;
}
export interface FormSubmission {
    id: string;
    formId: string;
    tenantId: string;
    submittedBy: string;
    data: Record<string, unknown>;
    submittedAt: string;
}
export interface Task {
    id: string;
    tenantId: string;
    title: string;
    description?: string;
    assigneeId?: string;
    status: "pending" | "in_progress" | "completed" | "cancelled";
    priority: "low" | "medium" | "high" | "urgent";
    dueDate?: string;
    coordinates?: Coordinates;
}
export interface Workflow {
    id: string;
    tenantId: string;
    name: string;
    trigger: string;
    steps: Record<string, unknown>[];
    status: "active" | "paused";
}
export interface MediaUpload {
    id: string;
    tenantId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    storageUrl: string;
    uploadedAt: string;
}
export interface SystemNotification {
    id: string;
    userId: string;
    tenantId: string;
    title: string;
    message: string;
    read: boolean;
    type: "info" | "warning" | "alert" | "task";
    createdAt: string;
}
export interface Subscription {
    id: string;
    tenantId: string;
    planId: string;
    planName: string;
    status: "active" | "past_due" | "canceled" | "trialing";
    maxUsers: number;
    maxStorageMb: number;
    expiresAt: string;
}
export interface License {
    id: string;
    tenantId: string;
    licenseKey: string;
    tier: "standard" | "professional" | "enterprise";
    validUntil: string;
    features: string[];
}
export interface Entitlement {
    code: string;
    enabled: boolean;
    limit?: number;
    usage?: number;
}
export interface AppConfiguration {
    theme: {
        primaryColor: string;
        logoUrl?: string;
        mode: "light" | "dark" | "system";
    };
    features: Record<string, boolean>;
    modules: string[];
}
export interface APIResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: {
        code: string;
        details?: string;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        requestId?: string;
    };
}
//# sourceMappingURL=index.d.ts.map