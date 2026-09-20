-- Phase 15 — Developer Portal, Application Registration, API Keys, SDK Client Management & License Foundation
-- Migration: 0007_add_developer_portal_tables.sql

-- ─── Applications ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id        UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  name                VARCHAR(255) NOT NULL,
  slug                VARCHAR(100) NOT NULL,
  description         TEXT,
  type                VARCHAR(50) NOT NULL DEFAULT 'WEB'
                        CHECK (type IN ('WEB', 'MOBILE', 'SERVER', 'DESKTOP', 'OTHER')),
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                        CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED', 'ARCHIVED')),
  environment         VARCHAR(20) NOT NULL DEFAULT 'DEVELOPMENT'
                        CHECK (environment IN ('DEVELOPMENT', 'STAGING', 'PRODUCTION')),
  client_id           VARCHAR(100) NOT NULL UNIQUE,
  client_secret_hash  TEXT,
  allowed_origins     JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_org_slug ON applications(organization_id, slug);
CREATE INDEX IF NOT EXISTS idx_applications_organization ON applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_applications_workspace ON applications(workspace_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_environment ON applications(environment);
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_client_id ON applications(client_id);

-- ─── API Keys ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_keys (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id     UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id        UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  name                VARCHAR(255) NOT NULL,
  key_id              VARCHAR(100) NOT NULL UNIQUE,
  prefix              VARCHAR(30) NOT NULL,
  hash                TEXT NOT NULL,
  environment         VARCHAR(20) NOT NULL DEFAULT 'DEVELOPMENT'
                        CHECK (environment IN ('DEVELOPMENT', 'STAGING', 'PRODUCTION')),
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                        CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED')),
  expires_at          TIMESTAMPTZ,
  last_used_at        TIMESTAMPTZ,
  revoked_at          TIMESTAMPTZ,
  created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_application ON api_keys(application_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_organization ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(prefix);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_key_id ON api_keys(key_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires ON api_keys(expires_at);

-- ─── API Scopes Registry ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_scopes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                VARCHAR(100) NOT NULL UNIQUE,
  name                VARCHAR(150) NOT NULL,
  description         TEXT,
  category            VARCHAR(50) NOT NULL DEFAULT 'GIS',
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_api_scopes_code ON api_scopes(code);
CREATE INDEX IF NOT EXISTS idx_api_scopes_category ON api_scopes(category);

-- ─── Application Granted Scopes ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS application_scopes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id     UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  scope_code          VARCHAR(100) NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_app_scopes_app_scope ON application_scopes(application_id, scope_code);
CREATE INDEX IF NOT EXISTS idx_app_scopes_application ON application_scopes(application_id);

-- ─── Commercial Software Licenses ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS licenses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  application_id     UUID REFERENCES applications(id) ON DELETE SET NULL,
  license_key         VARCHAR(255) NOT NULL UNIQUE,
  product_name        VARCHAR(100) NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                        CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED', 'SUSPENDED')),
  max_seats           INTEGER,
  expires_at          TIMESTAMPTZ,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_licenses_organization ON licenses(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
