/**
 * Business-Agnostic Generic GIS Rules, Automation & Workflow Engine Schemas — PostgreSQL + PostGIS
 *
 * Defines schemas for spatial rules, rule versions, rule execution history,
 * action job retries, alerts, and workflow tasks.
 * Strictly multi-tenant and business-agnostic.
 */

import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  jsonb,
  integer,
  text,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { postgisGeometry } from "./spatial-features";

/**
 * Generic Spatial Rules
 */
export const gisRulesTable = pgTable(
  "gis_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 20 }).notNull().default("DRAFT"), // DRAFT, ACTIVE, INACTIVE, ARCHIVED
    priority: integer("priority").notNull().default(1), // 1 is high priority
    triggerType: varchar("trigger_type", { length: 50 }).notNull(), // LOCATION_UPDATED, SPATIAL_ENTER, SPATIAL_EXIT, SPATIAL_PROXIMITY_ENTER, SPATIAL_PROXIMITY_EXIT, SPATIAL_EVENT, SCHEDULED, MANUAL
    scope: jsonb("scope").notNull().default({}), // { layerId?, geofenceId?, subjectType?, subjectId? }
    currentVersion: integer("current_version").notNull().default(1),
    executionPolicy: varchar("execution_policy", { length: 30 })
      .notNull()
      .default("ALLOW_CONCURRENT"), // ALLOW_CONCURRENT, DISALLOW_CONCURRENT, COALESCE, SKIP_IF_RUNNING
    cooldownSeconds: integer("cooldown_seconds").notNull().default(0),
    debounceSeconds: integer("debounce_seconds").notNull().default(0),
    actionFailurePolicy: varchar("action_failure_policy", { length: 30 })
      .notNull()
      .default("STOP_ON_FAILURE"), // STOP_ON_FAILURE, CONTINUE_ON_FAILURE
    maxRetries: integer("max_retries").notNull().default(3),
    scheduleCron: varchar("schedule_cron", { length: 50 }),
    nextScheduledAt: timestamp("next_scheduled_at"),
    lastExecutedAt: timestamp("last_executed_at"),
    createdBy: uuid("created_by"),
    updatedBy: uuid("updated_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantStatusIdx: index("idx_gis_rules_tenant_status").on(
      table.tenantId,
      table.status,
    ),
    tenantPriorityIdx: index("idx_gis_rules_tenant_priority").on(
      table.tenantId,
      table.priority,
    ),
    tenantTriggerIdx: index("idx_gis_rules_tenant_trigger").on(
      table.tenantId,
      table.triggerType,
      table.status,
    ),
    scheduledIdx: index("idx_gis_rules_scheduled").on(
      table.status,
      table.nextScheduledAt,
    ),
  }),
);

/**
 * Immutable Rule Version Configuration Snapshots
 */
export const gisRuleVersionsTable = pgTable(
  "gis_rule_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ruleId: uuid("rule_id")
      .notNull()
      .references(() => gisRulesTable.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id").notNull(),
    version: integer("version").notNull(),
    configuration: jsonb("configuration").notNull(), // { trigger, conditions, actions, executionPolicy, scope }
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    ruleVersionUniqueIdx: uniqueIndex("idx_gis_rule_versions_rule_ver").on(
      table.ruleId,
      table.version,
    ),
    tenantRuleIdx: index("idx_gis_rule_versions_tenant_rule").on(
      table.tenantId,
      table.ruleId,
    ),
  }),
);

/**
 * Rule Execution Audit History
 */
export const gisRuleExecutionsTable = pgTable(
  "gis_rule_executions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    ruleId: uuid("rule_id")
      .notNull()
      .references(() => gisRulesTable.id, { onDelete: "cascade" }),
    ruleVersion: integer("rule_version").notNull(),
    triggerType: varchar("trigger_type", { length: 50 }).notNull(),
    triggerEventId: varchar("trigger_event_id", { length: 100 }).notNull(),
    subjectId: uuid("subject_id"),
    status: varchar("status", { length: 20 }).notNull().default("PENDING"), // PENDING, RUNNING, SUCCESS, FAILED, SKIPPED
    parentExecutionId: uuid("parent_execution_id"),
    automationDepth: integer("automation_depth").notNull().default(0),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    error: text("error"),
    metadata: jsonb("metadata").notNull().default({}),
  },
  (table) => ({
    idempotencyUniqueIdx: uniqueIndex("idx_gis_rule_executions_idempotency").on(
      table.tenantId,
      table.ruleId,
      table.ruleVersion,
      table.triggerEventId,
    ),
    tenantRuleIdx: index("idx_gis_rule_executions_tenant_rule").on(
      table.tenantId,
      table.ruleId,
    ),
    tenantStatusIdx: index("idx_gis_rule_executions_tenant_status").on(
      table.tenantId,
      table.status,
    ),
    tenantCreatedIdx: index("idx_gis_rule_executions_tenant_created").on(
      table.tenantId,
      table.startedAt,
    ),
  }),
);

/**
 * Asynchronous Action Job Queue & Retry Tracking
 */
export const gisActionJobsTable = pgTable(
  "gis_action_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    executionId: uuid("execution_id")
      .notNull()
      .references(() => gisRuleExecutionsTable.id, { onDelete: "cascade" }),
    actionType: varchar("action_type", { length: 50 }).notNull(), // CREATE_ALERT, CREATE_TASK, SEND_NOTIFICATION, SEND_WEBHOOK, CREATE_EVENT, LOG_EVENT, UPDATE_STATE
    actionPayload: jsonb("action_payload").notNull().default({}),
    status: varchar("status", { length: 20 }).notNull().default("PENDING"), // PENDING, RUNNING, SUCCESS, FAILED, DEAD_LETTER
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    lastAttemptAt: timestamp("last_attempt_at"),
    nextAttemptAt: timestamp("next_attempt_at").defaultNow().notNull(),
    lastError: text("last_error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    workerClaimIdx: index("idx_gis_action_jobs_claim").on(
      table.status,
      table.nextAttemptAt,
    ),
    tenantExecutionIdx: index("idx_gis_action_jobs_tenant_exec").on(
      table.tenantId,
      table.executionId,
    ),
  }),
);

/**
 * Generic Spatial & Rule Triggered Alerts
 */
export const gisAlertsTable = pgTable(
  "gis_alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    ruleId: uuid("rule_id"),
    ruleVersion: integer("rule_version"),
    severity: varchar("severity", { length: 20 }).notNull().default("INFO"), // INFO, LOW, MEDIUM, HIGH, CRITICAL
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    subjectId: uuid("subject_id"),
    subjectType: varchar("subject_type", { length: 50 }),
    geometry: postgisGeometry("geometry"), // Optional point/polygon alert location
    status: varchar("status", { length: 20 }).notNull().default("OPEN"), // OPEN, ACKNOWLEDGED, RESOLVED, DISMISSED
    acknowledgedBy: uuid("acknowledged_by"),
    acknowledgedAt: timestamp("acknowledged_at"),
    resolvedBy: uuid("resolved_by"),
    resolvedAt: timestamp("resolved_at"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantStatusIdx: index("idx_gis_alerts_tenant_status").on(
      table.tenantId,
      table.status,
    ),
    tenantSeverityIdx: index("idx_gis_alerts_tenant_severity").on(
      table.tenantId,
      table.severity,
    ),
    tenantSubjectIdx: index("idx_gis_alerts_tenant_subject").on(
      table.tenantId,
      table.subjectId,
    ),
    tenantCreatedIdx: index("idx_gis_alerts_tenant_created").on(
      table.tenantId,
      table.createdAt,
    ),
    geometryGistIdx: index("idx_gis_alerts_geometry").on(table.geometry),
  }),
);

/**
 * Generic Workflow Tasks
 */
export const gisTasksTable = pgTable(
  "gis_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    sourceRuleId: uuid("source_rule_id"),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 20 }).notNull().default("OPEN"), // OPEN, IN_PROGRESS, COMPLETED, CANCELLED
    priority: varchar("priority", { length: 20 }).notNull().default("MEDIUM"), // LOW, MEDIUM, HIGH, URGENT
    assignedTo: uuid("assigned_to"),
    dueAt: timestamp("due_at"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantStatusIdx: index("idx_gis_tasks_tenant_status").on(
      table.tenantId,
      table.status,
    ),
    tenantAssigneeIdx: index("idx_gis_tasks_tenant_assignee").on(
      table.tenantId,
      table.assignedTo,
    ),
    tenantPriorityIdx: index("idx_gis_tasks_tenant_priority").on(
      table.tenantId,
      table.priority,
    ),
    tenantCreatedIdx: index("idx_gis_tasks_tenant_created").on(
      table.tenantId,
      table.createdAt,
    ),
  }),
);

export type GisRuleRow = typeof gisRulesTable.$inferSelect;
export type NewGisRuleRow = typeof gisRulesTable.$inferInsert;

export type GisRuleVersionRow = typeof gisRuleVersionsTable.$inferSelect;
export type NewGisRuleVersionRow = typeof gisRuleVersionsTable.$inferInsert;

export type GisRuleExecutionRow = typeof gisRuleExecutionsTable.$inferSelect;
export type NewGisRuleExecutionRow = typeof gisRuleExecutionsTable.$inferInsert;

export type GisActionJobRow = typeof gisActionJobsTable.$inferSelect;
export type NewGisActionJobRow = typeof gisActionJobsTable.$inferInsert;

export type GisAlertRow = typeof gisAlertsTable.$inferSelect;
export type NewGisAlertRow = typeof gisAlertsTable.$inferInsert;

export type GisTaskRow = typeof gisTasksTable.$inferSelect;
export type NewGisTaskRow = typeof gisTasksTable.$inferInsert;
