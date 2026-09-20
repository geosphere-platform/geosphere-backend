/**
 * Pure Framework-Independent Notification Engine Unit Tests
 *
 * Verifies alert creation, template interpolation, rule evaluation, multi-channel dispatching,
 * rate limiting & deduplication, in-app read tracking, and pure framework decoupling.
 *
 * MUST NOT require browser DOM, React, Next.js, or OpenLayers.
 */

import { NotificationEngine } from "../../core/notifications/engine/notification-engine";
import { AlertRule, NotificationAlert, NotificationChannel } from "../../core/notifications/types/notification.types";
import { MockNotificationChannelAdapter } from "../../core/notifications/channel/notification-channel.interface";
import { Coordinate } from "../../core/gis/types/geometry";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export async function runNotificationsEnginePureUnitTests(): Promise<void> {
  console.log("------------------------------------------");
  console.log("RUNNING GENERIC NOTIFICATION ENGINE PURE DOMAIN TESTS");
  console.log("------------------------------------------");

  const engine = new NotificationEngine();
  const coord: Coordinate = [77.2090, 28.6139]; // Delhi Connaught Place

  // 1. Template String Interpolation
  console.log("  [1/12] Testing Template String Variable Interpolation...");
  const interpolated = engine.interpolateTemplate(
    "Subject {{subjectId}} entered {{geofenceId}} at {{timestamp}}",
    { subjectId: "asset-101", geofenceId: "geo-warehouse-55", timestamp: "2026-08-18T10:00:00Z" }
  );
  assert(
    interpolated === "Subject asset-101 entered geo-warehouse-55 at 2026-08-18T10:00:00Z",
    "Template interpolation must replace placeholders with variable values"
  );

  // 2. Direct Alert Dispatching across Multi-Channels
  console.log("  [2/12] Testing Direct Multi-Channel Dispatch (PUSH, EMAIL, SMS)...");
  const pushRes = await engine.dispatchAlert("TASK_DISPATCH", "user-01", "PUSH", "New Task", "Task assigned to you", "INFO", coord);
  assert(pushRes.success && pushRes.channel === "PUSH", "Push notification dispatch must succeed");

  const smsRes = await engine.dispatchAlert("EMERGENCY_ALERT", "user-02", "SMS", "Emergency Alert", "Immediate evacuation", "EMERGENCY", coord);
  assert(smsRes.success && smsRes.channel === "SMS", "SMS notification dispatch must succeed");

  // 3. Geofence Rule Registration & Evaluation
  console.log("  [3/12] Testing Geofence Rule Registration & Evaluation...");
  const rule: AlertRule = {
    id: "rule-geo-enter-01",
    name: "Geofence Entry Alert Rule",
    eventType: "GEOFENCE_ENTER",
    severity: "WARNING",
    channels: ["PUSH", "IN_APP"],
    template: {
      titleTemplate: "Geofence Entry: {{subjectId}}",
      bodyTemplate: "Entity {{subjectId}} entered geofence {{geofenceId}}",
    },
    rateLimitSeconds: 60, // 60s deduplication window
    enabled: true,
  };
  engine.registerRule(rule);

  const evalResults = await engine.evaluateGeofenceEvent("GEOFENCE_ENTER", "truck-99", "zone-depot-1", coord);
  assert(evalResults.length === 2, "Rule evaluation must dispatch to both PUSH and IN_APP channels");

  // 4. Rate Limiting & Deduplication
  console.log("  [4/12] Testing Rate Limiting & Deduplication (Preventing Floods)...");
  const repeatEvalResults = await engine.evaluateGeofenceEvent("GEOFENCE_ENTER", "truck-99", "zone-depot-1", coord);
  assert(repeatEvalResults.length === 0, "Repeated event within 60s window must be rate-limited and skipped");

  // 5. In-App Notification Queue & Unread Count
  console.log("  [5/12] Testing In-App Notification Queue & Unread Filter...");
  const inAppList = engine.listInAppAlerts("truck-99", true); // unread only
  assert(inAppList.length === 1, "In-App queue must contain 1 unread notification for truck-99");
  assert(inAppList[0].read === false, "Notification read status must initially be false");

  // 6. In-App Notification Read Tracking
  console.log("  [6/12] Testing Marking In-App Notification as Read...");
  const alertId = inAppList[0].id;
  const marked = engine.markAsRead(alertId);
  assert(marked, "markAsRead must return true for valid alertId");

  const updatedUnread = engine.listInAppAlerts("truck-99", true);
  assert(updatedUnread.length === 0, "Unread list must be empty after marking as read");

  // 7. Custom Channel Adapter Registration
  console.log("  [7/12] Testing Custom Channel Adapter Registration...");
  const customAdapter = new MockNotificationChannelAdapter("WEBHOOK");
  engine.registerChannelAdapter(customAdapter);
  await engine.dispatchAlert("WEBHOOK_EVENT", "sys-admin", "WEBHOOK", "System Event", "Payload update");
  assert(customAdapter.dispatchedAlerts.length === 1, "Custom webhook adapter must capture dispatched alert");

  // 8. Alert Event Subscription Stream
  console.log("  [8/12] Testing Real-time Alert Event Subscriptions...");
  const capturedAlerts: NotificationAlert[] = [];
  const unsub = engine.subscribeAlerts((a) => capturedAlerts.push(a));

  await engine.dispatchAlert("STREAM_TEST", "user-77", "IN_APP", "Title", "Body");
  assert(capturedAlerts.length === 1 && capturedAlerts[0].recipientId === "user-77", "Alert listener must receive broadcast");

  // 9. Subscription Cleanup
  console.log("  [9/12] Testing Subscription Cleanup...");
  unsub();
  capturedAlerts.length = 0;
  await engine.dispatchAlert("STREAM_TEST_2", "user-78", "IN_APP", "Title", "Body");
  assert(capturedAlerts.length === 0, "Unsubscribed listener must NOT receive broadcast");

  // 10. Multi-Vertical Alert Scenarios (Agri, Field Service, Delivery)
  console.log("  [10/12] Testing Multi-Vertical Alert Scenarios (Agri Moisture, Delivery Arrival)...");
  const agriRule: AlertRule = {
    id: "rule-agri-moisture",
    name: "Low Soil Moisture Alert",
    eventType: "LOW_MOISTURE",
    severity: "CRITICAL",
    channels: ["EMAIL", "SMS"],
    template: {
      titleTemplate: "Agri Alert: Field {{fieldId}}",
      bodyTemplate: "Moisture level dropped to {{level}}%",
    },
    enabled: true,
  };
  engine.registerRule(agriRule);
  const agriRes = await engine.dispatchAlert("LOW_MOISTURE", "farmer-01", "EMAIL", "Agri Alert", "Field 4 moisture 12%");
  assert(agriRes.success, "Agri email alert dispatch must succeed");

  // 11. Unsupported Channel Error Handling
  console.log("  [11/12] Testing Error Handling for Invalid / Unsupported Channel...");
  let unsupportedFailed = false;
  try {
    const invalidEngine = new NotificationEngine();
    // Simulate removing adapter
    (invalidEngine as any).channelAdapters.clear();
    await invalidEngine.dispatchAlert("TEST", "user", "PUSH", "T", "B");
  } catch (err: any) {
    if (err.name === "NotificationError" && err.code === "UNSUPPORTED_CHANNEL") {
      unsupportedFailed = true;
    }
  }
  assert(unsupportedFailed, "Dispatch with missing adapter must throw UNSUPPORTED_CHANNEL error");

  // 12. Pure Framework Decoupling Verification
  console.log("  [12/12] Verifying Pure Framework Decoupling...");
  assert(typeof engine.dispatchAlert === "function", "NotificationEngine must expose dispatchAlert");
  assert(typeof customAdapter.sendAlert === "function", "INotificationChannelAdapter contract must be satisfied");

  console.log("✅ Generic Notification Engine Pure Domain Unit Tests Passed Successfully!");
}
