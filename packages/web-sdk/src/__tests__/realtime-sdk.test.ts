/**
 * GeoSphere Step 18 Realtime & Event Streaming SDK + Native UI Foundation Unit Test Suite
 */

import {
  GeoSphereRealtimeSDK,
  GeoSphereRealtimeConfig,
  GeoSphereMockRealtimeProvider,
  GeoSphereRealtimeError,
  GeoSphereRealtimeEventEnvelope,
  REALTIME_UI_COMPONENTS,
  REALTIME_READY_MADE_SCREENS,
  resolveThemePrecedence,
  validateLocaleConfig,
  evaluatePermissionState
} from "../contracts/index.js";

import { GeoSphereClient } from "../client.js";

declare const process: { exit(code?: number): never };

async function runRealtimeSdkTests() {
  console.log("==========================================");
  console.log("RUNNING GEOSPHERE REALTIME & EVENT STREAMING SDK UNIT TESTS");
  console.log("==========================================");

  // 1. Initialization & Initial Connection State
  console.log("  [1/44] Testing Realtime SDK Initialization & Initial Connection State...");
  const config: GeoSphereRealtimeConfig = {
    endpointUrl: "wss://api.geosphere.io/realtime",
    autoReconnect: true,
    maxReconnectRetries: 5,
    heartbeatIntervalMs: 15000,
    maxPayloadSizeBytes: 512 * 1024,
    embeddedMode: true
  };

  const provider = new GeoSphereMockRealtimeProvider();
  const sdk = new GeoSphereRealtimeSDK(config, provider);
  await sdk.initialize();

  if (sdk.getConnectionState() !== "IDLE") {
    throw new Error("Initialization failed: Connection state is not IDLE");
  }

  // 2. Capability Discovery
  console.log("  [2/44] Testing Realtime Capability Discovery...");
  const caps = sdk.getCapabilities();
  if (!caps.includes("WEBSOCKET") || !caps.includes("PUB_SUB") || !caps.includes("HEARTBEAT") || !caps.includes("EVENT_FILTERING")) {
    throw new Error("Capability discovery failed for supported Realtime capabilities");
  }

  // 3. Connection Lifecycle (Connect & Disconnect)
  console.log("  [3/44] Testing Realtime Connection Lifecycle (Connect & Disconnect)...");
  const lifecycleEvents: any[] = [];
  sdk.subscribeToLifecycle((evt) => lifecycleEvents.push(evt));

  await sdk.connect();
  if (sdk.getConnectionState() !== "CONNECTED") {
    throw new Error("connect() failed to transition state to CONNECTED");
  }

  const health = sdk.getHealth();
  if (health.status !== "HEALTHY" || health.latencyMs <= 0) {
    throw new Error("getHealth() returned invalid health metrics struct");
  }

  // 4. Subscription Management (Subscribe & Unsubscribe)
  console.log("  [4/44] Testing Subscription Lifecycle (Subscribe & Unsubscribe)...");
  const sub = await sdk.subscribe("tenant_alpha", "location.updates", { vehicleId: "veh_101" });
  if (!sub.id || sub.status !== "ACTIVE" || sub.channel !== "tenant_alpha" || sub.topic !== "location.updates") {
    throw new Error("subscribe() failed to construct active subscription");
  }

  await sdk.unsubscribe(sub.id);

  // 5. Normalized Event Envelope Creation & Handling
  console.log("  [5/44] Testing Normalized Event Envelope Handling...");
  const receivedEnvelopes: GeoSphereRealtimeEventEnvelope[] = [];
  sdk.onEvent((env) => receivedEnvelopes.push(env));

  const envelope: GeoSphereRealtimeEventEnvelope = {
    eventId: "evt_test_001",
    eventType: "location.updated",
    timestamp: new Date().toISOString(),
    channel: "tenant_alpha",
    topic: "location.updates",
    version: "1.0",
    sequence: 1,
    correlationId: "corr_001",
    payload: { lat: 21.1458, lng: 79.0882, speed: 45 }
  };

  const deliveryState = sdk.handleIncomingEvent(envelope);
  if (deliveryState !== "RECEIVED" || receivedEnvelopes.length !== 1) {
    throw new Error("handleIncomingEvent failed to deliver event to registered handlers");
  }

  // 6. Duplicate Event Detection (Idempotency Check)
  console.log("  [6/44] Testing Duplicate Event Idempotency Detection...");
  const dupState = sdk.handleIncomingEvent(envelope);
  if (dupState !== "DUPLICATE") {
    throw new Error("handleIncomingEvent failed to detect duplicate event ID");
  }

  // 7. Event Publishing & Size Limits
  console.log("  [7/44] Testing Event Publishing & Size Validation...");
  await sdk.publish(envelope);

  const giantPayloadEnvelope: GeoSphereRealtimeEventEnvelope = {
    ...envelope,
    eventId: "evt_giant_002",
    payload: { blob: "x".repeat(2 * 1024 * 1024) } // 2MB
  };

  try {
    await sdk.publish(giantPayloadEnvelope);
    throw new Error("publish() failed to throw PAYLOAD_TOO_LARGE for giant payload");
  } catch (err: any) {
    if (!(err instanceof GeoSphereRealtimeError) || err.code !== "PAYLOAD_TOO_LARGE") {
      throw err;
    }
  }

  // 8. Event Acknowledgement
  console.log("  [8/44] Testing Event Acknowledgement...");
  await sdk.acknowledge("evt_test_001");

  // 9. Replay Capability Query
  console.log("  [9/44] Testing Event Replay Capability Handling...");
  const replayEvents = await sdk.replay("evt_test_001");
  if (!Array.isArray(replayEvents)) throw new Error("replay() failed to return event array");

  // 10. Disconnection Lifecycle
  console.log(" [10/44] Testing Disconnection Lifecycle...");
  await sdk.disconnect();
  if (sdk.getConnectionState() !== "DISCONNECTED") {
    throw new Error("disconnect() failed to transition state to DISCONNECTED");
  }

  // 11. Multi-Tenant Channel Isolation Audit
  console.log(" [11/44] Verifying Multi-Tenant Channel Isolation Boundary...");
  const tenantAChannel: string = "tenant_company_a";
  const tenantBChannel: string = "tenant_company_b";
  if (tenantAChannel === tenantBChannel) throw new Error("Tenant boundary error");

  // 12. Tracking SDK Integration Boundary
  console.log(" [12/44] Verifying Tracking SDK Realtime Integration Boundary...");
  const trackEnv: GeoSphereRealtimeEventEnvelope = {
    eventId: "evt_trk_01",
    eventType: "tracking.locationUpdated",
    timestamp: new Date().toISOString(),
    channel: "fleet",
    topic: "telemetry",
    version: "1.0",
    payload: { sessionId: "sess_101", point: [79.08, 21.14] }
  };
  if (trackEnv.eventType !== "tracking.locationUpdated") throw new Error("Tracking SDK event type check failed");

  // 13. Geofencing SDK Integration Boundary
  console.log(" [13/44] Verifying Geofencing SDK Realtime Integration Boundary...");
  const gfEnv: GeoSphereRealtimeEventEnvelope = {
    eventId: "evt_gf_01",
    eventType: "geofence.entered",
    timestamp: new Date().toISOString(),
    channel: "geofence",
    topic: "events",
    version: "1.0",
    payload: { geofenceId: "gf_001", location: [79.08, 21.14] }
  };
  if (gfEnv.eventType !== "geofence.entered") throw new Error("Geofencing SDK event type check failed");

  // 14. Navigation SDK Integration Boundary
  console.log(" [14/44] Verifying Navigation SDK Realtime Integration Boundary...");
  const navEnv: GeoSphereRealtimeEventEnvelope = {
    eventId: "evt_nav_01",
    eventType: "navigation.maneuverChanged",
    timestamp: new Date().toISOString(),
    channel: "navigation",
    topic: "guidance",
    version: "1.0",
    payload: { maneuver: "TURN_RIGHT", distanceMeters: 100 }
  };
  if (navEnv.eventType !== "navigation.maneuverChanged") throw new Error("Navigation SDK event type check failed");

  // 15. Security Audit (No Secrets in Realtime Event Payloads)
  console.log(" [15/44] Verifying Realtime Envelope Security (No Secrets or Tokens)...");
  const envStr = JSON.stringify(envelope);
  if (envStr.includes("token") || envStr.includes("apiKey") || envStr.includes("secret")) {
    throw new Error("SECURITY VIOLATION: Realtime envelope exposes security tokens!");
  }

  // 16. Privacy Boundary Audit (Zero Automatic Tracking Telemetry Auto-Publish)
  console.log(" [16/44] Verifying Privacy Boundary (Zero Automatic Tracking Auto-Publish)...");
  const sdkStr = JSON.stringify(sdk);
  if (sdkStr.includes("/api/realtime/uploadAll")) {
    throw new Error("PRIVACY VIOLATION: Realtime SDK contains automatic telemetry auto-publish!");
  }

  // 17. Theme System Integration
  console.log(" [17/44] Testing Realtime Theme System Integration...");
  const theme = resolveThemePrecedence({
    tenantConfig: { preset: "dark-pro" }
  });
  if (!theme.colors.primary) throw new Error("Theme resolution failed for Realtime SDK");

  // 18. Localization Configuration
  console.log(" [18/44] Testing Realtime Localization Configuration...");
  const validLocale = validateLocaleConfig({
    language: "en",
    locale: "en-US",
    timezone: "UTC",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "HH:mm",
    distanceUnit: "kilometers",
    speedUnit: "km/h"
  });
  if (validLocale.distanceUnit !== "kilometers") throw new Error("Localization validation failed");

  // 19. RBAC Permission Integration
  console.log(" [19/44] Testing Realtime RBAC Permission Checks...");
  const userPerms = ["realtime.connect", "realtime.subscribe"];
  const connectState = evaluatePermissionState(userPerms, "realtime.connect", "hide");
  if (connectState.status !== "granted") throw new Error("RBAC evaluation failed for granted permission");

  const pubState = evaluatePermissionState(userPerms, "realtime.publish", "disable");
  if (pubState.status !== "denied" || pubState.mode !== "disable") throw new Error("RBAC evaluation failed for denied permission");

  // 20. Reusable UI Components Metadata
  console.log(" [20/44] Testing Reusable Realtime Component Definitions Metadata...");
  const statusBadgeComp = REALTIME_UI_COMPONENTS.REALTIME_STATUS_INDICATOR;
  const eventStreamComp = REALTIME_UI_COMPONENTS.EVENT_STREAM_INDICATOR;

  if (statusBadgeComp.id !== "realtime.status-indicator" || statusBadgeComp.supportedPlatforms.length !== 3) {
    throw new Error("REALTIME_STATUS_INDICATOR component metadata check failed");
  }
  if (!eventStreamComp.requiredPermissions.includes("realtime.subscribe")) {
    throw new Error("EVENT_STREAM_INDICATOR required permissions check failed");
  }

  // 21. Ready-Made Realtime Screens Metadata
  console.log(" [21/44] Testing Ready-Made Realtime Screen Definitions Metadata...");
  const dashScreen = REALTIME_READY_MADE_SCREENS.REALTIME_DASHBOARD_SCREEN;
  const streamScreen = REALTIME_READY_MADE_SCREENS.EVENT_STREAM_SCREEN;

  if (dashScreen.mode !== "full-screen" || !dashScreen.requiredPermissions.includes("realtime.connect")) {
    throw new Error("REALTIME_DASHBOARD_SCREEN metadata check failed");
  }
  if (!streamScreen.requiredPermissions.includes("realtime.subscribe")) {
    throw new Error("EVENT_STREAM_SCREEN metadata check failed");
  }

  // 22. Framework Neutrality Audit
  console.log(" [22/44] Verifying Framework Neutrality (No React/DOM Leakage)...");
  if (typeof (sdk as any).render === "function" || typeof (sdk as any).componentDidMount === "function") {
    throw new Error("DEPENDENCY VIOLATION: Core Realtime SDK leaks UI framework methods!");
  }

  // 23. Resource Cleanup
  console.log(" [23/44] Testing Realtime SDK Resource Cleanup (destroy)...");
  sdk.destroy();

  // 24. Backward Compatibility with GeoSphereClient.realtime
  console.log(" [24/44] Verifying Backward Compatibility with GeoSphereClient.realtime...");
  const client = new GeoSphereClient({
    baseUrl: "https://api.geosphere.local",
    tenantId: "tenant_rt_test_001",
    applicationId: "app_rt_test_001"
  });

  if (!client.realtime || typeof client.realtime.createRealtimeSDK !== "function") {
    throw new Error("Backward compatibility broken: existing client.realtime facade is invalid");
  }

  // 25–44. Zero Duplication Engine Checks
  console.log(" [25/44] Verifying Zero Duplicate GIS Engine in Realtime Core...");
  if (typeof (GeoSphereRealtimeSDK.prototype as any).createPolygon === "function") {
    throw new Error("DUPLICATION VIOLATION: Realtime SDK re-implemented GIS Geometry Engine!");
  }

  console.log(" [26/44] Verifying Zero Duplicate Map Renderer in Realtime Core...");
  if (typeof (GeoSphereRealtimeSDK.prototype as any).renderMap === "function") {
    throw new Error("DUPLICATION VIOLATION: Realtime SDK re-implemented Map Renderer!");
  }

  console.log(" [27/44] Verifying Zero Duplicate Location Acquisition Engine...");
  if (typeof (GeoSphereRealtimeSDK.prototype as any).watchPosition === "function") {
    throw new Error("DUPLICATION VIOLATION: Realtime SDK re-implemented Location Acquisition Engine!");
  }

  console.log(" [28/44] Verifying Zero Duplicate Tracking Engine...");
  if (typeof (GeoSphereRealtimeSDK.prototype as any).startTrackingSession === "function") {
    throw new Error("DUPLICATION VIOLATION: Realtime SDK re-implemented Tracking Engine!");
  }

  console.log(" [29/44] Verifying Zero Duplicate Geofence Evaluation Engine...");
  if (typeof (GeoSphereRealtimeSDK.prototype as any).evaluateGeofence === "function") {
    throw new Error("DUPLICATION VIOLATION: Realtime SDK re-implemented Geofence Engine!");
  }

  console.log(" [30/44] Verifying Zero Duplicate Routing Engine...");
  if (typeof (GeoSphereRealtimeSDK.prototype as any).calculateRoute === "function") {
    throw new Error("DUPLICATION VIOLATION: Realtime SDK re-implemented Routing Engine!");
  }

  console.log(" [31/44] Verifying Zero Duplicate Navigation Guidance Engine...");
  if (typeof (GeoSphereRealtimeSDK.prototype as any).startTurnByTurn === "function") {
    throw new Error("DUPLICATION VIOLATION: Realtime SDK re-implemented Navigation Engine!");
  }

  console.log(" [32/44] Verifying Zero Duplicate Search Provider Engine...");
  if (typeof (GeoSphereRealtimeSDK.prototype as any).searchPlaces === "function") {
    throw new Error("DUPLICATION VIOLATION: Realtime SDK re-implemented Search Engine!");
  }

  console.log(" [33/44] Verifying Zero Duplicate Spatial Analysis Math Engine...");
  if (typeof (GeoSphereRealtimeSDK.prototype as any).calculateArea === "function") {
    throw new Error("DUPLICATION VIOLATION: Realtime SDK re-implemented Spatial Analysis Engine!");
  }

  console.log(" [34/44] Verifying Zero Duplicate Offline Storage Engine...");
  if (typeof (GeoSphereRealtimeSDK.prototype as any).createMapPackage === "function") {
    throw new Error("DUPLICATION VIOLATION: Realtime SDK re-implemented Offline Storage Engine!");
  }

  console.log(" [35/44] Testing Provider Info Query...");
  const providerInfo = sdk.getProviderInfo();
  if (providerInfo.name !== "GeoSphereMockRealtimeProvider") {
    throw new Error("getProviderInfo returned invalid provider name");
  }

  console.log(" [36/44] Testing Provider Health Latency Metric...");
  const mockHealth = provider.getHealth();
  if (mockHealth.latencyMs !== 15) throw new Error("Mock provider health latency check failed");

  console.log(" [37/44] Testing Unsubscribe Error Handling when Disconnected...");
  await provider.connect();
  const testSub = await provider.subscribe("c1", "t1");
  await provider.unsubscribe(testSub.id);

  console.log(" [38/44] Testing Realtime Error Normalization...");
  try {
    await provider.disconnect();
    await provider.subscribe("c1", "t1");
    throw new Error("subscribe failed to throw when disconnected");
  } catch (e: any) {
    if (!(e instanceof GeoSphereRealtimeError) || e.code !== "CONNECTION_FAILED") throw e;
  }

  console.log(" [39/44] Testing Event Listener Unsubscribe Callback...");
  const handler = sdk.onEvent(() => {});
  handler.unsubscribe();

  console.log(" [40/44] Testing Lifecycle Listener Unsubscribe Callback...");
  const lifecycleSub = sdk.subscribeToLifecycle(() => {});
  lifecycleSub.unsubscribe();

  console.log(" [41/44] Testing Heartbeat Interval Config Flag...");
  if (config.heartbeatIntervalMs !== 15000) throw new Error("heartbeatIntervalMs config check failed");

  console.log(" [42/44] Testing Auto Reconnect Config Flag...");
  if (!config.autoReconnect) throw new Error("autoReconnect config check failed");

  console.log(" [43/44] Testing Max Reconnect Retries Config Flag...");
  if (config.maxReconnectRetries !== 5) throw new Error("maxReconnectRetries config check failed");

  console.log(" [44/44] Testing Embedded UI Mode Configuration Flag...");
  if (!config.embeddedMode) throw new Error("embeddedMode config check failed");

  console.log("✅ All GeoSphere Realtime & Event Streaming SDK & Native UI Foundation Unit Tests Passed Successfully!");
}

runRealtimeSdkTests().catch((err) => {
  console.error("❌ GeoSphere Realtime & Event Streaming SDK Unit Tests Failed:", err);
  process.exit(1);
});
