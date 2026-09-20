/**
 * GeoSphere Geofencing SDK Core Contracts & Multi-Platform Domain Models
 * Framework-Neutral Spatial Evaluation Engine (Circle & Polygon Geofences)
 * Consumes GeoSphere Location SDK from Step 10 & GIS SDK Contracts from Step 8
 */
import { GeoSphereCoordinate } from "./gis.contracts.js";
import { GeoSphereLocation, GeoSphereLocationSDK } from "./location.contracts.js";
export type GeoSphereGeofenceType = "circle" | "polygon" | "multipolygon";
export interface CircleGeofenceGeometry {
    type: "circle";
    center: GeoSphereCoordinate;
    radiusMeters: number;
}
export interface PolygonGeofenceGeometry {
    type: "polygon";
    coordinates: GeoSphereCoordinate[][];
}
export type GeoSphereGeofenceGeometry = CircleGeofenceGeometry | PolygonGeofenceGeometry;
export type GeoSphereGeofenceState = "INSIDE" | "OUTSIDE" | "BOUNDARY" | "UNKNOWN";
export type GeoSphereGeofenceEventType = "geofence.enter" | "geofence.exit" | "geofence.dwell" | "geofence.stateChanged" | "geofence.enabled" | "geofence.disabled" | "geofence.error";
export interface GeoSphereDwellConfig {
    enabled: boolean;
    dwellDurationSeconds: number;
    repeatDwell?: boolean;
}
export interface GeoSphereGeofenceConfig {
    accuracyThresholdMeters?: number;
    boundaryToleranceMeters?: number;
    dwellConfig?: GeoSphereDwellConfig;
    debounceDurationMs?: number;
    minTransitionDistanceMeters?: number;
    embeddedMode?: boolean;
}
export interface GeoSphereGeofence {
    id: string;
    name: string;
    geometry: GeoSphereGeofenceGeometry;
    enabled: boolean;
    config?: GeoSphereGeofenceConfig;
    state?: GeoSphereGeofenceState;
    metadata?: Record<string, unknown>;
}
export interface GeoSphereGeofenceEvent {
    id: string;
    geofenceId: string;
    geofenceName: string;
    subjectId: string;
    previousState: GeoSphereGeofenceState;
    currentState: GeoSphereGeofenceState;
    eventType: GeoSphereGeofenceEventType;
    location: GeoSphereLocation;
    timestamp: string;
    dwellDurationSeconds?: number;
    metadata?: Record<string, unknown>;
}
export type GeoSphereGeofenceCapability = "CIRCLE" | "POLYGON" | "MULTIPOLYGON" | "ENTER_EXIT" | "DWELL" | "MULTIPLE_GEOFENCES" | "OVERLAPPING_GEOFENCES";
export declare function validateGeofenceGeometry(geometry: GeoSphereGeofenceGeometry): void;
export declare function pointInCircle(point: GeoSphereLocation, center: GeoSphereCoordinate, radiusMeters: number): boolean;
export declare function pointInPolygon(point: GeoSphereLocation, ring: GeoSphereCoordinate[]): boolean;
export declare function evaluateGeofenceState(point: GeoSphereLocation, geofence: GeoSphereGeofence): GeoSphereGeofenceState;
export declare class GeoSphereGeofencingSDK {
    private globalConfig;
    private geofences;
    private geofenceStates;
    private dwellTimers;
    private listeners;
    private locationSdk;
    private locationSubId;
    constructor(globalConfig?: GeoSphereGeofenceConfig, locationSdk?: GeoSphereLocationSDK);
    initialize(locationSdk?: GeoSphereLocationSDK): Promise<void>;
    registerGeofence(geofence: GeoSphereGeofence): void;
    updateGeofence(geofenceId: string, updates: Partial<GeoSphereGeofence>): void;
    removeGeofence(geofenceId: string): void;
    enableGeofence(geofenceId: string): void;
    disableGeofence(geofenceId: string): void;
    getGeofence(geofenceId: string): GeoSphereGeofence | undefined;
    listGeofences(): GeoSphereGeofence[];
    getCapabilities(): GeoSphereGeofenceCapability[];
    hasCapability(capability: GeoSphereGeofenceCapability): boolean;
    evaluateLocation(location: GeoSphereLocation, subjectId?: string): GeoSphereGeofenceEvent[];
    subscribe(onGeofenceEvent: (event: GeoSphereGeofenceEvent) => void): {
        id: string;
        unsubscribe: () => void;
    };
    destroy(): void;
    private evaluateDwell;
    private clearDwellTimer;
    private notifyListeners;
}
//# sourceMappingURL=geofence.contracts.d.ts.map