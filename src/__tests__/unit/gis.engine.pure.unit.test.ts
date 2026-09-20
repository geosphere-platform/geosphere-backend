/**
 * Pure Core & GIS Engine Framework-Independent Unit Tests
 *
 * Verifies spatial geometry primitives, coordinate validators, BoundingBox calculations,
 * Haversine geodesic distance, bearing, area, centroid, and point-in-polygon predicates
 * without any dependency on Next.js, React, DOM, or OpenLayers.
 */

import {
  Coordinate,
  Geometry,
  PointGeometry,
  LineStringGeometry,
  PolygonGeometry,
  isValidCoordinate,
  isValidPointGeometry,
} from "../../core/gis/types/geometry";
import { BoundingBox } from "../../core/gis/bbox/bounding-box";
import {
  calculateDistance,
  calculateBearing,
  calculatePathLength,
  calculateArea,
  calculateCentroid,
  isPointInPolygon,
  calculateBoundingBox,
  calculateCenter,
  isPointInsideBoundingBox,
  extractCoordinatesFromGeometry,
} from "../../core/gis/utils/spatial-utils";
import { AppError } from "../../core/errors/errors";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export function runPureGisEngineUnitTests(): void {
  console.log("------------------------------------------");
  console.log("RUNNING PURE CORE & GIS ENGINE UNIT TESTS");
  console.log("------------------------------------------");

  // 1. Coordinate Validation Tests
  console.log("  [1/8] Testing Coordinate Validation...");
  assert(isValidCoordinate([77.209, 28.6139]), "Valid [lng, lat] should pass");
  assert(isValidCoordinate([77.209, 28.6139, 100]), "Valid [lng, lat, ele] should pass");
  assert(!isValidCoordinate([190, 28.6139]), "Longitude > 180 should fail");
  assert(!isValidCoordinate([-181, 28.6139]), "Longitude < -180 should fail");
  assert(!isValidCoordinate([77.209, 95]), "Latitude > 90 should fail");
  assert(!isValidCoordinate([77.209, -91]), "Latitude < -90 should fail");
  assert(!isValidCoordinate([NaN, 28.6139]), "NaN longitude should fail");
  assert(!isValidCoordinate([77.209, NaN]), "NaN latitude should fail");
  assert(!isValidCoordinate([77.209]), "Single value array should fail");
  assert(!isValidCoordinate("invalid" as any), "Non-array coordinate should fail");

  // 2. Geometry Creation & Structural Validation
  console.log("  [2/8] Testing Geometry Creation & Validation...");
  const validPoint: PointGeometry = {
    type: "Point",
    coordinates: [77.209, 28.6139],
  };
  assert(isValidPointGeometry(validPoint), "Valid PointGeometry should pass");

  const invalidPoint: any = { type: "Point", coordinates: [200, 300] };
  assert(!isValidPointGeometry(invalidPoint), "Invalid PointGeometry coordinates should fail");

  const lineString: LineStringGeometry = {
    type: "LineString",
    coordinates: [
      [77.209, 28.6139],
      [77.215, 28.62],
    ],
  };
  assert(lineString.coordinates.length === 2, "LineString should have 2 coordinates");

  const polygon: PolygonGeometry = {
    type: "Polygon",
    coordinates: [
      [
        [77.20, 28.60],
        [77.22, 28.60],
        [77.22, 28.62],
        [77.20, 28.62],
        [77.20, 28.60],
      ],
    ],
  };
  assert(polygon.coordinates[0].length === 5, "Polygon ring should have 5 coordinates");

  // 3. BoundingBox Primitive Tests
  console.log("  [3/8] Testing BoundingBox Primitives...");
  const bbox = new BoundingBox(77.0, 28.0, 77.5, 28.5);
  assert(bbox.minLng === 77.0 && bbox.maxLat === 28.5, "BBOX properties should match constructor");
  assert(bbox.containsCoordinate([77.2, 28.2]), "Coordinate inside BBOX should be contained");
  assert(!bbox.containsCoordinate([77.8, 28.2]), "Coordinate outside BBOX should not be contained");

  const intersectingBbox = new BoundingBox(77.3, 28.3, 77.8, 28.8);
  assert(bbox.intersects(intersectingBbox), "Overlapping BBOXes should intersect");

  const nonIntersectingBbox = new BoundingBox(78.0, 29.0, 78.5, 29.5);
  assert(!bbox.intersects(nonIntersectingBbox), "Disjoint BBOXes should not intersect");

  const center = bbox.center();
  assert(center[0] === 77.25 && center[1] === 28.25, "BBOX center calculation must be accurate");

  const polygonGeom = bbox.toPolygon();
  assert(polygonGeom.type === "Polygon", "BBOX toPolygon must produce a Polygon geometry");
  assert(polygonGeom.coordinates[0].length === 5, "Polygon representation must be a closed 5-point loop");

  // BBOX Invalid Input Edge Cases
  let nanErrorThrown = false;
  try {
    new BoundingBox(NaN, 28.0, 77.5, 28.5);
  } catch (e) {
    nanErrorThrown = true;
  }
  assert(nanErrorThrown, "BBOX constructor must throw on NaN input");

  let invertedErrorThrown = false;
  try {
    new BoundingBox(77.5, 28.0, 77.0, 28.5);
  } catch (e) {
    invertedErrorThrown = true;
  }
  assert(invertedErrorThrown, "BBOX constructor must throw when minLongitude > maxLongitude");

  // 4. Geodesic Distance (Haversine) Tests
  console.log("  [4/8] Testing Haversine Distance Calculations...");
  const connaughtPlace: Coordinate = [77.2195, 28.6315];
  const indiaGate: Coordinate = [77.2295, 28.6129];
  const distMeters = calculateDistance(connaughtPlace, indiaGate);
  // Distance between CP and India Gate is approx 2.2 km (2000m - 2500m)
  assert(distMeters > 2000 && distMeters < 2500, `Distance should be ~2.2km, got ${distMeters.toFixed(1)}m`);

  const samePointDist = calculateDistance(connaughtPlace, connaughtPlace);
  assert(samePointDist === 0, "Distance between identical points must be 0");

  // 5. Bearing & Path Length Calculations
  console.log("  [5/8] Testing Bearing & Path Length Calculations...");
  const bearing = calculateBearing([77.0, 28.0], [77.0, 29.0]); // Due North
  assert(Math.abs(bearing - 0) < 0.1 || Math.abs(bearing - 360) < 0.1, `Bearing due North should be 0°, got ${bearing}°`);

  const pathLength = calculatePathLength([
    [77.0, 28.0],
    [77.0, 28.1],
    [77.0, 28.2],
  ]);
  assert(pathLength > 20000, `Path length should be > 20km, got ${pathLength.toFixed(1)}m`);

  // 6. Surface Area & Centroid Calculations
  console.log("  [6/8] Testing Area & Centroid Calculations...");
  const farmRing: Coordinate[][] = [
    [
      [77.20, 28.60],
      [77.21, 28.60],
      [77.21, 28.61],
      [77.20, 28.61],
      [77.20, 28.60],
    ],
  ];
  const areaSqMeters = calculateArea(farmRing);
  assert(areaSqMeters > 1_000_000, `Area of ~1km x 1km box should be > 1,000,000 m², got ${areaSqMeters.toFixed(1)}`);

  const centroid = calculateCentroid(farmRing[0]);
  assert(Math.abs(centroid[0] - 28.605) < 0.01 && Math.abs(centroid[1] - 77.205) < 0.01, "Centroid must be near ring center");

  // 7. Ray-Casting Point-in-Polygon Tests
  console.log("  [7/8] Testing Point-in-Polygon Predicates...");
  const ring = farmRing[0];
  assert(isPointInPolygon(28.605, 77.205, ring), "Point inside ring should evaluate to true");
  assert(!isPointInPolygon(28.65, 77.25, ring), "Point outside ring should evaluate to false");

  // 8. Geometry Extraction & Utilities
  console.log("  [8/8] Testing Geometry Extraction & Utilities...");
  const extracted = extractCoordinatesFromGeometry(polygon);
  assert(extracted.length === 5, "extractCoordinatesFromGeometry must return 5 coordinates for Polygon");

  const calculatedBbox = calculateBoundingBox(lineString);
  assert(calculatedBbox.minLng === 77.209 && calculatedBbox.maxLng === 77.215, "calculateBoundingBox from LineString must match bounds");

  const calculatedCenter = calculateCenter(lineString);
  assert(calculatedCenter[0] === 77.212, "calculateCenter from LineString must compute mid longitude");

  console.log("✅ Pure Core & GIS Engine Unit Tests Passed Successfully!");
}
