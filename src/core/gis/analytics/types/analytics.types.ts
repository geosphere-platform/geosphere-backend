/**
 * GeoSphere Core Spatial Analytics Engine — Framework-Independent Domain Models
 *
 * Defines pure TypeScript models for heatmap points, spatial density grids, spatial clusters,
 * trajectory summaries, spatial metrics, and typed errors.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, Charting libraries, Android/iOS UI, database ORMs, or vehicle PII.
 */

import { Coordinate, BoundingBoxTuple } from "../../types/geometry";

export interface HeatmapPoint {
  coordinate: Coordinate; // [longitude, latitude]
  weight?: number; // Normalized 0.0 - 1.0 or raw scalar
}

export interface HeatmapOptions {
  radiusPixels?: number; // Heatmap blur radius
  minWeight?: number;
  maxWeight?: number;
  normalize?: boolean;
}

export interface SpatialDensityCell {
  cellId: string; // e.g. "cell_12_45"
  bounds: BoundingBoxTuple; // [minLng, minLat, maxLng, maxLat]
  center: Coordinate; // [centerLng, centerLat]
  pointCount: number;
  totalWeight: number;
  densityScore: number; // 0.0 - 1.0 normalized density
}

export interface SpatialDensityGrid {
  cellSizeKm: number;
  totalCells: number;
  totalPoints: number;
  boundingBox: BoundingBoxTuple;
  cells: SpatialDensityCell[];
}

export interface SpatialCluster {
  clusterId: string;
  centroid: Coordinate; // [lng, lat]
  pointCount: number;
  points: Coordinate[];
  radiusMeters: number;
}

export interface TrajectoryPoint {
  coordinate: Coordinate;
  timestamp: string; // ISO 8601 UTC
  speedKmh?: number;
}

export interface TrajectorySummary {
  totalDistanceMeters: number;
  durationSeconds: number;
  averageSpeedKmh: number;
  maxSpeedKmh: number;
  stopCount: number;
  totalIdleSeconds: number;
  boundingBox: BoundingBoxTuple;
  startCoordinate: Coordinate;
  endCoordinate: Coordinate;
}

export interface SpatialMetricSummary {
  totalPoints: number;
  boundingBox: BoundingBoxTuple;
  densityScore: number;
  averageDistanceMeters: number;
}

export type AnalyticsErrorCode =
  | "INVALID_COORDINATES"
  | "INSUFFICIENT_POINTS"
  | "INVALID_GRID_SIZE"
  | "CALCULATION_ERROR";

export class AnalyticsError extends Error {
  constructor(
    public readonly code: AnalyticsErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(`[ANALYTICS_ERROR:${code}] ${message}`);
    this.name = "AnalyticsError";
  }
}
