import { BoundingBox } from "@/core/gis/bbox/bounding-box";

export function runBoundingBoxUnitTests() {
  // 1. Valid BoundingBox Creation
  const bbox = new BoundingBox(77.0, 28.0, 78.0, 29.0);
  if (bbox.minLongitude !== 77.0 || bbox.maxLatitude !== 29.0) {
    throw new Error("BoundingBox constructor failed");
  }

  // 2. Coordinate Containment
  if (!bbox.containsCoordinate([77.5, 28.5])) {
    throw new Error("BoundingBox: Inside coordinate rejected");
  }
  if (bbox.containsCoordinate([80.0, 28.5])) {
    throw new Error("BoundingBox: Outside coordinate accepted");
  }

  // 3. Intersection Check
  const overlapping = new BoundingBox(77.5, 28.5, 79.0, 29.5);
  if (!bbox.intersects(overlapping)) {
    throw new Error("BoundingBox: Intersecting BoundingBox rejected");
  }

  const nonOverlapping = new BoundingBox(80.0, 30.0, 81.0, 31.0);
  if (bbox.intersects(nonOverlapping)) {
    throw new Error("BoundingBox: Non-intersecting BoundingBox accepted");
  }

  // 4. Polygon Conversion
  const poly = bbox.toPolygon();
  if (poly.type !== "Polygon" || poly.coordinates[0].length !== 5) {
    throw new Error("BoundingBox: Closed polygon conversion failed");
  }

  return true;
}
