/**
 * GeoSphere Core Routing Engine — Framework-Independent Domain Models
 *
 * Defines pure TypeScript models for route requests, route responses, waypoints,
 * steps, segments, routing profiles, preferences, options, summaries, and typed errors.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, MapLibre, Mapbox UI, Android/iOS UI, database ORMs, or vehicle PII.
 */

import { Coordinate, LineStringGeometry } from "../../types/geometry";

export type RouteProfile = "driving" | "walking" | "cycling" | "truck" | "motorcycle";

export type RoutePreference = "fastest" | "shortest" | "avoid-tolls" | "avoid-highways" | "avoid-ferries";

export interface RouteWaypoint {
  id?: string;
  name?: string;
  coordinate: Coordinate; // [longitude, latitude]
}

export interface RouteOptions {
  profile?: RouteProfile;
  preference?: RoutePreference;
  alternatives?: boolean;
  maxAlternatives?: number;
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  avoidFerries?: boolean;
  timeoutMs?: number;
  metadata?: Record<string, unknown>;
}

export interface RouteRequest {
  origin: RouteWaypoint | Coordinate;
  destination: RouteWaypoint | Coordinate;
  waypoints?: (RouteWaypoint | Coordinate)[];
  options?: RouteOptions;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  geometry?: LineStringGeometry;
  startCoordinate: Coordinate;
  endCoordinate: Coordinate;
}

export interface RouteSegment {
  distanceMeters: number;
  durationSeconds: number;
  steps: RouteStep[];
  geometry?: LineStringGeometry;
}

export interface RouteSummary {
  totalDistanceMeters: number;
  totalDistanceKm: number;
  totalDurationSeconds: number;
  totalDurationMinutes: number;
  waypointCount: number;
  profile: RouteProfile;
  providerName: string;
}

export interface Route {
  id: string;
  request: RouteRequest;
  geometry: LineStringGeometry;
  summary: RouteSummary;
  segments: RouteSegment[];
  waypoints: RouteWaypoint[];
  alternatives?: Route[];
  createdAt: string; // ISO 8601 UTC
  metadata?: Record<string, unknown>;
}

export interface RouteResponse {
  primaryRoute: Route;
  alternativeRoutes?: Route[];
  providerName: string;
  evaluatedAt: string; // ISO 8601 UTC
}

export type RoutingErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_COORDINATE"
  | "NO_ROUTE_FOUND"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_TIMEOUT"
  | "UNSUPPORTED_PROFILE"
  | "UNSUPPORTED_OPTION"
  | "NETWORK_ERROR";

export class RoutingError extends Error {
  constructor(
    public readonly code: RoutingErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(`[ROUTING_ERROR:${code}] ${message}`);
    this.name = "RoutingError";
  }
}
