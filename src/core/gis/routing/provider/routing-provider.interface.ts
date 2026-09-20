/**
 * Framework-Independent Routing Provider Abstraction
 *
 * Defines the IRoutingProvider contract for executing route calculations.
 * Includes a MockRoutingProvider for deterministic testing and fallback calculation.
 */

import { Coordinate, LineStringGeometry } from "../../types/geometry";
import { calculateDistance } from "../../utils/spatial-utils";
import {
  RouteRequest,
  RouteResponse,
  Route,
  RouteWaypoint,
  RoutingError,
} from "../types/routing.types";

export interface IRoutingProvider {
  readonly providerName: string;
  calculateRoute(request: RouteRequest): Promise<RouteResponse>;
}

export class MockRoutingProvider implements IRoutingProvider {
  public readonly providerName = "MockRoutingProvider";

  public async calculateRoute(request: RouteRequest): Promise<RouteResponse> {
    const originCoord = this.toCoordinate(request.origin);
    const destCoord = this.toCoordinate(request.destination);
    const intermediateCoords = (request.waypoints ?? []).map((w) => this.toCoordinate(w));

    const allWaypoints: Coordinate[] = [originCoord, ...intermediateCoords, destCoord];

    let totalDistanceMeters = 0;
    const geometryCoordinates: Coordinate[] = [originCoord];

    for (let i = 0; i < allWaypoints.length - 1; i++) {
      const from = allWaypoints[i];
      const to = allWaypoints[i + 1];

      const segmentDist = calculateDistance(from, to);
      totalDistanceMeters += segmentDist;

      // Add midpoint interpolation for realistic LineString geometry
      const midLng = (from[0] + to[0]) / 2;
      const midLat = (from[1] + to[1]) / 2;
      geometryCoordinates.push([midLng, midLat]);
      geometryCoordinates.push(to);
    }

    // Assume ~50 km/h average speed (13.88 m/s) for mock duration calculation
    const totalDurationSeconds = Math.round(totalDistanceMeters / 13.88);
    const profile = request.options?.profile ?? "driving";

    const geometry: LineStringGeometry = {
      type: "LineString",
      coordinates: geometryCoordinates,
    };

    const routeWaypoints: RouteWaypoint[] = allWaypoints.map((c, idx) => ({
      id: idx === 0 ? "origin" : idx === allWaypoints.length - 1 ? "destination" : `wp-${idx}`,
      name: idx === 0 ? "Origin" : idx === allWaypoints.length - 1 ? "Destination" : `Waypoint ${idx}`,
      coordinate: c,
    }));

    const primaryRoute: Route = {
      id: `route_mock_${Date.now()}`,
      request,
      geometry,
      summary: {
        totalDistanceMeters: Math.round(totalDistanceMeters),
        totalDistanceKm: Number((totalDistanceMeters / 1000).toFixed(2)),
        totalDurationSeconds,
        totalDurationMinutes: Number((totalDurationSeconds / 60).toFixed(1)),
        waypointCount: allWaypoints.length,
        profile,
        providerName: this.providerName,
      },
      segments: [
        {
          distanceMeters: Math.round(totalDistanceMeters),
          durationSeconds: totalDurationSeconds,
          steps: [
            {
              instruction: "Proceed to destination",
              distanceMeters: Math.round(totalDistanceMeters),
              durationSeconds: totalDurationSeconds,
              startCoordinate: originCoord,
              endCoordinate: destCoord,
            },
          ],
        },
      ],
      waypoints: routeWaypoints,
      createdAt: new Date().toISOString(),
    };

    return {
      primaryRoute,
      providerName: this.providerName,
      evaluatedAt: new Date().toISOString(),
    };
  }

  private toCoordinate(wpt: RouteWaypoint | Coordinate): Coordinate {
    if (Array.isArray(wpt)) {
      if (wpt.length < 2 || isNaN(wpt[0]) || isNaN(wpt[1])) {
        throw new RoutingError("INVALID_COORDINATE", "Invalid coordinate provided to routing provider");
      }
      return wpt;
    }
    if (!wpt || !wpt.coordinate || !Array.isArray(wpt.coordinate)) {
      throw new RoutingError("INVALID_COORDINATE", "Invalid waypoint coordinate");
    }
    return wpt.coordinate;
  }
}
