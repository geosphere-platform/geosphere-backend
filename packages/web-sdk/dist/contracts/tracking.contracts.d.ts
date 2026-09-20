/**
 * GeoSphere Tracking SDK Core Contracts & Multi-Platform Domain Models
 * Framework-Neutral Tracking Session & Telemetry Management
 * Consumes GeoSphere Location SDK from Step 10 (Zero Duplicate Location Acquisition)
 */
import { GeoSphereLocation, GeoSphereLocationConfig, GeoSphereLocationSDK } from "./location.contracts.js";
export type GeoSphereTrackingState = "IDLE" | "STARTING" | "RUNNING" | "PAUSED" | "STOPPING" | "STOPPED" | "ERROR";
export type GeoSphereTrackingQuality = "UNKNOWN" | "POOR" | "FAIR" | "GOOD" | "EXCELLENT";
export type GeoSphereTrackingCapability = "CURRENT_LOCATION" | "CONTINUOUS_LOCATION" | "PAUSE_RESUME" | "DISTANCE_CALCULATION" | "TELEMETRY";
export interface GeoSphereTrackingPoint {
    sequence: number;
    location: GeoSphereLocation;
    distanceFromPreviousMeters: number;
    timeFromPreviousMs: number;
    speedCalculated?: number | null;
    metadata?: Record<string, unknown>;
}
export interface GeoSphereTrackingStatistics {
    totalDistanceMeters: number;
    totalDistanceKm: number;
    activeDurationMs: number;
    pausedDurationMs: number;
    pointCount: number;
    avgAccuracyMeters: number | null;
    latestSpeedKmh: number | null;
    firstPointTime?: string | null;
    latestPointTime?: string | null;
}
export interface GeoSphereTrackingSession {
    sessionId: string;
    entityId: string;
    entityType: string;
    state: GeoSphereTrackingState;
    startTime: string;
    endTime?: string | null;
    activeDurationMs: number;
    pausedDurationMs: number;
    pointCount: number;
    distanceMeters: number;
    quality: GeoSphereTrackingQuality;
    metadata: Record<string, unknown>;
}
export interface GeoSphereTrackingConfig {
    locationConfig?: GeoSphereLocationConfig;
    updateIntervalMs?: number;
    minDistanceMeters?: number;
    maxAccuracyThresholdMeters?: number;
    stalePolicyMaxAgeMs?: number;
    speedCalculationMode?: "provider-first" | "calculate-from-distance";
    embeddedMode?: boolean;
}
export interface ITelemetryProviderContract {
    sendTrackingPoint(point: GeoSphereTrackingPoint, session: GeoSphereTrackingSession): Promise<void>;
    sendTrackingSession(session: GeoSphereTrackingSession): Promise<void>;
}
export declare class GeoSphereDistanceCalculator {
    /**
     * Computes Haversine great-circle distance between two geographic coordinates in meters.
     */
    static haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number;
}
export declare function classifyTrackingQuality(points: GeoSphereTrackingPoint[]): GeoSphereTrackingQuality;
export declare class GeoSphereTrackingSDK {
    private config;
    private locationSdk;
    private session;
    private points;
    private telemetryProvider?;
    private pauseStartTime;
    private listeners;
    private locationSubId;
    constructor(config?: GeoSphereTrackingConfig, locationSdk?: GeoSphereLocationSDK);
    initialize(telemetryProvider?: ITelemetryProviderContract): Promise<void>;
    getLocationSDK(): GeoSphereLocationSDK;
    getState(): GeoSphereTrackingState;
    getSession(): GeoSphereTrackingSession | null;
    getPoints(): GeoSphereTrackingPoint[];
    getCapabilities(): GeoSphereTrackingCapability[];
    hasCapability(capability: GeoSphereTrackingCapability): boolean;
    start(entityId: string, entityType?: string, metadata?: Record<string, unknown>): Promise<GeoSphereTrackingSession>;
    pause(): void;
    resume(): void;
    stop(): GeoSphereTrackingSession;
    getStatistics(): GeoSphereTrackingStatistics;
    subscribe(onTrackingUpdate: (session: GeoSphereTrackingSession, latestPoint?: GeoSphereTrackingPoint) => void): {
        id: string;
        unsubscribe: () => void;
    };
    destroy(): void;
    private handleLocationUpdate;
    private calculateActiveDuration;
    private notifyListeners;
}
//# sourceMappingURL=tracking.contracts.d.ts.map