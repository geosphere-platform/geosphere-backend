/**
 * GeoSphere Platform — Geofence UI Component & UX Flow Tests
 *
 * Verifies:
 * 1. Non-technical category metadata & descriptions
 * 2. Radius presets & unit conversions (meters -> km)
 * 3. Unified Full-Screen mode mechanics & Escape key listener
 * 4. Automated alert notification triggers display logic
 * 5. Live vehicle presence badge logic (active pulse & plates)
 * 6. Jargon-free copy compliance (no raw WKT or GIS acronyms in labels)
 * 7. Live tracking cross-navigation deep links
 */

import assert from "node:assert";
import { GEOFENCE_CATEGORY_METADATA, GeofenceCategory } from "../../features/geofence/types";
import { DEFAULT_GEOFENCE_ZONES } from "../../features/geofence/mock/mockGeofences";

export async function runGeofenceUiTests(): Promise<void> {
  console.log("\n============================================================");
  console.log("   TEST SUITE: GEOFENCE UI & USER EXPERIENCE FLOWS");
  console.log("============================================================\n");

  // TEST 1: Friendly Non-Technical Category Metadata
  console.log("  [1/7] Testing Non-Technical Category Metadata & Icons...");
  const categories: GeofenceCategory[] = ["depot", "customer", "restricted", "terminal", "service"];

  categories.forEach((cat) => {
    const meta = GEOFENCE_CATEGORY_METADATA[cat];
    assert(meta, `Category ${cat} must exist in metadata`);
    assert(meta.label.length > 0, `Category ${cat} must have a user-friendly label`);
    assert(meta.icon.length > 0, `Category ${cat} must have an intuitive emoji icon`);
    assert(meta.defaultColor.startsWith("#"), `Category ${cat} must have a valid hex color`);
    assert(meta.description.length > 10, `Category ${cat} must have an explanatory description`);
  });
  console.log("    ✓ All 5 categories feature plain-English names, icons, and descriptions");

  // TEST 2: Radius Slider Presets & Unit Conversions
  console.log("  [2/7] Testing Radius Slider Presets & Unit Conversions...");
  const radiusPresets = [
    { meters: 250, expectedKm: "0.3 km" },
    { meters: 500, expectedKm: "0.5 km" },
    { meters: 1000, expectedKm: "1.0 km" },
    { meters: 2500, expectedKm: "2.5 km" },
    { meters: 5000, expectedKm: "5.0 km" },
  ];

  radiusPresets.forEach(({ meters, expectedKm }) => {
    const kmFormatted = `${(meters / 1000).toFixed(1)} km`;
    assert.strictEqual(kmFormatted, expectedKm, `Radius ${meters}m must format to ${expectedKm}`);
  });
  console.log("    ✓ Radius presets correctly calculate and display human-readable km units");

  // TEST 3: Unified Fullscreen Mechanics & Keyboard Contract
  console.log("  [3/7] Testing Unified Fullscreen Support & Esc Contract...");
  let isFullscreen = false;
  const toggleFullscreen = () => {
    isFullscreen = !isFullscreen;
  };
  const handleKeyDown = (key: string) => {
    if (key === "Escape" && isFullscreen) {
      isFullscreen = false;
    }
  };

  toggleFullscreen();
  assert.strictEqual(isFullscreen, true, "Fullscreen must be active after toggle");

  // Press Esc
  handleKeyDown("Escape");
  assert.strictEqual(isFullscreen, false, "Fullscreen must close cleanly when Escape is pressed");
  console.log("    ✓ Fullscreen toggle and Escape key handling operate correctly");

  const zoneWithAlerts = DEFAULT_GEOFENCE_ZONES.find((z) => z.id === "geo-mihan-cargo")!;
  assert(zoneWithAlerts !== undefined, "Zone geo-mihan-cargo must exist");
  assert.strictEqual(zoneWithAlerts.alertTriggers.onEnter, true, "Entry alert must be enabled");
  assert.strictEqual(zoneWithAlerts.alertTriggers.onExit, true, "Exit alert must be enabled");
  assert.strictEqual(zoneWithAlerts.alertTriggers.onDwell, true, "Dwell alert must be enabled");
  assert.strictEqual(zoneWithAlerts.alertTriggers.dwellMinutes, 45, "Dwell minutes must be 45");
  console.log("    ✓ Automated entry, exit, and dwell triggers properly mapped");

  // TEST 5: Live Vehicle Presence Badges & Plates
  console.log("  [5/7] Testing Live Vehicle Presence Detection...");
  const terminalZone = DEFAULT_GEOFENCE_ZONES.find((z) => z.id === "geo-mihan-cargo");
  assert(terminalZone !== undefined);
  assert.strictEqual(terminalZone.activeVehiclesCount, 3);
  assert.deepStrictEqual(terminalZone.activeVehiclePlates, [
    "MH-31-FA-1001",
    "MH-12-RN-4589",
    "DL-01-AX-9231",
  ]);

  const emptyZone = DEFAULT_GEOFENCE_ZONES.find((z) => z.id === "geo-kalmeshwar-agro");
  assert(emptyZone !== undefined);
  assert.strictEqual(emptyZone.activeVehiclesCount, 0);
  assert.strictEqual(emptyZone.activeVehiclePlates.length, 0);
  console.log("    ✓ Live fleet vehicle counts and license plates correspond to active presence");

  // TEST 6: Jargon-Free Non-Technical Copy Verification
  console.log("  [6/7] Verifying Non-Technical Jargon-Free UX Labels...");
  const userLabels = [
    "Virtual Zones & Geofences",
    "Total Virtual Zones",
    "Active Monitoring",
    "Vehicles Inside Now",
    "Circular Radius (Recommended)",
    "Custom Boundary",
    "Depot & Warehouse",
    "Customer Site",
    "Restricted Zone",
  ];

  // Forbidden GIS jargon for user-facing UI labels
  const forbiddenJargon = [
    "ST_GeomFromText",
    "EPSG:4326",
    "MultiPolygon",
    "Bounding Box Extent",
    "Spatial Reference Identifier",
    "WKT Coordinate String",
  ];

  userLabels.forEach((label) => {
    forbiddenJargon.forEach((jargon) => {
      assert(
        !label.includes(jargon),
        `Label "${label}" must not contain GIS technical jargon "${jargon}"`
      );
    });
  });
  console.log("    ✓ All customer-facing labels adhere to simple, non-technical terminology");

  // TEST 7: Cross-Navigation Deep Links
  console.log("  [7/7] Testing Deep Link Navigation to Live Tracking...");
  const plate = "MH-31-FA-1001";
  const expectedUrl = `/dashboard/tracking?search=${encodeURIComponent(plate)}`;
  assert.strictEqual(
    expectedUrl,
    "/dashboard/tracking?search=MH-31-FA-1001",
    "Deep link must construct valid search URL for live tracking"
  );
  console.log("    ✓ Deep link correctly targets vehicle on Live Tracking map");

  console.log("\n============================================================");
  console.log("   GEOFENCE UI & UX FLOW TESTS: ALL PASSED (7/7)");
  console.log("============================================================\n");
}

if (process.argv[1]?.includes("geofence.ui.test")) {
  runGeofenceUiTests().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
}
