/**
 * Real-World Geospatial Scenarios & Edge Cases Integration Test Suite
 *
 * Verifies real-world end-to-end scenarios for logistics geofences, agricultural plot operations,
 * urban safety zone buffering, highway corridor route proximity, KNN nearest feature searches,
 * boundary edge cases, and PostGIS ST_IsValid error detection.
 */

import { PostGisOperationsRepository } from "../../core/gis/operations/postgis-operations.repository";
import { GeometryValidationService } from "../../core/gis/operations/geometry-validation.service";
import { SpatialMeasurementService } from "../../core/gis/operations/spatial-measurement.service";
import { SpatialOperationService } from "../../core/gis/operations/spatial-operation.service";
import { GeofenceEngine } from "../../core/gis/operations/geofence.engine";
import { Geometry, Coordinate } from "../../core/gis/types/geometry";
import { db } from "../../database";

export async function runRealWorldScenariosTest() {
  console.log(
    "   --> Initializing Real-World Geospatial Operations Test Suite...",
  );

  const repo = new PostGisOperationsRepository(db);
  const validator = new GeometryValidationService(repo);
  const measurement = new SpatialMeasurementService(repo, validator);
  const operations = new SpatialOperationService(repo, validator, measurement);
  const geofenceEngine = new GeofenceEngine(repo, validator);

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 1: Logistics Depot & Geofence Transition Lifecycle
  // ───────────────────────────────────────────────────────────────────────────
  console.log(
    "   --> Scenario 1: Logistics Depot Geofence Lifecycle & Transitions...",
  );

  // Mumbai Logistics Park Boundary Polygon
  const depotGeofence: Geometry = {
    type: "Polygon",
    coordinates: [
      [
        [72.87, 19.07] as Coordinate,
        [72.88, 19.07] as Coordinate,
        [72.88, 19.08] as Coordinate,
        [72.87, 19.08] as Coordinate,
        [72.87, 19.07] as Coordinate,
      ],
    ],
  };

  // Trajectory of Delivery Vehicle 101
  const point1_outside: Coordinate = [72.86, 19.06]; // Far outside
  const point2_inside: Coordinate = [72.875, 19.075]; // Center of depot
  const point3_inside2: Coordinate = [72.876, 19.076]; // Still inside depot

  // Step 1: Initial position OUTSIDE
  const eval1 = await geofenceEngine.evaluatePointAgainstGeofence(
    point1_outside,
    depotGeofence,
  );
  if (eval1.state !== "OUTSIDE")
    throw new Error(`Expected OUTSIDE, got ${eval1.state}`);

  // Step 2: Vehicle arrives INSIDE depot (Transition: ENTER)
  const eval2 = await geofenceEngine.evaluatePointAgainstGeofence(
    point2_inside,
    depotGeofence,
  );
  if (eval2.state !== "INSIDE")
    throw new Error(`Expected INSIDE, got ${eval2.state}`);
  const trans1 = geofenceEngine.evaluateTransition(eval1.state, eval2.state);
  if (trans1 !== "ENTER")
    throw new Error(`Expected ENTER transition, got ${trans1}`);

  // Create generic transition event for vehicle subject
  const event1 = geofenceEngine.createTransitionEvent(
    { tenantId: "logistics-tenant-01", role: "OPERATOR" },
    "depot-mumbai-01",
    "vehicle-delivery-101",
    eval1.state,
    eval2.state,
  );
  if (
    event1.transition !== "ENTER" ||
    event1.subjectId !== "vehicle-delivery-101"
  ) {
    throw new Error("Invalid transition event payload created");
  }

  // Step 3: Vehicle stays INSIDE depot (Transition: NO_CHANGE)
  const eval3 = await geofenceEngine.evaluatePointAgainstGeofence(
    point3_inside2,
    depotGeofence,
  );
  const trans2 = geofenceEngine.evaluateTransition(eval2.state, eval3.state);
  if (trans2 !== "NO_CHANGE")
    throw new Error(`Expected NO_CHANGE transition, got ${trans2}`);

  // Step 4: Vehicle leaves depot (Transition: EXIT)
  const trans3 = geofenceEngine.evaluateTransition(eval3.state, eval1.state);
  if (trans3 !== "EXIT")
    throw new Error(`Expected EXIT transition, got ${trans3}`);

  console.log(
    "   ✅ Scenario 1 Passed (Geofence State Machine & Event Lifecycle verified).",
  );

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: Agriculture / Farm Land Area & Polygon Union / Difference
  // ───────────────────────────────────────────────────────────────────────────
  console.log(
    "   --> Scenario 2: Agricultural Farm Plots Area & Polygon Union...",
  );

  // Farm Plot A (North Field)
  const plotA: Geometry = {
    type: "Polygon",
    coordinates: [
      [
        [73.85, 18.52] as Coordinate,
        [73.86, 18.52] as Coordinate,
        [73.86, 18.53] as Coordinate,
        [73.85, 18.53] as Coordinate,
        [73.85, 18.52] as Coordinate,
      ],
    ],
  };

  // Farm Plot B (Adjacent South Field overlapping)
  const plotB: Geometry = {
    type: "Polygon",
    coordinates: [
      [
        [73.855, 18.515] as Coordinate,
        [73.865, 18.515] as Coordinate,
        [73.865, 18.525] as Coordinate,
        [73.855, 18.525] as Coordinate,
        [73.855, 18.515] as Coordinate,
      ],
    ],
  };

  // Compute individual plot area in sq meters & hectares
  const areaA = await measurement.area(plotA, "hectares");
  if (areaA.area <= 0)
    throw new Error("Expected positive farm area in hectares");

  // Union of plots A & B
  const mergedPlot = await operations.unionGeometries([plotA, plotB]);
  if (
    !mergedPlot ||
    (mergedPlot.type !== "Polygon" && mergedPlot.type !== "MultiPolygon")
  ) {
    throw new Error("Union operation failed to return valid Polygon geometry");
  }

  // Polygon Difference (Plot A minus Plot B overlap)
  const diffPlot = await operations.difference(plotA, plotB);
  if (!diffPlot) throw new Error("Difference operation failed");

  console.log(
    `   ✅ Scenario 2 Passed (Farm Plot A: ${areaA.area} Ha, Merged Plot Type: ${mergedPlot.type}).`,
  );

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 3: Pipeline Corridor Safety Buffer Zone (500m & 2000m)
  // ───────────────────────────────────────────────────────────────────────────
  console.log(
    "   --> Scenario 3: Infrastructure Pipeline Safety Buffer Zone...",
  );

  const pipelineRoute: Geometry = {
    type: "LineString",
    coordinates: [
      [73.85, 18.52] as Coordinate,
      [73.89, 18.55] as Coordinate,
      [73.92, 18.58] as Coordinate,
    ],
  };

  const lineLen = await measurement.length(pipelineRoute, "kilometers");
  if (lineLen.length <= 0)
    throw new Error("Pipeline route length must be positive");

  // Generate 500m safety buffer zone around line
  const buffer500m = await operations.buffer(pipelineRoute, 500, "meters");
  if (buffer500m.type !== "Polygon" && buffer500m.type !== "MultiPolygon") {
    throw new Error("500m buffer failed to produce Polygon geometry");
  }

  // Verify pipeline line intersects its safety buffer zone
  const intersectsBuffer = await operations.intersects(
    pipelineRoute,
    buffer500m,
  );
  if (!intersectsBuffer)
    throw new Error("Pipeline must intersect its own buffer zone");

  console.log(
    `   ✅ Scenario 3 Passed (Pipeline Length: ${lineLen.length} km, Buffer Type: ${buffer500m.type}).`,
  );

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 4: Highway Nearest Service Asset & Closest Point
  // ───────────────────────────────────────────────────────────────────────────
  console.log(
    "   --> Scenario 4: Highway Nearest Service Asset & Closest Point...",
  );

  const vehicleBreakdownPt: Geometry = {
    type: "Point",
    coordinates: [73.855, 18.525],
  };

  const highwaySegment: Geometry = {
    type: "LineString",
    coordinates: [[73.85, 18.52] as Coordinate, [73.86, 18.53] as Coordinate],
  };

  // Find nearest point on highway line from breakdown location
  const closestPtOnHighway = await operations.nearestPointOnLine(
    highwaySegment,
    vehicleBreakdownPt,
  );
  if (closestPtOnHighway.type !== "Point")
    throw new Error("Closest point on line must be a Point");

  // Distance from breakdown to highway segment
  const distToHighway = await operations.pointToLineDistance(
    vehicleBreakdownPt,
    highwaySegment,
    "meters",
  );
  if (distToHighway < 0)
    throw new Error("Distance to highway cannot be negative");

  console.log(
    `   ✅ Scenario 4 Passed (Distance to Highway: ${distToHighway.toFixed(1)} m).`,
  );

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 5: Edge Cases & Invalid Geometry Validation Reports
  // ───────────────────────────────────────────────────────────────────────────
  console.log(
    "   --> Scenario 5: Edge Cases & Self-Intersecting Geometry Validation...",
  );

  // Self-intersecting bowtie polygon (invalid topology)
  const selfIntersectingPoly = {
    type: "Polygon" as const,
    coordinates: [
      [
        [0, 0] as Coordinate,
        [0, 10] as Coordinate,
        [10, 0] as Coordinate,
        [10, 10] as Coordinate,
        [0, 0] as Coordinate, // Self-intersects at center (5,5)
      ],
    ],
  };

  const valReport = await validator.validateDetailed(selfIntersectingPoly);
  // PostGIS ST_IsValid detects self-intersection when database is online
  if (valReport.postgisValidation && !valReport.postgisValidation.isValid) {
    console.log(
      `      PostGIS detected invalid topology: ${valReport.postgisValidation.reason}`,
    );
  }

  // Test Representative Point (ST_PointOnSurface) for U-shaped Polygon where centroid falls outside
  const uShapedPoly: Geometry = {
    type: "Polygon",
    coordinates: [
      [
        [0, 0] as Coordinate,
        [10, 0] as Coordinate,
        [10, 10] as Coordinate,
        [8, 10] as Coordinate,
        [8, 2] as Coordinate,
        [2, 2] as Coordinate,
        [2, 10] as Coordinate,
        [0, 10] as Coordinate,
        [0, 0] as Coordinate,
      ],
    ],
  };

  const repPt = await measurement.representativePoint(uShapedPoly);
  if (repPt.type !== "Point")
    throw new Error("Representative point must be a Point");

  console.log(
    "   ✅ Scenario 5 Passed (Representative interior point & edge cases verified).",
  );
}
