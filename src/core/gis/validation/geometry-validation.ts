/**
 * GIS Core — Geometry & GeoJSON Structured Validation
 *
 * Validates spatial geometries against GeoJSON specification standards.
 * Throws or returns structured GeometryValidationError instances.
 */

import { Geometry, Coordinate } from "../types/geometry";

export class GeometryValidationError extends Error {
  public readonly code: string;
  public readonly path?: string;

  constructor(
    message: string,
    code: string = "INVALID_GEOMETRY",
    path?: string,
  ) {
    super(message);
    this.name = "GeometryValidationError";
    this.code = code;
    this.path = path;
  }
}

export function validateCoordinate(
  coord: unknown,
  path: string = "coordinate",
): Coordinate {
  if (!Array.isArray(coord) || coord.length < 2 || coord.length > 3) {
    throw new GeometryValidationError(
      `Coordinate must be an array of [lng, lat, alt?]`,
      "INVALID_COORDINATE_FORMAT",
      path,
    );
  }
  const [lng, lat] = coord;
  if (typeof lng !== "number" || isNaN(lng) || lng < -180 || lng > 180) {
    throw new GeometryValidationError(
      `Invalid longitude '${lng}'. Must be between -180 and 180`,
      "INVALID_LONGITUDE",
      `${path}[0]`,
    );
  }
  if (typeof lat !== "number" || isNaN(lat) || lat < -90 || lat > 90) {
    throw new GeometryValidationError(
      `Invalid latitude '${lat}'. Must be between -90 and 90`,
      "INVALID_LATITUDE",
      `${path}[1]`,
    );
  }
  return coord as Coordinate;
}

export function validateGeometry(geometry: unknown): Geometry {
  if (!geometry || typeof geometry !== "object") {
    throw new GeometryValidationError(
      "Geometry must be a valid non-null object",
      "EMPTY_GEOMETRY",
    );
  }

  const g = geometry as Record<string, unknown>;
  const type = g.type as string;

  if (!type || typeof type !== "string") {
    throw new GeometryValidationError(
      "Geometry missing required 'type' string property",
      "MISSING_TYPE",
    );
  }

  switch (type) {
    case "Point": {
      validateCoordinate(g.coordinates, "Point.coordinates");
      return geometry as Geometry;
    }
    case "LineString": {
      const coords = g.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) {
        throw new GeometryValidationError(
          "LineString must contain at least 2 coordinates",
          "INSUFFICIENT_COORDINATES",
          "LineString.coordinates",
        );
      }
      coords.forEach((c, idx) =>
        validateCoordinate(c, `LineString.coordinates[${idx}]`),
      );
      return geometry as Geometry;
    }
    case "Polygon": {
      const rings = g.coordinates;
      if (!Array.isArray(rings) || rings.length === 0) {
        throw new GeometryValidationError(
          "Polygon must contain at least 1 linear ring",
          "EMPTY_POLYGON_RING",
          "Polygon.coordinates",
        );
      }
      rings.forEach((ring, rIdx) => {
        if (!Array.isArray(ring) || ring.length < 4) {
          throw new GeometryValidationError(
            `Polygon ring ${rIdx} must contain at least 4 coordinates (closed loop)`,
            "INVALID_POLYGON_RING",
            `Polygon.coordinates[${rIdx}]`,
          );
        }
        ring.forEach((c, cIdx) =>
          validateCoordinate(c, `Polygon.coordinates[${rIdx}][${cIdx}]`),
        );

        // Verify ring closure (first coordinate equals last coordinate)
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          throw new GeometryValidationError(
            `Polygon ring ${rIdx} is not closed (first and last coordinate must match)`,
            "UNCLOSED_POLYGON_RING",
            `Polygon.coordinates[${rIdx}]`,
          );
        }
      });
      return geometry as Geometry;
    }
    case "MultiPoint": {
      const coords = g.coordinates;
      if (!Array.isArray(coords) || coords.length === 0) {
        throw new GeometryValidationError(
          "MultiPoint must contain at least 1 coordinate",
          "EMPTY_MULTIPOINT",
          "MultiPoint.coordinates",
        );
      }
      coords.forEach((c, idx) =>
        validateCoordinate(c, `MultiPoint.coordinates[${idx}]`),
      );
      return geometry as Geometry;
    }
    case "MultiLineString": {
      const lines = g.coordinates;
      if (!Array.isArray(lines) || lines.length === 0) {
        throw new GeometryValidationError(
          "MultiLineString must contain at least 1 line",
          "EMPTY_MULTILINESTRING",
          "MultiLineString.coordinates",
        );
      }
      lines.forEach((line, lIdx) => {
        if (!Array.isArray(line) || line.length < 2) {
          throw new GeometryValidationError(
            `MultiLineString line ${lIdx} must contain at least 2 coordinates`,
            "INSUFFICIENT_COORDINATES",
            `MultiLineString.coordinates[${lIdx}]`,
          );
        }
        line.forEach((c, cIdx) =>
          validateCoordinate(
            c,
            `MultiLineString.coordinates[${lIdx}][${cIdx}]`,
          ),
        );
      });
      return geometry as Geometry;
    }
    case "MultiPolygon": {
      const polygons = g.coordinates;
      if (!Array.isArray(polygons) || polygons.length === 0) {
        throw new GeometryValidationError(
          "MultiPolygon must contain at least 1 polygon",
          "EMPTY_MULTIPOLYGON",
          "MultiPolygon.coordinates",
        );
      }
      polygons.forEach((poly, pIdx) => {
        if (!Array.isArray(poly) || poly.length === 0) {
          throw new GeometryValidationError(
            `MultiPolygon polygon ${pIdx} must contain at least 1 ring`,
            "EMPTY_POLYGON_RING",
            `MultiPolygon.coordinates[${pIdx}]`,
          );
        }
        poly.forEach((ring, rIdx) => {
          if (!Array.isArray(ring) || ring.length < 4) {
            throw new GeometryValidationError(
              `MultiPolygon polygon ${pIdx} ring ${rIdx} must contain at least 4 coordinates`,
              "INVALID_POLYGON_RING",
              `MultiPolygon.coordinates[${pIdx}][${rIdx}]`,
            );
          }
          ring.forEach((c, cIdx) =>
            validateCoordinate(
              c,
              `MultiPolygon.coordinates[${pIdx}][${rIdx}][${cIdx}]`,
            ),
          );
        });
      });
      return geometry as Geometry;
    }
    default:
      throw new GeometryValidationError(
        `Unsupported geometry type '${type}'`,
        "UNSUPPORTED_GEOMETRY_TYPE",
        "type",
      );
  }
}
