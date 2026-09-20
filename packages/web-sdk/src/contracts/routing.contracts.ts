/**
 * GeoSphere Routing SDK Core Contracts & Multi-Platform Domain Models
 * Framework-Neutral Route Calculation Engine & Provider Abstraction Boundary
 * Consumes GeoSphere GIS SDK Contracts from Step 8
 */

import { GeoSphereCoordinate, LineStringGeometry as GeoSphereLineStringGeometry } from "./gis.contracts.js";
import { GeoSphereLocation, GeoSphereLocationSDK } from "./location.contracts.js";
import { GeoSphereDistanceCalculator } from "./tracking.contracts.js";

export type GeoSphereRouteProfile = "driving" | "walking" | "cycling" | "truck" | "motorcycle";

export type GeoSphereRoutePreference = "fastest" | "shortest" | "avoid-tolls" | "avoid-highways" | "avoid-ferries";

export interface GeoSphereRouteWaypoint {
  id?: string;
  name?: string;
  coordinate: GeoSphereCoordinate; // [longitude, latitude]
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
    type: string; // e.g. "turn", "depart", "arrive"
    modifier?: string; // e.g. "left", "right", "straight"
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
  createdAt: string; // ISO 8601 UTC
  metadata?: Record<string, unknown>;
}

export interface GeoSphereRouteResponse {
  primaryRoute: GeoSphereRoute;
  alternativeRoutes?: GeoSphereRoute[];
  providerName: string;
  evaluatedAt: string; // ISO 8601 UTC
}

export type GeoSphereRoutingCapability =
  | "ROUTE_CALCULATION"
  | "ALTERNATIVE_ROUTES"
  | "WAYPOINTS"
  | "DRIVING"
  | "WALKING"
  | "CYCLING"
  | "TRUCK"
  | "MOTORCYCLE"
  | "TURN_INSTRUCTIONS";

export type GeoSphereRoutingErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_COORDINATE"
  | "NO_ROUTE_FOUND"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_TIMEOUT"
  | "UNSUPPORTED_PROFILE"
  | "UNSUPPORTED_OPTION"
  | "NETWORK_ERROR";

export class GeoSphereRoutingError extends Error {
  constructor(
    public readonly code: GeoSphereRoutingErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(`[ROUTING_ERROR:${code}] ${message}`);
    this.name = "GeoSphereRoutingError";
  }
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

export function validateCoordinate(coord: GeoSphereCoordinate, contextLabel: string = "Coordinate"): void {
  if (!Array.isArray(coord) || coord.length < 2 || isNaN(coord[0]) || isNaN(coord[1])) {
    throw new GeoSphereRoutingError("INVALID_COORDINATE", `${contextLabel} must be a valid [lng, lat] array.`);
  }
  const [lng, lat] = coord;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new GeoSphereRoutingError("INVALID_COORDINATE", `${contextLabel} values out of geographic bounds: [${lng}, ${lat}].`);
  }
}

export function normalizeWaypoint(input: GeoSphereRouteWaypoint | GeoSphereCoordinate, nameFallback: string): GeoSphereRouteWaypoint {
  if (Array.isArray(input)) {
    validateCoordinate(input, nameFallback);
    return { name: nameFallback, coordinate: input };
  }
  validateCoordinate(input.coordinate, input.name || nameFallback);
  return {
    id: input.id || `wp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: input.name || nameFallback,
    coordinate: input.coordinate
  };
}

/**
 * Production-Safe Deterministic Mock Routing Provider for Tests & Offline Usage
 */
export class GeoSphereMockRoutingProvider implements IGeoSphereRoutingProvider {
  public readonly name = "GeoSphereDeterministicMockProvider";
  public readonly version = "1.0.0";

  public getCapabilities(): GeoSphereRoutingCapability[] {
    return ["ROUTE_CALCULATION", "ALTERNATIVE_ROUTES", "WAYPOINTS", "DRIVING", "WALKING", "CYCLING", "TRUCK", "MOTORCYCLE", "TURN_INSTRUCTIONS"];
  }

  public async calculateRoute(request: GeoSphereRouteRequest): Promise<GeoSphereRouteResponse> {
    const originWp = normalizeWaypoint(request.origin, "Origin");
    const destWp = normalizeWaypoint(request.destination, "Destination");

    const waypoints: GeoSphereRouteWaypoint[] = [originWp];
    if (request.waypoints && request.waypoints.length > 0) {
      request.waypoints.forEach((wp, i) => {
        waypoints.push(normalizeWaypoint(wp, `Waypoint ${i + 1}`));
      });
    }
    waypoints.push(destWp);

    const profile: GeoSphereRouteProfile = request.options?.profile || "driving";
    const speedFactorMs = profile === "walking" ? 1.4 : profile === "cycling" ? 4.5 : 15.0; // speed in m/s

    const legs: GeoSphereRouteLeg[] = [];
    let totalDist = 0;
    let totalDur = 0;
    const allCoords: GeoSphereCoordinate[] = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const startWp = waypoints[i];
      const endWp = waypoints[i + 1];

      const legDist = GeoSphereDistanceCalculator.haversineMeters(
        startWp.coordinate[1],
        startWp.coordinate[0],
        endWp.coordinate[1],
        endWp.coordinate[0]
      );

      const legDur = Math.round(legDist / speedFactorMs);
      totalDist += legDist;
      totalDur += legDur;

      const legSteps: GeoSphereRouteStep[] = [
        {
          instruction: `Head towards ${endWp.name}`,
          distanceMeters: Math.round(legDist),
          durationSeconds: legDur,
          startCoordinate: startWp.coordinate,
          endCoordinate: endWp.coordinate,
          maneuver: { type: "depart", modifier: "straight" }
        }
      ];

      legs.push({
        startWaypoint: startWp,
        endWaypoint: endWp,
        distanceMeters: Math.round(legDist),
        durationSeconds: legDur,
        steps: legSteps,
        geometry: {
          type: "LineString",
          coordinates: [startWp.coordinate, endWp.coordinate]
        }
      });

      if (i === 0) allCoords.push(startWp.coordinate);
      allCoords.push(endWp.coordinate);
    }

    const routeId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const nowIso = new Date().toISOString();

    const summary: GeoSphereRouteSummary = {
      totalDistanceMeters: Math.round(totalDist),
      totalDistanceKm: Math.round((totalDist / 1000) * 100) / 100,
      totalDurationSeconds: totalDur,
      totalDurationMinutes: Math.round((totalDur / 60) * 10) / 10,
      legCount: legs.length,
      stepCount: legs.reduce((acc, leg) => acc + leg.steps.length, 0),
      profile,
      providerName: this.name
    };

    const primaryRoute: GeoSphereRoute = {
      id: routeId,
      request,
      geometry: { type: "LineString", coordinates: allCoords },
      summary,
      legs,
      waypoints,
      createdAt: nowIso
    };

    const alternativeRoutes: GeoSphereRoute[] = [];
    if (request.options?.alternatives) {
      const altRoute: GeoSphereRoute = {
        ...primaryRoute,
        id: `${routeId}_alt1`,
        summary: {
          ...summary,
          totalDistanceMeters: Math.round(totalDist * 1.15),
          totalDistanceKm: Math.round(((totalDist * 1.15) / 1000) * 100) / 100,
          totalDurationSeconds: Math.round(totalDur * 1.12),
          totalDurationMinutes: Math.round(((totalDur * 1.12) / 60) * 10) / 10
        }
      };
      alternativeRoutes.push(altRoute);
    }

    return {
      primaryRoute,
      alternativeRoutes: alternativeRoutes.length > 0 ? alternativeRoutes : undefined,
      providerName: this.name,
      evaluatedAt: nowIso
    };
  }
}

export class GeoSphereRoutingSDK {
  private provider: IGeoSphereRoutingProvider;
  private selectedRoute: GeoSphereRoute | null = null;
  private listeners: Map<string, (event: { type: string; payload: unknown }) => void> = new Map();
  private locationSdk?: GeoSphereLocationSDK;

  constructor(
    private config: GeoSphereRoutingConfig = {},
    provider?: IGeoSphereRoutingProvider,
    locationSdk?: GeoSphereLocationSDK
  ) {
    this.provider = provider || new GeoSphereMockRoutingProvider();
    this.locationSdk = locationSdk;
  }

  public async initialize(provider?: IGeoSphereRoutingProvider): Promise<void> {
    if (provider) {
      this.provider = provider;
    }
  }

  public setProvider(provider: IGeoSphereRoutingProvider): void {
    this.provider = provider;
  }

  public getProviderInfo(): { name: string; version: string } {
    return { name: this.provider.name, version: this.provider.version };
  }

  public getCapabilities(): GeoSphereRoutingCapability[] {
    return this.provider.getCapabilities();
  }

  public hasCapability(capability: GeoSphereRoutingCapability): boolean {
    return this.getCapabilities().includes(capability);
  }

  public async calculateRoute(request: GeoSphereRouteRequest): Promise<GeoSphereRouteResponse> {
    this.notifyListeners("routing.requestStarted", { request });

    try {
      const response = await this.provider.calculateRoute(request);
      this.selectedRoute = response.primaryRoute;
      this.notifyListeners("routing.requestCompleted", { response });
      return response;
    } catch (err: any) {
      this.notifyListeners("routing.requestFailed", { error: err });
      throw err;
    }
  }

  public async calculateRouteFromCurrentLocation(
    destination: GeoSphereRouteWaypoint | GeoSphereCoordinate,
    options?: GeoSphereRouteOptions
  ): Promise<GeoSphereRouteResponse> {
    if (!this.locationSdk) {
      this.locationSdk = new GeoSphereLocationSDK();
      await this.locationSdk.initialize();
    }

    const currentLoc = await this.locationSdk.getCurrentLocation();
    const origin: GeoSphereCoordinate = [currentLoc.longitude, currentLoc.latitude];

    return this.calculateRoute({
      origin,
      destination,
      options
    });
  }

  public selectRoute(route: GeoSphereRoute): void {
    this.selectedRoute = route;
    this.notifyListeners("routing.routeSelected", { route });
  }

  public getSelectedRoute(): GeoSphereRoute | null {
    return this.selectedRoute;
  }

  public subscribe(onEvent: (event: { type: string; payload: unknown }) => void): { id: string; unsubscribe: () => void } {
    const subId = `route_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
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
    this.selectedRoute = null;
  }

  private notifyListeners(type: string, payload: unknown): void {
    this.listeners.forEach((listener) => {
      try {
        listener({ type, payload });
      } catch (err) {
        console.error("[ROUTING_LISTENER_ERROR] Listener error:", err);
      }
    });
  }
}
