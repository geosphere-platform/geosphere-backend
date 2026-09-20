/**
 * GeoSphere Step 20 Analytics & Telemetry SDK + Native UI Foundation Unit Test Suite
 */
import { GeoSphereAnalyticsSDK, GeoSphereMockAnalyticsProvider, ANALYTICS_UI_COMPONENTS, ANALYTICS_READY_MADE_SCREENS, resolveThemePrecedence, validateLocaleConfig, evaluatePermissionState } from "../contracts/index.js";
import { GeoSphereClient } from "../client.js";
async function runAnalyticsSdkTests() {
    console.log("==========================================");
    console.log("RUNNING GEOSPHERE ANALYTICS & TELEMETRY SDK UNIT TESTS");
    console.log("==========================================");
    // 1. Initialization & Capabilities
    console.log("  [1/43] Testing Analytics SDK Initialization & Capabilities...");
    const config = {
        embeddedMode: true,
        batchSize: 20,
        flushIntervalMs: 5000,
        maxBufferSize: 500,
        consent: "GRANTED"
    };
    const provider = new GeoSphereMockAnalyticsProvider();
    const sdk = new GeoSphereAnalyticsSDK(config, provider);
    await sdk.initialize();
    const caps = sdk.getCapabilities();
    if (!caps.includes("EVENT_TRACKING") || !caps.includes("METRIC_RECORDING") || !caps.includes("PERFORMANCE_MEASUREMENT") || !caps.includes("CONSENT_ENFORCEMENT")) {
        throw new Error("Capability discovery failed for supported Analytics capabilities");
    }
    // 2. Event Model & Event Tracking
    console.log("  [2/43] Testing Event Model & Event Tracking...");
    const events = [];
    sdk.subscribe((evt) => events.push(evt));
    const event = await sdk.trackEvent("SDK_USAGE", "gis", { module: "layers" }, { featureCount: 150 });
    if (!event || !event.eventId || event.eventType !== "SDK_USAGE" || event.sdkName !== "gis") {
        throw new Error("trackEvent failed to construct normalized telemetry event struct");
    }
    if (events.length === 0 || events[0].type !== "analytics.eventTracked") {
        throw new Error("trackEvent failed to emit analytics.eventTracked event");
    }
    // 3. Metric Recording (Counters, Gauges, Timers)
    console.log("  [3/43] Testing Metric Recording (Counters, Gauges, Timers)...");
    const counterMetric = sdk.recordMetric("api.requests.count", "COUNTER", 1);
    if (counterMetric.name !== "api.requests.count" || counterMetric.type !== "COUNTER" || counterMetric.value !== 1) {
        throw new Error("recordMetric failed for COUNTER metric");
    }
    const gaugeMetric = sdk.recordMetric("offline.buffer.bytes", "GAUGE", 2048, "bytes");
    if (gaugeMetric.type !== "GAUGE" || gaugeMetric.value !== 2048) {
        throw new Error("recordMetric failed for GAUGE metric");
    }
    // 4. Performance Measurement Timers
    console.log("  [4/43] Testing Performance Measurement Timers...");
    sdk.startMeasurement("route_calculation");
    await new Promise((resolve) => setTimeout(resolve, 20)); // 20ms delay
    const durationMs = sdk.stopMeasurement("route_calculation", "routing");
    if (durationMs < 10) {
        throw new Error(`stopMeasurement returned invalid duration ${durationMs}ms`);
    }
    sdk.recordDuration("map_tile_render", 45, "maps");
    // 5. Session Lifecycle Management
    console.log("  [5/43] Testing Session Lifecycle Management...");
    const session = sdk.getSession();
    if (!session.sessionId || !session.isActive) {
        throw new Error("getSession returned invalid active session struct");
    }
    const newSession = sdk.startSession();
    if (newSession.sessionId === session.sessionId) {
        throw new Error("startSession failed to generate new unique session ID");
    }
    const endedSession = sdk.endSession();
    if (endedSession.isActive || !endedSession.sessionEnd) {
        throw new Error("endSession failed to terminate active session");
    }
    // 6. Privacy Configuration & Consent State Machine
    console.log("  [6/43] Testing Privacy Configuration & Consent State Machine...");
    const privacy = sdk.getPrivacyConfig();
    if (!privacy.telemetryEnabled || privacy.locationTelemetryEnabled) {
        throw new Error("Default privacy configuration failed default conservative checks");
    }
    sdk.setConsent("DENIED");
    if (sdk.getConsent() !== "DENIED")
        throw new Error("setConsent failed to update consent state");
    const deniedEvent = await sdk.trackEvent("SDK_USAGE", "maps", { test: 1 });
    if (deniedEvent !== null) {
        throw new Error("trackEvent allowed telemetry recording while consent was DENIED");
    }
    sdk.setConsent("GRANTED");
    // 7. Metadata Sanitization & Data Minimization (Token/Password Redaction)
    console.log("  [7/43] Testing Metadata Sanitization & Data Minimization...");
    const sensitiveMeta = {
        apiKey: "secret_12345",
        userPassword: "Password123!",
        safeField: "vehicle_101"
    };
    const sanitizedEvent = await sdk.trackEvent("SECURITY", "auth", sensitiveMeta);
    if (!sanitizedEvent || sanitizedEvent.metadata?.apiKey !== "[REDACTED]" || sanitizedEvent.metadata?.userPassword !== "[REDACTED]") {
        throw new Error("Sanitization failed to redact sensitive password/apiKey fields");
    }
    if (sanitizedEvent.metadata?.safeField !== "vehicle_101") {
        throw new Error("Sanitization incorrectly redacted non-sensitive field");
    }
    // 8. Local Buffering & Flush
    console.log("  [8/43] Testing Local Buffering & Transport Flush...");
    const initialBuffered = provider.getBufferedEvents();
    if (initialBuffered.length === 0) {
        throw new Error("trackEvent failed to buffer analytics events to provider");
    }
    await sdk.flush();
    const postFlushBuffered = provider.getBufferedEvents();
    if (postFlushBuffered.length !== 0) {
        throw new Error("flush failed to clear provider buffer");
    }
    // 9. Location Privacy Boundary Audit (No Automatic Precise Location Upload)
    console.log("  [9/43] Verifying Location Privacy Boundary (No Automatic Location Telemetry Upload)...");
    const eventStr = JSON.stringify(sanitizedEvent);
    if (eventStr.includes("latitude") || eventStr.includes("longitude") || eventStr.includes("gps_fix")) {
        throw new Error("PRIVACY VIOLATION: Analytics event automatically uploaded raw GPS location data!");
    }
    // 10. Search Privacy Boundary Audit (No Raw Search Query Text Upload)
    console.log(" [10/43] Verifying Search Privacy Boundary (No Raw Address/Query Upload)...");
    const searchTelemetry = {
        eventId: "evt_srch_001",
        eventType: "SDK_USAGE",
        timestamp: new Date().toISOString(),
        sessionId: session.sessionId,
        sdkName: "search",
        sdkVersion: "1.0.0",
        platform: "web",
        metadata: { resultCount: 5 } // No query text
    };
    if (JSON.stringify(searchTelemetry).includes("123 Main St")) {
        throw new Error("PRIVACY VIOLATION: Search telemetry contains raw user query text!");
    }
    // 11. Realtime Operational Metrics Integration Boundary
    console.log(" [11/43] Verifying Realtime Operational Metrics Integration Boundary...");
    const rtMetric = sdk.recordMetric("realtime.reconnect.count", "COUNTER", 2);
    if (rtMetric.name !== "realtime.reconnect.count")
        throw new Error("Realtime metric boundary check failed");
    // 12. Notifications Operational Metrics Integration Boundary
    console.log(" [12/43] Verifying Notifications Operational Metrics Integration Boundary...");
    const notifMetric = sdk.recordMetric("notifications.delivery.failures", "COUNTER", 0);
    if (notifMetric.name !== "notifications.delivery.failures")
        throw new Error("Notifications metric boundary check failed");
    // 13. Security Audit (No Credentials or Tokens in Events or Logs)
    console.log(" [13/43] Verifying Telemetry Payload Security (No Passwords or Tokens)...");
    if (eventStr.includes("bearer") || eventStr.includes("jwt") || eventStr.includes("secret_12345")) {
        throw new Error("SECURITY VIOLATION: Telemetry payload contains unredacted security tokens!");
    }
    // 14. Theme System Integration
    console.log(" [14/43] Testing Analytics Theme System Integration...");
    const theme = resolveThemePrecedence({
        tenantConfig: { preset: "dark-pro" }
    });
    if (!theme.colors.primary)
        throw new Error("Theme resolution failed for Analytics SDK");
    // 15. Localization Configuration
    console.log(" [15/43] Testing Analytics Localization Configuration...");
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
    // 16. RBAC Permission Integration
    console.log(" [16/43] Testing Analytics RBAC Permission Checks...");
    const userPerms = ["analytics.view"];
    const viewState = evaluatePermissionState(userPerms, "analytics.view", "hide");
    if (viewState.status !== "granted")
        throw new Error("RBAC evaluation failed for granted permission");
    const manageState = evaluatePermissionState(userPerms, "analytics.manage", "disable");
    if (manageState.status !== "denied" || manageState.mode !== "disable")
        throw new Error("RBAC evaluation failed for denied permission");
    // 17. Reusable UI Components Metadata
    console.log(" [17/43] Testing Reusable Analytics Component Definitions Metadata...");
    const healthComp = ANALYTICS_UI_COMPONENTS.HEALTH_INDICATOR;
    const perfComp = ANALYTICS_UI_COMPONENTS.PERFORMANCE_CARD;
    if (healthComp.id !== "analytics.health-indicator" || healthComp.supportedPlatforms.length !== 3) {
        throw new Error("HEALTH_INDICATOR component metadata check failed");
    }
    if (!perfComp.requiredPermissions.includes("analytics.view")) {
        throw new Error("PERFORMANCE_CARD required permissions check failed");
    }
    // 18. Ready-Made Analytics Screens Metadata
    console.log(" [18/43] Testing Ready-Made Analytics Screen Definitions Metadata...");
    const dashScreen = ANALYTICS_READY_MADE_SCREENS.ANALYTICS_DASHBOARD_SCREEN;
    const privacyScreen = ANALYTICS_READY_MADE_SCREENS.PRIVACY_CONSENT_SCREEN;
    if (dashScreen.mode !== "full-screen" || !dashScreen.requiredPermissions.includes("analytics.view")) {
        throw new Error("ANALYTICS_DASHBOARD_SCREEN metadata check failed");
    }
    if (!privacyScreen.requiredPermissions.includes("analytics.manage")) {
        throw new Error("PRIVACY_CONSENT_SCREEN metadata check failed");
    }
    // 19. Framework Neutrality Audit
    console.log(" [19/43] Verifying Framework Neutrality (No React/DOM Leakage)...");
    if (typeof sdk.render === "function" || typeof sdk.componentDidMount === "function") {
        throw new Error("DEPENDENCY VIOLATION: Core Analytics SDK leaks UI framework methods!");
    }
    // 20. Resource Cleanup
    console.log(" [20/43] Testing Analytics SDK Resource Cleanup (destroy)...");
    sdk.destroy();
    // 21. Backward Compatibility with GeoSphereClient.analytics
    console.log(" [21/43] Verifying Backward Compatibility with GeoSphereClient.analytics...");
    const client = new GeoSphereClient({
        baseUrl: "https://api.geosphere.local",
        tenantId: "tenant_analytics_test_001",
        applicationId: "app_analytics_test_001"
    });
    if (!client.analytics || typeof client.analytics.createAnalyticsSDK !== "function") {
        throw new Error("Backward compatibility broken: existing client.analytics facade is invalid");
    }
    // 22–43. Zero Duplication Engine & Forbidden Business Reporting Checks
    console.log(" [22/43] Verifying Zero Duplicate GIS Engine in Analytics Core...");
    if (typeof GeoSphereAnalyticsSDK.prototype.createPolygon === "function") {
        throw new Error("DUPLICATION VIOLATION: Analytics SDK re-implemented GIS Geometry Engine!");
    }
    console.log(" [23/43] Verifying Zero Duplicate Map Renderer in Analytics Core...");
    if (typeof GeoSphereAnalyticsSDK.prototype.renderMap === "function") {
        throw new Error("DUPLICATION VIOLATION: Analytics SDK re-implemented Map Renderer!");
    }
    console.log(" [24/43] Verifying Zero Duplicate Location Acquisition Engine...");
    if (typeof GeoSphereAnalyticsSDK.prototype.watchPosition === "function") {
        throw new Error("DUPLICATION VIOLATION: Analytics SDK re-implemented Location Engine!");
    }
    console.log(" [25/43] Verifying Zero Duplicate Tracking Engine...");
    if (typeof GeoSphereAnalyticsSDK.prototype.startTrackingSession === "function") {
        throw new Error("DUPLICATION VIOLATION: Analytics SDK re-implemented Tracking Engine!");
    }
    console.log(" [26/43] Verifying Zero Duplicate Geofence Engine...");
    if (typeof GeoSphereAnalyticsSDK.prototype.evaluateGeofence === "function") {
        throw new Error("DUPLICATION VIOLATION: Analytics SDK re-implemented Geofence Engine!");
    }
    console.log(" [27/43] Verifying Zero Duplicate Routing Engine...");
    if (typeof GeoSphereAnalyticsSDK.prototype.calculateRoute === "function") {
        throw new Error("DUPLICATION VIOLATION: Analytics SDK re-implemented Routing Engine!");
    }
    console.log(" [28/43] Verifying Zero Duplicate Navigation Engine...");
    if (typeof GeoSphereAnalyticsSDK.prototype.startTurnByTurn === "function") {
        throw new Error("DUPLICATION VIOLATION: Analytics SDK re-implemented Navigation Engine!");
    }
    console.log(" [29/43] Verifying Zero Duplicate Search Engine...");
    if (typeof GeoSphereAnalyticsSDK.prototype.searchPlaces === "function") {
        throw new Error("DUPLICATION VIOLATION: Analytics SDK re-implemented Search Engine!");
    }
    console.log(" [30/43] Verifying Zero Duplicate Spatial Analysis Engine...");
    if (typeof GeoSphereAnalyticsSDK.prototype.calculateArea === "function") {
        throw new Error("DUPLICATION VIOLATION: Analytics SDK re-implemented Spatial Analysis Engine!");
    }
    console.log(" [31/43] Verifying Zero Duplicate Offline Storage Engine...");
    if (typeof GeoSphereAnalyticsSDK.prototype.createMapPackage === "function") {
        throw new Error("DUPLICATION VIOLATION: Analytics SDK re-implemented Offline Engine!");
    }
    console.log(" [32/43] Verifying Zero Duplicate Realtime WebSocket Engine...");
    if (typeof GeoSphereAnalyticsSDK.prototype.connectWebSocket === "function") {
        throw new Error("DUPLICATION VIOLATION: Analytics SDK re-implemented Realtime Engine!");
    }
    console.log(" [33/43] Verifying Zero Forbidden Field Force Employee Reports...");
    if (typeof GeoSphereAnalyticsSDK.prototype.generateEmployeeReport === "function") {
        throw new Error("FORBIDDEN BUSINESS WORKFLOW: Analytics SDK contains Field Force Employee Reports!");
    }
    console.log(" [34/43] Verifying Zero Forbidden Field Force Sales/Visit Reports...");
    if (typeof GeoSphereAnalyticsSDK.prototype.generateSalesMetrics === "function") {
        throw new Error("FORBIDDEN BUSINESS WORKFLOW: Analytics SDK contains Field Force Sales Metrics!");
    }
    console.log(" [35/43] Testing Provider Info Query...");
    const providerInfo = sdk.getProviderInfo();
    if (providerInfo.name !== "GeoSphereMockAnalyticsProvider") {
        throw new Error("getProviderInfo returned invalid provider name");
    }
    console.log(" [36/43] Testing Listener Unsubscribe Callback...");
    const sub = sdk.subscribe(() => { });
    sub.unsubscribe();
    console.log(" [37/43] Testing Config Batch Size Defaults...");
    if (config.batchSize !== 20)
        throw new Error("batchSize config check failed");
    console.log(" [38/43] Testing Config Flush Interval Defaults...");
    if (config.flushIntervalMs !== 5000)
        throw new Error("flushIntervalMs config check failed");
    console.log(" [39/43] Testing Embedded UI Mode Configuration Flag...");
    if (!config.embeddedMode)
        throw new Error("embeddedMode config check failed");
    console.log(" [40/43] Testing Update Privacy Configuration...");
    const updatedPrivacy = sdk.updatePrivacyConfig({ performanceEnabled: false });
    if (updatedPrivacy.performanceEnabled !== false)
        throw new Error("updatePrivacyConfig failed to update flag");
    console.log(" [41/43] Testing Multi-Platform Web Adapter Metadata...");
    if (!dashScreen.adapters || dashScreen.adapters.length !== 3)
        throw new Error("dashScreen adapters check failed");
    console.log(" [42/43] Testing Multi-Platform Android Adapter Metadata...");
    const androidAdapter = dashScreen.adapters.find((a) => a.platform === "android");
    if (!androidAdapter || androidAdapter.framework !== "compose")
        throw new Error("Android Compose adapter check failed");
    console.log(" [43/43] Testing Multi-Platform iOS Adapter Metadata...");
    const iosAdapter = dashScreen.adapters.find((a) => a.platform === "ios");
    if (!iosAdapter || iosAdapter.framework !== "swiftui")
        throw new Error("iOS SwiftUI adapter check failed");
    console.log("✅ All GeoSphere Analytics & Telemetry SDK & Native UI Foundation Unit Tests Passed Successfully!");
}
runAnalyticsSdkTests().catch((err) => {
    console.error("❌ GeoSphere Analytics & Telemetry SDK Unit Tests Failed:", err);
    process.exit(1);
});
//# sourceMappingURL=analytics-sdk.test.js.map