import { GeofenceEngine } from "../../core/gis/operations/geofence.engine";
import { PostGisOperationsRepository } from "../../core/gis/operations/postgis-operations.repository";
import { GeometryValidationService } from "../../core/gis/operations/geometry-validation.service";
import { Coordinate } from "../../core/gis/types/geometry";
import { db } from "../../database";

export async function runGeofenceEngineUnitTests() {
  const repo = new PostGisOperationsRepository(db);
  const validator = new GeometryValidationService(repo);
  const engine = new GeofenceEngine(repo, validator);

  // Test 1: State transition state machine
  const t1 = engine.evaluateTransition("OUTSIDE", "INSIDE");
  if (t1 !== "ENTER") throw new Error(`Expected ENTER transition, got ${t1}`);

  const t2 = engine.evaluateTransition("INSIDE", "OUTSIDE");
  if (t2 !== "EXIT") throw new Error(`Expected EXIT transition, got ${t2}`);

  const t3 = engine.evaluateTransition("INSIDE", "INSIDE");
  if (t3 !== "NO_CHANGE")
    throw new Error(`Expected NO_CHANGE transition, got ${t3}`);

  const t4 = engine.evaluateTransition("OUTSIDE", "BOUNDARY");
  if (t4 !== "OUTSIDE_TO_BOUNDARY")
    throw new Error(`Expected OUTSIDE_TO_BOUNDARY transition, got ${t4}`);

  // Test 2: Point in Polygon Geofence Evaluation
  const poly = {
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

  const insidePt: Coordinate = [73.85, 18.53];
  const evalInside = await engine.evaluatePointAgainstGeofence(insidePt, poly);
  if (evalInside.state !== "INSIDE") {
    throw new Error(
      `Expected INSIDE state for point [73.85, 18.53], got ${evalInside.state}`,
    );
  }

  const outsidePt: Coordinate = [75.0, 20.0];
  const evalOutside = await engine.evaluatePointAgainstGeofence(
    outsidePt,
    poly,
  );
  if (evalOutside.state !== "OUTSIDE") {
    throw new Error(
      `Expected OUTSIDE state for point [75.0, 20.0], got ${evalOutside.state}`,
    );
  }

  // Test 3: Generic Event Model Creation with subjectId
  const ctx = { tenantId: "tenant-001", role: "TENANT_ADMIN" as const };
  const event = engine.createTransitionEvent(
    ctx,
    "gf-1",
    "vehicle-42",
    "OUTSIDE",
    "INSIDE",
  );

  if (event.subjectId !== "vehicle-42")
    throw new Error("Expected subjectId 'vehicle-42'");
  if (event.transition !== "ENTER")
    throw new Error("Expected transition 'ENTER'");
  if (event.tenantId !== "tenant-001")
    throw new Error("Expected tenantId 'tenant-001'");
}
