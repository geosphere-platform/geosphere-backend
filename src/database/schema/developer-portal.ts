/**
 * Phase 15 — Developer Portal, Application Registration, API Keys, SDK Client Management & License Foundation
 *
 * PostgreSQL + PostGIS with Drizzle ORM.
 * Strictly tenant-isolated. Multi-application architecture per organization.
 */

import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  uuid,
  jsonb,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizationsTable, workspacesTable } from "./tenant-saas";
import { usersTable } from "./index";

// ─── Application Type Enum ───────────────────────────────────────────────────

export const APPLICATION_TYPE = {
  WEB: "WEB",
  MOBILE: "MOBILE",
  SERVER: "SERVER",
  DESKTOP: "DESKTOP",
  OTHER: "OTHER",
} as const;

export type ApplicationType =
  (typeof APPLICATION_TYPE)[keyof typeof APPLICATION_TYPE];

// ─── Application Status Enum ─────────────────────────────────────────────────

export const APPLICATION_STATUS = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  REVOKED: "REVOKED",
  ARCHIVED: "ARCHIVED",
} as const;

export type ApplicationStatus =
  (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS];

// ─── Application Environment Enum ───────────────────────────────────────────

export const APPLICATION_ENVIRONMENT = {
  DEVELOPMENT: "DEVELOPMENT",
  STAGING: "STAGING",
  PRODUCTION: "PRODUCTION",
} as const;

export type ApplicationEnvironment =
  (typeof APPLICATION_ENVIRONMENT)[keyof typeof APPLICATION_ENVIRONMENT];

// ─── API Key Status Enum ──────────────────────────────────────────────────────

export const API_KEY_STATUS = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  REVOKED: "REVOKED",
} as const;

export type ApiKeyStatus = (typeof API_KEY_STATUS)[keyof typeof API_KEY_STATUS];

// ─── License Status Enum ──────────────────────────────────────────────────────

export const LICENSE_STATUS = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  REVOKED: "REVOKED",
  SUSPENDED: "SUSPENDED",
} as const;

export type LicenseStatus =
  (typeof LICENSE_STATUS)[keyof typeof LICENSE_STATUS];

// ─── Standard API Scopes ──────────────────────────────────────────────────────

export const API_SCOPE = {
  GIS_READ: "gis:read",
  GIS_WRITE: "gis:write",
  LAYERS_READ: "layers:read",
  LAYERS_WRITE: "layers:write",
  TRACKING_READ: "tracking:read",
  TRACKING_WRITE: "tracking:write",
  GEOFENCE_READ: "geofence:read",
  GEOFENCE_WRITE: "geofence:write",
  ANALYTICS_READ: "analytics:read",
  REALTIME_CONNECT: "realtime:connect",
} as const;

export type ApiScope = (typeof API_SCOPE)[keyof typeof API_SCOPE];

// ─────────────────────────────────────────────────────────────────────────────
// TABLES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Applications Table
 *
 * Represents an organization's software application that consumes the GIS Platform.
 * Supports organization-level or workspace-restricted applications.
 */
export const applicationsTable = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id").references(() => workspacesTable.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    description: text("description"),
    type: varchar("type", { length: 50 })
      .notNull()
      .default(APPLICATION_TYPE.WEB),
    status: varchar("status", { length: 20 })
      .notNull()
      .default(APPLICATION_STATUS.ACTIVE),
    environment: varchar("environment", { length: 20 })
      .notNull()
      .default(APPLICATION_ENVIRONMENT.DEVELOPMENT),
    /** Public client identifier (safe for browser / mobile SDK config) */
    clientId: varchar("client_id", { length: 100 }).notNull().unique(),
    /** Secure hash of client secret — only used for confidential server clients */
    clientSecretHash: text("client_secret_hash"),
    /** Allowed Origins for WEB applications (CORS check) */
    allowedOrigins: jsonb("allowed_origins").notNull().default([]),
    createdBy: uuid("created_by").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgSlugUniqueIdx: uniqueIndex("idx_applications_org_slug").on(
      table.organizationId,
      table.slug,
    ),
    orgIdx: index("idx_applications_organization").on(table.organizationId),
    workspaceIdx: index("idx_applications_workspace").on(table.workspaceId),
    statusIdx: index("idx_applications_status").on(table.status),
    envIdx: index("idx_applications_environment").on(table.environment),
    clientIdIdx: uniqueIndex("idx_applications_client_id").on(table.clientId),
  }),
);

/**
 * API Keys Table
 *
 * Stores API key metadata, non-secret prefix, and cryptographic hash of secrets.
 * RAW Secrets are NEVER stored in this table.
 */
export const apiKeysTable = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applicationsTable.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id").references(() => workspacesTable.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    /** Public key identifier */
    keyId: varchar("key_id", { length: 100 }).notNull().unique(),
    /** Non-secret prefix for audit identification e.g. gsk_live_abc123 */
    prefix: varchar("prefix", { length: 30 }).notNull(),
    /** SHA-256 hash of the full secret key */
    hash: text("hash").notNull(),
    environment: varchar("environment", { length: 20 })
      .notNull()
      .default(APPLICATION_ENVIRONMENT.DEVELOPMENT),
    status: varchar("status", { length: 20 })
      .notNull()
      .default(API_KEY_STATUS.ACTIVE),
    expiresAt: timestamp("expires_at"),
    lastUsedAt: timestamp("last_used_at"),
    revokedAt: timestamp("revoked_at"),
    createdBy: uuid("created_by").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    appIdx: index("idx_api_keys_application").on(table.applicationId),
    orgIdx: index("idx_api_keys_organization").on(table.organizationId),
    prefixIdx: index("idx_api_keys_prefix").on(table.prefix),
    keyIdIdx: uniqueIndex("idx_api_keys_key_id").on(table.keyId),
    hashIdx: index("idx_api_keys_hash").on(table.hash),
    statusIdx: index("idx_api_keys_status").on(table.status),
    expiresIdx: index("idx_api_keys_expires").on(table.expiresAt),
  }),
);

/**
 * API Scopes Registry Table
 */
export const scopesTable = pgTable(
  "api_scopes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 50 }).notNull().default("GIS"),
    status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex("idx_api_scopes_code").on(table.code),
    categoryIdx: index("idx_api_scopes_category").on(table.category),
  }),
);

/**
 * Application Granted Scopes Table
 */
export const applicationScopesTable = pgTable(
  "application_scopes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applicationsTable.id, { onDelete: "cascade" }),
    scopeCode: varchar("scope_code", { length: 100 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    appScopeUniqueIdx: uniqueIndex("idx_app_scopes_app_scope").on(
      table.applicationId,
      table.scopeCode,
    ),
    appIdx: index("idx_app_scopes_application").on(table.applicationId),
  }),
);

/**
 * Commercial Software Licenses Table (Foundation for future SDK/Package Licensing)
 */
export const licensesTable = pgTable(
  "licenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    applicationId: uuid("application_id").references(
      () => applicationsTable.id,
      { onDelete: "set null" },
    ),
    licenseKey: varchar("license_key", { length: 255 }).notNull().unique(),
    productName: varchar("product_name", { length: 100 }).notNull(),
    status: varchar("status", { length: 20 })
      .notNull()
      .default(LICENSE_STATUS.ACTIVE),
    maxSeats: integer("max_seats"),
    expiresAt: timestamp("expires_at"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("idx_licenses_organization").on(table.organizationId),
    licenseKeyIdx: uniqueIndex("idx_licenses_key").on(table.licenseKey),
    statusIdx: index("idx_licenses_status").on(table.status),
  }),
);

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type ApplicationRow = typeof applicationsTable.$inferSelect;
export type NewApplicationRow = typeof applicationsTable.$inferInsert;

export type ApiKeyRow = typeof apiKeysTable.$inferSelect;
export type NewApiKeyRow = typeof apiKeysTable.$inferInsert;

export type ScopeRow = typeof scopesTable.$inferSelect;
export type NewScopeRow = typeof scopesTable.$inferInsert;

export type ApplicationScopeRow = typeof applicationScopesTable.$inferSelect;
export type NewApplicationScopeRow = typeof applicationScopesTable.$inferInsert;

export type LicenseRow = typeof licensesTable.$inferSelect;
export type NewLicenseRow = typeof licensesTable.$inferInsert;
