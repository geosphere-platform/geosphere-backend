/**
 * Global GIS and Platform Constants
 */

export const GIS_CONSTANTS = {
  // Projections
  PROJECTION_WGS84: "EPSG:4326", // Geographic coordinates (lat/lon)
  PROJECTION_MERCATOR: "EPSG:3857", // Web mercator meters (OpenLayers default)

  // Default values
  DEFAULT_CENTER_LON: 0,
  DEFAULT_CENTER_LAT: 0,
  DEFAULT_ZOOM: 2,

  // Speed and thresholds
  STATIONARY_SPEED_THRESHOLD_KMH: 0.5,
  OVERSPEED_THRESHOLD_KMH: 120,
} as const;

// ─── RBAC: Platform & Tenant Roles ───────────────────────────────────────────

export const USER_ROLES = {
  PLATFORM_ADMIN: "PLATFORM_ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN", // Legacy alias for PLATFORM_ADMIN
  TENANT_OWNER: "TENANT_OWNER",
  TENANT_ADMIN: "TENANT_ADMIN",
  ORG_ADMIN: "ORG_ADMIN", // Legacy alias for TENANT_ADMIN
  MANAGER: "MANAGER",
  OPERATOR: "OPERATOR",
  DISPATCHER: "DISPATCHER",
  FIELD_AGENT: "FIELD_AGENT",
  DRIVER: "DRIVER",
  VIEWER: "VIEWER",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// ─── RBAC: Permissions ───────────────────────────────────────────────────────

export const PERMISSIONS = {
  // Platform & Tenant Administration
  TENANT_MANAGE: "tenant:manage",
  MODULE_MANAGE: "module:manage",
  ORGANIZATION_MANAGE: "organization:manage",

  // Identity & User Management
  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",

  // Business-Agnostic GIS Core & Real-Time Engine
  GIS_MAP_READ: "gis:map:read",
  GIS_FEATURE_READ: "gis:feature:read",
  GIS_FEATURE_CREATE: "gis:feature:create",
  GIS_FEATURE_UPDATE: "gis:feature:update",
  GIS_FEATURE_DELETE: "gis:feature:delete",
  GIS_SPATIAL_READ: "gis:spatial:read",
  GIS_SPATIAL_OPERATE: "gis:spatial:operate",
  GIS_LOCATION_READ: "gis:location:read",
  GIS_LOCATION_INGEST: "gis:location:ingest",
  GIS_LOCATION_HISTORY: "gis:location:history",
  GIS_REALTIME_SUBSCRIBE: "gis:realtime:subscribe",
  GIS_EVENT_READ: "gis:event:read",

  // Business Module: Fleet Management (legacy + module)
  VEHICLE_CREATE: "vehicle:create",
  VEHICLE_READ: "vehicle:read",
  VEHICLE_UPDATE: "vehicle:update",
  VEHICLE_DELETE: "vehicle:delete",

  // Business Module: Real-Time Tracking & Telemetry
  TRACKING_READ_LIVE: "tracking:read_live",
  TRACKING_READ_HISTORY: "tracking:read_history",
  TRACKING_UPDATE_OWN: "tracking:update_own",
  TRACKING_LOCATION_READ: "tracking:location:read",

  // Business Module: Routing & Trips
  ROUTING_CALCULATE: "routing:calculate",
  TRIP_READ: "trip:read",

  // Business Module: Geofencing
  GEOFENCE_READ: "geofence:read",
  GEOFENCE_CREATE: "geofence:create",
  GEOFENCE_UPDATE: "geofence:update",
  GEOFENCE_DELETE: "geofence:delete",
  GEOFENCE_EVALUATE: "geofence:evaluate",
  GEOFENCE_MANAGE: "geofence:manage",

  // Reports & Analytics
  REPORTS_READ: "reports:read",

  // Audit Logs
  AUDIT_READ: "audit:read",

  // Phase 10 — GIS Query, Search & Spatial Analytics Engine
  GIS_QUERY_READ: "gis:query:read", // Basic spatial queries (bbox, radius, polygon)
  GIS_QUERY_ADVANCED: "gis:query:advanced", // Advanced queries (nearest, combined, viewport)
  GIS_ANALYTICS_READ: "gis:analytics:read", // Aggregation & analytics queries
  GIS_HISTORY_READ: "gis:history:read", // Historical location & track queries
  GIS_EVENTS_ANALYTICS: "gis:events:analytics", // Event analytics & geofence analytics

  // Phase 11 — Generic GIS Rules, Automation & Workflow Engine
  GIS_RULES_READ: "gis:rules:read",
  GIS_RULES_CREATE: "gis:rules:create",
  GIS_RULES_UPDATE: "gis:rules:update",
  GIS_RULES_ACTIVATE: "gis:rules:activate",
  GIS_RULES_EXECUTE: "gis:rules:execute",
  GIS_RULES_DELETE: "gis:rules:delete",
  GIS_ALERTS_READ: "gis:alerts:read",
  GIS_ALERTS_UPDATE: "gis:alerts:update",
  GIS_TASKS_READ: "gis:tasks:read",
  GIS_TASKS_CREATE: "gis:tasks:create",
  GIS_TASKS_UPDATE: "gis:tasks:update",

  // Phase 12 — Multi-Tenant SaaS Organization & Workspace Management
  ORGANIZATION_READ: "organization:read",
  ORGANIZATION_UPDATE: "organization:update",
  ORGANIZATION_MEMBERS_READ: "organization:members:read",
  ORGANIZATION_MEMBERS_INVITE: "organization:members:invite",
  ORGANIZATION_MEMBERS_UPDATE: "organization:members:update",
  ORGANIZATION_MEMBERS_REMOVE: "organization:members:remove",
  WORKSPACE_READ: "workspace:read",
  WORKSPACE_CREATE: "workspace:create",
  WORKSPACE_UPDATE: "workspace:update",
  WORKSPACE_ARCHIVE: "workspace:archive",

  // Phase 13 — Subscription, Plans, Feature Entitlements & Usage Management
  SUBSCRIPTION_READ: "subscription:read", // View own subscription/plan
  SUBSCRIPTION_MANAGE: "subscription:manage", // Platform admin: assign/change/suspend plans
  PLAN_READ: "plan:read", // View available plans
  PLAN_MANAGE: "plan:manage", // Platform admin: create/edit/archive plans
  ENTITLEMENT_READ: "entitlement:read", // View own effective entitlements
  USAGE_READ: "usage:read", // View own usage metrics
  OVERRIDE_MANAGE: "override:manage", // Platform admin: manage org overrides
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ─── Auth Constants ───────────────────────────────────────────────────────────

export const AUTH_CONSTANTS = {
  // Token lifetimes
  ACCESS_TOKEN_EXPIRES_IN: "15m",
  REFRESH_TOKEN_EXPIRES_IN: "7d",
  REFRESH_TOKEN_EXPIRES_MS: 7 * 24 * 60 * 60 * 1000, // 7 days in ms

  // Verification / reset token lifetimes
  EMAIL_VERIFY_TOKEN_EXPIRES_MS: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_RESET_TOKEN_EXPIRES_MS: 60 * 60 * 1000, // 1 hour

  // Security
  BCRYPT_COST_FACTOR: 12,
  MAX_FAILED_LOGIN_ATTEMPTS: 5,
  ACCOUNT_LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes

  // Cookie
  REFRESH_TOKEN_COOKIE_NAME: "gis_refresh_token",
} as const;

// ─── HTTP Status ──────────────────────────────────────────────────────────────

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;
