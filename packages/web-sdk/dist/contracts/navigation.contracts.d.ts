/**
 * GeoSphere Navigation SDK Core Contracts & Multi-Platform Domain Models
 * Framework-Neutral Navigation Session & Route Progress Engine
 * Consumes GeoSphere Routing SDK (Step 13) & Location SDK (Step 10)
 */
import { GeoSphereCoordinate } from "./gis.contracts.js";
import { GeoSphereLocation, GeoSphereLocationSDK } from "./location.contracts.js";
import { GeoSphereRoute, GeoSphereRoutingSDK } from "./routing.contracts.js";
export type GeoSphereNavigationState = "IDLE" | "STARTING" | "ACTIVE" | "PAUSED" | "ARRIVED" | "CANCELLED" | "ERROR";
export type GeoSphereOffRouteState = "ON_ROUTE" | "POSSIBLY_OFF_ROUTE" | "OFF_ROUTE" | "RECOVERING";
export type GeoSphereMapFollowMode = "FREE" | "FOLLOW_LOCATION" | "FOLLOW_ROUTE" | "NAVIGATION";
export type GeoSphereManeuverType = "STRAIGHT" | "SLIGHT_LEFT" | "SLIGHT_RIGHT" | "LEFT" | "RIGHT" | "SHARP_LEFT" | "SHARP_RIGHT" | "UTURN" | "ROUNDABOUT" | "MERGE" | "EXIT" | "ARRIVAL";
export interface GeoSphereNavigationManeuver {
    type: GeoSphereManeuverType;
    instruction: string;
    distanceToManeuverMeters: number;
    durationToManeuverSeconds: number;
    coordinate: GeoSphereCoordinate;
}
export interface GeoSphereNavigationProgress {
    distanceTraveledMeters: number;
    distanceRemainingMeters: number;
    durationElapsedSeconds: number;
    durationRemainingSeconds: number;
    percentageComplete: number;
    currentLegIndex: number;
    currentStepIndex: number;
    etaIso: string;
}
export interface GeoSphereNavigationSession {
    id: string;
    route: GeoSphereRoute;
    state: GeoSphereNavigationState;
    offRouteState: GeoSphereOffRouteState;
    progress: GeoSphereNavigationProgress;
    currentManeuver: GeoSphereNavigationManeuver | null;
    nextManeuver: GeoSphereNavigationManeuver | null;
    currentLocation: GeoSphereLocation | null;
    startTime: string;
    endTime?: string | null;
}
export interface GeoSphereNavigationConfig {
    autoReroute?: boolean;
    offRouteThresholdMeters?: number;
    arrivalThresholdMeters?: number;
    maneuverThresholdMeters?: number;
    rerouteMinimumIntervalMs?: number;
    mapFollowMode?: GeoSphereMapFollowMode;
    units?: "metric" | "imperial";
    language?: string;
    embeddedMode?: boolean;
}
export type GeoSphereNavigationCapability = "NAVIGATION_SESSION" | "ROUTE_FOLLOWING" | "MANEUVER_DETECTION" | "PROGRESS_TRACKING" | "OFF_ROUTE_DETECTION" | "AUTO_REROUTING" | "ARRIVED_DETECTION";
export declare class GeoSphereNavigationSDK {
    private config;
    private activeSession;
    private listeners;
    private locationSdk;
    private routingSdk;
    private lastRerouteTimeMs;
    private locationSubId;
    constructor(config?: GeoSphereNavigationConfig, routingSdk?: GeoSphereRoutingSDK, locationSdk?: GeoSphereLocationSDK);
    initialize(routingSdk?: GeoSphereRoutingSDK, locationSdk?: GeoSphereLocationSDK): Promise<void>;
    getCapabilities(): GeoSphereNavigationCapability[];
    hasCapability(capability: GeoSphereNavigationCapability): boolean;
    startNavigation(route: GeoSphereRoute): GeoSphereNavigationSession;
    pauseNavigation(): void;
    resumeNavigation(): void;
    stopNavigation(): void;
    getActiveSession(): GeoSphereNavigationSession | null;
    setMapFollowMode(mode: GeoSphereMapFollowMode): void;
    getMapFollowMode(): GeoSphereMapFollowMode;
    updateLocation(location: GeoSphereLocation): void;
    subscribe(onEvent: (event: {
        type: string;
        payload: unknown;
    }) => void): {
        id: string;
        unsubscribe: () => void;
    };
    destroy(): void;
    private updateManeuvers;
    private triggerReroute;
    private notifyListeners;
}
//# sourceMappingURL=navigation.contracts.d.ts.map