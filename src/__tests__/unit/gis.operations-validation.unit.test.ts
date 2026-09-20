import { GeometryValidationService } from "../../core/gis/operations/geometry-validation.service";
import {
  InvalidGeometryError,
  InvalidCoordinateError,
  UnsupportedGeometryTypeError,
  SpatialOperationTooLargeError,
} from "../../core/errors/spatial-errors";

export function runOperationsValidationUnitTests() {
  const validator = new GeometryValidationService();

  // Test 1: Valid Point & Coordinates
  const validPoint = validator.validateStructure({
    type: "Point",
    coordinates: [73.8567, 18.5204],
  });
  if (validPoint.type !== "Point")
    throw new Error("Expected valid Point geometry");

  // Test 2: Invalid Coordinate Bounds
  let threwLng = false;
  try {
    validator.validateCoordinate([195.0, 18.5]);
  } catch (err) {
    if (err instanceof InvalidCoordinateError) threwLng = true;
  }
  if (!threwLng)
    throw new Error("Expected InvalidCoordinateError for longitude > 180");

  let threwLat = false;
  try {
    validator.validateCoordinate([73.85, -95.0]);
  } catch (err) {
    if (err instanceof InvalidCoordinateError) threwLat = true;
  }
  if (!threwLat)
    throw new Error("Expected InvalidCoordinateError for latitude < -90");

  // Test 3: Polygon Linear Ring Closure
  const closedPoly = {
    type: "Polygon",
    coordinates: [
      [
        [73.78, 18.58],
        [73.92, 18.58],
        [73.92, 18.48],
        [73.78, 18.48],
        [73.78, 18.58],
      ],
    ],
  };
  const validPoly = validator.validateStructure(closedPoly);
  if (validPoly.type !== "Polygon") throw new Error("Expected valid Polygon");

  let threwUnclosed = false;
  try {
    validator.validateStructure({
      type: "Polygon",
      coordinates: [
        [
          [73.78, 18.58],
          [73.92, 18.58],
          [73.92, 18.48],
          [73.78, 18.48], // Unclosed
        ],
      ],
    });
  } catch (err) {
    if (err instanceof InvalidGeometryError) threwUnclosed = true;
  }
  if (!threwUnclosed)
    throw new Error("Expected InvalidGeometryError for unclosed Polygon ring");

  // Test 4: Unsupported Geometry Type
  let threwType = false;
  try {
    validator.validateStructure({ type: "Circle", coordinates: [0, 0] });
  } catch (err) {
    if (err instanceof UnsupportedGeometryTypeError) threwType = true;
  }
  if (!threwType)
    throw new Error("Expected UnsupportedGeometryTypeError for Circle");

  // Test 5: Point Count Calculation
  const pts = validator.countPoints(validPoly);
  if (pts !== 5) throw new Error(`Expected point count 5, got ${pts}`);
}
