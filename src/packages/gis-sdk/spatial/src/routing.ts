import { Coordinates, GeoJSONGeometry } from "@gis-sdk/core";

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  geometry: GeoJSONGeometry;
  waypoints: Coordinates[];
}

export interface RoutingProvider {
  calculateRoute(
    origin: Coordinates,
    destination: Coordinates,
    waypoints?: Coordinates[],
  ): Promise<RouteResult>;
}

export class DefaultRoutingProvider implements RoutingProvider {
  public async calculateRoute(
    origin: Coordinates,
    destination: Coordinates,
    waypoints: Coordinates[] = [],
  ): Promise<RouteResult> {
    const pts = [origin, ...waypoints, destination];
    let dist = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      dist +=
        Math.hypot(
          pts[i + 1].latitude - pts[i].latitude,
          pts[i + 1].longitude - pts[i].longitude,
        ) * 111000;
    }

    return {
      distanceMeters: Math.round(dist),
      durationSeconds: Math.round(dist / 15), // ~50 km/h average
      geometry: {
        type: "LineString",
        coordinates: pts.map((p) => [p.longitude, p.latitude]),
      },
      waypoints: pts,
    };
  }
}
