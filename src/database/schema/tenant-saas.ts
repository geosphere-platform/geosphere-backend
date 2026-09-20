/**
 * Phase 12 — Multi-Tenant SaaS Organization, Workspace & Customer Management Database Schemas
 *
 * Implements the core 4-level domain hierarchy:
 * Platform -> Organization -> Workspace -> (Users, Layers, Rules, Spatial Data, Analytics) & Members.
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
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./index";

/**
 * Organization Status Enum Values:
 * ACTIVE, SUSPENDED, PENDING, ARCHIVED
 */
export const ORGANIZATION_STATUS = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  PENDING: "PENDING",
  ARCHIVED: "ARCHIVED",
} as const;

export type OrganizationStatus =
  (typeof ORGANIZATION_STATUS)[keyof typeof ORGANIZATION_STATUS];

/**
 * Workspace Status Enum Values:
 * ACTIVE, ARCHIVED
 */
export const WORKSPACE_STATUS = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;

export type WorkspaceStatus =
  (typeof WORKSPACE_STATUS)[keyof typeof WORKSPACE_STATUS];

/**
 * Membership Status Enum Values:
 * INVITED, ACTIVE, SUSPENDED, REMOVED
 */
export const MEMBERSHIP_STATUS = {
  INVITED: "INVITED",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  REMOVED: "REMOVED",
} as const;

export type MembershipStatus =
  (typeof MEMBERSHIP_STATUS)[keyof typeof MEMBERSHIP_STATUS];

/**
 * Invitation Status Enum Values:
 * PENDING, ACCEPTED, EXPIRED, REVOKED
 */
export const INVITATION_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  EXPIRED: "EXPIRED",
  REVOKED: "REVOKED",
} as const;

export type InvitationStatus =
  (typeof INVITATION_STATUS)[keyof typeof INVITATION_STATUS];

/**
 * Organizations Table (Represents a Customer / Tenant Entity)
 */
export const organizationsTable = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    status: varchar("status", { length: 20 })
      .notNull()
      .default(ORGANIZATION_STATUS.ACTIVE),
    ownerId: uuid("owner_id").references(() => usersTable.id, {
      onDelete: "restrict",
    }),
    timezone: varchar("timezone", { length: 50 }).notNull().default("UTC"),
    locale: varchar("locale", { length: 10 }).notNull().default("en-US"),
    defaultSettings: jsonb("default_settings")
      .notNull()
      .default({
        dateFormat: "YYYY-MM-DD",
        numberFormat: "en-US",
        defaultMapProvider: "osm",
        notificationDefaults: {
          email: true,
          inApp: true,
        },
      }),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index("idx_organizations_slug").on(table.slug),
    statusIdx: index("idx_organizations_status").on(table.status),
    ownerIdx: index("idx_organizations_owner").on(table.ownerId),
  }),
);

/**
 * Workspaces Table (Logical Environment within an Organization)
 */
export const workspacesTable = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 20 })
      .notNull()
      .default(WORKSPACE_STATUS.ACTIVE),
    settings: jsonb("settings")
      .notNull()
      .default({
        defaultMapProvider: "osm",
        defaultCenter: [77.209, 28.6139],
        defaultZoom: 10,
        defaultLayers: [],
        initialViewport: {
          longitude: 77.209,
          latitude: 28.6139,
          zoom: 10,
        },
      }),
    createdBy: uuid("created_by").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgSlugUniqueIdx: uniqueIndex("idx_workspaces_org_slug").on(
      table.organizationId,
      table.slug,
    ),
    orgIdx: index("idx_workspaces_organization").on(table.organizationId),
    statusIdx: index("idx_workspaces_status").on(table.status),
  }),
);

/**
 * Organization Memberships Table (User Identity <-> Organization Scope & Role)
 */
export const organizationMembershipsTable = pgTable(
  "organization_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull().default("MEMBER"),
    status: varchar("status", { length: 20 })
      .notNull()
      .default(MEMBERSHIP_STATUS.ACTIVE),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgUserUniqueIdx: uniqueIndex("idx_org_memberships_org_user").on(
      table.organizationId,
      table.userId,
    ),
    orgIdx: index("idx_org_memberships_org").on(table.organizationId),
    userIdx: index("idx_org_memberships_user").on(table.userId),
    statusIdx: index("idx_org_memberships_status").on(table.status),
  }),
);

/**
 * Organization Invitations Table (Hash-based Membership Invitations)
 */
export const organizationInvitationsTable = pgTable(
  "organization_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 }).notNull().default("MEMBER"),
    tokenHash: text("token_hash").notNull().unique(),
    status: varchar("status", { length: 20 })
      .notNull()
      .default(INVITATION_STATUS.PENDING),
    expiresAt: timestamp("expires_at").notNull(),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgEmailIdx: index("idx_org_invitations_org_email").on(
      table.organizationId,
      table.email,
    ),
    tokenHashIdx: index("idx_org_invitations_token_hash").on(table.tokenHash),
    statusExpiresIdx: index("idx_org_invitations_status_expires").on(
      table.status,
      table.expiresAt,
    ),
  }),
);
