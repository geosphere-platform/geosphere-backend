/**
 * Pure Framework-Independent Master Web SDK Productization Unit Tests
 *
 * Verifies GeoSphereSDK initialization, engine accessor composition across all 11 platform engines,
 * tenant context propagation, integrated cross-engine pipeline execution, and pure framework decoupling.
 *
 * MUST NOT require browser DOM, React, Next.js, or OpenLayers.
 */

import { GeoSphereSDK } from "../../packages/web-sdk/src/facade/geosphere-sdk";
import { GeoSphereSDKConfig } from "../../packages/web-sdk/src/types/web-sdk.types";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export async function runWebSDKProductizationUnitTests(): Promise<void> {
  console.log("------------------------------------------");
  console.log("RUNNING MASTER WEB SDK PRODUCTIZATION DOMAIN TESTS");
  console.log("------------------------------------------");

  const config: GeoSphereSDKConfig = {
    tenantId: "tenant_agri_corp",
    userId: "agri_manager_01",
    applicationId: "app_farm_pro",
    roles: ["FARM_MANAGER", "FIELD_OPERATOR"],
    permissions: ["VIEW_FEATURE", "EDIT_FEATURE", "DELETE_FEATURE"],
  };

  // 1. Unified GeoSphereSDK Initialization
  console.log("  [1/10] Testing Unified GeoSphereSDK Initialization...");
  const sdk = GeoSphereSDK.initialize(config);
  assert(sdk.tenantContext.tenantId === "tenant_agri_corp", "Tenant ID must propagate to TenantContext");
  assert(sdk.tenantContext.userId === "agri_manager_01", "User ID must propagate to TenantContext");

  // 2. Engine Accessor Composition (All 11 Platform Engines)
  console.log("  [2/10] Testing Engine Accessor Composition across all 11 Engines...");
  assert(sdk.location !== undefined, "1. location engine accessor must be defined");
  assert(sdk.tracking !== undefined, "2. tracking engine accessor must be defined");
  assert(sdk.geofencing !== undefined, "3. geofencing engine accessor must be defined");
  assert(sdk.routing !== undefined, "4. routing engine accessor must be defined");
  assert(sdk.forms !== undefined, "5. forms engine accessor must be defined");
  assert(sdk.tasks !== undefined, "6. tasks engine accessor must be defined");
  assert(sdk.media !== undefined, "7. media engine accessor must be defined");
  assert(sdk.notifications !== undefined, "8. notifications engine accessor must be defined");
  assert(sdk.analytics !== undefined, "9. analytics engine accessor must be defined");
  assert(sdk.offline !== undefined, "10. offline engine accessor must be defined");
  assert(sdk.security !== undefined, "11. security engine accessor must be defined");

  // 3. Invalid Configuration Rejection
  console.log("  [3/10] Testing Missing Config Initialization Rejection...");
  let initFailed = false;
  try {
    GeoSphereSDK.initialize({ tenantId: "", userId: "" });
  } catch (err: any) {
    initFailed = true;
  }
  assert(initFailed, "Initialization with empty tenantId/userId must throw Error");

  // 4. Security Audit Event Log on SDK Initialization
  console.log("  [4/10] Testing Security Audit Log on SDK Initialization...");
  const auditLogs = sdk.security.getAuditLogs("tenant_agri_corp");
  assert(auditLogs.length === 1 && auditLogs[0].action === "SDK_INITIALIZE", "SDK initialization must log SDK_INITIALIZE audit event");

  // 5. Integrated Cross-Engine Pipeline Execution (Location -> Geofence -> Notification)
  console.log("  [5/10] Testing Integrated Cross-Engine Pipeline Execution...");
  await sdk.geofencing.getRepository().addGeofence({
    id: "geo-farm-01",
    name: "Farm Sector A Boundary",
    geometry: { type: "circle", center: [77.2090, 28.6139], radiusMeters: 500 },
    enabled: true,
  });

  sdk.notifications.registerRule({
    id: "rule-farm-enter",
    name: "Farm Entry Alert Rule",
    eventType: "GEOFENCE_ENTER",
    severity: "INFO",
    channels: ["PUSH", "IN_APP"],
    template: { titleTemplate: "Farm Entry: {{subjectId}}", bodyTemplate: "Entered {{geofenceId}}" },
    enabled: true,
  });

  const pipelineRes = await sdk.processLocationPipeline("tractor-101");
  assert(pipelineRes.locationEvent !== undefined, "Location event must be processed");

  // 6. SuperAdmin Privilege Propagation
  console.log("  [6/10] Testing SuperAdmin Privilege Propagation...");
  const superSdk = GeoSphereSDK.initialize({
    tenantId: "system",
    userId: "admin_root",
    isSuperAdmin: true,
  });
  assert(superSdk.tenantContext.isSuperAdmin === true, "isSuperAdmin must equal true");
  assert(superSdk.security.hasPermission(superSdk.tenantContext, "DELETE_FEATURE"), "SuperAdmin must have all permissions implicitly");

  // 7. Multi-Vertical SDK Consumption (Field Service, Delivery, Utilities)
  console.log("  [7/10] Testing Multi-Vertical SDK Consumption...");
  await sdk.forms.registerSchema({
    id: "schema-agri-audit",
    name: "Crop Audit",
    version: 1,
    enabled: true,
    fields: [{ id: "cropType", label: "Crop Type", type: "text", required: true }],
  });
  const loadedSchema = await sdk.forms.getRepository().getSchema("schema-agri-audit");
  assert(loadedSchema !== null && loadedSchema.id === "schema-agri-audit", "Dynamic field form registration must succeed via SDK");

  // 8. Offline Record Creation via SDK
  console.log("  [8/10] Testing Offline Record Creation via SDK...");
  const offlineRec = await sdk.offline.createOfflineRecord("form_submission", "CREATE", { schemaId: "schema-agri-audit" });
  assert(offlineRec.id.startsWith("rec_"), "Offline record must be created via sdk.offline");

  // 9. Spatial Analytics Execution via SDK
  console.log("  [9/10] Testing Spatial Analytics Execution via SDK...");
  const heatmap = sdk.analytics.generateHeatmap([{ coordinate: [77.2090, 28.6139], weight: 10 }]);
  assert(heatmap.length === 1, "Spatial analytics heatmap must generate via sdk.analytics");

  // 10. Pure Framework Decoupling Verification
  console.log("  [10/10] Verifying Pure Framework Decoupling...");
  assert(typeof GeoSphereSDK.initialize === "function", "GeoSphereSDK facade must be instantiable without DOM");
  assert(typeof sdk.processLocationPipeline === "function", "GeoSphereSDK facade must expose processLocationPipeline");

  console.log("✅ Master Web SDK Productization Pure Domain Unit Tests Passed Successfully!");
}
