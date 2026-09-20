/**
 * GeometryValidationService — Generic Spatial Geometry Validation Service
 *
 * Validates GeoJSON geometry types, coordinate bounds, ring closure, minimum point counts,
 * SRID compliance, and integrates with PostGIS ST_IsValid / ST_IsValidReason.
 */

import { Geometry, Coordinate } from "../types/geometry";
import {
  InvalidGeometryError,
  InvalidCoordinateError,
  UnsupportedGeometryTypeError,
  SpatialOperationTooLargeError,
} from "../../errors/spatial-errors";
import { SPATIAL_OPERATION_LIMITS } from "../../config/spatial-limits";
import {
  PostGisOperationsRepository,
  PostGisValidationResult,
} from "./postgis-operations.repository";

export interface GeometryValidationReport {
  isValid: boolean;
  type: string;
  pointCount: number;
  srid: string;
  errors: string[];
  postgisValidation?: PostGisValidationResult;
}

export class GeometryValidationService {
  constructor(private readonly repository?: PostGisOperationsRepository) {}

  /**
   * Validate a single coordinate pair [longitude, latitude, altitude?]
   */
  validateCoordinate(coord: unknown, path: string = "coordinate"): Coordinate {
    if (!Array.isArray(coord) || coord.length < 2 || coord.length > 3) {
      throw new InvalidCoordinateError(
        `Coordinate at ${path} must be an array of [longitude, latitude, altitude?]`,
      );
    }

    const [lng, lat] = coord;

    if (
      typeof lng !== "number" ||
      isNaN(lng) ||
      !isFinite(lng) ||
      lng < -180 ||
      lng > 180
    ) {
      throw new InvalidCoordinateError(
        `Invalid longitude '${lng}' at ${path}[0]. Must be between -180 and 180`,
      );
    }

    if (
      typeof lat !== "number" ||
      isNaN(lat) ||
      !isFinite(lat) ||
      lat < -90 ||
      lat > 90
    ) {
      throw new InvalidCoordinateError(
        `Invalid latitude '${lat}' at ${path}[1]. Must be between -90 and 90`,
      );
    }

    return coord as Coordinate;
  }

  /**
   * Count total points in a geometry
   */
  countPoints(geometry: Geometry): number {
    switch (geometry.type) {
      case "Point":
        return 1;
      case "MultiPoint":
      case "LineString":
        return (geometry.coordinates as Coordinate[]).length;
      case "MultiLineString":
      case "Polygon":
        return (geometry.coordinates as Coordinate[][]).reduce(
          (acc, ring) => acc + ring.length,
          0,
        );
      case "MultiPolygon":
        return (geometry.coordinates as Coordinate[][][]).reduce(
          (acc, poly) =>
            acc + poly.reduce((ringAcc, ring) => ringAcc + ring.length, 0),
          0,
        );
      default:
        return 0;
    }
  }

  /**
   * Validate geometry structure and GeoJSON semantics
   */
  validateStructure(geometry: unknown): Geometry {
    if (!geometry || typeof geometry !== "object") {
      throw new InvalidGeometryError(
        "Geometry must be a valid non-null object",
      );
    }

    const g = geometry as Record<string, unknown>;
    const type = g.type as string;

    if (!type || typeof type !== "string") {
      throw new InvalidGeometryError(
        "Geometry missing required 'type' property",
      );
    }

    switch (type) {
      case "Point": {
        this.validateCoordinate(g.coordinates, "Point.coordinates");
        break;
      }
      case "MultiPoint": {
        const coords = g.coordinates;
        if (!Array.isArray(coords) || coords.length === 0) {
          throw new InvalidGeometryError(
            "MultiPoint must contain at least 1 coordinate",
          );
        }
        coords.forEach((c, idx) =>
          this.validateCoordinate(c, `MultiPoint.coordinates[${idx}]`),
        );
        break;
      }
      case "LineString": {
        const coords = g.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) {
          throw new InvalidGeometryError(
            "LineString must contain at least 2 coordinates",
          );
        }
        coords.forEach((c, idx) =>
          this.validateCoordinate(c, `LineString.coordinates[${idx}]`),
        );
        break;
      }
      case "MultiLineString": {
        const lines = g.coordinates;
        if (!Array.isArray(lines) || lines.length === 0) {
          throw new InvalidGeometryError(
            "MultiLineString must contain at least 1 line",
          );
        }
        lines.forEach((line, lIdx) => {
          if (!Array.isArray(line) || line.length < 2) {
            throw new InvalidGeometryError(
              `MultiLineString line ${lIdx} must contain at least 2 coordinates`,
            );
          }
          line.forEach((c, cIdx) =>
            this.validateCoordinate(c, `MultiLineString[${lIdx}][${cIdx}]`),
          );
        });
        break;
      }
      case "Polygon": {
        const rings = g.coordinates;
        if (!Array.isArray(rings) || rings.length === 0) {
          throw new InvalidGeometryError(
            "Polygon must contain at least 1 linear ring",
          );
        }
        rings.forEach((ring, rIdx) => {
          if (!Array.isArray(ring) || ring.length < 4) {
            throw new InvalidGeometryError(
              `Polygon ring ${rIdx} must contain at least 4 coordinates (closed ring)`,
            );
          }
          ring.forEach((c, cIdx) =>
            this.validateCoordinate(c, `Polygon[${rIdx}][${cIdx}]`),
          );

          const first = ring[0] as Coordinate;
          const last = ring[ring.length - 1] as Coordinate;
          if (first[0] !== last[0] || first[1] !== last[1]) {
            throw new InvalidGeometryError(
              `Polygon ring ${rIdx} is unclosed. First coordinate ${JSON.stringify(first)} must equal last coordinate ${JSON.stringify(last)}`,
            );
          }
        });
        break;
      }
      case "MultiPolygon": {
        const polygons = g.coordinates;
        if (!Array.isArray(polygons) || polygons.length === 0) {
          throw new InvalidGeometryError(
            "MultiPolygon must contain at least 1 polygon",
          );
        }
        polygons.forEach((poly, pIdx) => {
          if (!Array.isArray(poly) || poly.length === 0) {
            throw new InvalidGeometryError(
              `MultiPolygon polygon ${pIdx} must contain at least 1 ring`,
            );
          }
          poly.forEach((ring, rIdx) => {
            if (!Array.isArray(ring) || ring.length < 4) {
              throw new InvalidGeometryError(
                `MultiPolygon[${pIdx}][${rIdx}] ring must contain at least 4 coordinates`,
              );
            }
            ring.forEach((c, cIdx) =>
              this.validateCoordinate(
                c,
                `MultiPolygon[${pIdx}][${rIdx}][${cIdx}]`,
              ),
            );

            const first = ring[0] as Coordinate;
            const last = ring[ring.length - 1] as Coordinate;
            if (first[0] !== last[0] || first[1] !== last[1]) {
              throw new InvalidGeometryError(
                `MultiPolygon polygon ${pIdx} ring ${rIdx} is unclosed`,
              );
            }
          });
        });
        break;
      }
      default:
        throw new UnsupportedGeometryTypeError(type);
    }

    const validGeom = geometry as Geometry;
    const pts = this.countPoints(validGeom);
    if (pts > SPATIAL_OPERATION_LIMITS.MAX_GEOMETRY_POINTS) {
      throw new SpatialOperationTooLargeError(
        `Geometry contains ${pts} points, exceeding maximum limit of ${SPATIAL_OPERATION_LIMITS.MAX_GEOMETRY_POINTS}`,
      );
    }

    return validGeom;
  }

  /**
   * Comprehensive validation report including structure & PostGIS ST_IsValid execution
   */
  async validateDetailed(
    geometry: unknown,
    srid: string = "EPSG:4326",
  ): Promise<GeometryValidationReport> {
    const errors: string[] = [];
    let validGeom: Geometry | null = null;

    try {
      validGeom = this.validateStructure(geometry);
    } catch (err) {
      if (err instanceof Error) {
        errors.push(err.message);
      } else {
        errors.push("Invalid geometry payload");
      }
    }

    if (!validGeom) {
      return {
        isValid: false,
        type:
          typeof (geometry as Record<string, unknown>)?.type === "string"
            ? ((geometry as Record<string, unknown>).type as string)
            : "Unknown",
        pointCount: 0,
        srid,
        errors,
      };
    }

    const pointCount = this.countPoints(validGeom);
    let postgisReport: PostGisValidationResult | undefined;

    if (this.repository) {
      postgisReport = await this.repository.validateGeometryPostGis(validGeom);
      if (!postgisReport.isValid) {
        errors.push(`PostGIS Validation Error: ${postgisReport.reason}`);
      }
    }

    return {
      isValid: errors.length === 0,
      type: validGeom.type,
      pointCount,
      srid,
      errors,
      postgisValidation: postgisReport,
    };
  }
}
