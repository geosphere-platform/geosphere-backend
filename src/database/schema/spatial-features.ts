/**
 * Generic Spatial Features Table — PostgreSQL + PostGIS
 *
 * Stores business-agnostic spatial features (Points, LineStrings, Polygons, etc.)
 * with EPSG:4326 PostGIS geometry and GiST spatial index.
 */

import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  jsonb,
  index,
  customType,
} from "drizzle-orm/pg-core";

// Custom Drizzle type mapping for PostGIS geometry column
export const postgisGeometry = customType<{
  data: Record<string, unknown>; // GeoJSON geometry object
  driverData: string;
}>({
  dataType() {
    return "geometry(Geometry, 4326)";
  },
  toDriver(value: Record<string, unknown>): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string | Record<string, unknown>): Record<string, unknown> {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return { type: "Point", coordinates: [0, 0] };
      }
    }
    return value;
  },
});

export const spatialFeaturesTable = pgTable(
  "spatial_features",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    geometry: postgisGeometry("geometry").notNull(),
    properties: jsonb("properties").notNull().default({}),
    metadata: jsonb("metadata").notNull().default({}),
    createdBy: uuid("created_by"),
    updatedBy: uuid("updated_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("idx_spatial_features_tenant").on(table.tenantId),
    tenantTypeIdx: index("idx_spatial_features_tenant_type").on(
      table.tenantId,
      table.type,
    ),
    createdIdx: index("idx_spatial_features_created_at").on(table.createdAt),
  }),
);

export type SpatialFeatureRow = typeof spatialFeaturesTable.$inferSelect;
export type NewSpatialFeatureRow = typeof spatialFeaturesTable.$inferInsert;
