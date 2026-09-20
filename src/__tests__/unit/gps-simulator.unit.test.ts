/**
 * Phase 21 — Nagpur Multi-Vehicle GPS Simulator Unit Tests
 *
 * Verifies waypoint definitions, great-circle azimuth calculation,
 * directional arrow mapping, coordinate interpolation, and multi-vehicle stepping.
 */

import assert from "assert";
import {
  NAGPUR_SIMULATION_FLEET,
  ROUTE_CENTRAL_URBAN,
  ROUTE_SOUTH_CORRIDOR,
  ROUTE_WEST_INDUSTRIAL,
  calculateBearing,
  getDirectionArrow,
  interpolateCoordinate,
} from "../../features/tracking/mock/nagpurRoutes";
import { NagpurGpsSimulator } from "../../../scripts/gps-simulator";

export async function runGpsSimulatorUnitTests() {
  console.log("------------------------------------------");
  console.log("RUNNING NAGPUR GPS SIMULATOR UNIT TESTS");
  console.log("------------------------------------------");

  // 1. Nagpur Route Verification
  console.log("  [1/5] Verifying Nagpur Route Waypoints...");
  assert.strictEqual(NAGPUR_SIMULATION_FLEET.length, 3);
  assert.strictEqual(ROUTE_CENTRAL_URBAN.length >= 5, true);
  assert.strictEqual(ROUTE_SOUTH_CORRIDOR.length >= 5, true);
  assert.strictEqual(ROUTE_WEST_INDUSTRIAL.length >= 5, true);

  // All coordinates must be within Central India / Nagpur bounds
  for (const fleet of NAGPUR_SIMULATION_FLEET) {
    for (const wp of fleet.waypoints) {
      assert.strictEqual(wp.lat >= 20.8 && wp.lat <= 21.4, true, `Lat ${wp.lat} out of Nagpur bounds`);
      assert.strictEqual(wp.lng >= 78.8 && wp.lng <= 79.4, true, `Lng ${wp.lng} out of Nagpur bounds`);
      assert.strictEqual(wp.speedLimitKmh >= 20 && wp.speedLimitKmh <= 80, true);
    }
  }
  console.log("  ✓ All 3 fleet routes verified within Nagpur geographic envelope");

  // 2. Great-Circle Bearing Calculation
  console.log("  [2/5] Testing Great-Circle Forward Azimuth Calculation...");
  // Heading Due North (same lon, increasing lat)
  const northBearing = calculateBearing(21.0, 79.0, 21.1, 79.0);
  assert.strictEqual(northBearing === 0 || northBearing === 360, true);

  // Heading Due East (same lat, increasing lon)
  const eastBearing = calculateBearing(21.0, 79.0, 21.0, 79.1);
  assert.strictEqual(eastBearing, 90);

  // Heading Due South (same lon, decreasing lat)
  const southBearing = calculateBearing(21.1, 79.0, 21.0, 79.0);
  assert.strictEqual(southBearing, 180);

  // Heading Due West (same lat, decreasing lon)
  const westBearing = calculateBearing(21.0, 79.1, 21.0, 79.0);
  assert.strictEqual(westBearing, 270);
  console.log("  ✓ Great-circle forward azimuth accurate across all 4 cardinal quadrants");

  // 3. Directional Arrow Mapping
  console.log("  [3/5] Testing Directional Arrow Icons...");
  assert.strictEqual(getDirectionArrow(0), "↑");
  assert.strictEqual(getDirectionArrow(45), "↗");
  assert.strictEqual(getDirectionArrow(90), "→");
  assert.strictEqual(getDirectionArrow(135), "↘");
  assert.strictEqual(getDirectionArrow(180), "↓");
  assert.strictEqual(getDirectionArrow(225), "↙");
  assert.strictEqual(getDirectionArrow(270), "←");
  assert.strictEqual(getDirectionArrow(315), "↖");
  assert.strictEqual(getDirectionArrow(360), "↑");
  console.log("  ✓ Directional arrows accurately mapped to all 8 compass octants");

  // 4. Coordinate Interpolation
  console.log("  [4/5] Testing Waypoint Linear Interpolation...");
  const c1 = { lat: 21.0, lng: 79.0 };
  const c2 = { lat: 21.2, lng: 79.2 };

  const startPt = interpolateCoordinate(c1, c2, 0.0);
  assert.strictEqual(startPt.lat, 21.0);
  assert.strictEqual(startPt.lng, 79.0);

  const midPt = interpolateCoordinate(c1, c2, 0.5);
  assert.strictEqual(midPt.lat, 21.1);
  assert.strictEqual(midPt.lng, 79.1);

  const endPt = interpolateCoordinate(c1, c2, 1.0);
  assert.strictEqual(endPt.lat, 21.2);
  assert.strictEqual(endPt.lng, 79.2);
  console.log("  ✓ Waypoint interpolation conforms to parameter bounds");

  // 5. Simulator Stepping
  console.log("  [5/5] Testing NagpurGpsSimulator Step Progression...");
  const simulator = new NagpurGpsSimulator({
    vehicleCount: 3,
    intervalMs: 1000,
    dryRun: true,
  });

  const step1 = simulator.step();
  assert.strictEqual(step1.payloads.length, 3);
  assert.strictEqual(step1.states.length, 3);

  for (const p of step1.payloads) {
    assert.strictEqual(typeof p.subjectId, "string");
    assert.strictEqual(typeof p.latitude, "number");
    assert.strictEqual(typeof p.longitude, "number");
    assert.strictEqual(typeof p.speed, "number");
    assert.strictEqual(typeof p.heading, "number");
    assert.strictEqual(p.source, "gps-simulator");
  }

  // Advance second step
  const step2 = simulator.step();
  assert.strictEqual(step2.payloads.length, 3);
  // Vehicles should advance along route
  assert.strictEqual(step2.states[0].odometerKm >= step1.states[0].odometerKm, true);

  console.log("  ✓ Simulator successfully stepped 3 active vehicles along Nagpur routes");
  console.log("✅ NAGPUR GPS SIMULATOR UNIT TESTS PASSED SUCCESSFULLY!");
}
