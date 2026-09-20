/**
 * Framework-Independent SpatialAnalyticsEngine Class
 *
 * Provides heatmap generation, spatial density grid binning, spatial point clustering,
 * trajectory analysis, and spatial metric summary computation.
 *
 * Uses Core GIS spatial math helpers (Haversine distance, bounding box calculation).
 * MUST NOT depend on React, Next.js, OpenLayers, Charting libraries, Android/iOS UI, or vehicle PII.
 */

import { Coordinate, BoundingBoxTuple } from "../../types/geometry";
import { calculateDistance } from "../../utils/spatial-utils";
import {
  HeatmapPoint,
  HeatmapOptions,
  SpatialDensityCell,
  SpatialDensityGrid,
  SpatialCluster,
  TrajectoryPoint,
  TrajectorySummary,
  SpatialMetricSummary,
  AnalyticsError,
} from "../types/analytics.types";

export class SpatialAnalyticsEngine {
  /**
   * Generate heatmap points with weight normalization
   */
  public generateHeatmap(points: (HeatmapPoint | Coordinate)[], options: HeatmapOptions = {}): HeatmapPoint[] {
    if (!points || points.length === 0) {
      return [];
    }

    const normalizedPoints: HeatmapPoint[] = points.map((pt) => {
      if (Array.isArray(pt)) {
        return { coordinate: pt, weight: 1.0 };
      }
      return { coordinate: pt.coordinate, weight: pt.weight ?? 1.0 };
    });

    if (options.normalize) {
      let maxW = 0.0;
      for (const p of normalizedPoints) {
        if (p.weight! > maxW) maxW = p.weight!;
      }
      if (maxW > 0) {
        for (const p of normalizedPoints) {
          p.weight = Number((p.weight! / maxW).toFixed(4));
        }
      }
    }

    return normalizedPoints;
  }

  /**
   * Calculate bounding box for a list of coordinates
   */
  public computeBoundingBox(coordinates: Coordinate[]): BoundingBoxTuple {
    if (!coordinates || coordinates.length === 0) {
      return [0, 0, 0, 0];
    }
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;

    for (const [lng, lat] of coordinates) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    return [
      Number(minLng.toFixed(6)),
      Number(minLat.toFixed(6)),
      Number(maxLng.toFixed(6)),
      Number(maxLat.toFixed(6)),
    ];
  }

  /**
   * Compute spatial density grid
   */
  public computeDensityGrid(coordinates: Coordinate[], cellSizeKm: number = 1.0): SpatialDensityGrid {
    if (!coordinates || coordinates.length === 0) {
      throw new AnalyticsError("INSUFFICIENT_POINTS", "Cannot compute density grid on empty coordinate list");
    }
    if (cellSizeKm <= 0) {
      throw new AnalyticsError("INVALID_GRID_SIZE", "Cell size must be greater than 0 km");
    }

    const bbox = this.computeBoundingBox(coordinates);
    const [minLng, minLat, maxLng, maxLat] = bbox;

    // Convert approx 1km to lat/lng degrees (1 deg lat ~ 111km, 1 deg lng ~ 111km * cos(lat))
    const latStep = cellSizeKm / 111.0;
    const avgLat = (minLat + maxLat) / 2;
    const lngStep = cellSizeKm / (111.0 * Math.cos((avgLat * Math.PI) / 180));

    const gridMap = new Map<string, { bounds: BoundingBoxTuple; center: Coordinate; points: Coordinate[] }>();

    for (const coord of coordinates) {
      const col = Math.floor((coord[0] - minLng) / lngStep);
      const row = Math.floor((coord[1] - minLat) / latStep);
      const cellId = `cell_${col}_${row}`;

      if (!gridMap.has(cellId)) {
        const cellMinLng = Number((minLng + col * lngStep).toFixed(6));
        const cellMinLat = Number((minLat + row * latStep).toFixed(6));
        const cellMaxLng = Number((cellMinLng + lngStep).toFixed(6));
        const cellMaxLat = Number((cellMinLat + latStep).toFixed(6));

        gridMap.set(cellId, {
          bounds: [cellMinLng, cellMinLat, cellMaxLng, cellMaxLat],
          center: [
            Number(((cellMinLng + cellMaxLng) / 2).toFixed(6)),
            Number(((cellMinLat + cellMaxLat) / 2).toFixed(6)),
          ],
          points: [],
        });
      }

      gridMap.get(cellId)!.points.push(coord);
    }

    let maxPointsInCell = 0;
    for (const item of gridMap.values()) {
      if (item.points.length > maxPointsInCell) {
        maxPointsInCell = item.points.length;
      }
    }

    const cells: SpatialDensityCell[] = [];
    for (const [cellId, item] of gridMap.entries()) {
      cells.push({
        cellId,
        bounds: item.bounds,
        center: item.center,
        pointCount: item.points.length,
        totalWeight: item.points.length,
        densityScore: maxPointsInCell > 0 ? Number((item.points.length / maxPointsInCell).toFixed(4)) : 0,
      });
    }

    return {
      cellSizeKm,
      totalCells: cells.length,
      totalPoints: coordinates.length,
      boundingBox: bbox,
      cells,
    };
  }

  /**
   * Distance-based point clustering
   */
  public clusterPoints(coordinates: Coordinate[], maxDistanceMeters: number = 500): SpatialCluster[] {
    if (!coordinates || coordinates.length === 0) {
      return [];
    }

    const visited = new Set<number>();
    const clusters: SpatialCluster[] = [];
    let clusterIdx = 1;

    for (let i = 0; i < coordinates.length; i++) {
      if (visited.has(i)) continue;

      const currentClusterPoints: Coordinate[] = [coordinates[i]];
      visited.add(i);

      for (let j = i + 1; j < coordinates.length; j++) {
        if (visited.has(j)) continue;

        const dist = calculateDistance(coordinates[i], coordinates[j]);
        if (dist <= maxDistanceMeters) {
          currentClusterPoints.push(coordinates[j]);
          visited.add(j);
        }
      }

      // Compute centroid
      let sumLng = 0, sumLat = 0;
      for (const pt of currentClusterPoints) {
        sumLng += pt[0];
        sumLat += pt[1];
      }
      const centroid: Coordinate = [
        Number((sumLng / currentClusterPoints.length).toFixed(6)),
        Number((sumLat / currentClusterPoints.length).toFixed(6)),
      ];

      // Compute cluster radius
      let maxDist = 0;
      for (const pt of currentClusterPoints) {
        const d = calculateDistance(centroid, pt);
        if (d > maxDist) maxDist = d;
      }

      clusters.push({
        clusterId: `cluster_${clusterIdx++}`,
        centroid,
        pointCount: currentClusterPoints.length,
        points: currentClusterPoints,
        radiusMeters: Math.round(maxDist),
      });
    }

    return clusters;
  }

  /**
   * Trajectory analysis
   */
  public analyzeTrajectory(points: TrajectoryPoint[]): TrajectorySummary {
    if (!points || points.length < 2) {
      throw new AnalyticsError("INSUFFICIENT_POINTS", "Trajectory analysis requires at least 2 points");
    }

    let totalDistanceMeters = 0;
    let maxSpeedKmh = 0;
    let stopCount = 0;
    let totalIdleSeconds = 0;
    const speeds: number[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      const dist = calculateDistance(p1.coordinate, p2.coordinate);
      totalDistanceMeters += dist;

      const t1 = new Date(p1.timestamp).getTime();
      const t2 = new Date(p2.timestamp).getTime();
      const timeDiffSeconds = Math.max(1, (t2 - t1) / 1000);

      const speed = p2.speedKmh ?? (dist / 1000) / (timeDiffSeconds / 3600);
      speeds.push(speed);

      if (speed > maxSpeedKmh) {
        maxSpeedKmh = speed;
      }

      if ((speed === 0 || dist < 20.0) && timeDiffSeconds >= 30) { // Stationary stop (speed === 0 or distance < 20m for >=30s)
        stopCount++;
        totalIdleSeconds += timeDiffSeconds;
      }
    }

    const startTimestamp = new Date(points[0].timestamp).getTime();
    const endTimestamp = new Date(points[points.length - 1].timestamp).getTime();
    const durationSeconds = Math.max(1, (endTimestamp - startTimestamp) / 1000);

    const averageSpeedKmh = Number(((totalDistanceMeters / 1000) / (durationSeconds / 3600)).toFixed(2));
    const coords = points.map((p) => p.coordinate);
    const bbox = this.computeBoundingBox(coords);

    return {
      totalDistanceMeters: Math.round(totalDistanceMeters),
      durationSeconds: Math.round(durationSeconds),
      averageSpeedKmh: isNaN(averageSpeedKmh) ? 0 : averageSpeedKmh,
      maxSpeedKmh: Number(maxSpeedKmh.toFixed(2)),
      stopCount,
      totalIdleSeconds: Math.round(totalIdleSeconds),
      boundingBox: bbox,
      startCoordinate: points[0].coordinate,
      endCoordinate: points[points.length - 1].coordinate,
    };
  }

  /**
   * Spatial metric summary calculation
   */
  public computeMetricSummary(coordinates: Coordinate[]): SpatialMetricSummary {
    if (!coordinates || coordinates.length === 0) {
      return {
        totalPoints: 0,
        boundingBox: [0, 0, 0, 0],
        densityScore: 0,
        averageDistanceMeters: 0,
      };
    }

    const bbox = this.computeBoundingBox(coordinates);
    let totalDist = 0;
    let pairsCount = 0;

    for (let i = 0; i < Math.min(coordinates.length, 50); i++) {
      for (let j = i + 1; j < Math.min(coordinates.length, 50); j++) {
        totalDist += calculateDistance(coordinates[i], coordinates[j]);
        pairsCount++;
      }
    }

    const avgDist = pairsCount > 0 ? Math.round(totalDist / pairsCount) : 0;

    return {
      totalPoints: coordinates.length,
      boundingBox: bbox,
      densityScore: Number((coordinates.length / (bbox[2] - bbox[0] + 0.001)).toFixed(2)),
      averageDistanceMeters: avgDist,
    };
  }
}
