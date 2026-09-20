-- Phase 9 — Add Real-Time Spatial Engine Tables (PostgreSQL + PostGIS)

CREATE TABLE IF NOT EXISTS "spatial_subjects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "type" varchar(50) NOT NULL,
  "external_id" varchar(100) NOT NULL,
  "name" varchar(100) NOT NULL,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_spatial_subjects_tenant" ON "spatial_subjects" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_spatial_subjects_tenant_ext" ON "spatial_subjects" ("tenant_id", "external_id");
CREATE INDEX IF NOT EXISTS "idx_spatial_subjects_tenant_type" ON "spatial_subjects" ("tenant_id", "type");

CREATE TABLE IF NOT EXISTS "spatial_current_positions" (
  "subject_id" uuid PRIMARY KEY,
  "tenant_id" uuid NOT NULL,
  "location" geometry(Geometry,4326) NOT NULL,
  "timestamp" timestamp NOT NULL,
  "accuracy" double precision,
  "speed" double precision,
  "heading" double precision,
  "source" varchar(30) NOT NULL DEFAULT 'api',
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_spatial_current_positions_location" ON "spatial_current_positions" USING GIST ("location");
CREATE INDEX IF NOT EXISTS "idx_spatial_current_positions_tenant" ON "spatial_current_positions" ("tenant_id");

CREATE TABLE IF NOT EXISTS "spatial_location_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "subject_id" uuid NOT NULL,
  "location" geometry(Geometry,4326) NOT NULL,
  "timestamp" timestamp NOT NULL,
  "accuracy" double precision,
  "speed" double precision,
  "heading" double precision,
  "source" varchar(30) NOT NULL DEFAULT 'api',
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_spatial_location_history_location" ON "spatial_location_history" USING GIST ("location");
CREATE INDEX IF NOT EXISTS "idx_spatial_location_history_sub_ts" ON "spatial_location_history" ("tenant_id", "subject_id", "timestamp");
CREATE INDEX IF NOT EXISTS "idx_spatial_location_history_tenant_ts" ON "spatial_location_history" ("tenant_id", "timestamp");

CREATE TABLE IF NOT EXISTS "spatial_geofence_states" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "subject_id" uuid NOT NULL,
  "geofence_id" uuid NOT NULL,
  "state" varchar(30) NOT NULL,
  "last_evaluated_at" timestamp NOT NULL DEFAULT now(),
  "last_location_id" uuid
);

CREATE INDEX IF NOT EXISTS "idx_spatial_geofence_states_lookup" ON "spatial_geofence_states" ("tenant_id", "subject_id", "geofence_id");

CREATE TABLE IF NOT EXISTS "spatial_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "type" varchar(50) NOT NULL,
  "subject_id" uuid NOT NULL,
  "geometry" geometry(Geometry,4326),
  "timestamp" timestamp NOT NULL,
  "source" varchar(30) NOT NULL DEFAULT 'system',
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_spatial_events_tenant_sub_ts" ON "spatial_events" ("tenant_id", "subject_id", "timestamp");
CREATE INDEX IF NOT EXISTS "idx_spatial_events_tenant_type" ON "spatial_events" ("tenant_id", "type");
