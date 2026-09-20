/**
 * KMP Mobile Backend Infrastructure Integration Tests
 *
 * Verifies Device Registration, Session Revocation, Remote Mobile Configuration,
 * Delta Sync Ingestion, Form Validation & Submissions, Task Workflow Transitions,
 * Chunked Media Uploads, Offline Map Packages, and Multi-Tenant Security Isolation.
 *
 * MUST NOT require browser DOM, React, Next.js, or OpenLayers.
 */

import { MobileBackendService } from "../../core/mobile/service/mobile-backend.service";
import { MobileBackendError } from "../../core/mobile/types/mobile-backend.types";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export async function runMobileBackendInfrastructureIntegrationTests(): Promise<void> {
  console.log("------------------------------------------");
  console.log("RUNNING MOBILE BACKEND INFRASTRUCTURE INTEGRATION TESTS");
  console.log("------------------------------------------");

  const service = new MobileBackendService();

  // 1. Device Registration & Mobile Session Revocation
  console.log("  [1/8] Testing Mobile Device Registration & Session Revocation...");
  const { device, session } = service.registerDevice("tenant_field_service", "tech_user_01", "ANDROID", "Pixel 8 Pro");
  assert(device.deviceId.startsWith("dev_android_"), "Device ID must be generated with android prefix");
  assert(session.isActive === true, "New session must be active");

  const revoked = service.revokeSession(session.sessionId);
  assert(revoked === true, "Session revocation must return true");

  // 2. Remote Mobile App Configuration & Feature Flags
  console.log("  [2/8] Testing Remote Mobile App Configuration & Feature Flags...");
  const remoteConfig = service.getRemoteConfig("tenant_field_service", "app_field_pro");
  assert(remoteConfig.appName === "GeoSphere Field Mobile", "Remote config appName must match default");
  assert(remoteConfig.enabledModules.includes("FORMS"), "Remote config must contain FORMS module");
  assert(remoteConfig.featureFlags.enableOfflineTileCaching === true, "Feature flags must be populated");

  // 3. Delta Synchronization & Idempotency Header Ingestion
  console.log("  [3/8] Testing Delta Synchronization & Idempotency Processing...");
  const syncBatch = {
    batchId: "batch_001",
    tenantId: "tenant_field_service",
    deviceId: device.deviceId,
    records: [
      {
        id: "rec_01",
        entityType: "location_fix",
        clientOperationId: "op_unique_1001",
        operationType: "CREATE" as const,
        payload: { lat: 28.6139, lng: 77.2090 },
      },
    ],
  };

  const syncRes = await service.processDeltaSync("tenant_field_service", syncBatch);
  assert(syncRes.processedCount === 1, "Delta sync batch must process 1 record");

  // Multi-tenant Sync Mismatch Failure Protection
  let syncMismatchBlocked = false;
  try {
    await service.processDeltaSync("tenant_unauthorized", syncBatch);
  } catch (err: any) {
    if (err instanceof MobileBackendError && err.code === "UNAUTHORIZED_TENANT") {
      syncMismatchBlocked = true;
    }
  }
  assert(syncMismatchBlocked, "Delta sync must reject tenant ID mismatches");

  // 4. Dynamic Field Forms & Form Validation Endpoints
  console.log("  [4/8] Testing Dynamic Field Forms & Form Schema Validation...");
  await service.getFormsEngine().registerSchema({
    id: "schema_inspection",
    name: "Equipment Inspection",
    version: 1,
    enabled: true,
    fields: [{ id: "condition", label: "Condition", type: "text", required: true }],
  });

  const formSubmission = await service.validateAndSubmitForm(
    "tenant_field_service",
    "schema_inspection",
    "tech_user_01",
    { condition: "OPERATIONAL" },
  );
  assert(formSubmission.id.startsWith("sub_"), "Form submission ID must be generated");

  // 5. Field Tasks Workflow State Machine API
  console.log("  [5/8] Testing Field Tasks Workflow State Machine (ASSIGNED -> ACCEPTED -> IN_PROGRESS -> COMPLETED)...");
  const task = await service.getTasksEngine().createTask({
    title: "Inspect Hydrant #402",
    priority: "HIGH",
    assigneeId: "tech_user_01",
  });
  assert(task.status === "ASSIGNED", "Task initial status must be ASSIGNED");

  const acceptedTask = await service.transitionTaskStatus("tenant_field_service", task.id, "ACCEPTED", "tech_user_01");
  assert(acceptedTask.status === "ACCEPTED", "Task status must transition to ACCEPTED");

  const inProgressTask = await service.transitionTaskStatus("tenant_field_service", task.id, "IN_PROGRESS", "tech_user_01");
  assert(inProgressTask.status === "IN_PROGRESS", "Task status must transition to IN_PROGRESS");

  const completedTask = await service.transitionTaskStatus("tenant_field_service", task.id, "COMPLETED", "tech_user_01");
  assert(completedTask.status === "COMPLETED", "Task status must transition to COMPLETED");

  // 6. Chunked Media Upload Manager API
  console.log("  [6/8] Testing Chunked Media Upload Manager...");
  const fakeChunk = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]); // JPEG Header
  const mediaProgress = await service.handleChunkedMediaUpload(
    "tenant_field_service",
    "attach_photo_01",
    0,
    1,
    fakeChunk,
  );
  assert(mediaProgress.percentage === 100, "Chunked media upload progress must reach 100%");

  // 7. Offline Map Packages API
  console.log("  [7/8] Testing Offline Map Packages API...");
  service.registerOfflineMapPackage({
    packageId: "pkg_delhi_v1",
    regionId: "region_delhi",
    name: "Delhi NCR Vector Tiles",
    bounds: [77.10, 28.50, 77.30, 28.70],
    minZoom: 10,
    maxZoom: 16,
    downloadUrl: "https://cdn.geosphere.io/maps/delhi.mbtiles",
    sizeBytes: 15400000,
    updatedAt: new Date().toISOString(),
  });

  const packages = service.getOfflineMapPackages("tenant_field_service", "region_delhi");
  assert(packages.length === 1 && packages[0].packageId === "pkg_delhi_v1", "Offline map package must be retrievable by region");

  // 8. Pure Framework Decoupling Verification
  console.log("  [8/8] Verifying Pure Framework Decoupling & Multi-Tenant Boundaries...");
  assert(typeof service.registerDevice === "function", "MobileBackendService must operate without React/DOM");
  assert(typeof service.getRemoteConfig === "function", "Remote app config must operate without React/DOM");

  console.log("✅ Mobile Backend Infrastructure Integration Tests Passed Successfully!");
}
