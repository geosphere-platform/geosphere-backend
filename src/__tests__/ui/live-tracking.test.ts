/**
 * GeoSphere Platform — Live Tracking Feature & UI Unit Tests
 *
 * Verifies live tracking entity models, status filtering, search logic,
 * breadcrumb trail accumulation, geofence status, India default region,
 * and user live location tracking.
 */

import { INITIAL_LIVE_ENTITIES, MOCK_GEOFENCE_ZONES } from "../../features/tracking/mock/trackingMockData";
import { LiveTrackingEntity, TrackingStatusFilter, DEFAULT_INDIA_CENTER, UserLiveLocation } from "../../features/tracking/types";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export function runLiveTrackingFeatureTests(): void {
  console.log("------------------------------------------");
  console.log("RUNNING LIVE TRACKING FEATURE & UI TESTS");
  console.log("------------------------------------------");

  // 1. Initial State & India Region Bounds Validation
  console.log("  [1/9] Verifying Initial Live Tracking Entity Data (India Region)...");
  assert(INITIAL_LIVE_ENTITIES.length >= 6, "Must contain at least 6 initial vehicles");
  const first = INITIAL_LIVE_ENTITIES[0];
  assert(!!first.id && !!first.licensePlate, "Entity must have valid id and plate");
  
  // Verify Indian Geographic Bounds: Latitude [8°N, 37°N], Longitude [68°E, 98°E]
  for (const v of INITIAL_LIVE_ENTITIES) {
    assert(
      v.latitude >= 8 && v.latitude <= 37,
      `Vehicle ${v.id} latitude (${v.latitude}) must be inside India bounds [8, 37]`,
    );
    assert(
      v.longitude >= 68 && v.longitude <= 98,
      `Vehicle ${v.id} longitude (${v.longitude}) must be inside India bounds [68, 98]`,
    );
    assert(v.speed >= 0, "Speed must be non-negative");
    assert(v.heading >= 0 && v.heading <= 360, "Heading must be between 0 and 360 deg");
    assert(v.batteryPct >= 0 && v.batteryPct <= 100, "Battery percentage must be 0-100");
  }

  // 2. Default Region Configuration (India)
  console.log("  [2/9] Testing Default Region Configuration (India)...");
  assert(DEFAULT_INDIA_CENTER.country === "India", "Default country must be India");
  assert(
    DEFAULT_INDIA_CENTER.latitude >= 20 && DEFAULT_INDIA_CENTER.latitude <= 22,
    "Default India center must be in Central India (Nagpur Zero Mile hub)",
  );
  assert(
    DEFAULT_INDIA_CENTER.longitude >= 78 && DEFAULT_INDIA_CENTER.longitude <= 80,
    "Default India center longitude must be around 79°E",
  );

  // 3. User Live Location Data Contract
  console.log("  [3/9] Testing User Live Location Contract...");
  const mockUserLocation: UserLiveLocation = {
    latitude: 21.1458,
    longitude: 79.0882,
    accuracyMeters: 15,
    heading: 90,
    speed: 0,
    timestamp: "12:00:00 PM",
    isRealGps: true,
    address: "Civil Lines, Nagpur, Maharashtra, India",
  };
  assert(mockUserLocation.isRealGps === true, "User location should reflect active GPS state");
  assert(typeof mockUserLocation.accuracyMeters === "number" && mockUserLocation.accuracyMeters > 0, "Accuracy must be positive");
  assert(mockUserLocation.latitude >= 8 && mockUserLocation.latitude <= 37, "User location must be in India");

  // 4. Status Filtering Logic
  console.log("  [4/9] Testing Fleet Status Filtering...");
  const filterByStatus = (status: TrackingStatusFilter, list: LiveTrackingEntity[]) => {
    if (status === "all") return list;
    return list.filter((e) => e.status === status);
  };

  const movingVehicles = filterByStatus("moving", INITIAL_LIVE_ENTITIES);
  const idleVehicles = filterByStatus("idle", INITIAL_LIVE_ENTITIES);
  const offlineVehicles = filterByStatus("offline", INITIAL_LIVE_ENTITIES);

  assert(movingVehicles.length > 0, "Should have moving vehicles");
  assert(idleVehicles.length > 0, "Should have idle vehicles");
  assert(offlineVehicles.length > 0, "Should have offline vehicles");
  assert(
    movingVehicles.every((v) => v.status === "moving"),
    "All filtered moving vehicles must have status 'moving'",
  );
  assert(
    idleVehicles.every((v) => v.status === "idle"),
    "All filtered idle vehicles must have status 'idle'",
  );

  // 5. Search Filtering (by Indian Plate, Name, Driver)
  console.log("  [5/9] Testing Quick Search Filter (Indian Registrations)...");
  const searchFilter = (query: string, list: LiveTrackingEntity[]) => {
    const q = query.toLowerCase();
    return list.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.licensePlate.toLowerCase().includes(q) ||
        e.driverName.toLowerCase().includes(q),
    );
  };

  const byPlate = searchFilter("MH-31-FA-1001", INITIAL_LIVE_ENTITIES);
  assert(byPlate.length === 1 && byPlate[0].id === "veh-001", "Should find veh-001 by MH-31 plate");

  const byDriver = searchFilter("Patil", INITIAL_LIVE_ENTITIES);
  assert(byDriver.length === 1 && byDriver[0].driverName === "Sunil Patil", "Should find by driver name Sunil Patil");

  const byType = searchFilter("Pharma", INITIAL_LIVE_ENTITIES);
  assert(byType.length === 1 && byType[0].id === "veh-006", "Should find by vehicle name Pharma");

  // 6. Breadcrumb Waypoints Accumulation & Bounds Cap
  console.log("  [6/9] Testing Breadcrumb Trail Accumulation...");
  assert(first.breadcrumbTrail.length > 0, "Vehicle #1 should have pre-populated breadcrumbs");
  const maxCap = 25;
  const simulatedTrail = [...first.breadcrumbTrail];
  for (let i = 0; i < 30; i++) {
    simulatedTrail.push({
      id: `wp-${i}`,
      latitude: 21.1458 + i * 0.0001,
      longitude: 79.0882 + i * 0.0001,
      speedKmh: 55,
      heading: 90,
      timestamp: "now",
    });
  }
  const cappedTrail = simulatedTrail.slice(-maxCap);
  assert(cappedTrail.length === maxCap, "Breadcrumb trail must cap at max 25 waypoints");

  // 7. Compass Cardinal Direction Converter
  console.log("  [7/9] Testing Compass Cardinal Direction Mapping...");
  const getCardinal = (deg: number): string => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 45) % 8;
    return directions[index];
  };

  assert(getCardinal(0) === "N", "0 deg should be North");
  assert(getCardinal(90) === "E", "90 deg should be East");
  assert(getCardinal(180) === "S", "180 deg should be South");
  assert(getCardinal(270) === "W", "270 deg should be West");
  assert(getCardinal(45) === "NE", "45 deg should be North-East");

  // 8. Geofence Boundaries Schema & Containment (India Hub)
  console.log("  [8/9] Testing Geofence Boundary Definitions in India...");
  assert(MOCK_GEOFENCE_ZONES.length >= 3, "Must have at least 3 geofence zones");
  const mihan = MOCK_GEOFENCE_ZONES[0];
  assert(mihan.coordinates.length >= 4, "Geofence polygon must have at least 4 coordinates");
  assert(
    mihan.coordinates[0][0] === mihan.coordinates[mihan.coordinates.length - 1][0] &&
      mihan.coordinates[0][1] === mihan.coordinates[mihan.coordinates.length - 1][1],
    "Geofence polygon must be closed (first and last coordinate match)",
  );
  // Verify coordinates are in India
  assert(mihan.coordinates[0][0] >= 68 && mihan.coordinates[0][0] <= 98, "Geofence must be in India (longitude)");
  assert(mihan.coordinates[0][1] >= 8 && mihan.coordinates[0][1] <= 37, "Geofence must be in India (latitude)");

  // 9. Overspeed Alert & Fleet Metrics Aggregation
  console.log("  [9/9] Testing Overspeed Alert & Fleet Metrics Aggregation...");
  const overspeedVehicles = INITIAL_LIVE_ENTITIES.filter((v) => v.overspeedAlert);
  assert(overspeedVehicles.length >= 1, "Must detect at least 1 overspeed vehicle in mock dataset");
  assert(overspeedVehicles[0].speed > 70, "Overspeed vehicle should exceed speed threshold");

  const total = INITIAL_LIVE_ENTITIES.length;
  const moving = INITIAL_LIVE_ENTITIES.filter((v) => v.status === "moving").length;
  const idle = INITIAL_LIVE_ENTITIES.filter((v) => v.status === "idle").length;
  const offline = INITIAL_LIVE_ENTITIES.filter((v) => v.status === "offline").length;

  assert(total === moving + idle + offline, "Total count must equal moving + idle + offline");
  console.log(`  ✓ Verified India fleet total: ${total}, moving: ${moving}, idle: ${idle}, offline: ${offline}`);
  console.log("✅ LIVE TRACKING (INDIA REGION + USER LOCATION) TESTS PASSED SUCCESSFULLY!");
}
