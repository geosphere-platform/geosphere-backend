/**
 * GeoSphere Location SDK Core Contracts & Multi-Platform Domain Models
 * Framework-Neutral & Privacy Decoupled (Acquisition ONLY — Zero Automatic Telemetry Upload)
 */
export type LocationAccuracyQuality = "UNKNOWN" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
export type GeoSphereLocationState = "INITIALIZING" | "READY" | "PERMISSION_REQUIRED" | "PERMISSION_DENIED" | "SERVICE_DISABLED" | "ACQUIRING" | "AVAILABLE" | "UNAVAILABLE" | "ERROR" | "STOPPED";
export type GeoSphereLocationPermission = "UNKNOWN" | "GRANTED" | "DENIED" | "NOT_REQUESTED" | "RESTRICTED" | "PERMANENTLY_DENIED";
export type GeoSphereLocationServiceState = "UNKNOWN" | "ENABLED" | "DISABLED" | "RESTRICTED";
export type GeoSphereLocationCapability = "CURRENT_LOCATION" | "CONTINUOUS_UPDATES" | "HIGH_ACCURACY" | "HEADING" | "SPEED" | "ALTITUDE" | "BACKGROUND_LOCATION" | "MOCK_LOCATION_DETECTION";
export interface GeoSphereLocation {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    altitude?: number | null;
    altitudeAccuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
    timestamp: string;
    source?: string;
    isMocked?: boolean;
    metadata?: Record<string, unknown>;
}
export interface GeoSphereLocationConfig {
    desiredAccuracy?: number;
    timeout?: number;
    maximumAge?: number;
    updateInterval?: number;
    minimumDistance?: number;
    stalePolicyMaxAge?: number;
    providerPreference?: "high-accuracy" | "balanced" | "battery-saver";
    embeddedMode?: boolean;
}
export interface GeoSphereLocationSubscription {
    id: string;
    unsubscribe: () => void;
}
export interface ILocationAdapterContract {
    initialize(): Promise<void>;
    destroy(): void;
    getCurrentLocation(config: GeoSphereLocationConfig): Promise<GeoSphereLocation>;
    startUpdates(config: GeoSphereLocationConfig, onUpdate: (location: GeoSphereLocation) => void, onError?: (err: Error) => void): void;
    stopUpdates(): void;
    getCapabilities(): GeoSphereLocationCapability[];
    getPermissionState(): Promise<GeoSphereLocationPermission>;
    getServiceState(): Promise<GeoSphereLocationServiceState>;
}
export declare function validateGeoSphereLocation(location: unknown): GeoSphereLocation;
export declare function classifyLocationAccuracy(accuracyMeters?: number | null): LocationAccuracyQuality;
export declare function isLocationStale(location: GeoSphereLocation, maxAgeMs?: number): boolean;
export declare class GeoSphereLocationSDK {
    private config;
    private currentState;
    private permissionState;
    private serviceState;
    private currentLocation;
    private adapter?;
    private listeners;
    private updateActive;
    constructor(config?: GeoSphereLocationConfig);
    initialize(adapter?: ILocationAdapterContract): Promise<void>;
    getState(): GeoSphereLocationState;
    getPermissionState(): GeoSphereLocationPermission;
    getServiceState(): GeoSphereLocationServiceState;
    getCapabilities(): GeoSphereLocationCapability[];
    hasCapability(capability: GeoSphereLocationCapability): boolean;
    getCurrentLocation(options?: Partial<GeoSphereLocationConfig>): Promise<GeoSphereLocation>;
    startUpdates(options?: Partial<GeoSphereLocationConfig>): void;
    stopUpdates(): void;
    subscribe(onLocationUpdate: (location: GeoSphereLocation) => void): GeoSphereLocationSubscription;
    getLastKnownLocation(): GeoSphereLocation | null;
    destroy(): void;
    private notifyListeners;
}
//# sourceMappingURL=location.contracts.d.ts.map