import { Coordinates } from "@gis-sdk/core";

export class MeasurementManager {
  private static readonly EARTH_RADIUS_METERS = 6371008.8;

  public static calculateDistance(p1: Coordinates, p2: Coordinates): number {
    const dLat = this.toRadians(p2.latitude - p1.latitude);
    const dLon = this.toRadians(p2.longitude - p1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(p1.latitude)) *
        Math.cos(this.toRadians(p2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS_METERS * c; // In meters
  }

  public static calculateLength(points: Coordinates[]): number {
    if (points.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      total += this.calculateDistance(points[i], points[i + 1]);
    }
    return total;
  }

  public static calculatePolygonArea(polygon: Coordinates[]): number {
    if (polygon.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < polygon.length; i++) {
      const p1 = polygon[i];
      const p2 = polygon[(i + 1) % polygon.length];
      area +=
        this.toRadians(p2.longitude - p1.longitude) *
        (2 +
          Math.sin(this.toRadians(p1.latitude)) +
          Math.sin(this.toRadians(p2.latitude)));
    }
    area = (area * this.EARTH_RADIUS_METERS * this.EARTH_RADIUS_METERS) / 2;
    return Math.abs(area); // In square meters
  }

  private static toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
