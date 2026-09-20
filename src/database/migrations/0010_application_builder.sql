-- Phase 20 — Customer Application Builder Database Migration

CREATE TABLE IF NOT EXISTS "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
	"workspace_id" uuid REFERENCES "workspaces"("id") ON DELETE SET NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(100) NOT NULL,
	"description" text,
	"environment" varchar(30) DEFAULT 'PRODUCTION' NOT NULL,
	"platform" varchar(30) DEFAULT 'BOTH' NOT NULL,
	"status" varchar(30) DEFAULT 'DRAFT' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"current_published_version_id" uuid,
	"configuration" jsonb DEFAULT '{"branding":{"appTitle":"Default Application","primaryColor":"#0F172A","accentColor":"#3B82F6","darkMode":true},"modules":["MAP","GIS_LAYERS","LOCATION","OFFLINE"],"layers":[],"mapConfig":{"initialCenter":[-74.006,40.7128],"zoom":12,"minZoom":2,"maxZoom":18,"vectorTileUrl":"/api/v1/tiles/{layerId}/{z}/{x}/{y}","defaultStyle":"DARK_VECTOR"},"forms":[],"workflows":[],"featureFlags":{},"permissions":{},"locationConfig":{"trackingProfile":"BALANCED","intervalSeconds":15,"batchSize":20},"offlineConfig":{"autoDownloadPackages":false,"maxStorageBytes":1073741824},"notifications":[],"dashboards":[],"reports":[]}'::jsonb NOT NULL,
	"created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "application_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL REFERENCES "applications"("id") ON DELETE CASCADE,
	"tenant_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
	"version" integer NOT NULL,
	"status" varchar(30) DEFAULT 'PUBLISHED' NOT NULL,
	"snapshot" jsonb NOT NULL,
	"change_summary" text,
	"published_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "application_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL UNIQUE,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) DEFAULT 'GENERAL' NOT NULL,
	"default_configuration" jsonb NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "business_modules_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL UNIQUE,
	"name" varchar(255) NOT NULL,
	"description" text,
	"version" varchar(30) DEFAULT '1.0.0' NOT NULL,
	"dependencies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"configuration_schema" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(30) DEFAULT 'AVAILABLE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "application_workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL REFERENCES "applications"("id") ON DELETE CASCADE,
	"tenant_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
	"code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"version" integer DEFAULT 1 NOT NULL,
	"definition" jsonb DEFAULT '{"states":["CREATED","ASSIGNED","IN_PROGRESS","REVIEW","COMPLETED","REJECTED"],"initialState":"CREATED","transitions":[{"from":"CREATED","to":"ASSIGNED","role":"SUPERVISOR","action":"ASSIGN"},{"from":"ASSIGNED","to":"IN_PROGRESS","role":"FIELD_AGENT","action":"START"},{"from":"IN_PROGRESS","to":"REVIEW","role":"FIELD_AGENT","action":"SUBMIT"},{"from":"REVIEW","to":"COMPLETED","role":"SUPERVISOR","action":"APPROVE"},{"from":"REVIEW","to":"REJECTED","role":"SUPERVISOR","action":"REJECT"}]}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_applications_tenant_code" ON "applications" ("tenant_id", "code");
CREATE INDEX IF NOT EXISTS "idx_applications_tenant" ON "applications" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_applications_status" ON "applications" ("status");
CREATE INDEX IF NOT EXISTS "idx_applications_environment" ON "applications" ("environment");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_app_versions_app_version" ON "application_versions" ("application_id", "version");
CREATE INDEX IF NOT EXISTS "idx_app_versions_application" ON "application_versions" ("application_id");
CREATE INDEX IF NOT EXISTS "idx_app_versions_tenant" ON "application_versions" ("tenant_id");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_app_templates_code" ON "application_templates" ("code");
CREATE INDEX IF NOT EXISTS "idx_app_templates_category" ON "application_templates" ("category");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_modules_registry_code" ON "business_modules_registry" ("code");
CREATE INDEX IF NOT EXISTS "idx_modules_registry_status" ON "business_modules_registry" ("status");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_app_workflows_app_code" ON "application_workflows" ("application_id", "code");
CREATE INDEX IF NOT EXISTS "idx_app_workflows_app" ON "application_workflows" ("application_id");
