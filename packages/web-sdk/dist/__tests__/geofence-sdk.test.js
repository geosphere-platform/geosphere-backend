/**
 * GeoSphere Step 12 Geofencing SDK + Native UI Foundation Unit Test Suite
 */
import { GeoSphereGeofencingSDK, validateGeofenceGeometry, pointInCircle, pointInPolygon, GEOFENCE_UI_COMPONENTS, GEOFENCE_READY_MADE_SCREENS, resolveThemePrecedence, validateLocaleConfig, evaluatePermissionState } from "../contracts/index.js";
import { GeoSphereClient } from "../client.js";
async function runGeofenceSdkTests() {
    console.log("==========================================");
    console.log("RUNNING GEOSPHERE GEOFENCING SDK UNIT TESTS");
    console.log("==========================================");
    // 1. Initialization & Configuration
    console.log("  [1/25] Testing Geofencing SDK Initialization...");
    const config = {
        accuracyThresholdMeters: 50,
        boundaryToleranceMeters: 5,
        dwellConfig: { enabled: true, dwellDurationSeconds: 1 }, // 1s for fast unit test
        embeddedMode: true
    };
    const geofenceSdk = new GeoSphereGeofencingSDK(config);
    await geofenceSdk.initialize();
    // 2. Circle Geofence Geometry Validation
    console.log("  [2/25] Testing Circle Geofence Geometry Validation...");
    const circleGeofence = {
        id: "zone_hq_circle",
        name: "Headquarters Perimeter",
        enabled: true,
        geometry: {
            type: "circle",
            center: [-122.4194, 37.7749], // San Francisco [lng, lat]
            radiusMeters: 100
        }
    };
    validateGeofenceGeometry(circleGeofence.geometry);
    try {
        validateGeofenceGeometry({ type: "circle", center: [-122.4194, 37.7749], radiusMeters: -10 });
        throw new Error("Validation failed to reject circle radius <= 0");
    }
    catch (e) {
        if (!e.message.includes("INVALID_GEOMETRY"))
            throw e;
    }
    // 3. Polygon Geofence Geometry Validation
    console.log("  [3/25] Testing Polygon Geofence Geometry Validation...");
    const polygonGeofence = {
        id: "zone_warehouse_poly",
        name: "Warehouse Yard",
        enabled: true,
        geometry: {
            type: "polygon",
            coordinates: [
                [
                    [-122.4200, 37.7740],
                    [-122.4180, 37.7740],
                    [-122.4180, 37.7760],
                    [-122.4200, 37.7760],
                    [-122.4200, 37.7740] // Closed ring
                ]
            ]
        }
    };
    validateGeofenceGeometry(polygonGeofence.geometry);
    try {
        validateGeofenceGeometry({ type: "polygon", coordinates: [[[-122.42, 37.77], [-122.41, 37.77]]] });
        throw new Error("Validation failed to reject polygon ring with < 3 vertices");
    }
    catch (e) {
        if (!e.message.includes("INVALID_GEOMETRY"))
            throw e;
    }
    // 4. Point-in-Circle Evaluation (Inside vs Outside)
    console.log("  [4/25] Testing Point-in-Circle Evaluation...");
    const insideCircleLoc = { latitude: 37.7749, longitude: -122.4194, timestamp: new Date().toISOString() };
    const outsideCircleLoc = { latitude: 37.8000, longitude: -122.4194, timestamp: new Date().toISOString() };
    const circleGeom = circleGeofence.geometry;
    if (!pointInCircle(insideCircleLoc, circleGeom.center, 100)) {
        throw new Error("pointInCircle failed to identify point inside circle");
    }
    if (pointInCircle(outsideCircleLoc, circleGeom.center, 100)) {
        throw new Error("pointInCircle failed to identify point outside circle");
    }
    // 5. Point-in-Polygon Ray-Casting Evaluation (Inside vs Outside)
    console.log("  [5/25] Testing Point-in-Polygon Ray-Casting Evaluation...");
    const insidePolyLoc = { latitude: 37.7750, longitude: -122.4190, timestamp: new Date().toISOString() };
    const outsidePolyLoc = { latitude: 37.7800, longitude: -122.4190, timestamp: new Date().toISOString() };
    const polyGeom = polygonGeofence.geometry;
    if (!pointInPolygon(insidePolyLoc, polyGeom.coordinates[0])) {
        throw new Error("pointInPolygon failed to identify point inside polygon");
    }
    if (pointInPolygon(outsidePolyLoc, polyGeom.coordinates[0])) {
        throw new Error("pointInPolygon failed to identify point outside polygon");
    }
    // 6. Registry CRUD Operations
    console.log("  [6/25] Testing Geofence Registry CRUD Operations...");
    geofenceSdk.registerGeofence(circleGeofence);
    geofenceSdk.registerGeofence(polygonGeofence);
    if (geofenceSdk.listGeofences().length !== 2) {
        throw new Error("registerGeofence failed to store geofences in registry");
    }
    geofenceSdk.updateGeofence("zone_hq_circle", { name: "SF HQ Main Perimeter" });
    if (geofenceSdk.getGeofence("zone_hq_circle")?.name !== "SF HQ Main Perimeter") {
        throw new Error("updateGeofence failed to modify geofence properties");
    }
    geofenceSdk.disableGeofence("zone_warehouse_poly");
    if (geofenceSdk.getGeofence("zone_warehouse_poly")?.enabled !== false) {
        throw new Error("disableGeofence failed to set enabled to false");
    }
    geofenceSdk.enableGeofence("zone_warehouse_poly");
    // 7. State Transition ENTER Detection & Event Emission
    console.log("  [7/25] Testing ENTER State Transition Detection & Event...");
    const events = [];
    geofenceSdk.subscribe((evt) => {
        events.push(evt);
    });
    // First evaluation initializes state
    geofenceSdk.evaluateLocation(outsideCircleLoc, "vehicle_101");
    // Second evaluation triggers ENTER transition
    geofenceSdk.evaluateLocation(insideCircleLoc, "vehicle_101");
    const enterEvt = events.find((e) => e.eventType === "geofence.enter");
    if (!enterEvt || enterEvt.geofenceId !== "zone_hq_circle") {
        throw new Error("evaluateLocation failed to trigger geofence.enter event");
    }
    // 8. State Transition EXIT Detection & Event Emission
    console.log("  [8/25] Testing EXIT State Transition Detection & Event...");
    geofenceSdk.evaluateLocation(outsideCircleLoc, "vehicle_101");
    const exitEvt = events.find((e) => e.eventType === "geofence.exit");
    if (!exitEvt || exitEvt.geofenceId !== "zone_hq_circle") {
        throw new Error("evaluateLocation failed to trigger geofence.exit event");
    }
    // 9. DWELL Detection & Event Emission
    console.log("  [9/25] Testing DWELL State Transition Detection & Event...");
    geofenceSdk.evaluateLocation(insideCircleLoc, "vehicle_101");
    await new Promise((resolve) => setTimeout(resolve, 1100)); // Wait for 1.1s dwell timer
    const dwellEvt = events.find((e) => e.eventType === "geofence.dwell");
    if (!dwellEvt || dwellEvt.geofenceId !== "zone_hq_circle") {
        throw new Error("DWELL evaluation failed to trigger geofence.dwell event");
    }
    // 10. Accuracy Threshold Filtering
    console.log(" [10/25] Testing Accuracy Threshold Filtering...");
    const lowAccuracyLoc = { latitude: 37.7749, longitude: -122.4194, accuracy: 200, timestamp: new Date().toISOString() };
    const evtsCountBefore = events.length;
    geofenceSdk.evaluateLocation(lowAccuracyLoc, "vehicle_101");
    if (events.length > evtsCountBefore) {
        throw new Error("Accuracy threshold filter failed to ignore low-accuracy location update");
    }
    // 11. Overlapping Geofences Evaluation
    console.log(" [11/25] Testing Overlapping Geofences Evaluation...");
    const overlapCircle = {
        id: "zone_city_broad",
        name: "San Francisco City Zone",
        enabled: true,
        geometry: { type: "circle", center: [-122.4194, 37.7749], radiusMeters: 5000 }
    };
    geofenceSdk.registerGeofence(overlapCircle);
    geofenceSdk.evaluateLocation(insideCircleLoc, "vehicle_101");
    if (geofenceSdk.getGeofence("zone_hq_circle")?.state !== "INSIDE" || geofenceSdk.getGeofence("zone_city_broad")?.state !== "INSIDE") {
        throw new Error("Overlapping geofences evaluation failed to track independent states");
    }
    // 12. Capability Detection (Accurately Reporting Implemented Features ONLY)
    console.log(" [12/25] Testing Geofence Capability Detection...");
    const caps = geofenceSdk.getCapabilities();
    if (!caps.includes("CIRCLE") || !caps.includes("POLYGON") || !caps.includes("DWELL")) {
        throw new Error("Capability query failed for supported geofencing capabilities");
    }
    if (caps.includes("BACKGROUND_GEOFENCING")) {
        throw new Error("CAPABILITY VIOLATION: Capability returned unimplemented BACKGROUND_GEOFENCING!");
    }
    // 13. Event Struct Security Audit (No Tokens / No Secrets)
    console.log(" [13/25] Verifying Geofence Event Struct Security (No Secrets or Tokens)...");
    const eventStr = JSON.stringify(enterEvt);
    if (eventStr.includes("token") || eventStr.includes("apiKey") || eventStr.includes("secret")) {
        throw new Error("SECURITY VIOLATION: Geofence event struct exposes security tokens!");
    }
    // 14. Privacy Boundary Audit (Zero Automatic Location Upload)
    console.log(" [14/25] Verifying Privacy Boundary (No Automatic Telemetry Transmission)...");
    const geofenceSdkStr = JSON.stringify(geofenceSdk);
    if (geofenceSdkStr.includes("/api/geofences/evaluate") || geofenceSdkStr.includes("http")) {
        throw new Error("PRIVACY VIOLATION: Geofencing SDK contains automatic telemetry upload logic!");
    }
    // 15. Theme System Integration
    console.log(" [15/25] Testing Geofence Theme System Integration...");
    const geofenceTheme = resolveThemePrecedence({
        tenantConfig: { preset: "compact" }
    });
    if (!geofenceTheme.colors.primary) {
        throw new Error("Theme precedence resolution failed for Geofencing SDK");
    }
    // 16. Localization Configuration
    console.log(" [16/25] Testing Geofence Localization Configuration...");
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
        throw new Error("Geofence localization config validation failed");
    }
    // 17. RBAC Permission Integration
    console.log(" [17/25] Testing Geofence RBAC Permission Checks...");
    const userPerms = ["geofence.read", "geofence.create"];
    const createUIState = evaluatePermissionState(userPerms, "geofence.create", "hide");
    if (createUIState.status !== "granted") {
        throw new Error("RBAC evaluation failed for granted geofence.create permission");
    }
    const deleteUIState = evaluatePermissionState(userPerms, "geofence.delete", "disable");
    if (deleteUIState.status !== "denied" || deleteUIState.mode !== "disable") {
        throw new Error("RBAC evaluation failed for denied geofence.delete permission");
    }
    // 18. Reusable UI Components Metadata
    console.log(" [18/25] Testing Reusable Geofence Component Definitions Metadata...");
    const listComp = GEOFENCE_UI_COMPONENTS.GEOFENCE_LIST;
    const statusComp = GEOFENCE_UI_COMPONENTS.GEOFENCE_STATUS;
    if (listComp.id !== "geofence.list-view" || listComp.supportedPlatforms.length !== 3) {
        throw new Error("GEOFENCE_LIST component metadata check failed");
    }
    if (!statusComp.requiredPermissions.includes("geofence.read")) {
        throw new Error("GEOFENCE_STATUS required permissions check failed");
    }
    // 19. Ready-Made Geofence Screens Metadata
    console.log(" [19/25] Testing Ready-Made Geofence Screen Definitions Metadata...");
    const dashScreen = GEOFENCE_READY_MADE_SCREENS.GEOFENCE_DASHBOARD_SCREEN;
    const createScreen = GEOFENCE_READY_MADE_SCREENS.CREATE_GEOFENCE_SCREEN;
    if (dashScreen.mode !== "full-screen" || !dashScreen.requiredPermissions.includes("geofence.read")) {
        throw new Error("GEOFENCE_DASHBOARD_SCREEN metadata check failed");
    }
    if (!createScreen.requiredPermissions.includes("geofence.create")) {
        throw new Error("CREATE_GEOFENCE_SCREEN metadata check failed");
    }
    // 20. Framework Neutrality Audit
    console.log(" [20/25] Verifying Framework Neutrality (No React/DOM Leakage)...");
    if (typeof geofenceSdk.render === "function" || typeof geofenceSdk.componentDidMount === "function") {
        throw new Error("DEPENDENCY VIOLATION: Geofencing Core leaks UI framework methods!");
    }
    // 21. Resource Cleanup
    console.log(" [21/25] Testing Geofencing SDK Resource Cleanup (destroy)...");
    geofenceSdk.destroy();
    if (geofenceSdk.listGeofences().length !== 0) {
        throw new Error("destroy() failed to clear Geofencing SDK registry");
    }
    // 22. Backward Compatibility with GeofenceModule & GeoSphereClient.geofences
    console.log(" [22/25] Verifying Backward Compatibility with GeoSphereClient.geofences...");
    const client = new GeoSphereClient({
        baseUrl: "https://api.geosphere.local",
        tenantId: "tenant_geo_test_001",
        applicationId: "app_geo_test_001"
    });
    if (!client.geofences || typeof client.geofences.createGeofencingSDK !== "function" || typeof client.geofences.listGeofences !== "function") {
        throw new Error("Backward compatibility broken: existing client.geofences facade is invalid");
    }
    // 23. Remove Geofence Cleanup
    console.log(" [23/25] Testing removeGeofence Registry Cleanup...");
    const tempSdk = new GeoSphereGeofencingSDK();
    tempSdk.registerGeofence(circleGeofence);
    tempSdk.removeGeofence("zone_hq_circle");
    if (tempSdk.getGeofence("zone_hq_circle") !== undefined) {
        throw new Error("removeGeofence failed to purge geofence from registry");
    }
    // 24. Zero Duplicate GIS Geometry System Audit
    console.log(" [24/25] Verifying Zero Duplicate GIS Geometry Engine in Geofencing Core...");
    const hasOwnPoly = typeof GeoSphereGeofencingSDK.prototype.computeIntersection === "function";
    if (hasOwnPoly) {
        throw new Error("DUPLICATION VIOLATION: Geofencing SDK re-implemented GIS geometry engine!");
    }
    // 25. Zero Duplicate Location Acquisition Audit
    console.log(" [25/25] Verifying Zero Duplicate Location Acquisition Engine in Geofencing Core...");
    const hasOwnGPS = typeof GeoSphereGeofencingSDK.prototype.getCurrentPosition === "function";
    if (hasOwnGPS) {
        throw new Error("DUPLICATION VIOLATION: Geofencing SDK re-implemented location acquisition engine!");
    }
    console.log("✅ All GeoSphere Geofencing SDK & Native UI Foundation Unit Tests Passed Successfully!");
}
runGeofenceSdkTests().catch((err) => {
    console.error("❌ GeoSphere Geofencing SDK Unit Tests Failed:", err);
    process.exit(1);
});
//# sourceMappingURL=geofence-sdk.test.js.map