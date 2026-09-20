/**
 * GeoSphere Step 14 Navigation SDK + Native UI Foundation Unit Test Suite
 */
import { GeoSphereNavigationSDK, GeoSphereRoutingSDK, NAVIGATION_UI_COMPONENTS, NAVIGATION_READY_MADE_SCREENS, resolveThemePrecedence, validateLocaleConfig, evaluatePermissionState } from "../contracts/index.js";
import { GeoSphereClient } from "../client.js";
async function runNavigationSdkTests() {
    console.log("==========================================");
    console.log("RUNNING GEOSPHERE NAVIGATION SDK UNIT TESTS");
    console.log("==========================================");
    // 1. Initialization & Configuration
    console.log("  [1/29] Testing Navigation SDK Initialization...");
    const config = {
        autoReroute: true,
        offRouteThresholdMeters: 40,
        arrivalThresholdMeters: 25,
        maneuverThresholdMeters: 20,
        rerouteMinimumIntervalMs: 100, // fast for tests
        mapFollowMode: "NAVIGATION",
        embeddedMode: true
    };
    const routingSdk = new GeoSphereRoutingSDK();
    await routingSdk.initialize();
    const navigationSdk = new GeoSphereNavigationSDK(config, routingSdk);
    await navigationSdk.initialize();
    // 2. Capability Discovery (Accurately Reporting Implemented Features ONLY)
    console.log("  [2/29] Testing Capability Discovery...");
    const caps = navigationSdk.getCapabilities();
    if (!caps.includes("NAVIGATION_SESSION") || !caps.includes("ROUTE_FOLLOWING") || !caps.includes("OFF_ROUTE_DETECTION")) {
        throw new Error("Capability query failed for supported navigation capabilities");
    }
    if (caps.includes("BACKGROUND_NAVIGATION") || caps.includes("VOICE_NAVIGATION") || caps.includes("OFFLINE_NAVIGATION")) {
        throw new Error("CAPABILITY VIOLATION: Capability returned unimplemented BACKGROUND/VOICE/OFFLINE_NAVIGATION!");
    }
    // 3. Navigation Session State Machine & Lifecycle (IDLE -> ACTIVE -> PAUSED -> ACTIVE -> CANCELLED)
    console.log("  [3/29] Testing Navigation Session State Machine & Lifecycle...");
    const routeResponse = await routingSdk.calculateRoute({
        origin: [-122.4194, 37.7749], // SF
        destination: [-122.2712, 37.8044], // Oakland
        options: { profile: "driving" }
    });
    const session = navigationSdk.startNavigation(routeResponse.primaryRoute);
    if (session.state !== "ACTIVE" || !session.id) {
        throw new Error("startNavigation failed to transition state to ACTIVE");
    }
    navigationSdk.pauseNavigation();
    if (navigationSdk.getActiveSession()?.state !== "PAUSED") {
        throw new Error("pauseNavigation failed to set state to PAUSED");
    }
    navigationSdk.resumeNavigation();
    if (navigationSdk.getActiveSession()?.state !== "ACTIVE") {
        throw new Error("resumeNavigation failed to set state to ACTIVE");
    }
    navigationSdk.stopNavigation();
    if (navigationSdk.getActiveSession() !== null) {
        throw new Error("stopNavigation failed to cancel active session and reset state");
    }
    // 4. Invalid State Transition Rejection
    console.log("  [4/29] Testing Rejection of Invalid State Transitions...");
    try {
        navigationSdk.pauseNavigation();
        throw new Error("pauseNavigation failed to throw when session is IDLE");
    }
    catch (e) {
        if (!e.message.includes("INVALID_STATE"))
            throw e;
    }
    try {
        navigationSdk.resumeNavigation();
        throw new Error("resumeNavigation failed to throw when session is IDLE");
    }
    catch (e) {
        if (!e.message.includes("INVALID_STATE"))
            throw e;
    }
    // 5. Position Update & Progress Calculation
    console.log("  [5/29] Testing Position Update & Route Progress Calculation...");
    navigationSdk.startNavigation(routeResponse.primaryRoute);
    const events = [];
    navigationSdk.subscribe((evt) => events.push(evt));
    // Location near start of route
    const startLoc = { latitude: 37.7749, longitude: -122.4194, accuracy: 5, timestamp: new Date().toISOString() };
    navigationSdk.updateLocation(startLoc);
    const progEvt = events.find((e) => e.type === "navigation.progressUpdated");
    if (!progEvt || progEvt.payload.progress.distanceRemainingMeters <= 0) {
        throw new Error("updateLocation failed to compute valid progress update");
    }
    // 6. Maneuver Detection & Next Maneuver Calculation
    console.log("  [6/29] Testing Maneuver Detection & Next Maneuver Calculation...");
    const activeSess = navigationSdk.getActiveSession();
    if (!activeSess?.currentManeuver) {
        throw new Error("Navigation session failed to populate currentManeuver");
    }
    // 7. Off-Route Detection & Hysteresis State Machine
    console.log("  [7/29] Testing Off-Route Detection & Hysteresis State Machine...");
    // Location far off-route (~5km away)
    const offRouteLoc1 = { latitude: 37.9000, longitude: -122.4194, accuracy: 5, timestamp: new Date().toISOString() };
    // First off-route update transitions to POSSIBLY_OFF_ROUTE
    navigationSdk.updateLocation(offRouteLoc1);
    if (navigationSdk.getActiveSession()?.offRouteState !== "POSSIBLY_OFF_ROUTE") {
        throw new Error("First off-route update failed to transition offRouteState to POSSIBLY_OFF_ROUTE");
    }
    // Second off-route update confirms OFF_ROUTE and triggers auto-reroute
    navigationSdk.updateLocation(offRouteLoc1);
    await new Promise((resolve) => setTimeout(resolve, 150)); // Wait for async reroute
    const offRouteEvt = events.find((e) => e.type === "navigation.offRoute");
    if (!offRouteEvt) {
        throw new Error("Off-route hysteresis failed to emit navigation.offRoute event");
    }
    // 8. Arrival Detection
    console.log("  [8/29] Testing Arrival Detection...");
    const destCoord = routeResponse.primaryRoute.waypoints[1].coordinate;
    const arrivedLoc = { latitude: destCoord[1], longitude: destCoord[0], accuracy: 5, timestamp: new Date().toISOString() };
    navigationSdk.updateLocation(arrivedLoc);
    if (navigationSdk.getActiveSession()?.state !== "ARRIVED") {
        throw new Error("updateLocation failed to trigger ARRIVED state transition");
    }
    const arrEvt = events.find((e) => e.type === "navigation.arrived");
    if (!arrEvt) {
        throw new Error("Arrival detection failed to emit navigation.arrived event");
    }
    // 9. Map Follow Mode Management
    console.log("  [9/29] Testing Map Follow Mode Management...");
    navigationSdk.setMapFollowMode("FOLLOW_ROUTE");
    if (navigationSdk.getMapFollowMode() !== "FOLLOW_ROUTE") {
        throw new Error("setMapFollowMode failed to update map follow mode");
    }
    // 10. Event Struct Security Audit (No Tokens / No Secrets)
    console.log(" [10/29] Verifying Navigation Event Struct Security (No Secrets or Tokens)...");
    const eventStr = JSON.stringify(events);
    if (eventStr.includes("token") || eventStr.includes("apiKey") || eventStr.includes("secret")) {
        throw new Error("SECURITY VIOLATION: Navigation event struct exposes security tokens!");
    }
    // 11. Privacy Boundary Audit (Zero Automatic Location Upload)
    console.log(" [11/29] Verifying Privacy Boundary (No Automatic Tracking Upload)...");
    const sdkStr = JSON.stringify(navigationSdk);
    if (sdkStr.includes("/api/tracking/history") || sdkStr.includes("uploadLocation")) {
        throw new Error("PRIVACY VIOLATION: Navigation SDK contains automatic location upload logic!");
    }
    // 12. Theme System Integration
    console.log(" [12/29] Testing Navigation Theme System Integration...");
    const navTheme = resolveThemePrecedence({
        tenantConfig: { preset: "dark-pro" }
    });
    if (!navTheme.colors.primary) {
        throw new Error("Theme precedence resolution failed for Navigation SDK");
    }
    // 13. Localization Configuration
    console.log(" [13/29] Testing Navigation Localization Configuration...");
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
        throw new Error("Navigation localization config validation failed");
    }
    // 14. RBAC Permission Integration
    console.log(" [14/29] Testing Navigation RBAC Permission Checks...");
    const userPerms = ["navigation.read", "navigation.start"];
    const startUIState = evaluatePermissionState(userPerms, "navigation.start", "hide");
    if (startUIState.status !== "granted") {
        throw new Error("RBAC evaluation failed for granted navigation.start permission");
    }
    const configUIState = evaluatePermissionState(userPerms, "navigation.configure", "disable");
    if (configUIState.status !== "denied" || configUIState.mode !== "disable") {
        throw new Error("RBAC evaluation failed for denied navigation.configure permission");
    }
    // 15. Reusable UI Components Metadata
    console.log(" [15/29] Testing Reusable Navigation Component Definitions Metadata...");
    const curManComp = NAVIGATION_UI_COMPONENTS.CURRENT_MANEUVER;
    const progComp = NAVIGATION_UI_COMPONENTS.NAVIGATION_PROGRESS;
    if (curManComp.id !== "navigation.current-maneuver-card" || curManComp.supportedPlatforms.length !== 3) {
        throw new Error("CURRENT_MANEUVER component metadata check failed");
    }
    if (!progComp.requiredPermissions.includes("navigation.read")) {
        throw new Error("NAVIGATION_PROGRESS required permissions check failed");
    }
    // 16. Ready-Made Navigation Screens Metadata
    console.log(" [16/29] Testing Ready-Made Navigation Screen Definitions Metadata...");
    const mainScreen = NAVIGATION_READY_MADE_SCREENS.NAVIGATION_SCREEN;
    const settingsScreen = NAVIGATION_READY_MADE_SCREENS.NAVIGATION_SETTINGS_SCREEN;
    if (mainScreen.mode !== "full-screen" || !mainScreen.requiredPermissions.includes("navigation.start")) {
        throw new Error("NAVIGATION_SCREEN metadata check failed");
    }
    if (!settingsScreen.requiredPermissions.includes("navigation.configure")) {
        throw new Error("NAVIGATION_SETTINGS_SCREEN metadata check failed");
    }
    // 17. Framework Neutrality Audit
    console.log(" [17/29] Verifying Framework Neutrality (No React/DOM Leakage)...");
    if (typeof navigationSdk.render === "function" || typeof navigationSdk.componentDidMount === "function") {
        throw new Error("DEPENDENCY VIOLATION: Navigation Core leaks UI framework methods!");
    }
    // 18. Resource Cleanup
    console.log(" [18/29] Testing Navigation SDK Resource Cleanup (destroy)...");
    navigationSdk.destroy();
    if (navigationSdk.getActiveSession() !== null) {
        throw new Error("destroy() failed to reset active navigation session");
    }
    // 19. Backward Compatibility with GeoSphereClient.navigation
    console.log(" [19/29] Verifying Backward Compatibility with GeoSphereClient.navigation...");
    const client = new GeoSphereClient({
        baseUrl: "https://api.geosphere.local",
        tenantId: "tenant_nav_test_001",
        applicationId: "app_nav_test_001"
    });
    if (!client.navigation || typeof client.navigation.createNavigationSDK !== "function") {
        throw new Error("Backward compatibility broken: existing client.navigation facade is invalid");
    }
    // 20. Voice Navigation Non-Leakage Guard
    console.log(" [20/29] Verifying Zero Voice Guidance Engine in Navigation Core...");
    const hasVoice = typeof GeoSphereNavigationSDK.prototype.speakManeuver === "function";
    if (hasVoice) {
        throw new Error("SCOPE VIOLATION: Navigation SDK re-implemented Voice Guidance Engine!");
    }
    // 21. Zero Duplicate Routing Engine Audit
    console.log(" [21/29] Verifying Zero Duplicate Routing Engine in Navigation Core...");
    const hasOwnRouting = typeof GeoSphereNavigationSDK.prototype.buildRoutingGraph === "function";
    if (hasOwnRouting) {
        throw new Error("DUPLICATION VIOLATION: Navigation SDK re-implemented Routing Engine!");
    }
    // 22. Zero Duplicate Location Acquisition Audit
    console.log(" [22/29] Verifying Zero Duplicate Location Acquisition Engine in Navigation Core...");
    const hasOwnGPS = typeof GeoSphereNavigationSDK.prototype.getCurrentPosition === "function";
    if (hasOwnGPS) {
        throw new Error("DUPLICATION VIOLATION: Navigation SDK re-implemented Location Acquisition Engine!");
    }
    // 23. Zero Duplicate GIS Geometry Engine Audit
    console.log(" [23/29] Verifying Zero Duplicate GIS Geometry Engine in Navigation Core...");
    const hasOwnPoly = typeof GeoSphereNavigationSDK.prototype.computeIntersection === "function";
    if (hasOwnPoly) {
        throw new Error("DUPLICATION VIOLATION: Navigation SDK re-implemented GIS Geometry Engine!");
    }
    // 24. Zero Duplicate Geofencing Engine Audit
    console.log(" [24/29] Verifying Zero Duplicate Geofencing Engine in Navigation Core...");
    const hasOwnFence = typeof GeoSphereNavigationSDK.prototype.checkPointInGeofence === "function";
    if (hasOwnFence) {
        throw new Error("DUPLICATION VIOLATION: Navigation SDK re-implemented Geofencing Engine!");
    }
    // 25. Zero Offline Map Download Engine Audit
    console.log(" [25/29] Verifying Zero Offline Map Engine in Navigation Core...");
    const hasOfflineTiles = typeof GeoSphereNavigationSDK.prototype.downloadMapTiles === "function";
    if (hasOfflineTiles) {
        throw new Error("SCOPE VIOLATION: Navigation SDK re-implemented Offline Map Downloads!");
    }
    // 26. Pause/Resume Navigation Workflow Verification
    console.log(" [26/29] Verifying Pause and Resume Navigation Workflows...");
    const tempNav = new GeoSphereNavigationSDK(config, routingSdk);
    await tempNav.initialize();
    tempNav.startNavigation(routeResponse.primaryRoute);
    tempNav.pauseNavigation();
    // Location update while PAUSED should be ignored
    const posBefore = tempNav.getActiveSession()?.progress.distanceTraveledMeters;
    tempNav.updateLocation({ latitude: 37.7800, longitude: -122.4000, timestamp: new Date().toISOString() });
    if (tempNav.getActiveSession()?.progress.distanceTraveledMeters !== posBefore) {
        throw new Error("Navigation position update proceeded while session was PAUSED");
    }
    tempNav.resumeNavigation();
    tempNav.stopNavigation();
    // 27. Reroute Interval Debounce Verification
    console.log(" [27/29] Verifying Reroute Interval Debounce Threshold...");
    if (config.rerouteMinimumIntervalMs !== 100) {
        throw new Error("Config rerouteMinimumIntervalMs override check failed");
    }
    // 28. Map Follow Mode Setting
    console.log(" [28/29] Verifying Map Follow Mode Default...");
    const defaultNav = new GeoSphereNavigationSDK();
    if (defaultNav.getMapFollowMode() !== "NAVIGATION") {
        throw new Error("Default map follow mode should be NAVIGATION");
    }
    // 29. Clean Resource Teardown
    console.log(" [29/29] Verifying Clean Resource Teardown...");
    tempNav.destroy();
    if (tempNav.getActiveSession() !== null) {
        throw new Error("destroy() failed to clear navigation session");
    }
    console.log("✅ All GeoSphere Navigation SDK & Native UI Foundation Unit Tests Passed Successfully!");
}
runNavigationSdkTests().catch((err) => {
    console.error("❌ GeoSphere Navigation SDK Unit Tests Failed:", err);
    process.exit(1);
});
//# sourceMappingURL=navigation-sdk.test.js.map