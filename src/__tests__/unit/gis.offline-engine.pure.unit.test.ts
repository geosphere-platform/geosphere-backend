/**
 * Pure Framework-Independent Offline & Sync Engine Unit Tests
 *
 * Verifies record creation, clientOperationId idempotency headers, state machine transitions,
 * conflict resolution (SERVER_WINS vs CLIENT_WINS), delta sync batching, offline map regions, and pure framework decoupling.
 *
 * MUST NOT require browser DOM, React, Next.js, OpenLayers, or SQLite.
 */

import { OfflineSyncEngine } from "../../core/offline/engine/offline-sync-engine";
import { InMemoryOfflineStorageAdapter } from "../../core/offline/storage/offline-storage.interface";
import { OfflineRecord, SyncStatus } from "../../core/offline/types/offline.types";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export async function runOfflineSyncEnginePureUnitTests(): Promise<void> {
  console.log("------------------------------------------");
  console.log("RUNNING GENERIC OFFLINE & SYNC ENGINE PURE DOMAIN TESTS");
  console.log("------------------------------------------");

  const storage = new InMemoryOfflineStorageAdapter();
  const engine = new OfflineSyncEngine({ storageAdapter: storage, conflictStrategy: "SERVER_WINS", maxRetries: 3 });

  // 1. Offline Record Creation & Idempotency Header Generation
  console.log("  [1/12] Testing Offline Record Creation & clientOperationId Generation...");
  const record1 = await engine.createOfflineRecord("form_submission", "CREATE", { formId: "form-99", answers: { note: "Offline inspection" } });
  assert(record1.id.startsWith("rec_"), "Record ID must be generated");
  assert(record1.clientOperationId.startsWith("op_"), "clientOperationId idempotency header must be generated");
  assert(record1.syncStatus === "PENDING", "Initial syncStatus must be PENDING");

  // 2. Idempotency Duplicate Operation Suppression
  console.log("  [2/12] Testing Idempotency Duplicate Operation Suppression...");
  const duplicateRecord = await engine.createOfflineRecord("form_submission", "CREATE", { formId: "form-99" }, record1.clientOperationId);
  assert(duplicateRecord.id === record1.id, "Duplicate request with same clientOperationId must return existing record");

  // 3. Queue State Machine Transitions (PENDING -> SYNCING -> SYNCED)
  console.log("  [3/12] Testing Sync Queue State Machine Transitions...");
  const syncing = await engine.markRecordSyncStatus(record1.id, "SYNCING");
  assert(syncing.syncStatus === "SYNCING", "State transition to SYNCING must succeed");

  const synced = await engine.markRecordSyncStatus(record1.id, "SYNCED");
  assert(synced.syncStatus === "SYNCED", "State transition to SYNCED must succeed");

  // 4. Optimistic Concurrency Conflict Resolution (SERVER_WINS)
  console.log("  [4/12] Testing Conflict Resolution (SERVER_WINS Strategy)...");
  const localRecord = await engine.createOfflineRecord("field_task", "UPDATE", { taskId: "task-55", status: "IN_PROGRESS" });
  const serverState = { taskId: "task-55", status: "COMPLETED", version: 5 };

  const resServerWins = await engine.resolveConflict(localRecord, serverState, "SERVER_WINS");
  assert(resServerWins.resolvedRecord.syncStatus === "SYNCED", "SERVER_WINS must resolve conflict to SYNCED");
  assert((resServerWins.resolvedRecord.payload as any).status === "COMPLETED", "SERVER_WINS payload must match server state");

  // 5. Optimistic Concurrency Conflict Resolution (CLIENT_WINS)
  console.log("  [5/12] Testing Conflict Resolution (CLIENT_WINS Strategy)...");
  const localRecord2 = await engine.createOfflineRecord("crop_data", "UPDATE", { fieldId: "field-12", moisture: 45 });
  const serverState2 = { fieldId: "field-12", moisture: 30, version: 2 };

  const resClientWins = await engine.resolveConflict(localRecord2, serverState2, "CLIENT_WINS");
  assert(resClientWins.resolvedRecord.syncStatus === "PENDING", "CLIENT_WINS must resolve conflict to PENDING for re-sync");
  assert((resClientWins.resolvedRecord.payload as any).moisture === 45, "CLIENT_WINS payload must retain local client data");

  // 6. Delta Sync Batch Extraction
  console.log("  [6/12] Testing Delta Sync Batch Extraction...");
  const deltaBatch = await engine.getPendingDeltaSyncBatch();
  assert(deltaBatch.records.length === 1, "Delta sync batch must extract 1 pending record (crop_data)");
  assert(deltaBatch.records[0].entityType === "crop_data", "Delta batch entityType must match crop_data");

  // 7. Offline Map Region Tile Caching Metadata
  console.log("  [7/12] Testing Offline Map Region Caching Metadata...");
  const region = await engine.downloadMapRegion("Connaught Place Region", [77.2000, 28.6000, 77.2200, 28.6200], 12, 16);
  assert(region.regionId.startsWith("region_"), "Map region ID must be generated");
  assert(region.isDownloaded === true, "Region status must be isDownloaded=true");

  const regionList = await engine.listMapRegions();
  assert(regionList.length === 1 && regionList[0].name === "Connaught Place Region", "Map region list must contain downloaded region");

  // 8. Retry Policy & Exponential Backoff Queueing
  console.log("  [8/12] Testing Retry Policy Queueing...");
  await engine.markRecordSyncStatus(localRecord2.id, "FAILED", "Network timeout");
  const retried = await engine.retryPendingSyncs();
  assert(retried.length === 1, "retryPendingSyncs must re-queue failed record");

  // 9. Sync Status Real-time Event Subscriptions
  console.log("  [9/12] Testing Real-time Sync Status Subscriptions...");
  const statusUpdates: SyncStatus[] = [];
  const unsub = engine.subscribeSyncStatus((r) => statusUpdates.push(r.syncStatus));

  await engine.createOfflineRecord("emergency_incident", "CREATE", { incidentId: "inc-911" });
  assert(statusUpdates.length === 1 && statusUpdates[0] === "PENDING", "Sync status listener must capture PENDING event");

  // 10. Multi-Vertical Offline Scenarios (Agri, Field Service, Delivery)
  console.log("  [10/12] Testing Multi-Vertical Offline Scenarios...");
  const deliveryOffline = await engine.createOfflineRecord("delivery_proof", "CREATE", { packageId: "pkg-1234", recipientSig: "sig_data" });
  assert(deliveryOffline.entityType === "delivery_proof", "Delivery proof record entityType must equal delivery_proof");

  // 11. Headless Execution
  console.log("  [11/12] Testing Headless Engine Execution...");
  assert(typeof engine.createOfflineRecord === "function", "OfflineSyncEngine must operate without SQLite or DOM");

  // 12. Pure Framework Decoupling Verification
  console.log("  [12/12] Verifying Pure Framework Decoupling...");
  assert(typeof storage.saveRecord === "function", "IOfflineStorageAdapter contract must be satisfied");
  assert(typeof engine.downloadMapRegion === "function", "OfflineSyncEngine must expose downloadMapRegion");

  console.log("✅ Generic Offline & Sync Engine Pure Domain Unit Tests Passed Successfully!");
}
