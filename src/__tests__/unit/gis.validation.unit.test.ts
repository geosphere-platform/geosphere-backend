import {
  validateGeometry,
  GeometryValidationError,
} from "@/core/gis/validation/geometry-validation";

export function runGeometryValidationUnitTests() {
  // 1. Valid Point
  validateGeometry({ type: "Point", coordinates: [77.209, 28.6139] });

  // 2. Invalid Point coordinate range
  try {
    validateGeometry({ type: "Point", coordinates: [200, 28.6139] });
    throw new Error("Validation failed: Out of bounds longitude accepted");
  } catch (err) {
    if (!(err instanceof GeometryValidationError)) {
      throw new Error("Expected GeometryValidationError");
    }
  }

  // 3. Unclosed Polygon
  try {
    validateGeometry({
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0], // Not closed to [0,0]
        ],
      ],
    });
    throw new Error("Validation failed: Unclosed Polygon accepted");
  } catch (err) {
    if (!(err instanceof GeometryValidationError)) {
      throw new Error(
        "Expected GeometryValidationError for unclosed polygon ring",
      );
    }
  }

  return true;
}
