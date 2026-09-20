/**
 * GeoSphere Step 13 Routing SDK + Native UI Foundation Unit Test Suite
 */
import { GeoSphereRoutingSDK, GeoSphereMockRoutingProvider, validateCoordinate, normalizeWaypoint, ROUTING_UI_COMPONENTS, ROUTING_READY_MADE_SCREENS, resolveThemePrecedence, validateLocaleConfig, evaluatePermissionState } from "../contracts/index.js";
import { GeoSphereClient } from "../client.js";
async function runRoutingSdkTests() {
    console.log("==========================================");
    console.log("RUNNING GEOSPHERE ROUTING SDK UNIT TESTS");
    console.log("==========================================");
    // 1. Initialization & Configuration
    console.log("  [1/25] Testing Routing SDK Initialization...");
    const config = {
        defaultProfile: "driving",
        units: "metric",
        language: "en",
        embeddedMode: true
    };
    const routingSdk = new GeoSphereRoutingSDK(config);
    await routingSdk.initialize();
    // 2. Coordinate & Waypoint Validation
    console.log("  [2/25] Testing Coordinate & Waypoint Validation...");
    validateCoordinate([-122.4194, 37.7749], "SF Origin");
    try {
        validateCoordinate([200, 37.7749], "Invalid Lng");
        throw new Error("Validation failed to reject longitude out of bounds");
    }
    catch (e) {
        if (!e.message.includes("INVALID_COORDINATE"))
            throw e;
    }
    const wp = normalizeWaypoint([-122.4194, 37.7749], "Start Location");
    if (wp.name !== "Start Location" || wp.coordinate[0] !== -122.4194) {
        throw new Error("normalizeWaypoint failed to construct valid waypoint");
    }
    // 3. Provider Abstraction & Capability Discovery
    console.log("  [3/25] Testing Provider Abstraction & Capability Discovery...");
    const provider = new GeoSphereMockRoutingProvider();
    const info = routingSdk.getProviderInfo();
    if (!info.name)
        throw new Error("getProviderInfo failed");
    const caps = routingSdk.getCapabilities();
    if (!caps.includes("ROUTE_CALCULATION") || !caps.includes("WAYPOINTS") || !caps.includes("DRIVING")) {
        throw new Error("Capability query failed for supported routing capabilities");
    }
    if (caps.includes("TRAFFIC") || caps.includes("ISOCHRONES")) {
        throw new Error("CAPABILITY VIOLATION: Capability returned unimplemented TRAFFIC/ISOCHRONES!");
    }
    // 4. Basic Route Calculation & Response Normalization
    console.log("  [4/25] Testing Basic Route Calculation & Response Normalization...");
    const req = {
        origin: [-122.4194, 37.7749], // SF
        destination: [-122.2712, 37.8044], // Oakland
        options: { profile: "driving" }
    };
    const response = await routingSdk.calculateRoute(req);
    if (!response.primaryRoute || !response.primaryRoute.summary) {
        throw new Error("calculateRoute failed to return normalized response");
    }
    const summary = response.primaryRoute.summary;
    if (summary.totalDistanceMeters <= 0 || summary.totalDurationSeconds <= 0) {
        throw new Error("Route summary distance or duration is invalid");
    }
    // 5. Waypoints Route Calculation
    console.log("  [5/25] Testing Intermediate Waypoints Route Calculation...");
    const waypointsReq = {
        origin: [-122.4194, 37.7749],
        destination: [-121.8863, 37.3382], // San Jose
        waypoints: [[-122.0322, 37.3230]], // Cupertino
        options: { profile: "driving" }
    };
    const wpResponse = await routingSdk.calculateRoute(waypointsReq);
    if (wpResponse.primaryRoute.summary.legCount !== 2) {
        throw new Error(`Intermediate waypoints failed: expected 2 legs, got ${wpResponse.primaryRoute.summary.legCount}`);
    }
    // 6. Routing Profiles (driving, walking, cycling, truck, motorcycle)
    console.log("  [6/25] Testing Routing Profiles (Driving vs Walking vs Cycling)...");
    const driveResp = await routingSdk.calculateRoute({ origin: [-122.4194, 37.7749], destination: [-122.4000, 37.7800], options: { profile: "driving" } });
    const walkResp = await routingSdk.calculateRoute({ origin: [-122.4194, 37.7749], destination: [-122.4000, 37.7800], options: { profile: "walking" } });
    if (walkResp.primaryRoute.summary.totalDurationSeconds <= driveResp.primaryRoute.summary.totalDurationSeconds) {
        throw new Error("Walking profile duration should be longer than driving profile");
    }
    // 7. Route Alternatives Evaluation
    console.log("  [7/25] Testing Route Alternatives Evaluation...");
    const altResp = await routingSdk.calculateRoute({
        origin: [-122.4194, 37.7749],
        destination: [-122.2712, 37.8044],
        options: { alternatives: true }
    });
    if (!altResp.alternativeRoutes || altResp.alternativeRoutes.length === 0) {
        throw new Error("calculateRoute failed to return alternative routes when requested");
    }
    // 8. Route Selection Lifecycle
    console.log("  [8/25] Testing Route Selection Lifecycle...");
    routingSdk.selectRoute(altResp.alternativeRoutes[0]);
    if (routingSdk.getSelectedRoute()?.id !== altResp.alternativeRoutes[0].id) {
        throw new Error("selectRoute failed to store active route choice");
    }
    // 9. Event Lifecycle (routing.requestStarted, routing.requestCompleted, routing.routeSelected)
    console.log("  [9/25] Testing Routing Event Lifecycle...");
    const events = [];
    routingSdk.subscribe((evt) => {
        events.push(evt.type);
    });
    await routingSdk.calculateRoute(req);
    if (!events.includes("routing.requestStarted") || !events.includes("routing.requestCompleted")) {
        throw new Error("Routing SDK failed to emit requestStarted/requestCompleted events");
    }
    // 10. Routing Error Handling
    console.log(" [10/25] Testing Routing Error Handling...");
    try {
        await routingSdk.calculateRoute({ origin: [999, 999], destination: [0, 0] });
        throw new Error("Failed to throw error on invalid coordinates");
    }
    catch (e) {
        if (!e.message.includes("INVALID_COORDINATE"))
            throw e;
    }
    // 11. Location SDK Integration (Routing from Current Position)
    console.log(" [11/25] Testing Location SDK Integration (Routing from Current Position)...");
    const currentPosResp = await routingSdk.calculateRouteFromCurrentLocation([-122.2712, 37.8044]);
    if (!currentPosResp.primaryRoute) {
        throw new Error("calculateRouteFromCurrentLocation failed to calculate route");
    }
    // 12. GIS LineString Geometry Reuse Verification
    console.log(" [12/25] Verifying GIS LineString Geometry Reuse...");
    const routeGeom = response.primaryRoute.geometry;
    if (routeGeom.type !== "LineString" || !Array.isArray(routeGeom.coordinates)) {
        throw new Error("Route geometry is not a valid GeoJSON LineString");
    }
    // 13. Event Struct Security Audit (No Tokens / No Secrets)
    console.log(" [13/25] Verifying Routing Event Struct Security (No Secrets or Tokens)...");
    const eventStr = JSON.stringify(response);
    if (eventStr.includes("token") || eventStr.includes("apiKey") || eventStr.includes("secret")) {
        throw new Error("SECURITY VIOLATION: Routing response struct exposes security tokens!");
    }
    // 14. Privacy Boundary Audit (Zero Automatic Location Upload)
    console.log(" [14/25] Verifying Privacy Boundary (No Automatic Tracking Upload)...");
    const sdkStr = JSON.stringify(routingSdk);
    if (sdkStr.includes("/api/tracking") || sdkStr.includes("telemetry")) {
        throw new Error("PRIVACY VIOLATION: Routing SDK contains automatic tracking upload logic!");
    }
    // 15. Theme System Integration
    console.log(" [15/25] Testing Routing Theme System Integration...");
    const routingTheme = resolveThemePrecedence({
        tenantConfig: { preset: "glass" }
    });
    if (!routingTheme.colors.primary) {
        throw new Error("Theme precedence resolution failed for Routing SDK");
    }
    // 16. Localization Configuration
    console.log(" [16/25] Testing Routing Localization Configuration...");
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
        throw new Error("Routing localization config validation failed");
    }
    // 17. RBAC Permission Integration
    console.log(" [17/25] Testing Routing RBAC Permission Checks...");
    const userPerms = ["routing.read", "routing.calculate"];
    const calcUIState = evaluatePermissionState(userPerms, "routing.calculate", "hide");
    if (calcUIState.status !== "granted") {
        throw new Error("RBAC evaluation failed for granted routing.calculate permission");
    }
    const configUIState = evaluatePermissionState(userPerms, "routing.configure", "disable");
    if (configUIState.status !== "denied" || configUIState.mode !== "disable") {
        throw new Error("RBAC evaluation failed for denied routing.configure permission");
    }
    // 18. Reusable UI Components Metadata
    console.log(" [18/25] Testing Reusable Routing Component Definitions Metadata...");
    const summaryComp = ROUTING_UI_COMPONENTS.ROUTE_SUMMARY;
    const profileComp = ROUTING_UI_COMPONENTS.ROUTE_PROFILE_SELECTOR;
    if (summaryComp.id !== "routing.summary-card" || summaryComp.supportedPlatforms.length !== 3) {
        throw new Error("ROUTE_SUMMARY component metadata check failed");
    }
    if (!profileComp.requiredPermissions.includes("routing.read")) {
        throw new Error("ROUTE_PROFILE_SELECTOR required permissions check failed");
    }
    // 19. Ready-Made Routing Screens Metadata
    console.log(" [19/25] Testing Ready-Made Routing Screen Definitions Metadata...");
    const plannerScreen = ROUTING_READY_MADE_SCREENS.ROUTE_PLANNER_SCREEN;
    const altsScreen = ROUTING_READY_MADE_SCREENS.ROUTE_ALTERNATIVES_SCREEN;
    if (plannerScreen.mode !== "full-screen" || !plannerScreen.requiredPermissions.includes("routing.calculate")) {
        throw new Error("ROUTE_PLANNER_SCREEN metadata check failed");
    }
    if (!altsScreen.requiredPermissions.includes("routing.select")) {
        throw new Error("ROUTE_ALTERNATIVES_SCREEN metadata check failed");
    }
    // 20. Framework Neutrality Audit
    console.log(" [20/25] Verifying Framework Neutrality (No React/DOM Leakage)...");
    if (typeof routingSdk.render === "function" || typeof routingSdk.componentDidMount === "function") {
        throw new Error("DEPENDENCY VIOLATION: Routing Core leaks UI framework methods!");
    }
    // 21. Resource Cleanup
    console.log(" [21/25] Testing Routing SDK Resource Cleanup (destroy)...");
    routingSdk.destroy();
    if (routingSdk.getSelectedRoute() !== null) {
        throw new Error("destroy() failed to clear Routing SDK selected route");
    }
    // 22. Backward Compatibility with GeoSphereClient.routing
    console.log(" [22/25] Verifying Backward Compatibility with GeoSphereClient.routing...");
    const client = new GeoSphereClient({
        baseUrl: "https://api.geosphere.local",
        tenantId: "tenant_route_test_001",
        applicationId: "app_route_test_001"
    });
    if (!client.routing || typeof client.routing.createRoutingSDK !== "function") {
        throw new Error("Backward compatibility broken: existing client.routing facade is invalid");
    }
    // 23. Turn-by-Turn Navigation Engine Non-Leakage Guard
    console.log(" [23/25] Verifying Zero Turn-by-Turn Navigation Engine in Routing Core...");
    const hasNavSession = typeof GeoSphereRoutingSDK.prototype.startNavigation === "function";
    if (hasNavSession) {
        throw new Error("SCOPE VIOLATION: Routing SDK re-implemented Turn-by-Turn Navigation Session!");
    }
    // 24. Zero Duplicate GIS Geometry Engine Audit
    console.log(" [24/25] Verifying Zero Duplicate GIS Geometry Engine in Routing Core...");
    const hasOwnPoly = typeof GeoSphereRoutingSDK.prototype.computeIntersection === "function";
    if (hasOwnPoly) {
        throw new Error("DUPLICATION VIOLATION: Routing SDK re-implemented GIS geometry engine!");
    }
    // 25. Zero Duplicate Location Acquisition Audit
    console.log(" [25/25] Verifying Zero Duplicate Location Acquisition Engine in Routing Core...");
    const hasOwnGPS = typeof GeoSphereRoutingSDK.prototype.getCurrentPosition === "function";
    if (hasOwnGPS) {
        throw new Error("DUPLICATION VIOLATION: Routing SDK re-implemented location acquisition engine!");
    }
    console.log("✅ All GeoSphere Routing SDK & Native UI Foundation Unit Tests Passed Successfully!");
}
runRoutingSdkTests().catch((err) => {
    console.error("❌ GeoSphere Routing SDK Unit Tests Failed:", err);
    process.exit(1);
});
//# sourceMappingURL=routing-sdk.test.js.map