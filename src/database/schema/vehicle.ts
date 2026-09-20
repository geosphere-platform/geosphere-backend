import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  doublePrecision,
  text,
  index,
} from "drizzle-orm/pg-core";

// Vehicles table
export const vehiclesTable = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    licensePlate: varchar("license_plate", { length: 50 }).notNull().unique(),
    status: varchar("status", { length: 20 }).notNull().default("active"), // moving, idle, stopped, offline, active
    driverName: varchar("driver_name", { length: 100 }),
    organizationId: uuid("organization_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index("idx_vehicles_status").on(table.status),
    orgIdx: index("idx_vehicles_org_id").on(table.organizationId),
  }),
);

// Vehicle telemetry / location history table
export const vehicleTelemetryTable = pgTable(
  "vehicle_telemetry",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehiclesTable.id, { onDelete: "cascade" }),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    speed: doublePrecision("speed").notNull().default(0),
    heading: doublePrecision("heading").notNull().default(0),
    recordedAt: timestamp("recorded_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    vehicleRecordedIdx: index("idx_telemetry_vehicle_recorded").on(
      table.vehicleId,
      table.recordedAt,
    ),
  }),
);

// Alerts table
export const alertsTable = pgTable(
  "alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehiclesTable.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(), // overspeed, geofence, panic, maintenance
    severity: varchar("severity", { length: 20 }).notNull(), // critical, warning, info
    message: text("message").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"), // active, resolved
    organizationId: uuid("organization_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgStatusIdx: index("idx_alerts_org_status").on(
      table.organizationId,
      table.status,
    ),
    createdAtIdx: index("idx_alerts_created_at").on(table.createdAt),
  }),
);

// Trips table
export const tripsTable = pgTable(
  "trips",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehiclesTable.id, { onDelete: "cascade" }),
    driverName: varchar("driver_name", { length: 100 }).notNull(),
    origin: varchar("origin", { length: 255 }),
    destination: varchar("destination", { length: 255 }),
    distance: doublePrecision("distance").notNull().default(0), // in km
    status: varchar("status", { length: 20 }).notNull().default("in_progress"), // in_progress, completed
    startTime: timestamp("start_time").defaultNow().notNull(),
    endTime: timestamp("end_time"),
    organizationId: uuid("organization_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgStatusIdx: index("idx_trips_org_status").on(
      table.organizationId,
      table.status,
    ),
    startTimeIdx: index("idx_trips_start_time").on(table.startTime),
  }),
);
