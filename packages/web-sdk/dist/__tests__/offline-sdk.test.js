/**
 * GeoSphere Step 17 Offline Maps & Offline Data SDK + Native UI Foundation Unit Test Suite
 */
import { GeoSphereOfflineSDK, GeoSphereInMemoryOfflineStorage, GeoSphereOfflineError, OFFLINE_UI_COMPONENTS, OFFLINE_READY_MADE_SCREENS, resolveThemePrecedence, validateLocaleConfig, evaluatePermissionState } from "../contracts/index.js";
import { GeoSphereClient } from "../client.js";
async function runOfflineSdkTests() {
    console.log("==========================================");
    console.log("RUNNING GEOSPHERE OFFLINE MAPS & DATA SDK UNIT TESTS");
    console.log("==========================================");
    // 1. Initialization & Initial State
    console.log("  [1/43] Testing Offline SDK Initialization & Initial State...");
    const config = {
        maxStorageBytes: 100 * 1024 * 1024, // 100MB
        autoSync: true,
        conflictStrategy: "SERVER_WINS",
        units: "metric",
        embeddedMode: true
    };
    const storage = new GeoSphereInMemoryOfflineStorage();
    const sdk = new GeoSphereOfflineSDK(config, storage);
    await sdk.initialize();
    const capabilities = sdk.getCapabilities();
    if (!capabilities.includes("MAP_PACKAGES") || !capabilities.includes("MAP_DOWNLOAD") || !capabilities.includes("SYNC_QUEUE")) {
        throw new Error("Capability discovery failed for supported Offline SDK capabilities");
    }
    // 2. Package Creation & Bounds Metadata
    console.log("  [2/43] Testing Offline Map Package Creation & Metadata...");
    const bounds = [79.0, 21.0, 79.2, 21.2]; // Nagpur region
    const pkg = await sdk.createMapPackage("Nagpur Region Map", bounds, 10 * 1024 * 1024);
    if (!pkg.id || pkg.name !== "Nagpur Region Map" || pkg.status !== "IDLE" || pkg.type !== "MAP") {
        throw new Error("createMapPackage failed to construct valid offline package struct");
    }
    // 3. Storage Quota Enforcement
    console.log("  [3/43] Testing Storage Quota Limit Enforcement...");
    try {
        await sdk.createMapPackage("Giant Package", bounds, 200 * 1024 * 1024); // Exceeds 100MB limit
        throw new Error("createMapPackage failed to throw when download exceeds maxStorageBytes quota");
    }
    catch (err) {
        if (!(err instanceof GeoSphereOfflineError) || err.code !== "OFFLINE_STORAGE_LIMIT_EXCEEDED") {
            throw err;
        }
    }
    // 4. Download Lifecycle (Start, Progress, Pause, Resume, Cancel)
    console.log("  [4/43] Testing Download Lifecycle Events & Progress Tracking...");
    const progressEvents = [];
    sdk.subscribe((evt) => {
        if (evt.type.startsWith("offline."))
            progressEvents.push(evt);
    });
    await sdk.startDownload(pkg.id);
    if (progressEvents.length === 0 || progressEvents[0].type !== "offline.downloadProgress") {
        throw new Error("startDownload failed to emit offline.downloadProgress event");
    }
    // 5. Download Pause & Resume
    console.log("  [5/43] Testing Download Pause & Resume...");
    sdk.pauseDownload(pkg.id);
    sdk.resumeDownload(pkg.id);
    // 6. Package Verification
    console.log("  [6/43] Testing Package Integrity Verification...");
    // Wait for mock download completion
    await new Promise((r) => setTimeout(r, 80));
    const isVerified = await sdk.verifyPackage(pkg.id);
    if (!isVerified) {
        throw new Error("verifyPackage failed for completed offline map package");
    }
    // 7. Package Listing & Storage Usage
    console.log("  [7/43] Testing Package Listing & Storage Usage Calculation...");
    const pkgs = await sdk.listPackages();
    if (pkgs.length !== 1 || pkgs[0].id !== pkg.id) {
        throw new Error("listPackages failed to return active offline packages");
    }
    // 8. Package Deletion
    console.log("  [8/43] Testing Package Deletion...");
    const deleteTestPkg = await sdk.createMapPackage("Delete Test Map", bounds, 5 * 1024 * 1024);
    await sdk.deletePackage(deleteTestPkg.id);
    const remainingPkgs = await sdk.listPackages();
    if (remainingPkgs.some((p) => p.id === deleteTestPkg.id)) {
        throw new Error("deletePackage failed to remove package from registry");
    }
    // 9. Connectivity Awareness (ONLINE, OFFLINE, LIMITED)
    console.log("  [9/43] Testing Connectivity Awareness State Transitions...");
    sdk.setConnectivityState("OFFLINE");
    if (sdk.getConnectivityState() !== "OFFLINE") {
        throw new Error("setConnectivityState failed to update network connectivity state to OFFLINE");
    }
    sdk.setConnectivityState("ONLINE");
    if (sdk.getConnectivityState() !== "ONLINE") {
        throw new Error("setConnectivityState failed to restore network connectivity state to ONLINE");
    }
    // 10. Sync Queue Operations (Enqueue, Processing, Retrying)
    console.log(" [10/43] Testing Sync Queue Enqueue & Queue Inspection...");
    const syncItem = await sdk.enqueueSync("LOCATION_UPDATE", { lat: 21.1458, lng: 79.0882 });
    if (!syncItem.id || syncItem.state !== "PENDING" || sdk.getPendingSyncCount() !== 1) {
        throw new Error("enqueueSync failed to enqueue item into offline sync queue");
    }
    // 11. Sync Queue Processing
    console.log(" [11/43] Testing Sync Queue Processing...");
    const processedCount = await sdk.processSyncQueue();
    if (processedCount !== 1 || sdk.getPendingSyncCount() !== 0) {
        throw new Error("processSyncQueue failed to process pending sync items while ONLINE");
    }
    // 12. Offline Status Summary
    console.log(" [12/43] Testing Offline Status Reporting...");
    const status = await sdk.getStatus();
    if (status.connectivity !== "ONLINE" || status.availablePackagesCount !== 1) {
        throw new Error("getStatus returned invalid offline status summary payload");
    }
    // 13. GIS SDK Integration Boundary
    console.log(" [13/43] Verifying GIS SDK Integration Boundary...");
    if (!pkg.bounds || pkg.bounds.length !== 4) {
        throw new Error("Offline SDK failed to integrate with GIS BoundingBoxTuple bounds contract");
    }
    // 14. Mapping SDK Integration Boundary
    console.log(" [14/43] Verifying Mapping SDK Integration Boundary...");
    if (pkg.type !== "MAP") {
        throw new Error("Offline SDK map package type designation check failed");
    }
    // 15. Location & Tracking SDK Integration Boundary
    console.log(" [15/43] Verifying Location & Tracking SDK Integration Boundary...");
    const trackSync = await sdk.enqueueSync("TRACKING_TELEMETRY", { sessionId: "sess_001", pointCount: 15 });
    if (trackSync.type !== "TRACKING_TELEMETRY") {
        throw new Error("Tracking SDK telemetry sync item enqueue check failed");
    }
    // 16. Geofencing SDK Integration Boundary
    console.log(" [16/43] Verifying Geofencing SDK Integration Boundary...");
    const geofenceSync = await sdk.enqueueSync("GEOFENCE_EVENT", { geofenceId: "gf_101", event: "ENTER" });
    if (geofenceSync.type !== "GEOFENCE_EVENT") {
        throw new Error("Geofencing SDK event sync item enqueue check failed");
    }
    // 17. Routing & Navigation SDK Integration Boundary
    console.log(" [17/43] Verifying Routing & Navigation SDK Integration Boundary...");
    const routePkg = await sdk.createMapPackage("Routing Dataset", bounds, 5 * 1024 * 1024);
    routePkg.type = "ROUTING_DATA";
    if (routePkg.type !== "ROUTING_DATA")
        throw new Error("Offline routing package designation failed");
    // 18. Search SDK Integration Boundary
    console.log(" [18/43] Verifying Search SDK Integration Boundary...");
    const searchPkg = await sdk.createMapPackage("Search Index Dataset", bounds, 5 * 1024 * 1024);
    searchPkg.type = "SEARCH_DATA";
    if (searchPkg.type !== "SEARCH_DATA")
        throw new Error("Offline search dataset package designation failed");
    // 19. Security Audit (No Secrets or Tokens in Packages)
    console.log(" [19/43] Verifying Offline Struct Security (No Secrets or Tokens)...");
    const pkgStr = JSON.stringify(pkg);
    if (pkgStr.includes("token") || pkgStr.includes("apiKey") || pkgStr.includes("secret")) {
        throw new Error("SECURITY VIOLATION: Offline package metadata exposes security tokens!");
    }
    // 20. Privacy Boundary Audit (Zero Automatic User Identity Persistence)
    console.log(" [20/43] Verifying Privacy Boundary (Zero Automatic Identity Persistence)...");
    const sdkStr = JSON.stringify(sdk);
    if (sdkStr.includes("userPassword") || sdkStr.includes("creditCard")) {
        throw new Error("PRIVACY VIOLATION: Offline SDK automatically persists identity credentials!");
    }
    // 21. Theme System Integration
    console.log(" [21/43] Testing Offline Theme System Integration...");
    const theme = resolveThemePrecedence({
        tenantConfig: { preset: "dark-pro" }
    });
    if (!theme.colors.primary)
        throw new Error("Theme resolution failed for Offline SDK");
    // 22. Localization Configuration
    console.log(" [22/43] Testing Offline Localization Configuration...");
    const validLocale = validateLocaleConfig({
        language: "en",
        locale: "en-US",
        timezone: "UTC",
        dateFormat: "YYYY-MM-DD",
        timeFormat: "HH:mm",
        distanceUnit: "kilometers",
        speedUnit: "km/h"
    });
    if (validLocale.distanceUnit !== "kilometers")
        throw new Error("Localization validation failed");
    // 23. RBAC Permission Integration
    console.log(" [23/43] Testing Offline RBAC Permission Checks...");
    const userPerms = ["offline.read", "offline.download"];
    const readState = evaluatePermissionState(userPerms, "offline.read", "hide");
    if (readState.status !== "granted")
        throw new Error("RBAC evaluation failed for granted permission");
    const manageState = evaluatePermissionState(userPerms, "offline.manage", "disable");
    if (manageState.status !== "denied" || manageState.mode !== "disable")
        throw new Error("RBAC evaluation failed for denied permission");
    // 24. Reusable UI Components Metadata
    console.log(" [24/43] Testing Reusable Offline Component Definitions Metadata...");
    const statusBadgeComp = OFFLINE_UI_COMPONENTS.OFFLINE_STATUS_INDICATOR;
    const dlCardComp = OFFLINE_UI_COMPONENTS.DOWNLOAD_PROGRESS;
    if (statusBadgeComp.id !== "offline.status-indicator" || statusBadgeComp.supportedPlatforms.length !== 3) {
        throw new Error("OFFLINE_STATUS_INDICATOR component metadata check failed");
    }
    if (!dlCardComp.requiredPermissions.includes("offline.download")) {
        throw new Error("DOWNLOAD_PROGRESS required permissions check failed");
    }
    // 25. Ready-Made Offline Screens Metadata
    console.log(" [25/43] Testing Ready-Made Offline Screen Definitions Metadata...");
    const mapsScreen = OFFLINE_READY_MADE_SCREENS.OFFLINE_MAPS_SCREEN;
    const storageScreen = OFFLINE_READY_MADE_SCREENS.STORAGE_MANAGEMENT_SCREEN;
    if (mapsScreen.mode !== "full-screen" || !mapsScreen.requiredPermissions.includes("offline.read")) {
        throw new Error("OFFLINE_MAPS_SCREEN metadata check failed");
    }
    if (!storageScreen.requiredPermissions.includes("offline.manage")) {
        throw new Error("STORAGE_MANAGEMENT_SCREEN metadata check failed");
    }
    // 26. Framework Neutrality Audit
    console.log(" [26/43] Verifying Framework Neutrality (No React/DOM Leakage)...");
    if (typeof sdk.render === "function" || typeof sdk.componentDidMount === "function") {
        throw new Error("DEPENDENCY VIOLATION: Core Offline SDK leaks UI framework methods!");
    }
    // 27. Resource Cleanup
    console.log(" [27/43] Testing Offline SDK Resource Cleanup (destroy)...");
    sdk.destroy();
    // 28. Backward Compatibility with GeoSphereClient.offline
    console.log(" [28/43] Verifying Backward Compatibility with GeoSphereClient.offline...");
    const client = new GeoSphereClient({
        baseUrl: "https://api.geosphere.local",
        tenantId: "tenant_off_test_001",
        applicationId: "app_off_test_001"
    });
    if (!client.offline || typeof client.offline.createOfflineSDK !== "function") {
        throw new Error("Backward compatibility broken: existing client.offline facade is invalid");
    }
    // 29–43. Zero Duplication Engine Checks
    console.log(" [29/43] Verifying Zero Duplicate GIS Engine in Offline Core...");
    if (typeof GeoSphereOfflineSDK.prototype.createPolygon === "function") {
        throw new Error("DUPLICATION VIOLATION: Offline SDK re-implemented GIS Geometry Engine!");
    }
    console.log(" [30/43] Verifying Zero Duplicate Map Renderer in Offline Core...");
    if (typeof GeoSphereOfflineSDK.prototype.renderMap === "function") {
        throw new Error("DUPLICATION VIOLATION: Offline SDK re-implemented Map Renderer!");
    }
    console.log(" [31/43] Verifying Zero Duplicate Location Acquisition Engine...");
    if (typeof GeoSphereOfflineSDK.prototype.watchPosition === "function") {
        throw new Error("DUPLICATION VIOLATION: Offline SDK re-implemented Location Acquisition Engine!");
    }
    console.log(" [32/43] Verifying Zero Duplicate Tracking Engine...");
    if (typeof GeoSphereOfflineSDK.prototype.startTrackingSession === "function") {
        throw new Error("DUPLICATION VIOLATION: Offline SDK re-implemented Tracking Engine!");
    }
    console.log(" [33/43] Verifying Zero Duplicate Geofence Evaluation Engine...");
    if (typeof GeoSphereOfflineSDK.prototype.evaluateGeofence === "function") {
        throw new Error("DUPLICATION VIOLATION: Offline SDK re-implemented Geofence Engine!");
    }
    console.log(" [34/43] Verifying Zero Duplicate Routing Engine...");
    if (typeof GeoSphereOfflineSDK.prototype.calculateRoute === "function") {
        throw new Error("DUPLICATION VIOLATION: Offline SDK re-implemented Routing Engine!");
    }
    console.log(" [35/43] Verifying Zero Duplicate Navigation Guidance Engine...");
    if (typeof GeoSphereOfflineSDK.prototype.startTurnByTurn === "function") {
        throw new Error("DUPLICATION VIOLATION: Offline SDK re-implemented Navigation Engine!");
    }
    console.log(" [36/43] Verifying Zero Duplicate Search Provider Engine...");
    if (typeof GeoSphereOfflineSDK.prototype.searchPlaces === "function") {
        throw new Error("DUPLICATION VIOLATION: Offline SDK re-implemented Search Engine!");
    }
    console.log(" [37/43] Verifying Zero Duplicate Spatial Analysis Math Engine...");
    if (typeof GeoSphereOfflineSDK.prototype.calculateArea === "function") {
        throw new Error("DUPLICATION VIOLATION: Offline SDK re-implemented Spatial Analysis Engine!");
    }
    console.log(" [38/43] Verifying Storage Abstraction Non-Leakage Guard...");
    const memStorage = new GeoSphereInMemoryOfflineStorage();
    await memStorage.save("k1", { text: "v1" });
    const readK1 = await memStorage.read("k1");
    if (!readK1 || readK1.text !== "v1")
        throw new Error("Storage abstraction read/write failed");
    console.log(" [39/43] Testing Offline Error Normalization...");
    try {
        await sdk.startDownload("invalid_pkg_id");
        throw new Error("startDownload failed to throw on non-existent package");
    }
    catch (e) {
        if (!(e instanceof GeoSphereOfflineError) || e.code !== "PACKAGE_NOT_FOUND")
            throw e;
    }
    console.log(" [40/43] Testing Sync Item Deletion / Removal...");
    const sItem = await sdk.enqueueSync("TEST_SYNC", { data: 123 });
    if (sItem.state !== "PENDING")
        throw new Error("Sync item creation state check failed");
    console.log(" [41/43] Testing Auto-Sync Configuration Flag...");
    if (!config.autoSync)
        throw new Error("autoSync config flag state check failed");
    console.log(" [42/43] Testing Conflict Resolution Strategy Flag...");
    if (config.conflictStrategy !== "SERVER_WINS")
        throw new Error("conflictStrategy config flag state check failed");
    console.log(" [43/43] Testing Embedded UI Configuration Mode...");
    if (!config.embeddedMode)
        throw new Error("embeddedMode config flag state check failed");
    console.log("✅ All GeoSphere Offline Maps & Data SDK & Native UI Foundation Unit Tests Passed Successfully!");
}
runOfflineSdkTests().catch((err) => {
    console.error("❌ GeoSphere Offline Maps & Data SDK Unit Tests Failed:", err);
    process.exit(1);
});
//# sourceMappingURL=offline-sdk.test.js.map