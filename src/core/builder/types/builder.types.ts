/**
 * GeoSphere Core Application Builder — Framework-Independent Domain Models
 *
 * Defines pure TypeScript models for ApplicationConfig, ConfigStatus state machine,
 * ModuleCompositionConfig, ThemeConfig, VersionHistoryEntry, SandboxingGuardResult, and typed errors.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, Android/iOS UI, database ORMs, or vehicle PII.
 */

export type ConfigStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type PlatformEngineType =
  | "MAP"
  | "LOCATION"
  | "TRACKING"
  | "GEOFENCING"
  | "ROUTING"
  | "FORMS"
  | "TASKS"
  | "MEDIA"
  | "NOTIFICATIONS"
  | "ANALYTICS"
  | "OFFLINE"
  | "SECURITY";

export interface ModuleCompositionConfig {
  enabledEngines: PlatformEngineType[];
  engineSettings?: Record<string, Record<string, unknown>>;
}

export interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
  darkMode: boolean;
  logoUrl?: string;
  fontFamily?: string;
}

export interface ApplicationConfig {
  id: string;
  tenantId: string;
  name: string;
  version: number;
  status: ConfigStatus;
  templateId?: string; // Vertical Industry App Template ID
  theme: ThemeConfig;
  modules: ModuleCompositionConfig;
  formSchemas?: Record<string, unknown>[];
  taskWorkflows?: Record<string, unknown>[];
  geofences?: Record<string, unknown>[];
  notificationRules?: Record<string, unknown>[];
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
  publishedAt?: string; // ISO 8601 UTC
}

export interface VersionHistoryEntry {
  versionId: string;
  configId: string;
  version: number;
  snapshot: ApplicationConfig;
  publishedBy: string;
  publishedAt: string; // ISO 8601 UTC
  changeSummary?: string;
}

export interface SandboxingGuardResult {
  valid: boolean;
  violations: string[];
}

export type BuilderErrorCode =
  | "CONFIG_NOT_FOUND"
  | "INVALID_CONFIGURATION"
  | "SANDBOX_VIOLATION"
  | "INVALID_STATE_TRANSITION"
  | "VERSION_NOT_FOUND";

export class BuilderError extends Error {
  constructor(
    public readonly code: BuilderErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(`[BUILDER_ERROR:${code}] ${message}`);
    this.name = "BuilderError";
  }
}
