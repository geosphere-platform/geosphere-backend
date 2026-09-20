/**
 * GeoSphere Maps SDK — Configurable Geospatial Snapping Engine
 *
 * Evaluates snapping targets (Vertices, Edges, Grid) against candidate map features.
 */

import { Coordinate, MapFeature } from "../types";

export interface SnappingConfig {
  enabled: boolean;
  tolerancePixels?: number;
  snapToVertices?: boolean;
  snapToEdges?: boolean;
  snapToGrid?: boolean;
  gridSizeMeters?: number;
  targetLayerIds?: string[];
}

export interface SnapResult {
  snappedCoordinate: Coordinate;
  isSnapped: boolean;
  snapType?: "vertex" | "edge" | "grid";
  snappedFeatureId?: string;
  distanceMeters?: number;
}

export class SnappingEngine {
  private config: SnappingConfig;

  constructor(config?: Partial<SnappingConfig>) {
    this.config = {
      enabled: true,
      tolerancePixels: 15,
      snapToVertices: true,
      snapToEdges: true,
      snapToGrid: false,
      ...config,
    };
  }

  public updateConfig(config: Partial<SnappingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): SnappingConfig {
    return { ...this.config };
  }

  /**
   * Snap a candidate coordinate to nearest vertex, edge, or grid coordinate.
   */
  public snap(pointerCoordinate: Coordinate, targetFeatures: MapFeature[]): SnapResult {
    if (!this.config.enabled) {
      return { snappedCoordinate: pointerCoordinate, isSnapped: false };
    }

    let bestSnap: SnapResult | null = null;
    let minDistance = Infinity;
    const thresholdMeters = (this.config.tolerancePixels || 15) * 10; // Approx spatial tolerance scale

    // 1. Evaluate Vertices
    if (this.config.snapToVertices) {
      for (const feat of targetFeatures) {
        if (this.config.targetLayerIds && feat.layerId && !this.config.targetLayerIds.includes(feat.layerId)) {
          continue;
        }

        const vertices = this.extractVertices(feat);
        for (const vertex of vertices) {
          const dist = this.haversineDistance(pointerCoordinate, vertex);
          if (dist <= thresholdMeters && dist < minDistance) {
            minDistance = dist;
            bestSnap = {
              snappedCoordinate: vertex,
              isSnapped: true,
              snapType: "vertex",
              snappedFeatureId: feat.id,
              distanceMeters: dist,
            };
          }
        }
      }
    }

    if (bestSnap) return bestSnap;

    // 2. Evaluate Grid Snapping Fallback
    if (this.config.snapToGrid && this.config.gridSizeMeters) {
      const gridDegree = (this.config.gridSizeMeters / 111320); // Approx degree step
      const gridLng = Math.round(pointerCoordinate[0] / gridDegree) * gridDegree;
      const gridLat = Math.round(pointerCoordinate[1] / gridDegree) * gridDegree;
      return {
        snappedCoordinate: [gridLng, gridLat],
        isSnapped: true,
        snapType: "grid",
      };
    }

    return { snappedCoordinate: pointerCoordinate, isSnapped: false };
  }

  private extractVertices(feature: MapFeature): Coordinate[] {
    const vertices: Coordinate[] = [];
    const geom = feature.geometry;

    if (geom.type === "Point") {
      vertices.push(geom.coordinates as Coordinate);
    } else if (geom.type === "LineString" || geom.type === "MultiPoint") {
      (geom.coordinates as Coordinate[]).forEach((c) => vertices.push(c));
    } else if (geom.type === "Polygon") {
      (geom.coordinates as Coordinate[][]).forEach((ring) => ring.forEach((c) => vertices.push(c)));
    }

    return vertices;
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
