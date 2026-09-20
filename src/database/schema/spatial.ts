/**
 * GIS Core Database Schema — Business-Agnostic Spatial Entities
 *
 * Generic database table storing any geographic feature (Points, LineStrings, Polygons)
 * across any industry vertical (Vehicles, Buildings, Assets, Geofences, Utilities, Farms, etc.).
 */

import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const spatialEntitiesTable = pgTable(
  "spatial_entities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(), // Tenant isolation boundary
    entityType: varchar("entity_type", { length: 50 }).notNull(), // vehicle, building, warehouse, asset, farm, pipeline
    geometryType: varchar("geometry_type", { length: 30 }).notNull(), // Point, LineString, Polygon, etc.
    coordinates: jsonb("coordinates").notNull(), // GeoJSON coordinate array/payload
    properties: jsonb("properties").notNull().default({}), // Business key-value properties
    srid: varchar("srid", { length: 20 }).notNull().default("EPSG:4326"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("idx_spatial_entities_tenant").on(table.tenantId),
    tenantTypeIdx: index("idx_spatial_entities_tenant_type").on(
      table.tenantId,
      table.entityType,
    ),
    createdIdx: index("idx_spatial_entities_created_at").on(table.createdAt),
  }),
);
