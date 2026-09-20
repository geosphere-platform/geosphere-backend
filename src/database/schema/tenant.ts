/**
 * Multi-Tenant Platform Database Schema
 *
 * Tables for Tenant Organizations and Customer-Specific Configurations.
 */

import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  uuid,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// Tenants table (represents a Customer / Organization)
export const tenantsTable = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    plan: varchar("plan", { length: 50 }).notNull().default("enterprise"), // free, starter, pro, enterprise
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index("idx_tenants_slug").on(table.slug),
    activeIdx: index("idx_tenants_active").on(table.isActive),
  }),
);

// Tenant Settings & Configuration table
export const tenantSettingsTable = pgTable(
  "tenant_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" })
      .unique(),
    enabledModules: jsonb("enabled_modules")
      .notNull()
      .default(["gis-core", "fleet", "tracking", "routing", "geofence"]),
    enabledFeatures: jsonb("enabled_features")
      .notNull()
      .default(["base_maps", "custom_layers", "vehicle_status", "live_stream"]),
    mapConfiguration: jsonb("map_configuration")
      .notNull()
      .default({
        defaultCenter: [77.209, 28.6139],
        defaultZoom: 10,
        projection: "EPSG:4326",
        baseTile: "osm",
      }),
    spatialSettings: jsonb("spatial_settings")
      .notNull()
      .default({
        maxEntitiesLimit: 50000,
        supportedProjections: ["EPSG:4326", "EPSG:3857"],
      }),
    limits: jsonb("limits").notNull().default({
      maxVehicles: 1000,
      maxUsers: 100,
      maxGeofences: 500,
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("idx_tenant_settings_tenant_id").on(table.tenantId),
  }),
);

export * from "./tenant-saas";
