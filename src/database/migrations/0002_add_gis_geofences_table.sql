-- Create generic PostGIS gis_geofences table
CREATE TABLE IF NOT EXISTS "gis_geofences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"geometry" geometry(Geometry, 4326) NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- PostGIS GiST spatial index on geofence geometry
CREATE INDEX IF NOT EXISTS "idx_gis_geofences_geometry" ON "gis_geofences" USING GIST ("geometry");

-- Tenant isolation and name lookup indexes
CREATE INDEX IF NOT EXISTS "idx_gis_geofences_tenant" ON "gis_geofences" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_gis_geofences_tenant_name" ON "gis_geofences" ("tenant_id", "name");

-- Create generic spatial events table
CREATE TABLE IF NOT EXISTS "gis_spatial_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"geofence_id" uuid,
	"subject_id" varchar(100) NOT NULL,
	"previous_state" varchar(30) NOT NULL,
	"current_state" varchar(30) NOT NULL,
	"transition" varchar(30) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_gis_spatial_events_tenant" ON "gis_spatial_events" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_gis_spatial_events_subject" ON "gis_spatial_events" ("tenant_id", "subject_id");
CREATE INDEX IF NOT EXISTS "idx_gis_spatial_events_geofence" ON "gis_spatial_events" ("geofence_id");
CREATE INDEX IF NOT EXISTS "idx_gis_spatial_events_timestamp" ON "gis_spatial_events" ("timestamp");
