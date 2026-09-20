/**
 * LocationUpdate & SpatialCurrentPosition Domain Models
 *
 * Defines incoming location update payloads, normalized internal location records,
 * and latest spatial current position representations.
 */

import { PointGeometry, Coordinate } from "../types/geometry";

export type LocationSource =
  "mobile" | "web" | "iot" | "gps" | "api" | "simulated" | (string & {});

export interface LocationUpdate {
  subjectId: string;
  timestamp: string | number; // ISO string or epoch millis
  latitude: number;
  longitude: number;
  accuracy?: number; // meters
  altitude?: number; // meters
  speed?: number; // meters/second (or unit converted)
  heading?: number; // 0 - 360 degrees
  source?: LocationSource;
  metadata?: Record<string, unknown>;
}

export interface NormalizedLocationUpdate {
  subjectId: string;
  tenantId: string;
  coordinate: Coordinate; // [longitude, latitude]
  location: PointGeometry; // GeoJSON Point
  timestamp: string; // ISO 8601 UTC
  timestampMs: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null; // meters / sec
  heading: number | null; // normalized 0 - 360 deg
  source: string;
  metadata: Record<string, unknown>;
}

export interface SpatialCurrentPosition {
  subjectId: string;
  tenantId: string;
  location: PointGeometry;
  coordinate: Coordinate; // [longitude, latitude]
  timestamp: string; // UTC ISO 8601
  timestampMs: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  source: string;
  metadata: Record<string, unknown>;
  updatedAt: string;
}

export interface LocationHistoryRecord {
  id: string;
  tenantId: string;
  subjectId: string;
  location: PointGeometry;
  coordinate: Coordinate;
  timestamp: string;
  timestampMs: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  source: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}
