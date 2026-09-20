-- Enable PostGIS spatial extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create generic PostGIS spatial_features table
CREATE TABLE IF NOT EXISTS "spatial_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"geometry" geometry(Geometry, 4326) NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- PostGIS GiST spatial index on geometry column
CREATE INDEX IF NOT EXISTS "idx_spatial_features_geometry" ON "spatial_features" USING GIST ("geometry");

-- Tenant isolation and lookup indexes
CREATE INDEX IF NOT EXISTS "idx_spatial_features_tenant" ON "spatial_features" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_spatial_features_tenant_type" ON "spatial_features" ("tenant_id", "type");
CREATE INDEX IF NOT EXISTS "idx_spatial_features_created_at" ON "spatial_features" ("created_at");
