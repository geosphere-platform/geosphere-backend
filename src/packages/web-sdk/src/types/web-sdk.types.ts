/**
 * GeoSphere Master Web SDK (@geosphere/web-sdk) — Public Configuration Models
 *
 * Defines pure TypeScript configuration models for initialization, tenant context,
 * engine selection options, and master SDK container interfaces.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, Android/iOS UI, or vehicle PII.
 */

import { TenantContext } from "../../../gis-security/src";

export interface EngineSelectionOptions {
  enableLocation?: boolean;
  enableTracking?: boolean;
  enableGeofencing?: boolean;
  enableRouting?: boolean;
  enableForms?: boolean;
  enableTasks?: boolean;
  enableMedia?: boolean;
  enableNotifications?: boolean;
  enableAnalytics?: boolean;
  enableOffline?: boolean;
  enableSecurity?: boolean;
}

export interface GeoSphereSDKConfig {
  tenantId: string;
  userId: string;
  applicationId?: string;
  apiKey?: string;
  roles?: string[];
  permissions?: any[];
  isSuperAdmin?: boolean;
  engines?: EngineSelectionOptions;
  customMetadata?: Record<string, unknown>;
}

export interface GeoSphereSDKContainer {
  config: GeoSphereSDKConfig;
  tenantContext: TenantContext;
  initializedAt: string; // ISO 8601 UTC
}
