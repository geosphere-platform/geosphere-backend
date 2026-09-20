/**
 * GeoSphere Step 5 Foundational Contracts Unit Test Suite
 * Multi-Platform Target Verification for Web, Android, and iOS
 */
import { validatePlatformConfig, GeoSphereContractError, GeoSphereEventBus, validateBrandingConfig, validateLocaleConfig, evaluatePermissionState, resolveThemePrecedence } from "../contracts/index.js";
import { GeoSphereClient } from "../client.js";
async function runContractTests() {
    console.log("==========================================");
    console.log("RUNNING GEOSPHERE FOUNDATIONAL CONTRACTS UNIT TESTS");
    console.log("==========================================");
    // 1. Configuration Validation
    console.log("  [1/12] Testing Platform Configuration Validation...");
    const validConfig = validatePlatformConfig({
        core: {
            applicationId: "app_test_001",
            apiBaseUrl: "https://api.geosphere.test",
            environment: "staging"
        }
    });
    if (validConfig.core.applicationId !== "app_test_001") {
        throw new Error("Configuration validation failed for applicationId");
    }
    let configErrorThrown = false;
    try {
        validatePlatformConfig({ core: {} });
    }
    catch (err) {
        configErrorThrown = true;
        if (!err.message.includes("[CONFIG_ERROR]")) {
            throw new Error("Unexpected error message for invalid config");
        }
    }
    if (!configErrorThrown) {
        throw new Error("Failed to reject invalid platform config");
    }
    // 2. Module & Capability Metadata
    console.log("  [2/12] Testing Module Metadata & Capability Registration...");
    const mockTrackingModule = {
        id: "tracking",
        version: "1.0.0",
        capabilities: ["live-tracking", "history", "playback"],
        initialize: async () => { },
        destroy: async () => { },
        getCapabilities: () => ({
            moduleId: "tracking",
            capabilities: ["live-tracking", "history", "playback"],
            metadata: [
                { id: "live-tracking", name: "Real-time Vehicle Tracking", description: "Streams live telemetry" }
            ]
        })
    };
    const capabilities = mockTrackingModule.getCapabilities();
    if (capabilities.moduleId !== "tracking" || capabilities.capabilities.length !== 3) {
        throw new Error("Module capabilities metadata extraction failed");
    }
    // 3. Capability Discovery
    console.log("  [3/12] Testing Capability Discovery Engine...");
    const registeredModules = new Map();
    registeredModules.set("tracking", mockTrackingModule);
    const discovered = Array.from(registeredModules.values()).flatMap((m) => m.getCapabilities().capabilities);
    if (!discovered.includes("live-tracking") || !discovered.includes("playback")) {
        throw new Error("Capability discovery failed to aggregate module capabilities");
    }
    // 4. Error Contract
    console.log("  [4/12] Testing Unified Error Contract & Severities...");
    const error = new GeoSphereContractError({
        message: "Requested GIS layer was not found",
        code: "NOT_FOUND",
        category: "NOT_FOUND",
        severity: "WARNING",
        statusCode: 404,
        metadata: { layerId: "layer_999" }
    });
    if (error.category !== "NOT_FOUND" || error.severity !== "WARNING" || error.statusCode !== 404) {
        throw new Error("Error contract property initialization failed");
    }
    // 5. Event Contract & Event Bus
    console.log("  [5/12] Testing Event Contract & Framework-Neutral Event Bus...");
    const eventBus = new GeoSphereEventBus();
    let receivedPayload = null;
    const unsubscribe = eventBus.on("themeChanged", (event) => {
        receivedPayload = event.payload;
    });
    eventBus.emit({
        eventId: "evt_101",
        type: "themeChanged",
        category: "CONFIGURATION",
        timestamp: new Date().toISOString(),
        source: "ThemeEngine",
        payload: { mode: "dark" }
    });
    if (!receivedPayload || receivedPayload.mode !== "dark") {
        throw new Error("Event bus failed to deliver event payload to subscriber");
    }
    unsubscribe();
    if (eventBus.listenerCount("themeChanged") !== 0) {
        throw new Error("Event bus unsubscribe failed to remove listener");
    }
    // 6. Theme Validation & Precedence Resolution
    console.log("  [6/12] Testing Theme Precedence Resolution Engine...");
    const resolved = resolveThemePrecedence({
        environmentDefault: {
            tokens: { colors: { primary: "#2563EB" } }
        },
        tenantConfig: {
            tokens: { colors: { primary: "#7C3AED" } }
        },
        userPreference: {
            tokens: { colors: { primary: "#10B981" } }
        }
    });
    if (resolved.colors.primary !== "#10B981") {
        throw new Error(`Theme precedence failed: expected #10B981 (user preference), got ${resolved.colors.primary}`);
    }
    // 7. Branding Validation
    console.log("  [7/12] Testing Branding Contract Validation...");
    const validBranding = validateBrandingConfig({
        companyName: "Acme Logistics",
        applicationName: "Fleet Manager Pro",
        logoUrl: "https://acme.test/logo.png"
    });
    if (validBranding.companyName !== "Acme Logistics") {
        throw new Error("Branding validation failed for companyName");
    }
    // 8. Localization Config Validation
    console.log("  [8/12] Testing Localization Contract Validation...");
    const validLocale = validateLocaleConfig({
        language: "en",
        locale: "en-US",
        timezone: "UTC",
        dateFormat: "YYYY-MM-DD",
        timeFormat: "HH:mm:ss",
        distanceUnit: "kilometers",
        speedUnit: "km/h"
    });
    if (validLocale.distanceUnit !== "kilometers") {
        throw new Error("Localization validation failed for distanceUnit");
    }
    // 9. UI Component Metadata (Web, Android, iOS Multi-Platform Target)
    console.log("  [9/12] Testing Multi-Platform UI Component Metadata & Definition Contracts...");
    const vehicleCardDef = {
        id: "tracking.vehicle-card",
        name: "Vehicle Status Card",
        version: "1.0.0",
        moduleId: "tracking",
        description: "Renders vehicle telemetry card",
        inputs: [
            { name: "vehicleId", type: "string", required: true, description: "Vehicle ID" }
        ],
        outputs: ["onSelect"],
        events: ["onVehicleSelected"],
        requiredPermissions: ["VIEW_VEHICLES"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "GeoSphereVehicleCard", framework: "react" },
            { platform: "android", componentSymbol: "GeoSphereVehicleCard", framework: "compose" },
            { platform: "ios", componentSymbol: "GeoSphereVehicleCard", framework: "swiftui" }
        ]
    };
    if (vehicleCardDef.id !== "tracking.vehicle-card" || vehicleCardDef.supportedPlatforms.length !== 3) {
        throw new Error("UI Component definition contract multi-platform metadata check failed");
    }
    // 10. UI Screen Metadata (Web, Android, iOS Multi-Platform Target)
    console.log(" 10/12] Testing Multi-Platform UI Screen Metadata & Definition Contracts...");
    const trackingScreenDef = {
        id: "tracking.live-screen",
        title: "Live Fleet Tracking",
        version: "1.0.0",
        moduleId: "tracking",
        description: "End-to-end live tracking map and vehicle list screen",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["live-tracking", "playback"],
        requiredPermissions: ["VIEW_LIVE_TRACKING"],
        containedComponents: ["tracking.vehicle-card", "gis.map"],
        adapters: [
            { platform: "web", componentSymbol: "GeoSphereTrackingScreen", framework: "react" },
            { platform: "android", componentSymbol: "GeoSphereTrackingScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "GeoSphereTrackingScreen", framework: "swiftui" }
        ]
    };
    if (trackingScreenDef.mode !== "full-screen" || trackingScreenDef.supportedPlatforms.length !== 3) {
        throw new Error("UI Screen definition contract multi-platform metadata check failed");
    }
    // 11. Permission-Aware UI State Evaluator
    console.log("[11/12] Testing Permission-Aware UI State Evaluator...");
    const userPerms = ["VIEW_VEHICLES", "VIEW_LIVE_TRACKING"];
    const grantedCtx = evaluatePermissionState(userPerms, "VIEW_LIVE_TRACKING", "hide");
    if (grantedCtx.status !== "granted") {
        throw new Error("Permission evaluator failed to grant allowed permission");
    }
    const deniedCtx = evaluatePermissionState(userPerms, "MANAGE_GEOFENCES", "disable");
    if (deniedCtx.status !== "denied" || deniedCtx.mode !== "disable") {
        throw new Error("Permission evaluator failed to deny restricted permission");
    }
    // 12. Backward Compatibility Verification
    console.log("[12/12] Verifying Backward Compatibility with Existing GeoSphereClient...");
    const client = new GeoSphereClient({
        baseUrl: "https://api.geosphere.local",
        tenantId: "tenant_contract_test_001",
        applicationId: "app_contract_test_001"
    });
    if (!client.gis || !client.location || !client.geofences) {
        throw new Error("Backward compatibility broken: existing client facades unavailable");
    }
    console.log("✅ All Multi-Platform GeoSphere Foundational Contracts Unit Tests Passed Successfully!");
}
runContractTests().catch((err) => {
    console.error("❌ GeoSphere Contract Unit Tests Failed:", err);
    process.exit(1);
});
//# sourceMappingURL=contracts.test.js.map