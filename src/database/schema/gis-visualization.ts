/**
 * GIS Visualization Configs Database Schema — Multi-Tenant GIS Platform
 *
 * Stores tenant-scoped GIS layer definitions, map configurations, and dynamic
 * visualization configurations (styles, filters, labels, legends).
 */

import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  jsonb,
  integer,
  index,
} from "drizzle-orm/pg-core";

export const gisVisualizationConfigsTable = pgTable(
  "gis_visualization_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(), // Tenant isolation boundary
    mapId: varchar("map_id", { length: 100 }).notNull().default("default_map"),
    layerId: varchar("layer_id", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    scope: varchar("scope", { length: 50 }).notNull().default("tenant"), // platform, tenant, application, user
    version: integer("version").notNull().default(1),
    layerDefinition: jsonb("layer_definition").notNull().default({}),
    visualizationConfig: jsonb("visualization_config").notNull().default({}),
    createdBy: uuid("created_by"),
    updatedBy: uuid("updated_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("idx_gis_viz_tenant").on(table.tenantId),
    tenantLayerIdx: index("idx_gis_viz_tenant_layer").on(
      table.tenantId,
      table.layerId,
    ),
    tenantMapIdx: index("idx_gis_viz_tenant_map").on(
      table.tenantId,
      table.mapId,
    ),
  }),
);

export type GISVisualizationConfigRow =
  typeof gisVisualizationConfigsTable.$inferSelect;
export type NewGISVisualizationConfigRow =
  typeof gisVisualizationConfigsTable.$inferInsert;
