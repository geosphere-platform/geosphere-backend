import {
  pgTable,
  varchar,
  timestamp,
  text,
  integer,
  jsonb,
  index,
  boolean,
} from "drizzle-orm/pg-core";

/**
 * System Asynchronous Job Processing Queue Table (`sys_jobs`)
 * Supports generic background jobs without Redis or Kafka dependencies.
 */
export const sysJobs = pgTable(
  "sys_jobs",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 64 }).notNull(),
    organizationId: varchar("organization_id", { length: 64 }).notNull(),
    workspaceId: varchar("workspace_id", { length: 64 }),
    userId: varchar("user_id", { length: 64 }),
    type: varchar("type", { length: 64 }).notNull(), // e.g. "GIS_EXPORT", "BULK_IMPORT", "SPATIAL_ANALYTICS"
    status: varchar("status", { length: 32 }).notNull().default("PENDING"), // PENDING, RUNNING, COMPLETED, FAILED, CANCELLED
    payload: jsonb("payload").notNull(),
    result: jsonb("result"),
    errorMessage: text("error_message"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    scheduledAt: timestamp("scheduled_at").defaultNow(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantOrgIdx: index("idx_sys_jobs_tenant_org").on(
      table.tenantId,
      table.organizationId,
    ),
    statusIdx: index("idx_sys_jobs_status").on(table.status),
    typeIdx: index("idx_sys_jobs_type").on(table.type),
    createdAtIdx: index("idx_sys_jobs_created_at").on(table.createdAt),
  }),
);

/**
 * System Production Audit Logs Table (`sys_audit_logs`)
 * Immutable record of tenant security events, login attempts, key rotations, license updates.
 */
export const sysAuditLogs = pgTable(
  "sys_audit_logs",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 64 }).notNull(),
    organizationId: varchar("organization_id", { length: 64 }).notNull(),
    userId: varchar("user_id", { length: 64 }),
    action: varchar("action", { length: 128 }).notNull(),
    category: varchar("category", { length: 64 }).notNull(), // SECURITY, AUTH, LICENSE, SDK, DATA_EXPORT
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: text("user_agent"),
    details: jsonb("details"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantOrgIdx: index("idx_sys_audit_tenant_org").on(
      table.tenantId,
      table.organizationId,
    ),
    actionIdx: index("idx_sys_audit_action").on(table.action),
    categoryIdx: index("idx_sys_audit_category").on(table.category),
    createdAtIdx: index("idx_sys_audit_created_at").on(table.createdAt),
  }),
);

/**
 * System Application Rate Limits State (`sys_rate_limits`)
 * Backup/Persistent sliding-window state for rate limiter when in-memory cache restarts.
 */
export const sysRateLimits = pgTable(
  "sys_rate_limits",
  {
    key: varchar("key", { length: 256 }).primaryKey(), // e.g. ip:1.2.3.4 or api_key:ak_123
    tokens: integer("tokens").notNull(),
    lastRefillAt: timestamp("last_refill_at").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => ({
    expiresIdx: index("idx_sys_rate_limits_expires").on(table.expiresAt),
  }),
);

export type SysJob = typeof sysJobs.$inferSelect;
export type NewSysJob = typeof sysJobs.$inferInsert;
export type SysAuditLog = typeof sysAuditLogs.$inferSelect;
export type NewSysAuditLog = typeof sysAuditLogs.$inferInsert;
