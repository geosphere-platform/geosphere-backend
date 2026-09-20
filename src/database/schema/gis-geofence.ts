/**
 * Business-Agnostic GIS Geofence Schema & Spatial Event Persistence — PostgreSQL + PostGIS
 *
 * Stores generic spatial boundaries (Polygon / MultiPolygon geofences) and spatial transition events.
 * Strictly business-agnostic: uses generic `subjectId` (not vehicleId/driverId).
 */

import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { postgisGeometry } from "./spatial-features";

export const gisGeofencesTable = pgTable(
  "gis_geofences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    geometry: postgisGeometry("geometry").notNull(),
    properties: jsonb("properties").notNull().default({}),
    createdBy: uuid("created_by"),
    updatedBy: uuid("updated_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    geometryGistIdx: index("idx_gis_geofences_geometry").on(table.geometry),
    tenantIdx: index("idx_gis_geofences_tenant").on(table.tenantId),
    tenantNameIdx: index("idx_gis_geofences_tenant_name").on(
      table.tenantId,
      table.name,
    ),
  }),
);

export const gisSpatialEventsTable = pgTable(
  "gis_spatial_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    geofenceId: uuid("geofence_id"),
    subjectId: varchar("subject_id", { length: 100 }).notNull(), // Generic subject ID (vehicle, driver, asset, employee, device)
    previousState: varchar("previous_state", { length: 30 }).notNull(), // INSIDE, OUTSIDE, BOUNDARY
    currentState: varchar("current_state", { length: 30 }).notNull(),
    transition: varchar("transition", { length: 30 }).notNull(), // ENTER, EXIT, NO_CHANGE, etc.
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    metadata: jsonb("metadata").notNull().default({}),
  },
  (table) => ({
    tenantIdx: index("idx_gis_spatial_events_tenant").on(table.tenantId),
    subjectIdx: index("idx_gis_spatial_events_subject").on(
      table.tenantId,
      table.subjectId,
    ),
    geofenceIdx: index("idx_gis_spatial_events_geofence").on(table.geofenceId),
    timestampIdx: index("idx_gis_spatial_events_timestamp").on(table.timestamp),
  }),
);

export type GisGeofenceRow = typeof gisGeofencesTable.$inferSelect;
export type NewGisGeofenceRow = typeof gisGeofencesTable.$inferInsert;

export type GisSpatialEventRow = typeof gisSpatialEventsTable.$inferSelect;
export type NewGisSpatialEventRow = typeof gisSpatialEventsTable.$inferInsert;
