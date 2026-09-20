import { SpatialMeasurementService } from "../../core/gis/operations/spatial-measurement.service";
import { GeometryValidationService } from "../../core/gis/operations/geometry-validation.service";
import { PostGisOperationsRepository } from "../../core/gis/operations/postgis-operations.repository";
import { Coordinate } from "../../core/gis/types/geometry";
import { db } from "../../database";

export async function runSpatialMeasurementUnitTests() {
  const repo = new PostGisOperationsRepository(db);
  const validator = new GeometryValidationService(repo);
  const measurement = new SpatialMeasurementService(repo, validator);

  // Test 1: BoundingBox computation
  const polyGeom = {
    type: "Polygon" as const,
    coordinates: [
      [
        [73.78, 18.58] as Coordinate,
        [73.92, 18.58] as Coordinate,
        [73.92, 18.48] as Coordinate,
        [73.78, 18.48] as Coordinate,
        [73.78, 18.58] as Coordinate,
      ],
    ],
  };

  const bbox = measurement.boundingBox(polyGeom);
  if (bbox.minLng !== 73.78 || bbox.maxLng !== 73.92) {
    throw new Error(
      `Unexpected bounding box min/max Lng: ${bbox.minLng}, ${bbox.maxLng}`,
    );
  }

  // Test 2: Distance calculation
  const p1 = {
    type: "Point" as const,
    coordinates: [73.8567, 18.5204] as Coordinate,
  };
  const p2 = {
    type: "Point" as const,
    coordinates: [72.8777, 19.076] as Coordinate,
  };
  const distRes = await measurement.distance(p1, p2, "kilometers");

  if (distRes.distance <= 0) {
    throw new Error("Expected positive distance");
  }

  // Test 3: Area calculation
  const areaRes = await measurement.area(polyGeom, "sq_meters");
  if (areaRes.areaSqMeters < 0) {
    throw new Error("Expected non-negative area");
  }

  // Test 4: Centroid calculation
  const centroid = await measurement.centroid(polyGeom);
  if (centroid.type !== "Point") {
    throw new Error("Centroid must be a Point geometry");
  }
}
