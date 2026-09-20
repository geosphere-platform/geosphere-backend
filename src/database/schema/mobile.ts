/**
 * Mobile GIS Platform Database Schema — Multi-Tenant Mobile Infrastructure
 *
 * Provides database persistence for device registration, remote app configurations,
 * offline synchronization operations, dynamic field forms, task management,
 * resumable media uploads, and offline map packages.
 */

import {
  pgTable,
  varchar,
  timestamp,
  text,
  boolean,
  integer,
  uuid,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// 1. Registered Mobile Devices
export const mobileDevicesTable = pgTable(
  "mobile_devices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    userId: uuid("user_id").notNull(),
    deviceId: varchar("device_id", { length: 100 }).notNull().unique(),
    deviceName: varchar("device_name", { length: 100 }).notNull(),
    platform: varchar("platform", { length: 20 }).notNull(), // ANDROID, IOS
    osVersion: varchar("os_version", { length: 30 }).notNull(),
    appVersion: varchar("app_version", { length: 30 }).notNull(),
    pushToken: text("push_token"),
    status: varchar("status", { length: 30 }).notNull().default("ACTIVE"), // ACTIVE, REVOKED, PENDING
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("idx_mobile_devices_tenant").on(table.tenantId),
    userDeviceIdx: index("idx_mobile_devices_user_device").on(
      table.userId,
      table.deviceId,
    ),
  }),
);

// 2. Data-Driven Mobile Remote Configurations
export const mobileConfigsTable = pgTable(
  "mobile_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    appName: varchar("app_name", { length: 100 }).notNull(),
    appId: varchar("app_id", { length: 100 }).notNull(), // e.g. com.customer.fieldservice
    modules: jsonb("modules").notNull(), // enabled module array: ["MAP", "LOCATION", "OFFLINE", "SYNC", "FORMS", "TASKS"]
    layers: jsonb("layers").notNull(), // layer configurations
    branding: jsonb("branding").notNull(), // theme, colors, logoUrl, appTitle
    featureFlags: jsonb("feature_flags").notNull().default({}),
    mapConfig: jsonb("map_config").notNull(), // initialCenter, zoom, minZoom, maxZoom, vectorTileUrl
    locationConfig: jsonb("location_config").notNull(), // trackingProfile, intervalSeconds, batchSize
    version: integer("version").notNull().default(1),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantAppIdx: index("idx_mobile_configs_tenant_app").on(
      table.tenantId,
      table.appId,
    ),
  }),
);

// 3. Mobile Synchronization Operation Logs & Idempotency
export const mobileSyncLogsTable = pgTable(
  "mobile_sync_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    userId: uuid("user_id").notNull(),
    deviceId: varchar("device_id", { length: 100 }).notNull(),
    clientOperationId: uuid("client_operation_id").notNull().unique(), // Idempotency key
    entityType: varchar("entity_type", { length: 50 }).notNull(), // feature, form, task, location
    entityId: varchar("entity_id", { length: 100 }).notNull(),
    operation: varchar("operation", { length: 20 }).notNull(), // CREATE, UPDATE, DELETE
    clientVersion: integer("client_version").notNull(),
    serverVersion: integer("server_version").notNull(),
    syncStatus: varchar("sync_status", { length: 30 }).notNull(), // SYNCED, FAILED, CONFLICT
    conflictStrategy: varchar("conflict_strategy", { length: 30 }).default(
      "SERVER_WINS",
    ),
    errorDetails: text("error_details"),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantDeviceIdx: index("idx_mobile_sync_tenant_device").on(
      table.tenantId,
      table.deviceId,
    ),
    operationIdx: index("idx_mobile_sync_operation").on(
      table.clientOperationId,
    ),
  }),
);

// 4. Dynamic Field Form Definitions
export const mobileFormsTable = pgTable(
  "mobile_forms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    formKey: varchar("form_key", { length: 100 }).notNull(), // e.g. asset_inspection
    title: varchar("title", { length: 150 }).notNull(),
    description: text("description"),
    version: integer("version").notNull().default(1),
    fields: jsonb("fields").notNull(), // Array of FormField definitions (type, label, required, validation, options)
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantKeyIdx: index("idx_mobile_forms_tenant_key").on(
      table.tenantId,
      table.formKey,
    ),
  }),
);

// 5. Dynamic Form Submissions (Field Data Collection)
export const mobileFormSubmissionsTable = pgTable(
  "mobile_form_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    userId: uuid("user_id").notNull(),
    deviceId: varchar("device_id", { length: 100 }).notNull(),
    formId: uuid("form_id").notNull(),
    formVersion: integer("form_version").notNull(),
    clientOperationId: uuid("client_operation_id").notNull().unique(),
    geometry: jsonb("geometry"), // Optional Point/Polygon geometry captured during form submission
    formData: jsonb("form_data").notNull(), // Key-value field values
    syncStatus: varchar("sync_status", { length: 30 })
      .notNull()
      .default("SYNCED"),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantUserIdx: index("idx_mobile_submissions_tenant_user").on(
      table.tenantId,
      table.userId,
    ),
  }),
);

// 6. Mobile Field Tasks
export const mobileTasksTable = pgTable(
  "mobile_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    assignedUserId: uuid("assigned_user_id").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 30 }).notNull().default("ASSIGNED"), // ASSIGNED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED, FAILED
    priority: varchar("priority", { length: 20 }).notNull().default("MEDIUM"), // LOW, MEDIUM, HIGH, URGENT
    dueDate: timestamp("due_date"),
    locationGeom: jsonb("location_geom"), // Target GeoJSON geometry
    formId: uuid("form_id"), // Optional associated inspection form
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantAssigneeIdx: index("idx_mobile_tasks_tenant_user").on(
      table.tenantId,
      table.assignedUserId,
    ),
    statusIdx: index("idx_mobile_tasks_status").on(table.status),
  }),
);

// 7. Resumable & Chunked Mobile Media Uploads
export const mobileMediaUploadsTable = pgTable(
  "mobile_media_uploads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    userId: uuid("user_id").notNull(),
    deviceId: varchar("device_id", { length: 100 }).notNull(),
    clientOperationId: uuid("client_operation_id").notNull().unique(),
    mediaType: varchar("media_type", { length: 30 }).notNull(), // PHOTO, DOCUMENT, SIGNATURE
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileSizeBytes: integer("file_size_bytes").notNull(),
    chunksTotal: integer("chunks_total").notNull().default(1),
    chunksReceived: integer("chunks_received").notNull().default(0),
    storageUrl: text("storage_url"),
    status: varchar("status", { length: 30 }).notNull().default("PENDING"), // PENDING, UPLOADING, COMPLETED, FAILED
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantDeviceIdx: index("idx_mobile_media_tenant_device").on(
      table.tenantId,
      table.deviceId,
    ),
  }),
);

// 8. Offline Map Packages Metadata
export const mobileOfflinePackagesTable = pgTable(
  "mobile_offline_packages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    areaName: varchar("area_name", { length: 150 }).notNull(),
    boundingBox: jsonb("bounding_box").notNull(), // [minLng, minLat, maxLng, maxLat]
    minZoom: integer("min_zoom").notNull().default(0),
    maxZoom: integer("max_zoom").notNull().default(16),
    layerIds: jsonb("layer_ids").notNull(), // Layer IDs included in tile pack
    version: integer("version").notNull().default(1),
    packageSizeBytes: integer("package_size_bytes").notNull(),
    downloadUrl: text("download_url").notNull(),
    checksum: varchar("checksum", { length: 64 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantAreaIdx: index("idx_mobile_packages_tenant_area").on(
      table.tenantId,
      table.areaName,
    ),
  }),
);
