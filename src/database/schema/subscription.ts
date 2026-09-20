/**
 * Phase 13 — Subscription, Plans, Feature Entitlements & Usage Management
 *
 * Generic, extensible commercial subscription and entitlement domain schema.
 * Strictly tenant-isolated. No business-specific logic.
 *
 * Architecture:
 *   Organization → Subscription → Plan → PlanFeatures + PlanLimits
 *                                      ↓
 *                             Effective Entitlements
 *                                      ↓
 *                         GIS Core | Realtime | Analytics
 *
 * Design decisions:
 * - isUnlimited: boolean field instead of magic numbers like 999999999.
 *   When isUnlimited=true, limit checks always return ALLOWED.
 * - One active subscription per org enforced via partial unique index.
 * - Historical subscription records are NEVER deleted (audit trail).
 * - Pending invitations do NOT count against MAX_USERS quota.
 * - Downgrade: existing resources are retained; only new creation is blocked.
 *
 * Override priority:
 *   1. Organization Entitlement Override (highest)
 *   2. Subscription Plan limit/feature
 *   3. Default system config (lowest)
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
  bigint,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizationsTable } from "./tenant-saas";
import { usersTable } from "./index";

// ─── Plan Status ─────────────────────────────────────────────────────────────

export const PLAN_STATUS = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;

export type PlanStatus = (typeof PLAN_STATUS)[keyof typeof PLAN_STATUS];

// ─── Feature Category ─────────────────────────────────────────────────────────

export const FEATURE_CATEGORY = {
  CORE: "CORE",
  GIS: "GIS",
  REALTIME: "REALTIME",
  ANALYTICS: "ANALYTICS",
  AUTOMATION: "AUTOMATION",
  API: "API",
  SDK: "SDK",
  ADMIN: "ADMIN",
  EXPORT: "EXPORT",
  INTEGRATION: "INTEGRATION",
} as const;

export type FeatureCategory =
  (typeof FEATURE_CATEGORY)[keyof typeof FEATURE_CATEGORY];

// ─── Feature Status ───────────────────────────────────────────────────────────

export const FEATURE_STATUS = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;

export type FeatureStatus =
  (typeof FEATURE_STATUS)[keyof typeof FEATURE_STATUS];

// ─── Subscription Status ──────────────────────────────────────────────────────

export const SUBSCRIPTION_STATUS = {
  TRIALING: "TRIALING",
  ACTIVE: "ACTIVE",
  PAST_DUE: "PAST_DUE",
  SUSPENDED: "SUSPENDED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

/** Statuses that represent a currently active subscription (access granted) */
export const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  SUBSCRIPTION_STATUS.TRIALING,
  SUBSCRIPTION_STATUS.ACTIVE,
];

// ─── Override Type ────────────────────────────────────────────────────────────

export const OVERRIDE_TYPE = {
  LIMIT: "LIMIT",
  FEATURE_ENABLE: "FEATURE_ENABLE",
  FEATURE_DISABLE: "FEATURE_DISABLE",
} as const;

export type OverrideType = (typeof OVERRIDE_TYPE)[keyof typeof OVERRIDE_TYPE];

// ─── Limit Metric Codes ───────────────────────────────────────────────────────

/**
 * Generic metric codes for plan limits and usage tracking.
 * These are stored in the database — do NOT hard-code business logic around them.
 */
export const LIMIT_METRIC = {
  MAX_USERS: "MAX_USERS",
  MAX_WORKSPACES: "MAX_WORKSPACES",
  MAX_LAYERS: "MAX_LAYERS",
  MAX_SPATIAL_DATASETS: "MAX_SPATIAL_DATASETS",
  MAX_RULES: "MAX_RULES",
  MAX_ALERTS: "MAX_ALERTS",
  MAX_API_REQUESTS: "MAX_API_REQUESTS",
  MAX_SPATIAL_QUERIES: "MAX_SPATIAL_QUERIES",
  MAX_REALTIME_CONNECTIONS: "MAX_REALTIME_CONNECTIONS",
  MAX_STORAGE_BYTES: "MAX_STORAGE_BYTES",
  MAX_FILE_UPLOAD_SIZE: "MAX_FILE_UPLOAD_SIZE",
  MAX_EXPORTS: "MAX_EXPORTS",
  MAX_IMPORTS: "MAX_IMPORTS",
  MAX_MAP_RESOURCES: "MAX_MAP_RESOURCES",
} as const;

export type LimitMetric = (typeof LIMIT_METRIC)[keyof typeof LIMIT_METRIC];

// ─── Feature Codes ────────────────────────────────────────────────────────────

/**
 * Generic commercial feature codes.
 * These are stored in the features table — do NOT hard-code plan logic around them.
 */
export const FEATURE_CODE = {
  GIS_MAP: "GIS_MAP",
  GIS_LAYERS: "GIS_LAYERS",
  SPATIAL_QUERY: "SPATIAL_QUERY",
  SPATIAL_ANALYTICS: "SPATIAL_ANALYTICS",
  REALTIME: "REALTIME",
  RULE_ENGINE: "RULE_ENGINE",
  WORKFLOW_ENGINE: "WORKFLOW_ENGINE",
  ALERTS: "ALERTS",
  DASHBOARDS: "DASHBOARDS",
  API_ACCESS: "API_ACCESS",
  MOBILE_SDK: "MOBILE_SDK",
  WEB_SDK: "WEB_SDK",
  EXPORT: "EXPORT",
  IMPORT: "IMPORT",
  ADVANCED_ANALYTICS: "ADVANCED_ANALYTICS",
} as const;

export type FeatureCode = (typeof FEATURE_CODE)[keyof typeof FEATURE_CODE];

// ─── Usage Metric Codes ───────────────────────────────────────────────────────

export const USAGE_METRIC = {
  USERS: "USERS",
  WORKSPACES: "WORKSPACES",
  LAYERS: "LAYERS",
  DATASETS: "DATASETS",
  RULES: "RULES",
  ALERTS: "ALERTS",
  API_REQUESTS: "API_REQUESTS",
  SPATIAL_QUERIES: "SPATIAL_QUERIES",
  REALTIME_CONNECTIONS: "REALTIME_CONNECTIONS",
  STORAGE_BYTES: "STORAGE_BYTES",
  EXPORTS: "EXPORTS",
  IMPORTS: "IMPORTS",
} as const;

export type UsageMetric = (typeof USAGE_METRIC)[keyof typeof USAGE_METRIC];

// ─────────────────────────────────────────────────────────────────────────────
// TABLES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Plans Table
 *
 * Represents commercial product tiers (FREE, STARTER, PRO, ENTERPRISE).
 * Names/codes are configuration-driven and stored in DB.
 * Do NOT hard-code plan behavior in application logic.
 *
 * Rules:
 * - Plans with ARCHIVED status may not be assigned to new subscriptions.
 * - Plans referenced by subscriptions must NOT be hard-deleted.
 */
export const plansTable = pgTable(
  "plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Unique machine-readable code: FREE, STARTER, PRO, ENTERPRISE */
    code: varchar("code", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 20 })
      .notNull()
      .default(PLAN_STATUS.DRAFT),
    isPublic: boolean("is_public").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    /** Future billing readiness fields */
    monthlyPriceCents: integer("monthly_price_cents"),
    yearlyPriceCents: integer("yearly_price_cents"),
    currency: varchar("currency", { length: 3 }).default("USD"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex("idx_plans_code").on(table.code),
    statusIdx: index("idx_plans_status").on(table.status),
    displayOrderIdx: index("idx_plans_display_order").on(table.displayOrder),
  }),
);

/**
 * Features Table
 *
 * Registry of all commercial capabilities that can be enabled/disabled per plan.
 * Feature codes are unique and stable. Do NOT delete features referenced by plans.
 *
 * Examples: GIS_MAP, REALTIME, ADVANCED_ANALYTICS
 */
export const featuresTable = pgTable(
  "features",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Unique stable machine-readable code: GIS_MAP, REALTIME, etc. */
    code: varchar("code", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 50 })
      .notNull()
      .default(FEATURE_CATEGORY.CORE),
    status: varchar("status", { length: 20 })
      .notNull()
      .default(FEATURE_STATUS.ACTIVE),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex("idx_features_code").on(table.code),
    categoryIdx: index("idx_features_category").on(table.category),
    statusIdx: index("idx_features_status").on(table.status),
  }),
);

/**
 * Plan Features Table
 *
 * Many-to-many relationship between plans and features.
 * Allows enabling/disabling specific features per plan.
 *
 * Example:
 *   FREE → GIS_MAP (enabled)
 *   PRO  → REALTIME (enabled)
 *   PRO  → ADVANCED_ANALYTICS (enabled)
 */
export const planFeaturesTable = pgTable(
  "plan_features",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plansTable.id, { onDelete: "cascade" }),
    featureCode: varchar("feature_code", { length: 100 }).notNull(),
    isEnabled: boolean("is_enabled").notNull().default(true),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    planFeatureUniqueIdx: uniqueIndex("idx_plan_features_plan_feature").on(
      table.planId,
      table.featureCode,
    ),
    planIdx: index("idx_plan_features_plan_id").on(table.planId),
    featureIdx: index("idx_plan_features_feature_code").on(table.featureCode),
  }),
);

/**
 * Plan Limits Table
 *
 * Generic configurable resource limits per plan.
 * Supports numeric limits and explicit unlimited via isUnlimited boolean.
 *
 * IMPORTANT: isUnlimited=true means no limit applies.
 * DO NOT use magic numbers (e.g. 999999999) for unlimited.
 *
 * Examples:
 *   FREE   → MAX_USERS=3, MAX_LAYERS=5
 *   PRO    → MAX_USERS=50, MAX_LAYERS=100
 *   ENTERPRISE → MAX_USERS isUnlimited=true
 */
export const planLimitsTable = pgTable(
  "plan_limits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plansTable.id, { onDelete: "cascade" }),
    /** Generic metric code: MAX_USERS, MAX_LAYERS, etc. */
    metricCode: varchar("metric_code", { length: 100 }).notNull(),
    /**
     * Numeric value of the limit.
     * Ignored when isUnlimited=true.
     * Use bigint for storage bytes.
     */
    numericValue: bigint("numeric_value", { mode: "number" }),
    /**
     * Explicit unlimited flag.
     * When true: limit checks always return ALLOWED.
     * When false: numericValue is the ceiling.
     */
    isUnlimited: boolean("is_unlimited").notNull().default(false),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    planMetricUniqueIdx: uniqueIndex("idx_plan_limits_plan_metric").on(
      table.planId,
      table.metricCode,
    ),
    planIdx: index("idx_plan_limits_plan_id").on(table.planId),
    metricIdx: index("idx_plan_limits_metric_code").on(table.metricCode),
  }),
);

/**
 * Subscriptions Table
 *
 * Links an Organization to a Plan.
 *
 * Rules:
 * - Only ONE subscription per org may be TRIALING or ACTIVE at a time.
 *   Enforced via SQL partial unique index in migration.
 * - Historical records are retained for full audit trail.
 * - SUSPENDED: entitlement checks fail (platform-level block).
 * - EXPIRED: controlled access policy (no data deletion).
 * - Billing fields are prepared for future payment provider integration.
 */
export const subscriptionsTable = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "restrict" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plansTable.id, { onDelete: "restrict" }),
    status: varchar("status", { length: 20 })
      .notNull()
      .default(SUBSCRIPTION_STATUS.ACTIVE),
    startsAt: timestamp("starts_at").notNull(),
    endsAt: timestamp("ends_at"),
    trialEndsAt: timestamp("trial_ends_at"),
    cancelledAt: timestamp("cancelled_at"),

    /** Future billing readiness — no payment provider integrated in Phase 13 */
    billingInterval: varchar("billing_interval", { length: 20 }),
    currency: varchar("currency", { length: 3 }),
    externalCustomerId: varchar("external_customer_id", { length: 255 }),
    externalSubscriptionId: varchar("external_subscription_id", {
      length: 255,
    }),
    billingProvider: varchar("billing_provider", { length: 50 }),

    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("idx_subscriptions_organization_id").on(table.organizationId),
    statusIdx: index("idx_subscriptions_status").on(table.status),
    endsAtIdx: index("idx_subscriptions_ends_at").on(table.endsAt),
    orgStatusIdx: index("idx_subscriptions_org_status").on(
      table.organizationId,
      table.status,
    ),
    // NOTE: Partial unique index (one active/trialing per org) is created
    // in the raw SQL migration because Drizzle doesn't support partial unique indexes.
    // SQL: CREATE UNIQUE INDEX idx_subscriptions_one_active_per_org
    //      ON subscriptions (organization_id)
    //      WHERE status IN ('TRIALING', 'ACTIVE');
  }),
);

/**
 * Organization Entitlement Overrides Table
 *
 * Custom per-organization overrides for limits and features.
 * Used for ENTERPRISE customers with bespoke limits.
 *
 * Override priority:
 *   1. Organization Override (this table) — HIGHEST
 *   2. Subscription Plan limit/feature
 *   3. Default system config — LOWEST
 *
 * Only platform admins may create/modify overrides.
 * Ordinary customer admins may only VIEW their effective entitlements.
 */
export const organizationEntitlementOverridesTable = pgTable(
  "organization_entitlement_overrides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    /**
     * Generic code — either a limit metric (MAX_USERS) or feature code (REALTIME).
     * Combined with overrideType to determine meaning.
     */
    resourceCode: varchar("resource_code", { length: 100 }).notNull(),
    overrideType: varchar("override_type", { length: 30 })
      .notNull()
      .default(OVERRIDE_TYPE.LIMIT),
    /** For LIMIT type: numeric ceiling (ignored if isUnlimited=true) */
    numericValue: bigint("numeric_value", { mode: "number" }),
    /** For LIMIT type: explicit unlimited override */
    isUnlimited: boolean("is_unlimited").notNull().default(false),
    /** For FEATURE_ENABLE / FEATURE_DISABLE type */
    isEnabled: boolean("is_enabled"),
    reason: text("reason"),
    createdBy: uuid("created_by").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("idx_org_ent_overrides_organization").on(
      table.organizationId,
    ),
    orgResourceIdx: uniqueIndex("idx_org_ent_overrides_org_resource").on(
      table.organizationId,
      table.resourceCode,
      table.overrideType,
    ),
  }),
);

/**
 * Usage Records Table
 *
 * Event-based metered usage for resource tracking and billing preparation.
 * Supports current/daily/monthly/lifetime period types.
 *
 * Atomicity: Increments are done at DB level, not read-then-write.
 * Idempotency: idempotencyKey prevents accidental double-counting on retries.
 *
 * Examples:
 *   API_REQUESTS  — monthly metered
 *   SPATIAL_QUERIES — monthly metered
 *   EXPORTS/IMPORTS — monthly metered
 *   USERS/WORKSPACES/LAYERS — derived from source tables (not metered)
 *
 * NOTE: Usage records are NEVER deleted (audit trail for billing).
 */
export const usageRecordsTable = pgTable(
  "usage_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "restrict" }),
    /** Generic metric code: API_REQUESTS, SPATIAL_QUERIES, etc. */
    metricCode: varchar("metric_code", { length: 100 }).notNull(),
    /** The numeric value of this usage event */
    value: bigint("value", { mode: "number" }).notNull().default(1),
    /**
     * Period boundaries for time-bounded metrics.
     * For monthly metrics: first and last day of the month.
     * For lifetime metrics: both null.
     */
    periodStart: timestamp("period_start"),
    periodEnd: timestamp("period_end"),
    /**
     * Idempotency key to prevent duplicate usage recording on retries.
     * Unique constraint prevents double-counting the same event.
     */
    idempotencyKey: varchar("idempotency_key", { length: 255 }).unique(),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgMetricIdx: index("idx_usage_records_org_metric").on(
      table.organizationId,
      table.metricCode,
    ),
    periodIdx: index("idx_usage_records_period").on(
      table.periodStart,
      table.periodEnd,
    ),
    orgMetricPeriodIdx: index("idx_usage_records_org_metric_period").on(
      table.organizationId,
      table.metricCode,
      table.periodStart,
    ),
    idempotencyIdx: uniqueIndex("idx_usage_records_idempotency").on(
      table.idempotencyKey,
    ),
  }),
);

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type PlanRow = typeof plansTable.$inferSelect;
export type NewPlanRow = typeof plansTable.$inferInsert;

export type FeatureRow = typeof featuresTable.$inferSelect;
export type NewFeatureRow = typeof featuresTable.$inferInsert;

export type PlanFeatureRow = typeof planFeaturesTable.$inferSelect;
export type NewPlanFeatureRow = typeof planFeaturesTable.$inferInsert;

export type PlanLimitRow = typeof planLimitsTable.$inferSelect;
export type NewPlanLimitRow = typeof planLimitsTable.$inferInsert;

export type SubscriptionRow = typeof subscriptionsTable.$inferSelect;
export type NewSubscriptionRow = typeof subscriptionsTable.$inferInsert;

export type OrganizationEntitlementOverrideRow =
  typeof organizationEntitlementOverridesTable.$inferSelect;
export type NewOrganizationEntitlementOverrideRow =
  typeof organizationEntitlementOverridesTable.$inferInsert;

export type UsageRecordRow = typeof usageRecordsTable.$inferSelect;
export type NewUsageRecordRow = typeof usageRecordsTable.$inferInsert;
