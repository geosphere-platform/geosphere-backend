/**
 * GIS Core — Generic Spatial & Geometry Types
 *
 * Business-agnostic spatial domain primitives supporting EPSG:4326 (WGS84) and EPSG:3857 (Web Mercator).
 */

export type SpatialReference = "EPSG:4326" | "EPSG:3857";

/**
 * Geographic Coordinate tuple: [longitude, latitude, elevation?]
 */
export type Coordinate = [number, number, number?];

/**
 * Bounding Box Tuple: [minLng, minLat, maxLng, maxLat]
 */
export type BoundingBoxTuple = [number, number, number, number];

export type GeometryType =
  | "Point"
  | "LineString"
  | "Polygon"
  | "MultiPoint"
  | "MultiLineString"
  | "MultiPolygon";

export interface PointGeometry {
  type: "Point";
  coordinates: Coordinate;
}

export interface LineStringGeometry {
  type: "LineString";
  coordinates: Coordinate[];
}

export interface PolygonGeometry {
  type: "Polygon";
  coordinates: Coordinate[][];
}

export interface MultiPointGeometry {
  type: "MultiPoint";
  coordinates: Coordinate[];
}

export interface MultiLineStringGeometry {
  type: "MultiLineString";
  coordinates: Coordinate[][];
}

export interface MultiPolygonGeometry {
  type: "MultiPolygon";
  coordinates: Coordinate[][][];
}

export type Geometry =
  | PointGeometry
  | LineStringGeometry
  | PolygonGeometry
  | MultiPointGeometry
  | MultiLineStringGeometry
  | MultiPolygonGeometry;

/**
 * Geometry Validation Utilities
 */
export function isValidCoordinate(coord: unknown): coord is Coordinate {
  if (!Array.isArray(coord) || coord.length < 2 || coord.length > 3)
    return false;
  const [lng, lat] = coord;
  return (
    typeof lng === "number" &&
    !isNaN(lng) &&
    lng >= -180 &&
    lng <= 180 &&
    typeof lat === "number" &&
    !isNaN(lat) &&
    lat >= -90 &&
    lat <= 90
  );
}

export function isValidPointGeometry(geom: unknown): geom is PointGeometry {
  if (!geom || typeof geom !== "object") return false;
  const g = geom as PointGeometry;
  return g.type === "Point" && isValidCoordinate(g.coordinates);
}
