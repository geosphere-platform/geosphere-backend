/**
 * GeoSphere Routing SDK Core Contracts & Multi-Platform Domain Models
 * Framework-Neutral Route Calculation Engine & Provider Abstraction Boundary
 * Consumes GeoSphere GIS SDK Contracts from Step 8
 */
import { GeoSphereCoordinate, LineStringGeometry as GeoSphereLineStringGeometry } from "./gis.contracts.js";
import { GeoSphereLocationSDK } from "./location.contracts.js";
export type GeoSphereRouteProfile = "driving" | "walking" | "cycling" | "truck" | "motorcycle";
export type GeoSphereRoutePreference = "fastest" | "shortest" | "avoid-tolls" | "avoid-highways" | "avoid-ferries";
export interface GeoSphereRouteWaypoint {
    id?: string;
    name?: string;
    coordinate: GeoSphereCoordinate;
}
export interface GeoSphereRouteOptions {
    profile?: GeoSphereRouteProfile;
    preference?: GeoSphereRoutePreference;
    alternatives?: boolean;
    maxAlternatives?: number;
    avoidTolls?: boolean;
    avoidHighways?: boolean;
    avoidFerries?: boolean;
    timeoutMs?: number;
    language?: string;
    metadata?: Record<string, unknown>;
}
export interface GeoSphereRouteRequest {
    origin: GeoSphereRouteWaypoint | GeoSphereCoordinate;
    destination: GeoSphereRouteWaypoint | GeoSphereCoordinate;
    waypoints?: (GeoSphereRouteWaypoint | GeoSphereCoordinate)[];
    options?: GeoSphereRouteOptions;
}
export interface GeoSphereRouteStep {
    instruction: string;
    distanceMeters: number;
    durationSeconds: number;
    geometry?: GeoSphereLineStringGeometry;
    startCoordinate: GeoSphereCoordinate;
    endCoordinate: GeoSphereCoordinate;
    maneuver?: {
        type: string;
        modifier?: string;
    };
}
export interface GeoSphereRouteLeg {
    startWaypoint: GeoSphereRouteWaypoint;
    endWaypoint: GeoSphereRouteWaypoint;
    distanceMeters: number;
    durationSeconds: number;
    steps: GeoSphereRouteStep[];
    geometry?: GeoSphereLineStringGeometry;
}
export interface GeoSphereRouteSummary {
    totalDistanceMeters: number;
    totalDistanceKm: number;
    totalDurationSeconds: number;
    totalDurationMinutes: number;
    legCount: number;
    stepCount: number;
    profile: GeoSphereRouteProfile;
    providerName: string;
}
export interface GeoSphereRoute {
    id: string;
    request: GeoSphereRouteRequest;
    geometry: GeoSphereLineStringGeometry;
    summary: GeoSphereRouteSummary;
    legs: GeoSphereRouteLeg[];
    waypoints: GeoSphereRouteWaypoint[];
    alternatives?: GeoSphereRoute[];
    createdAt: string;
    metadata?: Record<string, unknown>;
}
export interface GeoSphereRouteResponse {
    primaryRoute: GeoSphereRoute;
    alternativeRoutes?: GeoSphereRoute[];
    providerName: string;
    evaluatedAt: string;
}
export type GeoSphereRoutingCapability = "ROUTE_CALCULATION" | "ALTERNATIVE_ROUTES" | "WAYPOINTS" | "DRIVING" | "WALKING" | "CYCLING" | "TRUCK" | "MOTORCYCLE" | "TURN_INSTRUCTIONS";
export type GeoSphereRoutingErrorCode = "INVALID_REQUEST" | "INVALID_COORDINATE" | "NO_ROUTE_FOUND" | "PROVIDER_UNAVAILABLE" | "PROVIDER_TIMEOUT" | "UNSUPPORTED_PROFILE" | "UNSUPPORTED_OPTION" | "NETWORK_ERROR";
export declare class GeoSphereRoutingError extends Error {
    readonly code: GeoSphereRoutingErrorCode;
    readonly details?: Record<string, unknown> | undefined;
    constructor(code: GeoSphereRoutingErrorCode, message: string, details?: Record<string, unknown> | undefined);
}
export interface GeoSphereRoutingConfig {
    provider?: string;
    defaultProfile?: GeoSphereRouteProfile;
    units?: "metric" | "imperial";
    language?: string;
    timeoutMs?: number;
    embeddedMode?: boolean;
}
export interface IGeoSphereRoutingProvider {
    name: string;
    version: string;
    calculateRoute(request: GeoSphereRouteRequest): Promise<GeoSphereRouteResponse>;
    getCapabilities(): GeoSphereRoutingCapability[];
}
export declare function validateCoordinate(coord: GeoSphereCoordinate, contextLabel?: string): void;
export declare function normalizeWaypoint(input: GeoSphereRouteWaypoint | GeoSphereCoordinate, nameFallback: string): GeoSphereRouteWaypoint;
/**
 * Production-Safe Deterministic Mock Routing Provider for Tests & Offline Usage
 */
export declare class GeoSphereMockRoutingProvider implements IGeoSphereRoutingProvider {
    readonly name = "GeoSphereDeterministicMockProvider";
    readonly version = "1.0.0";
    getCapabilities(): GeoSphereRoutingCapability[];
    calculateRoute(request: GeoSphereRouteRequest): Promise<GeoSphereRouteResponse>;
}
export declare class GeoSphereRoutingSDK {
    private config;
    private provider;
    private selectedRoute;
    private listeners;
    private locationSdk?;
    constructor(config?: GeoSphereRoutingConfig, provider?: IGeoSphereRoutingProvider, locationSdk?: GeoSphereLocationSDK);
    initialize(provider?: IGeoSphereRoutingProvider): Promise<void>;
    setProvider(provider: IGeoSphereRoutingProvider): void;
    getProviderInfo(): {
        name: string;
        version: string;
    };
    getCapabilities(): GeoSphereRoutingCapability[];
    hasCapability(capability: GeoSphereRoutingCapability): boolean;
    calculateRoute(request: GeoSphereRouteRequest): Promise<GeoSphereRouteResponse>;
    calculateRouteFromCurrentLocation(destination: GeoSphereRouteWaypoint | GeoSphereCoordinate, options?: GeoSphereRouteOptions): Promise<GeoSphereRouteResponse>;
    selectRoute(route: GeoSphereRoute): void;
    getSelectedRoute(): GeoSphereRoute | null;
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
//# sourceMappingURL=routing.contracts.d.ts.map