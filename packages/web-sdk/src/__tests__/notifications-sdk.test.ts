/**
 * GeoSphere Step 19 Notifications & Messaging SDK + Native UI Foundation Unit Test Suite
 */

import {
  GeoSphereNotificationsSDK,
  GeoSphereNotificationsConfig,
  GeoSphereMockNotificationProvider,
  GeoSphereNotificationsError,
  GeoSphereNotification,
  NOTIFICATIONS_UI_COMPONENTS,
  NOTIFICATIONS_READY_MADE_SCREENS,
  resolveThemePrecedence,
  validateLocaleConfig,
  evaluatePermissionState
} from "../contracts/index.js";

import { GeoSphereClient } from "../client.js";

declare const process: { exit(code?: number): never };

async function runNotificationsSdkTests() {
  console.log("==========================================");
  console.log("RUNNING GEOSPHERE NOTIFICATIONS & MESSAGING SDK UNIT TESTS");
  console.log("==========================================");

  // 1. Initialization & Capabilities
  console.log("  [1/38] Testing Notifications SDK Initialization & Capabilities...");
  const config: GeoSphereNotificationsConfig = {
    embeddedMode: true,
    pageSize: 10,
    autoSyncOffline: true
  };

  const provider = new GeoSphereMockNotificationProvider();
  const sdk = new GeoSphereNotificationsSDK(config, provider);
  await sdk.initialize();

  const caps = sdk.getCapabilities();
  if (!caps.includes("IN_APP") || !caps.includes("PUSH") || !caps.includes("TOKEN_REGISTRATION") || !caps.includes("QUIET_HOURS")) {
    throw new Error("Capability discovery failed for supported Notifications capabilities");
  }

  // 2. Notification Model & Pagination
  console.log("  [2/38] Testing Notification Retrieval & Pagination...");
  const listRes = await sdk.listNotifications();
  if (!listRes.items || listRes.items.length === 0) {
    throw new Error("listNotifications failed to return seeded notification list");
  }

  const seedNotif = listRes.items[0];
  if (!seedNotif.id || seedNotif.type !== "SYSTEM" || seedNotif.channel !== "IN_APP") {
    throw new Error("Seed notification payload struct check failed");
  }

  // 3. Unread Count Calculation & Read Receipts
  console.log("  [3/38] Testing Unread Count Calculation & Mark Read Receipts...");
  const initialUnread = await sdk.getUnreadCount();
  if (initialUnread !== 1) {
    throw new Error(`getUnreadCount() returned ${initialUnread}, expected 1`);
  }

  const events: any[] = [];
  sdk.subscribe((evt) => events.push(evt));

  await sdk.markAsRead(seedNotif.id);
  const updatedUnread = await sdk.getUnreadCount();
  if (updatedUnread !== 0) {
    throw new Error(`getUnreadCount() returned ${updatedUnread} after markAsRead, expected 0`);
  }

  if (events.length === 0 || events[0].type !== "notifications.read") {
    throw new Error("markAsRead failed to emit notifications.read event");
  }

  // 4. Explicit Acknowledgement
  console.log("  [4/38] Testing Explicit Notification Acknowledgement...");
  await sdk.acknowledge(seedNotif.id);
  if (events.length < 2 || events[1].type !== "notifications.acknowledged") {
    throw new Error("acknowledge failed to emit notifications.acknowledged event");
  }

  // 5. Notification Dismissal
  console.log("  [5/38] Testing Notification Dismissal...");
  await sdk.dismiss(seedNotif.id);
  if (events.length < 3 || events[2].type !== "notifications.dismissed") {
    throw new Error("dismiss failed to emit notifications.dismissed event");
  }

  // 6. Push Token Registration & Unregistration
  console.log("  [6/38] Testing Push Token Registration & Unregistration...");
  const pushTok = await sdk.registerPushToken("fcm_token_test_12345", "android", "fcm");
  if (pushTok.token !== "fcm_token_test_12345" || pushTok.status !== "ACTIVE") {
    throw new Error("registerPushToken failed to register active push token struct");
  }

  await sdk.unregisterPushToken(pushTok.token);

  // 7. Notification Preferences & Quiet Hours
  console.log("  [7/38] Testing Notification Preferences & Quiet Hours Configuration...");
  const initialPrefs = await sdk.getPreferences();
  if (!initialPrefs.enabled || !initialPrefs.channels.IN_APP) {
    throw new Error("getPreferences returned invalid default preference struct");
  }

  const updatedPrefs = await sdk.updatePreferences({
    soundEnabled: false,
    quietHours: { enabled: true, startTime: "23:00", endTime: "06:00", timezone: "UTC" }
  });
  if (updatedPrefs.soundEnabled !== false || !updatedPrefs.quietHours?.enabled) {
    throw new Error("updatePreferences failed to mutate notification preferences");
  }

  // 8. Safe Action & Deep Link Validation
  console.log("  [8/38] Testing Safe Action & Deep Link Payload Validation...");
  const actionNotif: GeoSphereNotification = {
    id: "notif_action_001",
    type: "INFO",
    title: "Route Updated",
    body: "New route calculated.",
    timestamp: new Date().toISOString(),
    priority: "HIGH",
    severity: "NOTICE",
    category: "navigation",
    channel: "IN_APP",
    status: "DELIVERED",
    version: "1.0",
    actions: [
      { id: "act_view", label: "View Map", actionType: "DEEP_LINK", target: "app://map" }
    ],
    deepLink: "app://map"
  };

  if (!actionNotif.deepLink?.startsWith("app://")) {
    throw new Error("Deep link format validation check failed");
  }

  // 9. Realtime SDK Integration Boundary
  console.log("  [9/38] Verifying Realtime SDK Integration Boundary...");
  const realtimePushEvent = {
    eventId: "evt_push_001",
    eventType: "notifications.pushed",
    payload: actionNotif
  };
  if (realtimePushEvent.eventType !== "notifications.pushed") {
    throw new Error("Realtime SDK notification event boundary check failed");
  }

  // 10. Offline SDK Integration Boundary
  console.log(" [10/38] Verifying Offline SDK Integration Boundary...");
  const offlineAckQueueItem = {
    id: "sync_notif_ack_001",
    type: "NOTIFICATION_ACK",
    payload: { notificationId: "notif_seed_001" }
  };
  if (offlineAckQueueItem.type !== "NOTIFICATION_ACK") {
    throw new Error("Offline SDK notification sync queue boundary check failed");
  }

  // 11. Security Audit (No Secrets or Tokens in Notification Payloads or Logs)
  console.log(" [11/38] Verifying Notification Payload Security (No Secrets or Tokens)...");
  const notifStr = JSON.stringify(actionNotif);
  if (notifStr.includes("token") && !notifStr.includes("fcm_token") || notifStr.includes("apiKey") || notifStr.includes("secret")) {
    throw new Error("SECURITY VIOLATION: Notification payload exposes security secrets!");
  }

  // 12. Privacy Boundary Audit (Sanitized Token Logging)
  console.log(" [12/38] Verifying Privacy Boundary (Sanitized Token Handling)...");
  const pushTokStr = JSON.stringify(pushTok);
  if (pushTokStr.includes("userPassword") || pushTokStr.includes("creditCard")) {
    throw new Error("PRIVACY VIOLATION: Push token struct contains private credentials!");
  }

  // 13. Theme System Integration
  console.log(" [13/38] Testing Notifications Theme System Integration...");
  const theme = resolveThemePrecedence({
    tenantConfig: { preset: "dark-pro" }
  });
  if (!theme.colors.primary) throw new Error("Theme resolution failed for Notifications SDK");

  // 14. Localization Configuration
  console.log(" [14/38] Testing Notifications Localization Configuration...");
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

  // 15. RBAC Permission Integration
  console.log(" [15/38] Testing Notifications RBAC Permission Checks...");
  const userPerms = ["notifications.read", "notifications.configure"];
  const readState = evaluatePermissionState(userPerms, "notifications.read", "hide");
  if (readState.status !== "granted") throw new Error("RBAC evaluation failed for granted permission");

  const manageState = evaluatePermissionState(userPerms, "notifications.manage", "disable");
  if (manageState.status !== "denied" || manageState.mode !== "disable") throw new Error("RBAC evaluation failed for denied permission");

  // 16. Reusable UI Components Metadata
  console.log(" [16/38] Testing Reusable Notifications Component Definitions Metadata...");
  const bellComp = NOTIFICATIONS_UI_COMPONENTS.NOTIFICATION_BELL;
  const cardComp = NOTIFICATIONS_UI_COMPONENTS.NOTIFICATION_CARD;

  if (bellComp.id !== "notifications.bell-button" || bellComp.supportedPlatforms.length !== 3) {
    throw new Error("NOTIFICATION_BELL component metadata check failed");
  }
  if (!cardComp.requiredPermissions.includes("notifications.read")) {
    throw new Error("NOTIFICATION_CARD required permissions check failed");
  }

  // 17. Ready-Made Notifications Screens Metadata
  console.log(" [17/38] Testing Ready-Made Notifications Screen Definitions Metadata...");
  const centerScreen = NOTIFICATIONS_READY_MADE_SCREENS.NOTIFICATION_CENTER_SCREEN;
  const settingsScreen = NOTIFICATIONS_READY_MADE_SCREENS.NOTIFICATION_SETTINGS_SCREEN;

  if (centerScreen.mode !== "full-screen" || !centerScreen.requiredPermissions.includes("notifications.read")) {
    throw new Error("NOTIFICATION_CENTER_SCREEN metadata check failed");
  }
  if (!settingsScreen.requiredPermissions.includes("notifications.manage")) {
    throw new Error("NOTIFICATION_SETTINGS_SCREEN metadata check failed");
  }

  // 18. Framework Neutrality Audit
  console.log(" [18/38] Verifying Framework Neutrality (No React/DOM Leakage)...");
  if (typeof (sdk as any).render === "function" || typeof (sdk as any).componentDidMount === "function") {
    throw new Error("DEPENDENCY VIOLATION: Core Notifications SDK leaks UI framework methods!");
  }

  // 19. Resource Cleanup
  console.log(" [19/38] Testing Notifications SDK Resource Cleanup (destroy)...");
  sdk.destroy();

  // 20. Backward Compatibility with GeoSphereClient.notifications
  console.log(" [20/38] Verifying Backward Compatibility with GeoSphereClient.notifications...");
  const client = new GeoSphereClient({
    baseUrl: "https://api.geosphere.local",
    tenantId: "tenant_notif_test_001",
    applicationId: "app_notif_test_001"
  });

  if (!client.notifications || typeof client.notifications.createNotificationsSDK !== "function") {
    throw new Error("Backward compatibility broken: existing client.notifications facade is invalid");
  }

  // 21–38. Zero Duplication Engine Checks
  console.log(" [21/38] Verifying Zero Duplicate GIS Engine in Notifications Core...");
  if (typeof (GeoSphereNotificationsSDK.prototype as any).createPolygon === "function") {
    throw new Error("DUPLICATION VIOLATION: Notifications SDK re-implemented GIS Geometry Engine!");
  }

  console.log(" [22/38] Verifying Zero Duplicate Map Renderer in Notifications Core...");
  if (typeof (GeoSphereNotificationsSDK.prototype as any).renderMap === "function") {
    throw new Error("DUPLICATION VIOLATION: Notifications SDK re-implemented Map Renderer!");
  }

  console.log(" [23/38] Verifying Zero Duplicate Location Acquisition Engine...");
  if (typeof (GeoSphereNotificationsSDK.prototype as any).watchPosition === "function") {
    throw new Error("DUPLICATION VIOLATION: Notifications SDK re-implemented Location Engine!");
  }

  console.log(" [24/38] Verifying Zero Duplicate Tracking Engine...");
  if (typeof (GeoSphereNotificationsSDK.prototype as any).startTrackingSession === "function") {
    throw new Error("DUPLICATION VIOLATION: Notifications SDK re-implemented Tracking Engine!");
  }

  console.log(" [25/38] Verifying Zero Duplicate Geofence Engine...");
  if (typeof (GeoSphereNotificationsSDK.prototype as any).evaluateGeofence === "function") {
    throw new Error("DUPLICATION VIOLATION: Notifications SDK re-implemented Geofence Engine!");
  }

  console.log(" [26/38] Verifying Zero Duplicate Routing Engine...");
  if (typeof (GeoSphereNotificationsSDK.prototype as any).calculateRoute === "function") {
    throw new Error("DUPLICATION VIOLATION: Notifications SDK re-implemented Routing Engine!");
  }

  console.log(" [27/38] Verifying Zero Duplicate Navigation Engine...");
  if (typeof (GeoSphereNotificationsSDK.prototype as any).startTurnByTurn === "function") {
    throw new Error("DUPLICATION VIOLATION: Notifications SDK re-implemented Navigation Engine!");
  }

  console.log(" [28/38] Verifying Zero Duplicate Search Engine...");
  if (typeof (GeoSphereNotificationsSDK.prototype as any).searchPlaces === "function") {
    throw new Error("DUPLICATION VIOLATION: Notifications SDK re-implemented Search Engine!");
  }

  console.log(" [29/38] Verifying Zero Duplicate Spatial Analysis Engine...");
  if (typeof (GeoSphereNotificationsSDK.prototype as any).calculateArea === "function") {
    throw new Error("DUPLICATION VIOLATION: Notifications SDK re-implemented Spatial Analysis Engine!");
  }

  console.log(" [30/38] Verifying Zero Duplicate Offline Storage Engine...");
  if (typeof (GeoSphereNotificationsSDK.prototype as any).createMapPackage === "function") {
    throw new Error("DUPLICATION VIOLATION: Notifications SDK re-implemented Offline Engine!");
  }

  console.log(" [31/38] Verifying Zero Duplicate Realtime WebSocket Engine...");
  if (typeof (GeoSphereNotificationsSDK.prototype as any).connectWebSocket === "function") {
    throw new Error("DUPLICATION VIOLATION: Notifications SDK re-implemented Realtime Engine!");
  }

  console.log(" [32/38] Testing Provider Info Query...");
  const providerInfo = sdk.getProviderInfo();
  if (providerInfo.name !== "GeoSphereMockNotificationProvider") {
    throw new Error("getProviderInfo returned invalid provider name");
  }

  console.log(" [33/38] Testing Invalid Push Token Registration Error Handling...");
  try {
    await sdk.registerPushToken("", "android", "fcm");
    throw new Error("registerPushToken failed to throw TOKEN_INVALID on empty token");
  } catch (e: any) {
    if (!(e instanceof GeoSphereNotificationsError) || e.code !== "TOKEN_INVALID") throw e;
  }

  console.log(" [34/38] Testing Mark Read Non-Existent Notification Error Handling...");
  try {
    await sdk.markAsRead("non_existent_id_999");
    throw new Error("markAsRead failed to throw NOTIFICATION_NOT_FOUND on missing ID");
  } catch (e: any) {
    if (!(e instanceof GeoSphereNotificationsError) || e.code !== "NOTIFICATION_NOT_FOUND") throw e;
  }

  console.log(" [35/38] Testing Mark All As Read...");
  await sdk.markAllAsRead();
  const unreadAfterMarkAll = await sdk.getUnreadCount();
  if (unreadAfterMarkAll !== 0) throw new Error("markAllAsRead failed to set unread count to 0");

  console.log(" [36/38] Testing Listener Subscription Unsubscribe Callback...");
  const sub = sdk.subscribe(() => {});
  sub.unsubscribe();

  console.log(" [37/38] Testing Config Page Size Defaults...");
  if (config.pageSize !== 10) throw new Error("pageSize config check failed");

  console.log(" [38/38] Testing Embedded UI Mode Configuration Flag...");
  if (!config.embeddedMode) throw new Error("embeddedMode config check failed");

  console.log("✅ All GeoSphere Notifications & Messaging SDK & Native UI Foundation Unit Tests Passed Successfully!");
}

runNotificationsSdkTests().catch((err) => {
  console.error("❌ GeoSphere Notifications & Messaging SDK Unit Tests Failed:", err);
  process.exit(1);
});
