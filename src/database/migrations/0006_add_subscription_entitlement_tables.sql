-- Phase 13 — Subscription, Plans, Feature Entitlements & Usage Management
-- Migration: 0006_add_subscription_entitlement_tables.sql
--
-- Creates the commercial subscription and entitlement domain tables.
-- Preserves all existing tables from previous phases.
--
-- Design decisions documented:
-- * isUnlimited boolean = explicit unlimited, NO magic numbers (999999999 forbidden)
-- * Partial unique index enforces one TRIALING or ACTIVE subscription per organization
-- * usage_records idempotency_key prevents double-counting on retries
-- * All FKs use RESTRICT or SET NULL to preserve audit trail

-- ─── Plans ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          VARCHAR(50)  NOT NULL,
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  status        VARCHAR(20)  NOT NULL DEFAULT 'DRAFT'
                  CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  is_public     BOOLEAN      NOT NULL DEFAULT TRUE,
  display_order INTEGER      NOT NULL DEFAULT 0,
  monthly_price_cents INTEGER,
  yearly_price_cents  INTEGER,
  currency      VARCHAR(3)   DEFAULT 'USD',
  metadata      JSONB        NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_plans_code
  ON plans (code);

CREATE INDEX IF NOT EXISTS idx_plans_status
  ON plans (status);

CREATE INDEX IF NOT EXISTS idx_plans_display_order
  ON plans (display_order);

-- ─── Features ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS features (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(100) NOT NULL,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  category    VARCHAR(50)  NOT NULL DEFAULT 'CORE'
                CHECK (category IN ('CORE','GIS','REALTIME','ANALYTICS','AUTOMATION','API','SDK','ADMIN','EXPORT','INTEGRATION')),
  status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                CHECK (status IN ('ACTIVE','ARCHIVED')),
  metadata    JSONB        NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_features_code
  ON features (code);

CREATE INDEX IF NOT EXISTS idx_features_category
  ON features (category);

CREATE INDEX IF NOT EXISTS idx_features_status
  ON features (status);

-- ─── Plan Features ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS plan_features (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id      UUID        NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  feature_code VARCHAR(100) NOT NULL,
  is_enabled   BOOLEAN      NOT NULL DEFAULT TRUE,
  metadata     JSONB        NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_plan_features_plan_feature
  ON plan_features (plan_id, feature_code);

CREATE INDEX IF NOT EXISTS idx_plan_features_plan_id
  ON plan_features (plan_id);

CREATE INDEX IF NOT EXISTS idx_plan_features_feature_code
  ON plan_features (feature_code);

-- ─── Plan Limits ──────────────────────────────────────────────────────────────
--
-- isUnlimited (is_unlimited): When TRUE, limit checks always return ALLOWED.
-- numeric_value is ignored when is_unlimited=TRUE.
-- DO NOT use magic numbers (999999999) for unlimited — use is_unlimited=TRUE.

CREATE TABLE IF NOT EXISTS plan_limits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id       UUID         NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  metric_code   VARCHAR(100) NOT NULL,
  numeric_value BIGINT,
  is_unlimited  BOOLEAN      NOT NULL DEFAULT FALSE,
  metadata      JSONB        NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_plan_limits_plan_metric
  ON plan_limits (plan_id, metric_code);

CREATE INDEX IF NOT EXISTS idx_plan_limits_plan_id
  ON plan_limits (plan_id);

CREATE INDEX IF NOT EXISTS idx_plan_limits_metric_code
  ON plan_limits (metric_code);

-- ─── Subscriptions ────────────────────────────────────────────────────────────
--
-- One TRIALING or ACTIVE subscription per organization (partial unique index).
-- Historical CANCELLED/EXPIRED records are retained — never hard-deleted.
-- Billing fields (billing_provider, external_customer_id, etc.) prepared for
-- future payment provider integration — NOT implemented in Phase 13.

CREATE TABLE IF NOT EXISTS subscriptions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           UUID        NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  plan_id                   UUID        NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  status                    VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                              CHECK (status IN ('TRIALING','ACTIVE','PAST_DUE','SUSPENDED','CANCELLED','EXPIRED')),
  starts_at                 TIMESTAMPTZ NOT NULL,
  ends_at                   TIMESTAMPTZ,
  trial_ends_at             TIMESTAMPTZ,
  cancelled_at              TIMESTAMPTZ,
  billing_interval          VARCHAR(20),
  currency                  VARCHAR(3),
  external_customer_id      VARCHAR(255),
  external_subscription_id  VARCHAR(255),
  billing_provider          VARCHAR(50),
  metadata                  JSONB       NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Core indexes per spec section 104
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id
  ON subscriptions (organization_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON subscriptions (status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_ends_at
  ON subscriptions (ends_at);

CREATE INDEX IF NOT EXISTS idx_subscriptions_org_status
  ON subscriptions (organization_id, status);

-- CRITICAL: Partial unique index — one active/trialing subscription per org.
-- History (CANCELLED, EXPIRED) is retained via normal rows.
-- Drizzle ORM does not support partial unique indexes, so this is raw SQL.
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_one_active_per_org
  ON subscriptions (organization_id)
  WHERE status IN ('TRIALING', 'ACTIVE');

-- ─── Organization Entitlement Overrides ──────────────────────────────────────
--
-- Custom per-organization overrides for enterprise customers.
-- Override priority:
--   1. This table (Organization Override) — HIGHEST
--   2. Plan limits/features
--   3. Default system config — LOWEST
--
-- Only platform admins may create/modify these records.
-- Platform admin changes must be audited via audit_logs.

CREATE TABLE IF NOT EXISTS organization_entitlement_overrides (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resource_code   VARCHAR(100) NOT NULL,
  override_type   VARCHAR(30)  NOT NULL DEFAULT 'LIMIT'
                    CHECK (override_type IN ('LIMIT','FEATURE_ENABLE','FEATURE_DISABLE')),
  numeric_value   BIGINT,
  is_unlimited    BOOLEAN      NOT NULL DEFAULT FALSE,
  is_enabled      BOOLEAN,
  reason          TEXT,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_ent_overrides_organization
  ON organization_entitlement_overrides (organization_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_org_ent_overrides_org_resource
  ON organization_entitlement_overrides (organization_id, resource_code, override_type);

-- ─── Usage Records ────────────────────────────────────────────────────────────
--
-- Event-based metered usage for billing preparation and limit enforcement.
--
-- Atomicity: Application uses DB-level atomic UPDATE, not read-then-write.
-- Idempotency: idempotency_key unique constraint prevents double-counting.
-- Retention: Records are NEVER deleted (audit trail for billing).
--
-- Period types:
--   monthly:  period_start = first day of month, period_end = last day
--   daily:    period_start = start of day, period_end = end of day
--   lifetime: period_start and period_end are NULL

CREATE TABLE IF NOT EXISTS usage_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID         NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  metric_code       VARCHAR(100) NOT NULL,
  value             BIGINT       NOT NULL DEFAULT 1,
  period_start      TIMESTAMPTZ,
  period_end        TIMESTAMPTZ,
  idempotency_key   VARCHAR(255),
  metadata          JSONB        NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_records_idempotency
  ON usage_records (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_usage_records_org_metric
  ON usage_records (organization_id, metric_code);

CREATE INDEX IF NOT EXISTS idx_usage_records_period
  ON usage_records (period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_usage_records_org_metric_period
  ON usage_records (organization_id, metric_code, period_start);
