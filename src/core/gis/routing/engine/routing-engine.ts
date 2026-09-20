/**
 * Framework-Independent RoutingEngine Class
 *
 * Provides provider-agnostic route calculation, request validation, fallback estimation,
 * route geometry normalization, and spatial network analysis.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, MapLibre, Mapbox UI, Android/iOS UI, or vehicle PII.
 */

import { Coordinate } from "../../types/geometry";
import { BoundingBox } from "../../bbox/bounding-box";
import { calculateDistance } from "../../utils/spatial-utils";
import { IRoutingProvider, MockRoutingProvider } from "../provider/routing-provider.interface";
import {
  RouteRequest,
  RouteResponse,
  RouteWaypoint,
  RoutingError,
} from "../types/routing.types";

export class RoutingEngine {
  private provider: IRoutingProvider;
  private fallbackProvider: IRoutingProvider;

  constructor(provider?: IRoutingProvider) {
    this.provider = provider ?? new MockRoutingProvider();
    this.fallbackProvider = new MockRoutingProvider();
  }

  public getProvider(): IRoutingProvider {
    return this.provider;
  }

  public setProvider(provider: IRoutingProvider): void {
    this.provider = provider;
  }

  /**
   * Validate RouteRequest coordinates and waypoints
   */
  public validateRequest(request: RouteRequest): void {
    if (!request || !request.origin || !request.destination) {
      throw new RoutingError("INVALID_REQUEST", "RouteRequest must specify 'origin' and 'destination'");
    }

    this.validateCoordinate(this.extractCoordinate(request.origin), "Origin");
    this.validateCoordinate(this.extractCoordinate(request.destination), "Destination");

    if (request.waypoints) {
      request.waypoints.forEach((w, idx) => {
        this.validateCoordinate(this.extractCoordinate(w), `Waypoint [${idx}]`);
      });
    }
  }

  private validateCoordinate(coord: Coordinate, label: string): void {
    const [lng, lat] = coord;
    if (typeof lng !== "number" || typeof lat !== "number" || isNaN(lng) || isNaN(lat)) {
      throw new RoutingError("INVALID_COORDINATE", `${label} contains non-numeric coordinate values`);
    }
    if (lat < -90 || lat > 90) {
      throw new RoutingError("INVALID_COORDINATE", `${label} latitude ${lat} out of valid range [-90, 90]`);
    }
    if (lng < -180 || lng > 180) {
      throw new RoutingError("INVALID_COORDINATE", `${label} longitude ${lng} out of valid range [-180, 180]`);
    }
  }

  private extractCoordinate(wpt: RouteWaypoint | Coordinate): Coordinate {
    if (Array.isArray(wpt)) return wpt;
    return wpt.coordinate;
  }

  /**
   * Calculate route using configured primary provider with automatic fallback
   */
  public async calculateRoute(request: RouteRequest): Promise<RouteResponse> {
    this.validateRequest(request);

    try {
      return await this.provider.calculateRoute(request);
    } catch (err: any) {
      console.warn(`[ROUTING-ENGINE:WARN] Primary provider '${this.provider.providerName}' failed: ${err.message}. Falling back to MockRoutingProvider.`);
      return await this.fallbackProvider.calculateRoute(request);
    }
  }

  /**
   * Calculate bounding box for a calculated route LineString
   */
  public calculateRouteBounds(routeResponse: RouteResponse): BoundingBox {
    const coordinates = routeResponse.primaryRoute.geometry.coordinates;
    return BoundingBox.fromCoordinates(coordinates);
  }

  /**
   * Estimate geographic straight-line distance and duration between waypoints
   */
  public estimateDirectTravel(origin: Coordinate, destination: Coordinate, averageSpeedKmh: number = 50): {
    distanceMeters: number;
    durationSeconds: number;
  } {
    const distanceMeters = Math.round(calculateDistance(origin, destination));
    const speedMs = (averageSpeedKmh * 1000) / 3600;
    const durationSeconds = Math.round(distanceMeters / speedMs);

    return { distanceMeters, durationSeconds };
  }
}
