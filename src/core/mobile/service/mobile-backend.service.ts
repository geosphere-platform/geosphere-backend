/**
 * Framework-Independent MobileBackendService Class
 *
 * Provides device registration, session revocation, remote mobile app configuration,
 * idempotent delta sync processing, dynamic field forms validation, field task workflows,
 * chunked media uploads, and offline map package management.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, Android/iOS UI, or vehicle PII.
 */

import {
  DeviceRegistration,
  MobileSession,
  RemoteAppConfig,
  MobileSyncBatch,
  OfflineMapPackage,
  MobileBackendError,
} from "../types/mobile-backend.types";
import { FormsEngine } from "../../forms/engine/forms-engine";
import { TasksEngine } from "../../tasks/engine/tasks-engine";
import { MediaEngine } from "../../media/engine/media-engine";
import { OfflineSyncEngine } from "../../offline/engine/offline-sync-engine";
import { TaskStatus } from "../../tasks/types/task.types";

export class MobileBackendService {
  private readonly devices = new Map<string, DeviceRegistration>();
  private readonly sessions = new Map<string, MobileSession>();
  private readonly configs = new Map<string, RemoteAppConfig>();
  private readonly mapPackages = new Map<string, OfflineMapPackage>();

  private readonly formsEngine: FormsEngine;
  private readonly tasksEngine: TasksEngine;
  private readonly mediaEngine: MediaEngine;
  private readonly offlineSyncEngine: OfflineSyncEngine;

  constructor() {
    this.formsEngine = new FormsEngine();
    this.tasksEngine = new TasksEngine();
    this.mediaEngine = new MediaEngine();
    this.offlineSyncEngine = new OfflineSyncEngine();
  }

  public getFormsEngine(): FormsEngine {
    return this.formsEngine;
  }

  public getTasksEngine(): TasksEngine {
    return this.tasksEngine;
  }

  public getMediaEngine(): MediaEngine {
    return this.mediaEngine;
  }

  public getOfflineSyncEngine(): OfflineSyncEngine {
    return this.offlineSyncEngine;
  }

  /**
   * 1. Register Mobile Device & Create Mobile Session
   */
  public registerDevice(
    tenantId: string,
    userId: string,
    platform: "ANDROID" | "IOS",
    deviceModel: string,
    osVersion: string = "14.0",
    appVersion: string = "1.0.0",
  ): { device: DeviceRegistration; session: MobileSession } {
    const deviceId = `dev_${platform.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const token = `mobsess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    const device: DeviceRegistration = {
      deviceId,
      tenantId,
      userId,
      platform,
      deviceModel,
      osVersion,
      appVersion,
      registeredAt: now.toISOString(),
    };

    const session: MobileSession = {
      sessionId,
      deviceId,
      tenantId,
      userId,
      token,
      isActive: true,
      createdAt: now.toISOString(),
      expiresAt,
    };

    this.devices.set(deviceId, device);
    this.sessions.set(sessionId, session);
    return { device, session };
  }

  /**
   * Revoke Mobile Session
   */
  public revokeSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.isActive = false;
    return true;
  }

  /**
   * 2. Remote Mobile App Configuration & Feature Flags
   */
  public getRemoteConfig(tenantId: string, applicationId: string = "app_default"): RemoteAppConfig {
    const key = `${tenantId}:${applicationId}`;
    const existing = this.configs.get(key);
    if (existing) return { ...existing };

    const config: RemoteAppConfig = {
      configId: `cfg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenantId,
      applicationId,
      appName: "GeoSphere Field Mobile",
      theme: { primaryColor: "#1E293B", accentColor: "#10B981", darkMode: true },
      enabledModules: ["MAP", "LOCATION", "OFFLINE", "SYNC", "FORMS", "TASKS", "MEDIA"],
      featureFlags: { enableOfflineTileCaching: true, enableHighAccuracyTracking: true },
      updatedAt: new Date().toISOString(),
    };

    this.configs.set(key, config);
    return config;
  }

  /**
   * 3. Delta Synchronization & Idempotency Processing
   */
  public async processDeltaSync(tenantId: string, syncBatch: MobileSyncBatch): Promise<{ processedCount: number; errors: string[] }> {
    if (syncBatch.tenantId !== tenantId) {
      throw new MobileBackendError("UNAUTHORIZED_TENANT", `Tenant mismatch in sync batch for tenant '${tenantId}'`);
    }

    let processedCount = 0;
    const errors: string[] = [];

    for (const rec of syncBatch.records) {
      try {
        await this.offlineSyncEngine.createOfflineRecord(
          rec.entityType,
          rec.operationType,
          rec.payload,
          rec.clientOperationId,
        );
        processedCount++;
      } catch (err: any) {
        errors.push(`Record ${rec.id} failed: ${err.message}`);
      }
    }

    return { processedCount, errors };
  }

  /**
   * 4. Dynamic Field Forms & Form Schema Validation Endpoints
   */
  public async validateAndSubmitForm(
    tenantId: string,
    schemaId: string,
    submitterId: string,
    values: Record<string, unknown>,
  ) {
    const valRes = await this.formsEngine.validateSubmission(schemaId, values);
    if (!valRes.valid) {
      throw new MobileBackendError("SYNC_FAILED", `Form validation failed for schema '${schemaId}'`, { errors: valRes.errors });
    }

    return await this.formsEngine.submitForm(schemaId, submitterId, values);
  }

  /**
   * 5. Field Tasks Workflow State Machine API
   */
  public async transitionTaskStatus(
    tenantId: string,
    taskId: string,
    newStatus: TaskStatus,
    executorId: string = "system",
  ) {
    return await this.tasksEngine.transitionTask(taskId, newStatus, executorId);
  }

  /**
   * 6. Chunked Media Upload Manager API
   */
  public async handleChunkedMediaUpload(
    tenantId: string,
    attachmentId: string,
    chunkIndex: number,
    totalChunks: number,
    bufferInput: Uint8Array | Buffer,
  ) {
    const buf = Buffer.isBuffer(bufferInput) ? bufferInput : Buffer.from(bufferInput);
    const session = await this.mediaEngine.initiateChunkedUpload(`media_${attachmentId}.jpg`, buf.length * totalChunks);
    return await this.mediaEngine.uploadChunk(session.sessionId, chunkIndex, buf);
  }

  /**
   * 7. Offline Map Region Packages API
   */
  public registerOfflineMapPackage(pkg: OfflineMapPackage): OfflineMapPackage {
    this.mapPackages.set(pkg.packageId, { ...pkg });
    return pkg;
  }

  public getOfflineMapPackages(tenantId: string, regionId?: string): OfflineMapPackage[] {
    const list = Array.from(this.mapPackages.values());
    if (!regionId) return list.map((p) => ({ ...p }));
    return list.filter((p) => p.regionId === regionId).map((p) => ({ ...p }));
  }
}
