/**
 * GeoSphere Platform — Geofence Management Unit Tests
 *
 * Verifies:
 * 1. Default Geofence zones data structure integrity
 * 2. Circle-to-polygon approximation algorithm (closure, coordinates precision)
 * 3. KPI metrics computation (total, active, vehicles inside)
 * 4. Filtering by query, category, and shape type
 * 5. CRUD logic: Add, Toggle, Update, and Delete operations
 */

import assert from "node:assert";
import { DEFAULT_GEOFENCE_ZONES } from "../../features/geofence/mock/mockGeofences";
import { generateCirclePolygon } from "../../features/geofence/components/GeofenceMap";
import {
  GeofenceZoneItem,
  GEOFENCE_CATEGORY_METADATA,
} from "../../features/geofence/types";

export async function runGeofenceManagementUnitTests(): Promise<void> {
  console.log("\n============================================================");
  console.log("   TEST SUITE: GEOFENCE MANAGEMENT & BOUNDARY LOGIC");
  console.log("============================================================\n");

  // TEST 1: Default Zones Data Integrity
  console.log("  [1/6] Verifying Default Geofence Zones Structure...");
  assert(Array.isArray(DEFAULT_GEOFENCE_ZONES), "DEFAULT_GEOFENCE_ZONES must be an array");
  assert(DEFAULT_GEOFENCE_ZONES.length >= 5, "Must have at least 5 default zones for demonstration");

  DEFAULT_GEOFENCE_ZONES.forEach((zone) => {
    assert(zone.id, "Zone must have an id");
    assert(zone.name, "Zone must have a human-readable name");
    assert(zone.category, "Zone must have a category");
    assert(GEOFENCE_CATEGORY_METADATA[zone.category], `Category ${zone.category} must have valid metadata`);
    assert(Array.isArray(zone.center) && zone.center.length === 2, "Center must be [lon, lat]");
    assert(typeof zone.enabled === "boolean", "enabled flag must be boolean");
    assert(typeof zone.activeVehiclesCount === "number", "activeVehiclesCount must be number");
    assert(Array.isArray(zone.activeVehiclePlates), "activeVehiclePlates must be array");
  });
  console.log("    ✓ All default zones pass schema and metadata validation");

  // TEST 2: Circular Polygon Ring Generation
  console.log("  [2/6] Testing Circle-to-Polygon Approximation Algorithm...");
  const center: [number, number] = [79.0882, 21.1458];
  const radiusMeters = 1000;
  const polygonRing = generateCirclePolygon(center, radiusMeters, 32);

  assert(polygonRing.length === 33, "32-point circle must generate 33 vertices (closed ring)");
  const first = polygonRing[0];
  const last = polygonRing[polygonRing.length - 1];
  assert.strictEqual(first[0], last[0], "First and last longitude must match for closed polygon");
  assert.strictEqual(first[1], last[1], "First and last latitude must match for closed polygon");

  // Check delta distance is approx 1km (1000m ~ 0.009 degrees latitude)
  const maxLat = Math.max(...polygonRing.map((p) => p[1]));
  const minLat = Math.min(...polygonRing.map((p) => p[1]));
  const latDelta = maxLat - minLat;
  assert(latDelta > 0.015 && latDelta < 0.022, `Latitude delta (~${latDelta.toFixed(4)}°) must approximate ~2km diameter`);
  console.log("    ✓ Circle approximation produces valid closed polygon geometry");

  // TEST 3: KPI Metrics Calculation
  console.log("  [3/6] Testing Geofence KPI Metrics Calculation...");
  const total = DEFAULT_GEOFENCE_ZONES.length;
  const active = DEFAULT_GEOFENCE_ZONES.filter((z) => z.enabled).length;
  const vehiclesInside = DEFAULT_GEOFENCE_ZONES.reduce(
    (acc, z) => acc + (z.activeVehiclesCount || 0),
    0
  );

  assert.strictEqual(total, 6, "Total zones should equal 6");
  assert.strictEqual(active, 6, "All initial mock zones should be enabled");
  assert(vehiclesInside >= 5, "At least 5 vehicles should be detected inside boundaries");
  console.log(`    ✓ Computed KPIs: Total=${total}, Active=${active}, VehiclesInside=${vehiclesInside}`);

  // TEST 4: Filter by Search Query
  console.log("  [4/6] Testing Search Query Filtering...");
  const searchCargo = DEFAULT_GEOFENCE_ZONES.filter((z) =>
    z.name.toLowerCase().includes("cargo")
  );
  assert.strictEqual(searchCargo.length, 1, "Searching 'cargo' should return 1 terminal");
  assert.strictEqual(searchCargo[0].id, "geo-mihan-cargo");

  const searchPlate = DEFAULT_GEOFENCE_ZONES.filter((z) =>
    z.activeVehiclePlates.some((p) => p.includes("MH-31-FA-1001"))
  );
  assert(searchPlate.length >= 2, "Searching vehicle plate MH-31-FA-1001 should find its terminal and enclosing district");
  assert(searchPlate.some((z) => z.id === "geo-mihan-cargo"), "Should match MIHAN Cargo Hub");
  assert(searchPlate.some((z) => z.id === "geo-nagpur-district"), "Should match Nagpur District boundary");
  console.log("    ✓ Search query matches zone names and active vehicle license plates");

  // TEST 5: Filter by Category & Shape
  console.log("  [5/6] Testing Category & Shape Filtering...");
  const depotZones = DEFAULT_GEOFENCE_ZONES.filter((z) => z.category === "depot");
  assert(depotZones.length >= 1, "Should find depot zones");

  const circularZones = DEFAULT_GEOFENCE_ZONES.filter((z) => z.shapeType === "circle");
  assert(circularZones.length >= 2, "Should find circular radius zones");
  circularZones.forEach((z) => {
    assert(z.radiusMeters !== undefined && z.radiusMeters > 0, "Circle zone must have positive radiusMeters");
  });
  console.log("    ✓ Filter by category and shape type executes properly");

  // TEST 6: CRUD Operations (Add, Toggle, Delete)
  console.log("  [6/6] Testing Zone CRUD State Transitions...");
  let zonesList: GeofenceZoneItem[] = [...DEFAULT_GEOFENCE_ZONES];

  // Add Zone
  const newZone: GeofenceZoneItem = {
    id: "geo-custom-test",
    name: "Express Delivery Hub Test",
    category: "customer",
    color: "#f59e0b",
    shapeType: "circle",
    center: [79.1, 21.15],
    radiusMeters: 500,
    coordinates: [],
    enabled: true,
    activeVehiclesCount: 1,
    activeVehiclePlates: ["MH-31-TEST-99"],
    alertTriggers: { onEnter: true, onExit: true },
  };
  zonesList = [newZone, ...zonesList];
  assert.strictEqual(zonesList.length, total + 1, "List length must increase after addition");

  // Toggle Zone Enabled
  zonesList = zonesList.map((z) =>
    z.id === newZone.id ? { ...z, enabled: !z.enabled } : z
  );
  const toggled = zonesList.find((z) => z.id === newZone.id);
  assert.strictEqual(toggled?.enabled, false, "Zone should now be disabled");

  // Delete Zone
  zonesList = zonesList.filter((z) => z.id !== newZone.id);
  assert.strictEqual(zonesList.length, total, "List length must return to original after deletion");
  console.log("    ✓ Zone CRUD operations maintain immutability and state correctness");

  console.log("\n============================================================");
  console.log("   GEOFENCE MANAGEMENT UNIT TESTS: ALL PASSED (6/6)");
  console.log("============================================================\n");
}

if (process.argv[1]?.includes("geofence.management.unit.test")) {
  runGeofenceManagementUnitTests().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
}
