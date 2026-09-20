/**
 * Framework-Independent OSRM Routing Adapter
 *
 * Implements IRoutingProvider for OSRM / generic HTTP directions engines,
 * converting raw polyline/directions responses into canonical GeoSphere RouteResponse domain models.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, MapLibre, Mapbox UI, Android/iOS UI, or vehicle PII.
 */

import { Coordinate, LineStringGeometry } from "../../types/geometry";
import { IRoutingProvider } from "../provider/routing-provider.interface";
import {
  RouteRequest,
  RouteResponse,
  Route,
  RouteWaypoint,
  RoutingError,
} from "../types/routing.types";

export interface OSRMAdapterOptions {
  baseUrl?: string; // Default: 'https://router.project-osrm.org'
  timeoutMs?: number;
}

export class OSRMRoutingAdapter implements IRoutingProvider {
  public readonly providerName = "OSRMRoutingAdapter";
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options: OSRMAdapterOptions = {}) {
    this.baseUrl = options.baseUrl ?? "https://router.project-osrm.org";
    this.timeoutMs = options.timeoutMs ?? 10000;
  }

  public async calculateRoute(request: RouteRequest): Promise<RouteResponse> {
    const originCoord = this.extractCoordinate(request.origin);
    const destCoord = this.extractCoordinate(request.destination);
    const intermediateCoords = (request.waypoints ?? []).map((w) => this.extractCoordinate(w));

    const allCoords: Coordinate[] = [originCoord, ...intermediateCoords, destCoord];

    // Format OSRM coordinate string: lon1,lat1;lon2,lat2;...
    const coordString = allCoords.map(([lon, lat]) => `${lon},${lat}`).join(";");
    const profile = request.options?.profile ?? "driving";
    const osrmProfile = profile === "walking" ? "foot" : profile === "cycling" ? "bicycle" : "car";

    const url = `${this.baseUrl}/route/v1/${osrmProfile}/${coordString}?overview=full&geometries=geojson&steps=true`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new RoutingError(
          "PROVIDER_UNAVAILABLE",
          `OSRM routing request failed with HTTP status ${response.status}`,
        );
      }

      const data = await response.json();
      if (!data || data.code !== "Ok" || !Array.isArray(data.routes) || data.routes.length === 0) {
        throw new RoutingError(
          "NO_ROUTE_FOUND",
          `OSRM routing provider returned code '${data?.code ?? "UNKNOWN"}'`,
        );
      }

      const osrmRoute = data.routes[0];
      const geometry: LineStringGeometry = osrmRoute.geometry;
      const totalDistanceMeters = osrmRoute.distance ?? 0;
      const totalDurationSeconds = Math.round(osrmRoute.duration ?? 0);

      const waypoints: RouteWaypoint[] = allCoords.map((c, idx) => ({
        id: idx === 0 ? "origin" : idx === allCoords.length - 1 ? "destination" : `wp-${idx}`,
        name: idx === 0 ? "Origin" : idx === allCoords.length - 1 ? "Destination" : `Waypoint ${idx}`,
        coordinate: c,
      }));

      const primaryRoute: Route = {
        id: `route_osrm_${Date.now()}`,
        request,
        geometry,
        summary: {
          totalDistanceMeters: Math.round(totalDistanceMeters),
          totalDistanceKm: Number((totalDistanceMeters / 1000).toFixed(2)),
          totalDurationSeconds,
          totalDurationMinutes: Number((totalDurationSeconds / 60).toFixed(1)),
          waypointCount: allCoords.length,
          profile,
          providerName: this.providerName,
        },
        segments: [
          {
            distanceMeters: Math.round(totalDistanceMeters),
            durationSeconds: totalDurationSeconds,
            steps: [],
          },
        ],
        waypoints,
        createdAt: new Date().toISOString(),
      };

      return {
        primaryRoute,
        providerName: this.providerName,
        evaluatedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      if (err instanceof RoutingError) throw err;
      if (err.name === "AbortError") {
        throw new RoutingError("PROVIDER_TIMEOUT", "OSRM routing request timed out");
      }
      throw new RoutingError("NETWORK_ERROR", `Failed to communicate with OSRM provider: ${err.message}`);
    }
  }

  private extractCoordinate(wpt: RouteWaypoint | Coordinate): Coordinate {
    if (Array.isArray(wpt)) {
      if (wpt.length < 2 || isNaN(wpt[0]) || isNaN(wpt[1])) {
        throw new RoutingError("INVALID_COORDINATE", "Invalid coordinate array");
      }
      return wpt;
    }
    if (!wpt || !wpt.coordinate || !Array.isArray(wpt.coordinate)) {
      throw new RoutingError("INVALID_COORDINATE", "Invalid waypoint coordinate object");
    }
    return wpt.coordinate;
  }
}
