import { env } from "@/core/config/env";

export interface GeometryValidationResult {
  valid: boolean;
  type: string;
  vertexCount: number;
  srid: number;
  error?: string;
}

export class SpatialGeometryValidator {
  /**
   * Validate GeoJSON Geometry object against security bounds (SRID 4326, vertex caps, range checks)
   */
  static validateGeometry(geoJson: any): GeometryValidationResult {
    if (!geoJson || typeof geoJson !== "object") {
      return {
        valid: false,
        type: "Unknown",
        vertexCount: 0,
        srid: 4326,
        error: "Invalid or missing GeoJSON object",
      };
    }

    // Support GeometryCollection or Feature wrapper
    const geom = geoJson.type === "Feature" ? geoJson.geometry : geoJson;
    if (!geom || !geom.type || !geom.coordinates) {
      return {
        valid: false,
        type: "Unknown",
        vertexCount: 0,
        srid: 4326,
        error: "Missing GeoJSON type or coordinates property",
      };
    }

    const type = geom.type;
    const allowedTypes = [
      "Point",
      "MultiPoint",
      "LineString",
      "MultiLineString",
      "Polygon",
      "MultiPolygon",
      "GeometryCollection",
    ];
    if (!allowedTypes.includes(type)) {
      return {
        valid: false,
        type,
        vertexCount: 0,
        srid: 4326,
        error: `Unsupported geometry type: ${type}`,
      };
    }

    let vertexCount = 0;

    try {
      vertexCount = SpatialGeometryValidator.countVerticesAndValidateCoords(
        geom.coordinates,
      );
    } catch (err) {
      return {
        valid: false,
        type,
        vertexCount: 0,
        srid: 4326,
        error:
          err instanceof Error ? err.message : "Malformed coordinate structure",
      };
    }

    const maxVertices = env.MAX_GEOJSON_VERTICES ?? 50000;
    if (vertexCount > maxVertices) {
      return {
        valid: false,
        type,
        vertexCount,
        srid: 4326,
        error: `Geometry exceeds maximum allowed complexity cap of ${maxVertices} vertices (received ${vertexCount})`,
      };
    }

    return {
      valid: true,
      type,
      vertexCount,
      srid: 4326,
    };
  }

  private static countVerticesAndValidateCoords(coords: any): number {
    if (!Array.isArray(coords)) {
      throw new Error("Coordinates must be an array");
    }

    // Base point coordinate pair [lng, lat]
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      const lng = coords[0];
      const lat = coords[1];
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        throw new Error(
          `Coordinate [${lng}, ${lat}] out of valid WGS84 range (Lng: -180..180, Lat: -90..90)`,
        );
      }
      return 1;
    }

    let total = 0;
    for (const item of coords) {
      total += SpatialGeometryValidator.countVerticesAndValidateCoords(item);
    }
    return total;
  }
}
