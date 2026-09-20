import {
  pgTable,
  serial,
  varchar,
  timestamp,
  text,
  boolean,
  integer,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";

// System logs
export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  level: varchar("level", { length: 10 }).notNull(),
  message: text("message").notNull(),
  meta: text("meta"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users table
export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("VIEWER"),
  organizationId: uuid("organization_id"),
  emailVerifiedAt: timestamp("email_verified_at"),
  isActive: boolean("is_active").notNull().default(true),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Refresh tokens table (with token rotation family)
export const refreshTokensTable = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  family: uuid("family").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Email verification tokens table
export const emailVerificationsTable = pgTable("email_verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Password reset tokens table
export const passwordResetsTable = pgTable("password_resets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// MFA configs table (TOTP / SMS ready)
export const mfaConfigsTable = pgTable("mfa_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" })
    .unique(),
  method: varchar("method", { length: 20 }).notNull().default("totp"),
  secretEncrypted: text("secret_encrypted").notNull(),
  isEnabled: boolean("is_enabled").notNull().default(false),
  backupCodesHash: jsonb("backup_codes_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Audit logs table
export const auditLogsTable = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  organizationId: uuid("organization_id"),
  workspaceId: uuid("workspace_id"),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export * from "./tenant";
export * from "./sdk-distribution";
export * from "./spatial";
export * from "./spatial-features";
export * from "./vehicle";
export * from "./gis-visualization";
export * from "./gis-geofence";
export * from "./realtime-spatial";
export * from "./gis-rules";
export * from "./subscription";
export * from "./developer-portal";
export * from "./production-sys";
export * from "./mobile";
export {
  applicationVersionsTable,
  applicationTemplatesTable,
  businessModulesRegistryTable,
  applicationWorkflowsTable,
  MODULE_STATUS,
  APPLICATION_PLATFORM,
  type ModuleStatus,
  type ApplicationPlatform,
  type ApplicationVersionRow,
  type NewApplicationVersionRow,
  type ApplicationTemplateRow,
  type NewApplicationTemplateRow,
  type BusinessModuleRegistryRow,
  type NewBusinessModuleRegistryRow,
  type ApplicationWorkflowRow,
  type NewApplicationWorkflowRow,
} from "./application-builder";
