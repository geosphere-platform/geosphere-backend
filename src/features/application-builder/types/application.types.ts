/**
 * Phase 20 Application Builder & Module Composer Data Contracts
 */

export type ApplicationEnvironment = "DEVELOPMENT" | "STAGING" | "PRODUCTION";
export type ApplicationPlatform = "WEB" | "MOBILE" | "BOTH";
export type ApplicationStatus =
  "DRAFT" | "VALIDATED" | "PUBLISHED" | "SUSPENDED" | "ARCHIVED";

export interface BrandingConfig {
  appTitle: string;
  logoUrl?: string;
  iconUrl?: string;
  primaryColor: string;
  accentColor: string;
  theme?: string;
  darkMode: boolean;
  splashScreenUrl?: string;
  loginBranding?: {
    welcomeTitle?: string;
    subtitle?: string;
    backgroundImageUrl?: string;
  };
  supportInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

export interface MapConfig {
  initialCenter: [number, number];
  zoom: number;
  minZoom: number;
  maxZoom: number;
  vectorTileUrl: string;
  defaultStyle: string;
  bounds?: [number, number, number, number];
  baseMap?: string;
  enabledLayers?: string[];
  layerOrder?: string[];
  clustering?: boolean;
  labels?: boolean;
  selectionBehavior?: string;
  editingBehavior?: string;
}

export interface LayerConfig {
  id: string;
  name: string;
  description?: string;
  geometryType: "Point" | "LineString" | "Polygon" | "MultiPolygon";
  type?: "VECTOR" | "RASTER" | "VECTOR_TILE" | "GEOJSON" | "POSTGIS";
  source?: string;
  enabled: boolean;
  defaultVisibility?: boolean;
  minZoom?: number;
  maxZoom?: number;
  style?: Record<string, any>;
  permissions?: ("VIEW" | "CREATE" | "UPDATE" | "DELETE" | "EXPORT")[];
  queryConfiguration?: Record<string, any>;
  tenantScope?: string;
}

export interface FormFieldConfig {
  id: string;
  label: string;
  type:
    | "TEXT"
    | "NUMBER"
    | "SELECT"
    | "TEXTAREA"
    | "CHECKBOX"
    | "DATE"
    | "GPS"
    | "PHOTO";
  required: boolean;
  options?: string[];
  validation?: Record<string, any>;
}

export interface FormConfig {
  formKey: string;
  title: string;
  description?: string;
  fields: FormFieldConfig[];
}

export interface WorkflowTransition {
  from: string;
  to: string;
  role: string;
  action: string;
  condition?: {
    field?: string;
    operator?: "<" | ">" | "==" | "!=" | "contains";
    value?: any;
  };
}

export interface WorkflowConfig {
  code: string;
  name: string;
  description?: string;
  definition: {
    states: string[];
    initialState: string;
    transitions: WorkflowTransition[];
  };
}

export interface LocationConfig {
  trackingProfile: "HIGH_ACCURACY" | "BALANCED" | "BATTERY_SAVER";
  intervalSeconds: number;
  distanceFilterMeters?: number;
  batchSize: number;
  allowBackgroundTracking?: boolean;
}

export interface OfflineConfig {
  autoDownloadPackages: boolean;
  maxStorageBytes: number;
  syncIntervalSeconds?: number;
}

export interface NotificationRule {
  id: string;
  event:
    | "TASK_ASSIGNED"
    | "TASK_COMPLETED"
    | "TASK_REJECTED"
    | "GEOFENCE_ENTER"
    | "GEOFENCE_EXIT"
    | "SYNC_FAILED";
  channel: "PUSH" | "IN_APP" | "EMAIL";
  template: string;
  enabled: boolean;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: "COUNTER" | "MAP_SUMMARY" | "TASK_LIST" | "ALERT_STREAM" | "CHART";
  gridPosition: { x: number; y: number; w: number; h: number };
  config?: Record<string, any>;
}

export interface ApplicationConfig {
  branding: BrandingConfig;
  modules: string[];
  layers: LayerConfig[];
  mapConfig: MapConfig;
  forms: FormConfig[];
  workflows: WorkflowConfig[];
  featureFlags: Record<string, boolean>;
  permissions: Record<string, string[]>;
  locationConfig: LocationConfig;
  offlineConfig: OfflineConfig;
  notifications: NotificationRule[];
  dashboards: DashboardWidget[];
  reports: string[];
  subscriptionEntitlements?: Record<string, any>;
}

export interface ApplicationModel {
  id: string;
  tenantId: string;
  workspaceId?: string | null;
  name: string;
  code: string;
  description?: string | null;
  environment: ApplicationEnvironment;
  platform: ApplicationPlatform;
  status: ApplicationStatus;
  version: number;
  currentPublishedVersionId?: string | null;
  configuration: ApplicationConfig;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationIssue {
  code: string;
  message: string;
  severity: "ERROR" | "WARNING";
  module?: string;
  field?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}
