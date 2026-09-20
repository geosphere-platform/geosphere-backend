/**
 * GeoSphere Step 15 Search, Geocoding & Places SDK Unit Test Suite
 */

import {
  GeoSphereSearchSDK,
  GeoSphereSearchConfig,
  GeoSphereMockSearchProvider,
  InMemorySearchHistoryStore,
  GeoSphereSearchError,
  GeoSphereLocationSDK,
  GeoSphereRoutingSDK,
  SEARCH_UI_COMPONENTS,
  SEARCH_READY_MADE_SCREENS,
  resolveThemePrecedence,
  validateLocaleConfig,
  evaluatePermissionState
} from "../contracts/index.js";

import { GeoSphereClient } from "../client.js";

declare const process: { exit(code?: number): never };

async function runSearchSdkTests() {
  console.log("==========================================");
  console.log("RUNNING GEOSPHERE SEARCH SDK UNIT TESTS");
  console.log("==========================================");

  // 1. Initialization & Provider Configuration
  console.log("  [1/28] Testing Search SDK Initialization...");
  const config: GeoSphereSearchConfig = {
    language: "en",
    country: "IND",
    defaultLimit: 10,
    defaultRadiusMeters: 5000,
    units: "metric",
    embeddedMode: true
  };

  const provider = new GeoSphereMockSearchProvider();
  const historyStore = new InMemorySearchHistoryStore();
  const searchSdk = new GeoSphereSearchSDK(config, provider, historyStore);
  await searchSdk.initialize();

  const providerInfo = searchSdk.getProviderInfo();
  if (providerInfo.name !== "GeoSphereMockSearchProvider") {
    throw new Error("Search SDK initialization failed to bind mock search provider");
  }

  // 2. Capability Discovery
  console.log("  [2/28] Testing Search Capabilities Discovery...");
  const caps = searchSdk.getCapabilities();
  if (!caps.includes("FORWARD_GEOCODING") || !caps.includes("REVERSE_GEOCODING") || !caps.includes("NEARBY_SEARCH")) {
    throw new Error("Capability discovery failed for supported search capabilities");
  }

  // 3. Forward Geocoding (Address -> Coordinates)
  console.log("  [3/28] Testing Forward Geocoding...");
  const geocodeRes = await searchSdk.geocode({ address: "Nagpur Station" });
  if (!geocodeRes.results || geocodeRes.results.length === 0 || !geocodeRes.results[0].coordinate) {
    throw new Error("Forward geocoding failed to resolve coordinates for address");
  }
  const topResult = geocodeRes.results[0];
  if (topResult.coordinate[0] !== 79.0882 || topResult.coordinate[1] !== 21.1458) {
    throw new Error("Forward geocoding returned inaccurate coordinate values");
  }

  // 4. Reverse Geocoding (Coordinates -> Human-Readable Address)
  console.log("  [4/28] Testing Reverse Geocoding...");
  const revAddress = await searchSdk.reverseGeocode({ coordinate: [79.0882, 21.1458] });
  if (!revAddress.formattedAddress || !revAddress.city) {
    throw new Error("Reverse geocoding failed to return formatted address");
  }
  if (revAddress.city !== "Nagpur" || revAddress.country !== "India") {
    throw new Error("Reverse geocoding address normalization check failed");
  }

  // 5. Full-Text Place Search Execution
  console.log("  [5/28] Testing Full-Text Place Search Execution...");
  const events: any[] = [];
  searchSdk.subscribe((evt) => events.push(evt));

  const searchRes = await searchSdk.search({ query: "Airport" });
  if (!searchRes.results || searchRes.results.length === 0) {
    throw new Error("Place search failed to return matching POIs");
  }

  const searchEvt = events.find((e) => e.type === "search.executed");
  if (!searchEvt) {
    throw new Error("search.executed event was not emitted on search call");
  }

  // 6. Autocomplete Search Suggestions
  console.log("  [6/28] Testing Autocomplete Search Suggestions...");
  const suggestions = await searchSdk.suggest({ query: "Nag" });
  if (!suggestions || suggestions.length === 0 || !suggestions[0].title) {
    throw new Error("suggest() failed to return autocomplete suggestions");
  }

  // 7. Place Details Lookup & History Recording
  console.log("  [7/28] Testing Place Details Lookup & History Store...");
  const placeDetails = await searchSdk.getPlaceDetails({ placeId: "place_nagpur_central" });
  if (placeDetails.id !== "place_nagpur_central" || !placeDetails.name) {
    throw new Error("getPlaceDetails failed to return place record");
  }

  const history = await searchSdk.getSearchHistory();
  if (history.length === 0 || history[0].id !== "place_nagpur_central") {
    throw new Error("Place details lookup failed to persist place into search history store");
  }

  await searchSdk.clearSearchHistory();
  const clearedHist = await searchSdk.getSearchHistory();
  if (clearedHist.length !== 0) {
    throw new Error("clearSearchHistory failed to reset search history");
  }

  // 8. Nearby Search within Spatial Radius
  console.log("  [8/28] Testing Nearby Search within Spatial Radius...");
  const nearbyRes = await searchSdk.nearbySearch({
    center: [79.0882, 21.1458],
    radiusMeters: 3000,
    category: "transit"
  });
  if (!nearbyRes.results || nearbyRes.results.length === 0) {
    throw new Error("nearbySearch failed to return spatial POI results");
  }

  // 9. Location SDK Integration for Nearby Search from Current Location
  console.log("  [9/28] Testing Nearby Search from Live Device Location...");
  const locationSdk = new GeoSphereLocationSDK();
  await locationSdk.initialize();

  await searchSdk.initialize(locationSdk);
  const liveNearbyRes = await searchSdk.nearbySearchFromCurrentLocation("transit", 5000);
  if (!liveNearbyRes.results || liveNearbyRes.results.length === 0) {
    throw new Error("nearbySearchFromCurrentLocation failed to consume Location SDK");
  }

  // 10. Routing SDK Integration Boundary (routeToPlace)
  console.log(" [10/28] Testing Routing Integration Boundary (routeToPlace)...");
  const routingSdk = new GeoSphereRoutingSDK();
  await routingSdk.initialize();
  await searchSdk.initialize(locationSdk, routingSdk);

  const route = await searchSdk.routeToPlace(placeDetails);
  if (!route || !route.id || !route.summary) {
    throw new Error("routeToPlace integration failed to generate valid route via Routing SDK");
  }

  // 11. Search Error Normalization
  console.log(" [11/28] Testing Search Error Normalization...");
  try {
    await searchSdk.search({ query: "   " });
    throw new Error("search failed to throw when query is empty");
  } catch (e: any) {
    if (!(e instanceof GeoSphereSearchError) || e.code !== "INVALID_QUERY") throw e;
  }

  try {
    await searchSdk.reverseGeocode({ coordinate: [] as any });
    throw new Error("reverseGeocode failed to throw on invalid coordinate");
  } catch (e: any) {
    if (!(e instanceof GeoSphereSearchError) || e.code !== "INVALID_COORDINATE") throw e;
  }

  // 12. Security Audit (No Secrets or Tokens in Responses)
  console.log(" [12/28] Verifying Search Struct Security (No Secrets or Tokens)...");
  const eventStr = JSON.stringify(events);
  if (eventStr.includes("token") || eventStr.includes("apiKey") || eventStr.includes("secret")) {
    throw new Error("SECURITY VIOLATION: Search events expose security tokens!");
  }

  // 13. Privacy Boundary Audit (Zero Automatic History Syncing)
  console.log(" [13/28] Verifying Privacy Boundary (No Automatic Search History Tracking Upload)...");
  const sdkStr = JSON.stringify(searchSdk);
  if (sdkStr.includes("/api/search/history/upload") || sdkStr.includes("syncHistory")) {
    throw new Error("PRIVACY VIOLATION: Search SDK contains automatic search history tracking upload!");
  }

  // 14. Theme System Integration
  console.log(" [14/28] Testing Search Theme System Integration...");
  const searchTheme = resolveThemePrecedence({
    tenantConfig: { preset: "glass" }
  });

  if (!searchTheme.colors.primary) {
    throw new Error("Theme precedence resolution failed for Search SDK");
  }

  // 15. Localization Configuration
  console.log(" [15/28] Testing Search Localization Configuration...");
  const validLocale = validateLocaleConfig({
    language: "en",
    locale: "en-US",
    timezone: "UTC",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "HH:mm",
    distanceUnit: "kilometers",
    speedUnit: "km/h"
  });

  if (validLocale.distanceUnit !== "kilometers") {
    throw new Error("Search localization config validation failed");
  }

  // 16. RBAC Permission Integration
  console.log(" [16/28] Testing Search RBAC Permission Checks...");
  const userPerms = ["search.read", "search.execute", "search.placeDetails"];
  const executeUIState = evaluatePermissionState(userPerms, "search.execute", "hide");
  if (executeUIState.status !== "granted") {
    throw new Error("RBAC evaluation failed for granted search.execute permission");
  }

  const configUIState = evaluatePermissionState(userPerms, "search.configure", "disable");
  if (configUIState.status !== "denied" || configUIState.mode !== "disable") {
    throw new Error("RBAC evaluation failed for denied search.configure permission");
  }

  // 17. Reusable UI Components Metadata
  console.log(" [17/28] Testing Reusable Search Component Definitions Metadata...");
  const searchBarComp = SEARCH_UI_COMPONENTS.SEARCH_BAR;
  const placeDetComp = SEARCH_UI_COMPONENTS.PLACE_DETAILS;

  if (searchBarComp.id !== "search.search-bar" || searchBarComp.supportedPlatforms.length !== 3) {
    throw new Error("SEARCH_BAR component metadata check failed");
  }
  if (!placeDetComp.requiredPermissions.includes("search.placeDetails")) {
    throw new Error("PLACE_DETAILS required permissions check failed");
  }

  // 18. Ready-Made Search Screens Metadata
  console.log(" [18/28] Testing Ready-Made Search Screen Definitions Metadata...");
  const mainScreen = SEARCH_READY_MADE_SCREENS.SEARCH_SCREEN;
  const settingsScreen = SEARCH_READY_MADE_SCREENS.SEARCH_SETTINGS_SCREEN;

  if (mainScreen.mode !== "full-screen" || !mainScreen.requiredPermissions.includes("search.execute")) {
    throw new Error("SEARCH_SCREEN metadata check failed");
  }
  if (!settingsScreen.requiredPermissions.includes("search.configure")) {
    throw new Error("SEARCH_SETTINGS_SCREEN metadata check failed");
  }

  // 19. Framework Neutrality Audit
  console.log(" [19/28] Verifying Framework Neutrality (No React/DOM Leakage)...");
  if (typeof (searchSdk as any).render === "function" || typeof (searchSdk as any).componentDidMount === "function") {
    throw new Error("DEPENDENCY VIOLATION: Search Core leaks UI framework methods!");
  }

  // 20. Resource Cleanup
  console.log(" [20/28] Testing Search SDK Resource Cleanup (destroy)...");
  searchSdk.destroy();

  // 21. Backward Compatibility with GeoSphereClient.search
  console.log(" [21/28] Verifying Backward Compatibility with GeoSphereClient.search...");
  const client = new GeoSphereClient({
    baseUrl: "https://api.geosphere.local",
    tenantId: "tenant_search_test_001",
    applicationId: "app_search_test_001"
  });

  if (!client.search || typeof client.search.createSearchSDK !== "function") {
    throw new Error("Backward compatibility broken: existing client.search facade is invalid");
  }

  // 22. Zero Duplicate Routing Engine Audit
  console.log(" [22/28] Verifying Zero Duplicate Routing Engine in Search Core...");
  const hasOwnRouting = typeof (GeoSphereSearchSDK.prototype as any).calculateRoute === "function";
  if (hasOwnRouting) {
    throw new Error("DUPLICATION VIOLATION: Search SDK re-implemented Routing Engine!");
  }

  // 23. Zero Duplicate Navigation Engine Audit
  console.log(" [23/28] Verifying Zero Duplicate Navigation Engine in Search Core...");
  const hasOwnNav = typeof (GeoSphereSearchSDK.prototype as any).startNavigation === "function";
  if (hasOwnNav) {
    throw new Error("DUPLICATION VIOLATION: Search SDK re-implemented Navigation Engine!");
  }

  // 24. Zero Duplicate Location Acquisition Audit
  console.log(" [24/28] Verifying Zero Duplicate Location Acquisition Engine in Search Core...");
  const hasOwnGPS = typeof (GeoSphereSearchSDK.prototype as any).getCurrentPosition === "function";
  if (hasOwnGPS) {
    throw new Error("DUPLICATION VIOLATION: Search SDK re-implemented Location Acquisition Engine!");
  }

  // 25. Zero Duplicate GIS Geometry Engine Audit
  console.log(" [25/28] Verifying Zero Duplicate GIS Geometry Engine in Search Core...");
  const hasOwnPoly = typeof (GeoSphereSearchSDK.prototype as any).computeIntersection === "function";
  if (hasOwnPoly) {
    throw new Error("DUPLICATION VIOLATION: Search SDK re-implemented GIS Geometry Engine!");
  }

  // 26. Zero Duplicate Geofencing Engine Audit
  console.log(" [26/28] Verifying Zero Duplicate Geofencing Engine in Search Core...");
  const hasOwnFence = typeof (GeoSphereSearchSDK.prototype as any).checkPointInGeofence === "function";
  if (hasOwnFence) {
    throw new Error("DUPLICATION VIOLATION: Search SDK re-implemented Geofencing Engine!");
  }

  // 27. Search Filters Validation
  console.log(" [27/28] Verifying Search Filters Validation...");
  const filterSearch = await searchSdk.search({
    query: "station",
    category: "transit",
    country: "IND",
    radiusMeters: 10000
  });
  if (!filterSearch.results) {
    throw new Error("Filtered search failed to return results structure");
  }

  // 28. Teardown Verification
  console.log(" [28/28] Verifying Teardown Verification...");
  locationSdk.destroy();
  routingSdk.destroy();

  console.log("✅ All GeoSphere Search, Geocoding & Places SDK & Native UI Foundation Unit Tests Passed Successfully!");
}

runSearchSdkTests().catch((err) => {
  console.error("❌ GeoSphere Search SDK Unit Tests Failed:", err);
  process.exit(1);
});
