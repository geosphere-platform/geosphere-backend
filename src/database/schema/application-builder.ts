/**
 * Phase 20 — Customer Application Builder, Data-Driven Business Module Composer & White-Label Configuration
 *
 * Implements tenant-isolated customer application management, module registry, business module definitions,
 * application version snapshots, immutable configuration publishing, rollback history, templates, and dynamic workflows.
 *
 * PostgreSQL + PostGIS with Drizzle ORM.
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

// ─── Application Status & Environment Enums ──────────────────────────────────────────

export const APPLICATION_STATUS = {
  DRAFT: "DRAFT",
  VALIDATED: "VALIDATED",
  PUBLISHED: "PUBLISHED",
  SUSPENDED: "SUSPENDED",
  ARCHIVED: "ARCHIVED",
} as const;

export type ApplicationStatus =
  (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS];

export const APPLICATION_ENVIRONMENT = {
  DEVELOPMENT: "DEVELOPMENT",
  STAGING: "STAGING",
  PRODUCTION: "PRODUCTION",
} as const;

export type ApplicationEnvironment =
  (typeof APPLICATION_ENVIRONMENT)[keyof typeof APPLICATION_ENVIRONMENT];

export const APPLICATION_PLATFORM = {
  WEB: "WEB",
  MOBILE: "MOBILE",
  BOTH: "BOTH",
} as const;

export type ApplicationPlatform =
  (typeof APPLICATION_PLATFORM)[keyof typeof APPLICATION_PLATFORM];

export const MODULE_STATUS = {
  AVAILABLE: "AVAILABLE",
  ENABLED: "ENABLED",
  DISABLED: "DISABLED",
  REQUIRED: "REQUIRED",
  OPTIONAL: "OPTIONAL",
  PREMIUM: "PREMIUM",
} as const;

export type ModuleStatus = (typeof MODULE_STATUS)[keyof typeof MODULE_STATUS];

// ─── Applications Table ──────────────────────────────────────────────────────────

export const applicationsTable = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id").references(() => workspacesTable.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 100 }).notNull(),
    description: text("description"),
    environment: varchar("environment", { length: 30 })
      .notNull()
      .default(APPLICATION_ENVIRONMENT.PRODUCTION),
    platform: varchar("platform", { length: 30 })
      .notNull()
      .default(APPLICATION_PLATFORM.BOTH),
    status: varchar("status", { length: 30 })
      .notNull()
      .default(APPLICATION_STATUS.DRAFT),
    version: integer("version").notNull().default(1),
    currentPublishedVersionId: uuid("current_published_version_id"),

    /** Draft configuration JSON payload */
    configuration: jsonb("configuration")
      .notNull()
      .default({
        branding: {
          appTitle: "Default Application",
          primaryColor: "#0F172A",
          accentColor: "#3B82F6",
          darkMode: true,
        },
        modules: ["MAP", "GIS_LAYERS", "LOCATION", "OFFLINE"],
        layers: [],
        mapConfig: {
          initialCenter: [-74.006, 40.7128],
          zoom: 12,
          minZoom: 2,
          maxZoom: 18,
          vectorTileUrl: "/api/v1/tiles/{layerId}/{z}/{x}/{y}",
          defaultStyle: "DARK_VECTOR",
        },
        forms: [],
        workflows: [],
        featureFlags: {},
        permissions: {},
        locationConfig: {
          trackingProfile: "BALANCED",
          intervalSeconds: 15,
          batchSize: 20,
        },
        offlineConfig: {
          autoDownloadPackages: false,
          maxStorageBytes: 1073741824, // 1 GB
        },
        notifications: [],
        dashboards: [],
        reports: [],
      }),

    createdBy: uuid("created_by").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantCodeUniqueIdx: uniqueIndex("idx_applications_tenant_code").on(
      table.tenantId,
      table.code,
    ),
    tenantIdx: index("idx_applications_tenant").on(table.tenantId),
    statusIdx: index("idx_applications_status").on(table.status),
    envIdx: index("idx_applications_environment").on(table.environment),
  }),
);

// ─── Application Versions Table (Immutable Snapshots & Audit) ──────────────────

export const applicationVersionsTable = pgTable(
  "application_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applicationsTable.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    status: varchar("status", { length: 30 })
      .notNull()
      .default(APPLICATION_STATUS.PUBLISHED),

    /** Immutable configuration snapshot */
    snapshot: jsonb("snapshot").notNull(),
    changeSummary: text("change_summary"),

    publishedBy: uuid("published_by").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    appVersionUniqueIdx: uniqueIndex("idx_app_versions_app_version").on(
      table.applicationId,
      table.version,
    ),
    appIdx: index("idx_app_versions_application").on(table.applicationId),
    tenantIdx: index("idx_app_versions_tenant").on(table.tenantId),
  }),
);

// ─── Application Templates Table ──────────────────────────────────────────────────

export const applicationTemplatesTable = pgTable(
  "application_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }).notNull().default("GENERAL"),
    defaultConfiguration: jsonb("default_configuration").notNull(),
    isPublic: boolean("is_public").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex("idx_app_templates_code").on(table.code),
    categoryIdx: index("idx_app_templates_category").on(table.category),
  }),
);

// ─── Business Modules Registry Table ──────────────────────────────────────────────

export const businessModulesRegistryTable = pgTable(
  "business_modules_registry",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    version: varchar("version", { length: 30 }).notNull().default("1.0.0"),
    dependencies: jsonb("dependencies").notNull().default([]), // e.g. ["MAP", "FORMS"]
    features: jsonb("features").notNull().default([]),
    permissions: jsonb("permissions").notNull().default([]),
    configurationSchema: jsonb("configuration_schema").notNull().default({}),
    status: varchar("status", { length: 30 })
      .notNull()
      .default(MODULE_STATUS.AVAILABLE),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex("idx_modules_registry_code").on(table.code),
    statusIdx: index("idx_modules_registry_status").on(table.status),
  }),
);

// ─── Application Workflows Table ──────────────────────────────────────────────────

export const applicationWorkflowsTable = pgTable(
  "application_workflows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applicationsTable.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    version: integer("version").notNull().default(1),

    /** Workflow definition JSON (states, transitions, roles, conditions, actions) */
    definition: jsonb("definition")
      .notNull()
      .default({
        states: [
          "CREATED",
          "ASSIGNED",
          "IN_PROGRESS",
          "REVIEW",
          "COMPLETED",
          "REJECTED",
        ],
        initialState: "CREATED",
        transitions: [
          {
            from: "CREATED",
            to: "ASSIGNED",
            role: "SUPERVISOR",
            action: "ASSIGN",
          },
          {
            from: "ASSIGNED",
            to: "IN_PROGRESS",
            role: "FIELD_AGENT",
            action: "START",
          },
          {
            from: "IN_PROGRESS",
            to: "REVIEW",
            role: "FIELD_AGENT",
            action: "SUBMIT",
          },
          {
            from: "REVIEW",
            to: "COMPLETED",
            role: "SUPERVISOR",
            action: "APPROVE",
          },
          {
            from: "REVIEW",
            to: "REJECTED",
            role: "SUPERVISOR",
            action: "REJECT",
          },
        ],
      }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    appCodeUniqueIdx: uniqueIndex("idx_app_workflows_app_code").on(
      table.applicationId,
      table.code,
    ),
    appIdx: index("idx_app_workflows_app").on(table.applicationId),
  }),
);

// ─── Inferred Types ───────────────────────────────────────────────────────────────

export type ApplicationRow = typeof applicationsTable.$inferSelect;
export type NewApplicationRow = typeof applicationsTable.$inferInsert;

export type ApplicationVersionRow =
  typeof applicationVersionsTable.$inferSelect;
export type NewApplicationVersionRow =
  typeof applicationVersionsTable.$inferInsert;

export type ApplicationTemplateRow =
  typeof applicationTemplatesTable.$inferSelect;
export type NewApplicationTemplateRow =
  typeof applicationTemplatesTable.$inferInsert;

export type BusinessModuleRegistryRow =
  typeof businessModulesRegistryTable.$inferSelect;
export type NewBusinessModuleRegistryRow =
  typeof businessModulesRegistryTable.$inferInsert;

export type ApplicationWorkflowRow =
  typeof applicationWorkflowsTable.$inferSelect;
export type NewApplicationWorkflowRow =
  typeof applicationWorkflowsTable.$inferInsert;
