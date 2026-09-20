/**
 * GIS Core — Spatial Calculation & Utility Functions
 *
 * Geospatial calculations based on the WGS84 reference ellipsoid / Great-Circle spherical model.
 * All calculations explicitly state their mathematical model & accuracy bounds.
 */

import { Coordinate, Geometry } from "../types/geometry";
import { BoundingBox } from "../bbox/bounding-box";

const EARTH_RADIUS_METERS = 6371008.8; // Mean WGS84 earth radius

/**
 * Calculates Great-Circle Geodesic Distance between two coordinates in meters
 * Formula: Haversine Formula (accuracy approx. ±0.3% over WGS84 ellipsoid)
 */
export function calculateDistance(
  coord1: Coordinate,
  coord2: Coordinate,
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) *
      Math.cos(radLat2) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculates Initial Great-Circle Bearing (Heading) from coord1 to coord2 in degrees (0° - 360°)
 */
export function calculateBearing(
  coord1: Coordinate,
  coord2: Coordinate,
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(radLat2);
  const x =
    Math.cos(radLat1) * Math.sin(radLat2) -
    Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLon);

  const bearingRad = Math.atan2(y, x);
  const bearingDeg = ((bearingRad * 180) / Math.PI + 360) % 360;

  return bearingDeg;
}

/**
 * Calculates total path length of line coordinates in meters
 */
export function calculatePathLength(coordinates: Coordinate[]): number {
  if (!coordinates || coordinates.length < 2) return 0;
  let totalMeters = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    totalMeters += calculateDistance(coordinates[i], coordinates[i + 1]);
  }
  return totalMeters;
}

/**
 * Calculates approximate surface area of polygon rings in square meters
 */
export function calculateArea(rings: Coordinate[][]): number {
  if (!rings || rings.length === 0) return 0;
  const ring = rings[0];
  if (ring.length < 3) return 0;

  let areaSqDegrees = 0;
  const numPoints = ring.length;

  for (let i = 0; i < numPoints; i++) {
    const j = (i + 1) % numPoints;
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[j];
    areaSqDegrees += lon1 * lat2;
    areaSqDegrees -= lon2 * lat1;
  }

  areaSqDegrees = Math.abs(areaSqDegrees) / 2;
  const centerLat = ring.reduce((sum, pt) => sum + pt[1], 0) / ring.length;
  const metersPerLonDeg = 111320 * Math.cos((centerLat * Math.PI) / 180);
  const metersPerLatDeg = 110574;

  return areaSqDegrees * metersPerLonDeg * metersPerLatDeg;
}

/**
 * Calculates mean center of coordinates [latitude, longitude]
 */
export function calculateCentroid(coordinates: Coordinate[]): [number, number] {
  if (!coordinates || coordinates.length === 0) return [0, 0];
  let sumLat = 0;
  let sumLon = 0;
  for (const [lon, lat] of coordinates) {
    sumLat += lat;
    sumLon += lon;
  }
  return [sumLat / coordinates.length, sumLon / coordinates.length];
}

/**
 * Ray-casting Point in Polygon test
 */
export function isPointInPolygon(
  lat: number,
  lon: number,
  polygonRing: Coordinate[],
): boolean {
  let inside = false;
  for (let i = 0, j = polygonRing.length - 1; i < polygonRing.length; j = i++) {
    const xi = polygonRing[i][0];
    const yi = polygonRing[i][1];
    const xj = polygonRing[j][0];
    const yj = polygonRing[j][1];

    const intersect =
      yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Calculates Bounding Box for any Geometry or array of Coordinates
 */
export function calculateBoundingBox(
  geometryOrCoords: Geometry | Coordinate[],
): BoundingBox {
  let coords: Coordinate[] = [];

  if (Array.isArray(geometryOrCoords)) {
    coords = geometryOrCoords;
  } else {
    coords = extractCoordinatesFromGeometry(geometryOrCoords);
  }

  return BoundingBox.fromCoordinates(coords);
}

/**
 * Calculates Center Point (Centroid) of any Geometry or array of Coordinates
 */
export function calculateCenter(
  geometryOrCoords: Geometry | Coordinate[],
): Coordinate {
  const bbox = calculateBoundingBox(geometryOrCoords);
  return bbox.center();
}

/**
 * Checks if a Point coordinate is inside a BoundingBox
 */
export function isPointInsideBoundingBox(
  point: Coordinate,
  bbox: BoundingBox,
): boolean {
  return bbox.containsCoordinate(point);
}

/**
 * Recursively extracts all individual Coordinate tuples from any GeoJSON Geometry
 */
export function extractCoordinatesFromGeometry(
  geometry: Geometry,
): Coordinate[] {
  switch (geometry.type) {
    case "Point":
      return [geometry.coordinates];
    case "LineString":
    case "MultiPoint":
      return geometry.coordinates;
    case "Polygon":
    case "MultiLineString":
      return geometry.coordinates.flat();
    case "MultiPolygon":
      return geometry.coordinates.flat(2);
    default:
      return [];
  }
}
