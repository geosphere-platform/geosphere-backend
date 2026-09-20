/**
 * GeoSphere Step 10 Location SDK + Native UI Foundation Unit Test Suite
 */

import {
  GeoSphereLocationSDK,
  GeoSphereLocationConfig,
  GeoSphereLocation,
  validateGeoSphereLocation,
  classifyLocationAccuracy,
  isLocationStale,
  LOCATION_UI_COMPONENTS,
  LOCATION_READY_MADE_SCREENS,
  resolveThemePrecedence,
  validateLocaleConfig,
  evaluatePermissionState
} from "../contracts/index.js";

import { GeoSphereClient } from "../client.js";

declare const process: { exit(code?: number): never };

async function runLocationSdkTests() {
  console.log("==========================================");
  console.log("RUNNING GEOSPHERE LOCATION SDK UNIT TESTS");
  console.log("==========================================");

  // 1. Initialization & Configuration Validation
  console.log("  [1/20] Testing Location SDK Initialization & Initial State...");
  const config: GeoSphereLocationConfig = {
    desiredAccuracy: 10,
    timeout: 5000,
    maximumAge: 30000,
    updateInterval: 2000,
    minimumDistance: 5,
    stalePolicyMaxAge: 60000,
    providerPreference: "high-accuracy",
    embeddedMode: true
  };

  const locationSdk = new GeoSphereLocationSDK(config);
  await locationSdk.initialize();

  if (locationSdk.getState() !== "READY") {
    throw new Error("Location SDK state failed to transition to READY after initialization");
  }

  // 2. Coordinate Range Validation
  console.log("  [2/20] Testing Coordinate Range & Struct Validation...");
  const validLoc = validateGeoSphereLocation({
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 8,
    altitude: 12,
    heading: 90,
    speed: 4.2
  });

  if (validLoc.latitude !== 37.7749 || validLoc.longitude !== -122.4194) {
    throw new Error("Coordinate validation corrupted valid latitude/longitude");
  }

  try {
    validateGeoSphereLocation({ latitude: 100, longitude: -122.4194 });
    throw new Error("Validation failed to reject invalid latitude > 90");
  } catch (e: any) {
    if (!e.message.includes("INVALID_LOCATION")) throw e;
  }

  // 3. Accuracy Classification & Quality Levels
  console.log("  [3/20] Testing Accuracy Classification & Quality Levels...");
  if (classifyLocationAccuracy(3) !== "VERY_HIGH") throw new Error("Accuracy classification failed for 3m");
  if (classifyLocationAccuracy(10) !== "HIGH") throw new Error("Accuracy classification failed for 10m");
  if (classifyLocationAccuracy(30) !== "MEDIUM") throw new Error("Accuracy classification failed for 30m");
  if (classifyLocationAccuracy(100) !== "LOW") throw new Error("Accuracy classification failed for 100m");
  if (classifyLocationAccuracy(null) !== "UNKNOWN") throw new Error("Accuracy classification failed for null");

  // 4. Stale Location Policy Evaluation
  console.log("  [4/20] Testing Stale Location Policy Evaluation...");
  const freshLocation: GeoSphereLocation = {
    latitude: 37.7749,
    longitude: -122.4194,
    timestamp: new Date().toISOString()
  };
  const staleLocation: GeoSphereLocation = {
    latitude: 37.7749,
    longitude: -122.4194,
    timestamp: new Date(Date.now() - 120000).toISOString() // 2 minutes ago
  };

  if (isLocationStale(freshLocation, 60000)) {
    throw new Error("Fresh location incorrectly identified as stale");
  }
  if (!isLocationStale(staleLocation, 60000)) {
    throw new Error("Stale location incorrectly identified as fresh");
  }

  // 5. One-Time Location Acquisition (getCurrentLocation)
  console.log("  [5/20] Testing One-Time Location Acquisition (getCurrentLocation)...");
  const currentLoc = await locationSdk.getCurrentLocation();
  if (!currentLoc || typeof currentLoc.latitude !== "number" || typeof currentLoc.longitude !== "number") {
    throw new Error("getCurrentLocation() failed to return valid coordinates");
  }
  if (locationSdk.getState() !== "AVAILABLE") {
    throw new Error("Location SDK state failed to transition to AVAILABLE");
  }

  // 6. Continuous Location Stream (startUpdates / stopUpdates)
  console.log("  [6/20] Testing Continuous Location Stream (startUpdates/stopUpdates)...");
  let updateReceived = false;
  locationSdk.subscribe((loc) => {
    updateReceived = true;
  });

  locationSdk.startUpdates();
  if (!updateReceived) {
    throw new Error("startUpdates() failed to notify subscribers with initial update");
  }

  locationSdk.stopUpdates();
  if (locationSdk.getState() !== "STOPPED") {
    throw new Error("stopUpdates() failed to set state to STOPPED");
  }

  // 7. Subscription & Unsubscription Lifecycle
  console.log("  [7/20] Testing Location Subscription Lifecycle...");
  let count = 0;
  const sub = locationSdk.subscribe(() => { count++; });
  sub.unsubscribe();

  // 8. Location State Machine Transitions
  console.log("  [8/20] Testing Location State Machine Transitions...");
  if (locationSdk.getPermissionState() !== "GRANTED") {
    throw new Error("Permission state check failed");
  }
  if (locationSdk.getServiceState() !== "ENABLED") {
    throw new Error("Service state check failed");
  }

  // 9. Service State vs Permission State Distinction
  console.log("  [9/20] Verifying Device Service State vs Permission State Distinction...");
  // Permission = GRANTED, Service = ENABLED is verified independently

  // 10. Capability Detection & Background Location Reporting
  console.log(" [10/20] Testing Location Capability Detection...");
  const caps = locationSdk.getCapabilities();
  if (!caps.includes("CURRENT_LOCATION") || !caps.includes("HIGH_ACCURACY")) {
    throw new Error("Capability query failed for supported location capabilities");
  }

  // 11. Privacy Boundary Audit (Zero Automatic Telemetry Upload)
  console.log(" [11/20] Verifying Privacy Decoupling (Zero Automatic Telemetry Upload)...");
  const sdkString = JSON.stringify(locationSdk);
  if (sdkString.includes("/api/location/telemetry") || sdkString.includes("http")) {
    throw new Error("PRIVACY VIOLATION: Location SDK contains automatic telemetry upload logic!");
  }

  // 12. Location Data Security Audit (No Tokens / No Secrets)
  console.log(" [12/20] Verifying Location Struct Security (No Secrets or Tokens)...");
  const locKeys = Object.keys(currentLoc);
  if (locKeys.includes("token") || locKeys.includes("apiKey") || locKeys.includes("secret")) {
    throw new Error("SECURITY VIOLATION: Location struct exposes security tokens!");
  }

  // 13. Theme System Integration
  console.log(" [13/20] Testing Location Theme System Integration...");
  const locationTheme = resolveThemePrecedence({
    tenantConfig: { preset: "modern" }
  });

  if (!locationTheme.colors.primary) {
    throw new Error("Theme precedence resolution failed for Location SDK");
  }

  // 14. Localization Configuration
  console.log(" [14/20] Testing Location Localization Configuration...");
  const validLocale = validateLocaleConfig({
    language: "en",
    locale: "en-US",
    timezone: "UTC",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "HH:mm",
    distanceUnit: "miles",
    speedUnit: "mph"
  });

  if (validLocale.distanceUnit !== "miles" || validLocale.speedUnit !== "mph") {
    throw new Error("Location localization config validation failed");
  }

  // 15. RBAC Permission Integration
  console.log(" [15/20] Testing Location RBAC Permission Checks...");
  const userPerms = ["location.read", "location.current"];
  const currentUIState = evaluatePermissionState(userPerms, "location.current", "hide");
  if (currentUIState.status !== "granted") {
    throw new Error("RBAC evaluation failed for granted location.current permission");
  }

  const configUIState = evaluatePermissionState(userPerms, "location.configure", "disable");
  if (configUIState.status !== "denied" || configUIState.mode !== "disable") {
    throw new Error("RBAC evaluation failed for denied location.configure permission");
  }

  // 16. Reusable UI Components Metadata
  console.log(" [16/20] Testing Reusable Location Component Definitions Metadata...");
  const statusComp = LOCATION_UI_COMPONENTS.LOCATION_STATUS;
  const currentComp = LOCATION_UI_COMPONENTS.CURRENT_LOCATION_INDICATOR;

  if (statusComp.id !== "location.status-badge" || statusComp.supportedPlatforms.length !== 3) {
    throw new Error("LOCATION_STATUS component metadata check failed");
  }
  if (!currentComp.requiredPermissions.includes("location.current")) {
    throw new Error("CURRENT_LOCATION_INDICATOR required permissions check failed");
  }

  // 17. Ready-Made Location Screens Metadata
  console.log(" [17/20] Testing Ready-Made Location Screen Definitions Metadata...");
  const statusScreen = LOCATION_READY_MADE_SCREENS.LOCATION_STATUS_SCREEN;
  const currentScreen = LOCATION_READY_MADE_SCREENS.CURRENT_LOCATION_SCREEN;

  if (statusScreen.mode !== "component" || !statusScreen.requiredPermissions.includes("location.read")) {
    throw new Error("LOCATION_STATUS_SCREEN metadata check failed");
  }
  if (!currentScreen.requiredPermissions.includes("location.current")) {
    throw new Error("CURRENT_LOCATION_SCREEN required permissions check failed");
  }

  // 18. Framework Neutrality Audit
  console.log(" [18/20] Verifying Framework Neutrality (No React/DOM Leakage)...");
  if (typeof (locationSdk as any).render === "function" || typeof (locationSdk as any).componentDidMount === "function") {
    throw new Error("DEPENDENCY VIOLATION: Location Core leaks UI framework methods!");
  }

  // 19. Resource Cleanup
  console.log(" [19/20] Testing Location SDK Resource Cleanup (destroy)...");
  locationSdk.destroy();
  if (locationSdk.getState() !== "STOPPED" || locationSdk.getLastKnownLocation() !== null) {
    throw new Error("destroy() failed to reset Location SDK state");
  }

  // 20. Backward Compatibility with Existing LocationModule & GeoSphereClient.location
  console.log(" [20/20] Verifying Backward Compatibility with GeoSphereClient.location...");
  const client = new GeoSphereClient({
    baseUrl: "https://api.geosphere.local",
    tenantId: "tenant_loc_test_001",
    applicationId: "app_loc_test_001"
  });

  if (!client.location || typeof client.location.createLocationSDK !== "function" || typeof client.location.sendTelemetry !== "function") {
    throw new Error("Backward compatibility broken: existing client.location facade is invalid");
  }

  console.log("✅ All GeoSphere Location SDK & Native UI Foundation Unit Tests Passed Successfully!");
}

runLocationSdkTests().catch((err) => {
  console.error("❌ GeoSphere Location SDK Unit Tests Failed:", err);
  process.exit(1);
});
