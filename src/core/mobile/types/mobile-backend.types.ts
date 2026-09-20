/**
 * GeoSphere Core Mobile Backend Infrastructure — Framework-Independent Domain Models
 *
 * Defines pure TypeScript models for DeviceRegistration, MobileSession, RemoteAppConfig,
 * MobileSyncBatch, OfflineMapPackage, and typed MobileBackendError.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, Android/iOS UI, database ORMs, or vehicle PII.
 */

export interface DeviceRegistration {
  deviceId: string;
  tenantId: string;
  userId: string;
  platform: "ANDROID" | "IOS";
  deviceModel: string;
  osVersion: string;
  appVersion: string;
  pushToken?: string;
  registeredAt: string; // ISO 8601 UTC
}

export interface MobileSession {
  sessionId: string;
  deviceId: string;
  tenantId: string;
  userId: string;
  token: string;
  isActive: boolean;
  createdAt: string; // ISO 8601 UTC
  expiresAt: string; // ISO 8601 UTC
}

export interface RemoteAppConfig {
  configId: string;
  tenantId: string;
  applicationId: string;
  appName: string;
  theme: {
    primaryColor: string;
    accentColor: string;
    darkMode: boolean;
  };
  enabledModules: string[];
  featureFlags: Record<string, boolean>;
  updatedAt: string; // ISO 8601 UTC
}

export interface MobileSyncBatch {
  batchId: string;
  tenantId: string;
  deviceId: string;
  records: Array<{
    id: string;
    entityType: string;
    clientOperationId: string;
    operationType: "CREATE" | "UPDATE" | "DELETE";
    payload: Record<string, unknown>;
  }>;
}

export interface OfflineMapPackage {
  packageId: string;
  regionId: string;
  name: string;
  bounds: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  minZoom: number;
  maxZoom: number;
  downloadUrl: string;
  sizeBytes: number;
  updatedAt: string; // ISO 8601 UTC
}

export type MobileErrorCode =
  | "DEVICE_ALREADY_REGISTERED"
  | "SESSION_EXPIRED"
  | "CONFIG_NOT_FOUND"
  | "SYNC_FAILED"
  | "UNAUTHORIZED_TENANT";

export class MobileBackendError extends Error {
  constructor(
    public readonly code: MobileErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(`[MOBILE_ERROR:${code}] ${message}`);
    this.name = "MobileBackendError";
  }
}
