-- Phase 11 — Add Generic GIS Rules, Automation & Workflow Engine Tables (PostgreSQL + PostGIS)

CREATE TABLE IF NOT EXISTS "gis_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "name" varchar(100) NOT NULL,
  "description" text,
  "status" varchar(20) NOT NULL DEFAULT 'DRAFT',
  "priority" integer NOT NULL DEFAULT 1,
  "trigger_type" varchar(50) NOT NULL,
  "scope" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "current_version" integer NOT NULL DEFAULT 1,
  "execution_policy" varchar(30) NOT NULL DEFAULT 'ALLOW_CONCURRENT',
  "cooldown_seconds" integer NOT NULL DEFAULT 0,
  "debounce_seconds" integer NOT NULL DEFAULT 0,
  "action_failure_policy" varchar(30) NOT NULL DEFAULT 'STOP_ON_FAILURE',
  "max_retries" integer NOT NULL DEFAULT 3,
  "schedule_cron" varchar(50),
  "next_scheduled_at" timestamp,
  "last_executed_at" timestamp,
  "created_by" uuid,
  "updated_by" uuid,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_gis_rules_tenant_status" ON "gis_rules" ("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "idx_gis_rules_tenant_priority" ON "gis_rules" ("tenant_id", "priority");
CREATE INDEX IF NOT EXISTS "idx_gis_rules_tenant_trigger" ON "gis_rules" ("tenant_id", "trigger_type", "status");
CREATE INDEX IF NOT EXISTS "idx_gis_rules_scheduled" ON "gis_rules" ("status", "next_scheduled_at");

CREATE TABLE IF NOT EXISTS "gis_rule_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "rule_id" uuid NOT NULL REFERENCES "gis_rules"("id") ON DELETE CASCADE,
  "tenant_id" uuid NOT NULL,
  "version" integer NOT NULL,
  "configuration" jsonb NOT NULL,
  "created_by" uuid,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_gis_rule_versions_rule_ver" ON "gis_rule_versions" ("rule_id", "version");
CREATE INDEX IF NOT EXISTS "idx_gis_rule_versions_tenant_rule" ON "gis_rule_versions" ("tenant_id", "rule_id");

CREATE TABLE IF NOT EXISTS "gis_rule_executions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "rule_id" uuid NOT NULL REFERENCES "gis_rules"("id") ON DELETE CASCADE,
  "rule_version" integer NOT NULL,
  "trigger_type" varchar(50) NOT NULL,
  "trigger_event_id" varchar(100) NOT NULL,
  "subject_id" uuid,
  "status" varchar(20) NOT NULL DEFAULT 'PENDING',
  "parent_execution_id" uuid,
  "automation_depth" integer NOT NULL DEFAULT 0,
  "started_at" timestamp NOT NULL DEFAULT now(),
  "completed_at" timestamp,
  "error" text,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_gis_rule_executions_idempotency" ON "gis_rule_executions" ("tenant_id", "rule_id", "rule_version", "trigger_event_id");
CREATE INDEX IF NOT EXISTS "idx_gis_rule_executions_tenant_rule" ON "gis_rule_executions" ("tenant_id", "rule_id");
CREATE INDEX IF NOT EXISTS "idx_gis_rule_executions_tenant_status" ON "gis_rule_executions" ("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "idx_gis_rule_executions_tenant_created" ON "gis_rule_executions" ("tenant_id", "started_at");

CREATE TABLE IF NOT EXISTS "gis_action_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "execution_id" uuid NOT NULL REFERENCES "gis_rule_executions"("id") ON DELETE CASCADE,
  "action_type" varchar(50) NOT NULL,
  "action_payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "status" varchar(20) NOT NULL DEFAULT 'PENDING',
  "attempts" integer NOT NULL DEFAULT 0,
  "max_attempts" integer NOT NULL DEFAULT 3,
  "last_attempt_at" timestamp,
  "next_attempt_at" timestamp NOT NULL DEFAULT now(),
  "last_error" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_gis_action_jobs_claim" ON "gis_action_jobs" ("status", "next_attempt_at");
CREATE INDEX IF NOT EXISTS "idx_gis_action_jobs_tenant_exec" ON "gis_action_jobs" ("tenant_id", "execution_id");

CREATE TABLE IF NOT EXISTS "gis_alerts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "rule_id" uuid,
  "rule_version" integer,
  "severity" varchar(20) NOT NULL DEFAULT 'INFO',
  "title" varchar(255) NOT NULL,
  "message" text NOT NULL,
  "subject_id" uuid,
  "subject_type" varchar(50),
  "geometry" geometry(Geometry,4326),
  "status" varchar(20) NOT NULL DEFAULT 'OPEN',
  "acknowledged_by" uuid,
  "acknowledged_at" timestamp,
  "resolved_by" uuid,
  "resolved_at" timestamp,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_gis_alerts_tenant_status" ON "gis_alerts" ("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "idx_gis_alerts_tenant_severity" ON "gis_alerts" ("tenant_id", "severity");
CREATE INDEX IF NOT EXISTS "idx_gis_alerts_tenant_subject" ON "gis_alerts" ("tenant_id", "subject_id");
CREATE INDEX IF NOT EXISTS "idx_gis_alerts_tenant_created" ON "gis_alerts" ("tenant_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_gis_alerts_geometry" ON "gis_alerts" USING GIST ("geometry");

CREATE TABLE IF NOT EXISTS "gis_tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "source_rule_id" uuid,
  "title" varchar(255) NOT NULL,
  "description" text,
  "status" varchar(20) NOT NULL DEFAULT 'OPEN',
  "priority" varchar(20) NOT NULL DEFAULT 'MEDIUM',
  "assigned_to" uuid,
  "due_at" timestamp,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_gis_tasks_tenant_status" ON "gis_tasks" ("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "idx_gis_tasks_tenant_assignee" ON "gis_tasks" ("tenant_id", "assigned_to");
CREATE INDEX IF NOT EXISTS "idx_gis_tasks_tenant_priority" ON "gis_tasks" ("tenant_id", "priority");
CREATE INDEX IF NOT EXISTS "idx_gis_tasks_tenant_created" ON "gis_tasks" ("tenant_id", "created_at");
