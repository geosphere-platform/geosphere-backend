/**
 * Business-Agnostic Real-Time Spatial Engine Database Schemas — PostgreSQL + PostGIS
 *
 * Defines schemas for spatial subjects, current positions, location history,
 * geofence state tracking, and persisted spatial transition events.
 */

import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  jsonb,
  boolean,
  doublePrecision,
  index,
} from "drizzle-orm/pg-core";
import { postgisGeometry } from "./spatial-features";

/**
 * Generic Spatial Subjects (vehicle, employee, asset, device, equipment, delivery, drone, field-agent)
 */
export const spatialSubjectsTable = pgTable(
  "spatial_subjects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    type: varchar("type", { length: 50 }).notNull(), // vehicle, employee, asset, drone, device, delivery
    externalId: varchar("external_id", { length: 100 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("idx_spatial_subjects_tenant").on(table.tenantId),
    tenantExtIdx: index("idx_spatial_subjects_tenant_ext").on(
      table.tenantId,
      table.externalId,
    ),
    tenantTypeIdx: index("idx_spatial_subjects_tenant_type").on(
      table.tenantId,
      table.type,
    ),
  }),
);

/**
 * Atomic Current Positions (Enforces exactly ONE position record per subject)
 */
export const spatialCurrentPositionsTable = pgTable(
  "spatial_current_positions",
  {
    subjectId: uuid("subject_id").primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    location: postgisGeometry("location").notNull(), // PostGIS EPSG:4326 Point
    timestamp: timestamp("timestamp").notNull(), // Sensor / GPS update timestamp (UTC)
    accuracy: doublePrecision("accuracy"), // meters
    speed: doublePrecision("speed"), // meters/second
    heading: doublePrecision("heading"), // 0 - 360 degrees
    source: varchar("source", { length: 30 }).notNull().default("api"),
    metadata: jsonb("metadata").notNull().default({}),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    locationGistIdx: index("idx_spatial_current_positions_location").on(
      table.location,
    ),
    tenantIdx: index("idx_spatial_current_positions_tenant").on(table.tenantId),
  }),
);

/**
 * Location History Ledger
 */
export const spatialLocationHistoryTable = pgTable(
  "spatial_location_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    subjectId: uuid("subject_id").notNull(),
    location: postgisGeometry("location").notNull(), // PostGIS EPSG:4326 Point
    timestamp: timestamp("timestamp").notNull(), // Update timestamp (UTC)
    accuracy: doublePrecision("accuracy"),
    speed: doublePrecision("speed"),
    heading: doublePrecision("heading"),
    source: varchar("source", { length: 30 }).notNull().default("api"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    locationGistIdx: index("idx_spatial_location_history_location").on(
      table.location,
    ),
    tenantSubTsIdx: index("idx_spatial_location_history_sub_ts").on(
      table.tenantId,
      table.subjectId,
      table.timestamp,
    ),
    tenantTsIdx: index("idx_spatial_location_history_tenant_ts").on(
      table.tenantId,
      table.timestamp,
    ),
  }),
);

/**
 * Subject Geofence State Tracking
 */
export const spatialGeofenceStatesTable = pgTable(
  "spatial_geofence_states",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    subjectId: uuid("subject_id").notNull(),
    geofenceId: uuid("geofence_id").notNull(),
    state: varchar("state", { length: 30 }).notNull(), // INSIDE, OUTSIDE, BOUNDARY
    lastEvaluatedAt: timestamp("last_evaluated_at").defaultNow().notNull(),
    lastLocationId: uuid("last_location_id"),
  },
  (table) => ({
    tenantSubGfIdx: index("idx_spatial_geofence_states_lookup").on(
      table.tenantId,
      table.subjectId,
      table.geofenceId,
    ),
  }),
);

/**
 * Persisted Real-Time Spatial Events
 */
export const spatialEventsTable = pgTable(
  "spatial_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    type: varchar("type", { length: 50 }).notNull(), // LOCATION_UPDATED, SPATIAL_ENTER, SPATIAL_EXIT, etc.
    subjectId: uuid("subject_id").notNull(),
    geometry: postgisGeometry("geometry"), // Optional point or polygon geometry
    timestamp: timestamp("timestamp").notNull(),
    source: varchar("source", { length: 30 }).notNull().default("system"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantSubTsIdx: index("idx_spatial_events_tenant_sub_ts").on(
      table.tenantId,
      table.subjectId,
      table.timestamp,
    ),
    tenantTypeIdx: index("idx_spatial_events_tenant_type").on(
      table.tenantId,
      table.type,
    ),
  }),
);

export type SpatialSubjectRow = typeof spatialSubjectsTable.$inferSelect;
export type NewSpatialSubjectRow = typeof spatialSubjectsTable.$inferInsert;

export type SpatialCurrentPositionRow =
  typeof spatialCurrentPositionsTable.$inferSelect;
export type NewSpatialCurrentPositionRow =
  typeof spatialCurrentPositionsTable.$inferInsert;

export type SpatialLocationHistoryRow =
  typeof spatialLocationHistoryTable.$inferSelect;
export type NewSpatialLocationHistoryRow =
  typeof spatialLocationHistoryTable.$inferInsert;

export type SpatialGeofenceStateRow =
  typeof spatialGeofenceStatesTable.$inferSelect;
export type NewSpatialGeofenceStateRow =
  typeof spatialGeofenceStatesTable.$inferInsert;

export type SpatialEventRow = typeof spatialEventsTable.$inferSelect;
export type NewSpatialEventRow = typeof spatialEventsTable.$inferInsert;
