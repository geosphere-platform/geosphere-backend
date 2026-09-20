/**
 * Spatial Validation Utilities
 *
 * Strict validation routines for GeoJSON geometries, SRID, geographic coordinates,
 * bounding box ranges, search radii, and pagination limits.
 */

import { Geometry, Coordinate, isValidCoordinate } from "../types/geometry";
import {
  InvalidGeometryError,
  InvalidCoordinateError,
  InvalidBBoxError,
  InvalidRadiusError,
  SpatialResultLimitExceededError,
} from "../../errors/spatial-errors";

export const MAX_SPATIAL_LIMIT = 500;
export const DEFAULT_SPATIAL_LIMIT = 50;
export const MAX_RADIUS_METERS = 50000; // 50 km max search radius

/**
 * Validates SRID — strictly enforces EPSG:4326
 */
export function validateSRID(srid?: string): void {
  if (srid && srid !== "EPSG:4326") {
    throw new InvalidGeometryError(
      `Unsupported SRID '${srid}'. Platform strictly requires 'EPSG:4326'`,
    );
  }
}

/**
 * Validates a single geographic coordinate [longitude, latitude, elevation?]
 */
export function validateCoordinate(coord: unknown): Coordinate {
  if (!isValidCoordinate(coord)) {
    throw new InvalidCoordinateError(
      "Coordinate must be an array [longitude, latitude] where longitude is between -180 and 180 and latitude is between -90 and 90",
    );
  }
  return coord as Coordinate;
}

/**
 * Validates generic spatial geometry
 */
export function validateGeometry(geom: unknown): Geometry {
  if (!geom || typeof geom !== "object") {
    throw new InvalidGeometryError("Geometry object is required");
  }

  const g = geom as Geometry;
  const validTypes = [
    "Point",
    "LineString",
    "Polygon",
    "MultiPoint",
    "MultiLineString",
    "MultiPolygon",
  ];

  if (!validTypes.includes(g.type)) {
    throw new InvalidGeometryError(
      `Unsupported geometry type '${(g as { type?: string }).type}'. Must be one of: ${validTypes.join(", ")}`,
    );
  }

  switch (g.type) {
    case "Point":
      validateCoordinate(g.coordinates);
      break;

    case "LineString":
    case "MultiPoint":
      if (!Array.isArray(g.coordinates) || g.coordinates.length < 2) {
        throw new InvalidGeometryError(
          `${g.type} must contain at least 2 valid coordinates`,
        );
      }
      g.coordinates.forEach(validateCoordinate);
      break;

    case "Polygon":
    case "MultiLineString":
      if (!Array.isArray(g.coordinates) || g.coordinates.length === 0) {
        throw new InvalidGeometryError(
          `${g.type} coordinates array must not be empty`,
        );
      }
      g.coordinates.forEach((ring) => {
        if (!Array.isArray(ring) || ring.length < 3) {
          throw new InvalidGeometryError(
            `${g.type} linear ring must contain at least 3 coordinates`,
          );
        }
        ring.forEach(validateCoordinate);
      });
      break;

    case "MultiPolygon":
      if (!Array.isArray(g.coordinates) || g.coordinates.length === 0) {
        throw new InvalidGeometryError(
          "MultiPolygon coordinates array must not be empty",
        );
      }
      g.coordinates.forEach((poly) => {
        poly.forEach((ring) => {
          ring.forEach(validateCoordinate);
        });
      });
      break;
  }

  return g;
}

/**
 * Validates Bounding Box parameters
 */
export function validateBBox(
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number,
): { minLng: number; minLat: number; maxLng: number; maxLat: number } {
  if (isNaN(minLng) || isNaN(minLat) || isNaN(maxLng) || isNaN(maxLat)) {
    throw new InvalidBBoxError(
      "Bounding box coordinates must all be valid numbers",
    );
  }

  if (minLng < -180 || maxLng > 180 || minLat < -90 || maxLat > 90) {
    throw new InvalidBBoxError(
      "Bounding box coordinates out of bounds (lon [-180, 180], lat [-90, 90])",
    );
  }

  if (minLng > maxLng) {
    throw new InvalidBBoxError(
      "minLongitude cannot be greater than maxLongitude",
    );
  }

  if (minLat > maxLat) {
    throw new InvalidBBoxError(
      "minLatitude cannot be greater than maxLatitude",
    );
  }

  return { minLng, minLat, maxLng, maxLat };
}

/**
 * Validates search radius parameters
 */
export function validateRadius(
  radius: number,
  unit: string = "meters",
): number {
  if (isNaN(radius) || radius <= 0) {
    throw new InvalidRadiusError("Radius must be a positive number");
  }

  let radiusInMeters = radius;
  if (unit.toLowerCase() === "kilometers" || unit.toLowerCase() === "km") {
    radiusInMeters = radius * 1000;
  } else if (unit.toLowerCase() !== "meters" && unit.toLowerCase() !== "m") {
    throw new InvalidRadiusError(
      `Unsupported unit '${unit}'. Supported units: 'meters', 'kilometers'`,
    );
  }

  if (radiusInMeters > MAX_RADIUS_METERS) {
    throw new InvalidRadiusError(
      `Search radius of ${radiusInMeters}m exceeds maximum allowed limit of ${MAX_RADIUS_METERS}m (50km)`,
    );
  }

  return radiusInMeters;
}

/**
 * Validates pagination parameters
 */
export function validatePagination(
  limit?: number,
  offset?: number,
): { limit: number; offset: number } {
  const parsedLimit =
    limit !== undefined && !isNaN(limit)
      ? Math.trunc(limit)
      : DEFAULT_SPATIAL_LIMIT;
  const parsedOffset =
    offset !== undefined && !isNaN(offset) ? Math.trunc(offset) : 0;

  if (parsedLimit <= 0) {
    throw new SpatialResultLimitExceededError(MAX_SPATIAL_LIMIT);
  }

  if (parsedLimit > MAX_SPATIAL_LIMIT) {
    throw new SpatialResultLimitExceededError(MAX_SPATIAL_LIMIT);
  }

  if (parsedOffset < 0) {
    return { limit: parsedLimit, offset: 0 };
  }

  return { limit: parsedLimit, offset: parsedOffset };
}
