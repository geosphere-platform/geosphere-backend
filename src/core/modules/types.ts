/**
 * Module Architecture — Standard Module Contract & Tenant Module Configuration
 *
 * Standard contract for business modules (Fleet, Assets, Routing, Geofencing, Workforce, etc.).
 */

import { Permission } from "../constants";

export type ModuleCategory =
  | "core"
  | "fleet_logistics"
  | "asset_field"
  | "spatial_analytics"
  | "industry_vertical";

export interface GISModule {
  id: string; // e.g. 'gis-core', 'fleet', 'tracking', 'routing', 'geofence', 'assets', 'workforce'
  name: string;
  version: string;
  description: string;
  category: ModuleCategory;
  isCoreModule?: boolean; // Core modules cannot be disabled
  dependencies: string[]; // IDs of required modules
  permissions: Permission[];
  features: string[]; // Granular feature flag identifiers
  configurationSchema?: Record<string, unknown>;
}

export interface TenantModuleConfig {
  moduleId: string;
  enabled: boolean;
  settings?: Record<string, unknown>;
  enabledFeatures?: string[];
  updatedAt?: string;
}
