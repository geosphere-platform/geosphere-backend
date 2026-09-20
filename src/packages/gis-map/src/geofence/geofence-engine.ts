/**
 * GeoSphere Maps SDK — Geofence System & Spatial Evaluation Engine
 *
 * Real-time point-in-polygon and circular radius spatial containment checks.
 */

import { Coordinate, Geometry } from "../types";

export interface GeofenceZone {
  id: string;
  name: string;
  geometry: Geometry;
  radiusMeters?: number;
  enabled: boolean;
  metadata?: Record<string, unknown>;
}

export type GeofenceTransitionType = "ENTER" | "EXIT" | "DWELL";

export interface GeofenceTransitionEvent {
  subjectId: string;
  geofenceId: string;
  type: GeofenceTransitionType;
  coordinate: Coordinate;
  timestamp: number;
}

export class GeofenceEngine {
  private zones: Map<string, GeofenceZone> = new Map();
  private subjectOccupancy: Map<string, Set<string>> = new Map(); // subjectId -> Set<geofenceId>

  public addGeofence(zone: GeofenceZone): void {
    this.zones.set(zone.id, zone);
  }

  public removeGeofence(zoneId: string): void {
    this.zones.delete(zoneId);
  }

  public getGeofence(zoneId: string): GeofenceZone | undefined {
    return this.zones.get(zoneId);
  }

  public getAllGeofences(): GeofenceZone[] {
    return Array.from(this.zones.values());
  }

  /**
   * Evaluate point containment against active geofences and return transition events.
   */
  public evaluateLocation(subjectId: string, coordinate: Coordinate): GeofenceTransitionEvent[] {
    const transitions: GeofenceTransitionEvent[] = [];
    const now = Date.now();

    let currentInside = this.subjectOccupancy.get(subjectId);
    if (!currentInside) {
      currentInside = new Set();
      this.subjectOccupancy.set(subjectId, currentInside);
    }

    const newInside = new Set<string>();

    for (const zone of this.zones.values()) {
      if (!zone.enabled) continue;

      const isInside = this.checkContainment(coordinate, zone);
      if (isInside) {
        newInside.add(zone.id);
        if (!currentInside.has(zone.id)) {
          transitions.push({
            subjectId,
            geofenceId: zone.id,
            type: "ENTER",
            coordinate,
            timestamp: now,
          });
        } else {
          transitions.push({
            subjectId,
            geofenceId: zone.id,
            type: "DWELL",
            coordinate,
            timestamp: now,
          });
        }
      }
    }

    // Check for EXIT transitions
    for (const oldZoneId of currentInside) {
      if (!newInside.has(oldZoneId)) {
        transitions.push({
          subjectId,
          geofenceId: oldZoneId,
          type: "EXIT",
          coordinate,
          timestamp: now,
        });
      }
    }

    this.subjectOccupancy.set(subjectId, newInside);
    return transitions;
  }

  private checkContainment(point: Coordinate, zone: GeofenceZone): boolean {
    const geom = zone.geometry;

    if (geom.type === "Point" && zone.radiusMeters) {
      const dist = this.haversineDistance(point, geom.coordinates as Coordinate);
      return dist <= zone.radiusMeters;
    }

    if (geom.type === "Polygon") {
      const ring = (geom.coordinates as Coordinate[][])[0];
      return this.pointInPolygon(point, ring);
    }

    return false;
  }

  private pointInPolygon(point: Coordinate, ring: Coordinate[]): boolean {
    let inside = false;
    const x = point[0];
    const y = point[1];

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0];
      const yi = ring[i][1];
      const xj = ring[j][0];
      const yj = ring[j][1];

      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  }

  private haversineDistance(p1: Coordinate, p2: Coordinate): number {
    const R = 6371000;
    const lat1 = (p1[1] * Math.PI) / 180;
    const lat2 = (p2[1] * Math.PI) / 180;
    const deltaLat = ((p2[1] - p1[1]) * Math.PI) / 180;
    const deltaLng = ((p2[0] - p1[0]) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
