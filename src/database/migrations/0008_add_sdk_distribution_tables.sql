-- Phase 16 — Private SDK Distribution, License Management,
-- Customer Provisioning & Package Access Control
--
-- Migration: 0008_add_sdk_distribution_tables.sql
--
-- Creates tables for:
--   sdk_products, sdk_versions, sdk_version_compatibility, sdk_artifacts,
--   sdk_licenses, license_entitlements, sdk_access,
--   package_credentials, sdk_downloads, sdk_license_audit
--
-- Immutability enforcement:
--   - Unique constraint on (product_id, version) prevents version collision
--   - Released artifacts must not be overwritten (enforced at application layer)
--   - Audit tables use ON DELETE RESTRICT to preserve history
--
-- Security:
--   - No raw credentials stored anywhere in this migration
--   - license_key_hash stores SHA-256 only
--   - token_hash stores SHA-256 only

-- ─── SDK Products ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "sdk_products" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"         VARCHAR(255)  NOT NULL,
  "slug"         VARCHAR(100)  NOT NULL UNIQUE,
  "description"  TEXT,
  "product_type" VARCHAR(50)   NOT NULL DEFAULT 'WEB_SDK',
  "status"       VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
  "package_scope" VARCHAR(100),
  "metadata"     JSONB         NOT NULL DEFAULT '{}',
  "created_at"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updated_at"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT "chk_sdk_products_status" CHECK (
    "status" IN ('DRAFT', 'ACTIVE', 'DEPRECATED', 'RETIRED')
  ),
  CONSTRAINT "chk_sdk_products_type" CHECK (
    "product_type" IN ('WEB_SDK', 'MOBILE_SDK', 'SERVER_SDK', 'CORE_LIBRARY', 'PLUGIN', 'OTHER')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_sdk_products_slug"   ON "sdk_products" ("slug");
CREATE        INDEX IF NOT EXISTS "idx_sdk_products_status" ON "sdk_products" ("status");
CREATE        INDEX IF NOT EXISTS "idx_sdk_products_type"   ON "sdk_products" ("product_type");

-- ─── SDK Versions ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "sdk_versions" (
  "id"                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id"              UUID          NOT NULL REFERENCES "sdk_products" ("id") ON DELETE RESTRICT,
  "version"                 VARCHAR(50)   NOT NULL,
  "status"                  VARCHAR(30)   NOT NULL DEFAULT 'DRAFT',
  "channel"                 VARCHAR(20)   NOT NULL DEFAULT 'stable',
  "pre_release"             VARCHAR(50),
  "release_date"            TIMESTAMPTZ,
  "deprecated_at"           TIMESTAMPTZ,
  "retired_at"              TIMESTAMPTZ,
  "is_security_revoked"     BOOLEAN       NOT NULL DEFAULT FALSE,
  "security_revoked_at"     TIMESTAMPTZ,
  "security_revoked_reason" TEXT,
  "minimum_api_version"     VARCHAR(20),
  "maximum_api_version"     VARCHAR(20),
  "package_name"            VARCHAR(255),
  "package_registry"        VARCHAR(100),
  "checksum"                VARCHAR(128),
  "commit_sha"              VARCHAR(64),
  "build_timestamp"         TIMESTAMPTZ,
  "package_metadata"        JSONB         NOT NULL DEFAULT '{}',
  "release_notes"           TEXT,
  "recommended_version"     VARCHAR(50),
  "created_at"              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updated_at"              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT "chk_sdk_versions_status" CHECK (
    "status" IN ('DRAFT', 'RELEASE_CANDIDATE', 'RELEASED', 'DEPRECATED', 'RETIRED')
  ),
  CONSTRAINT "chk_sdk_versions_channel" CHECK (
    "channel" IN ('stable', 'beta', 'alpha')
  ),
  -- Immutability: no two versions of the same product can share a version string
  CONSTRAINT "uq_sdk_versions_product_version" UNIQUE ("product_id", "version")
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_sdk_versions_product_version"  ON "sdk_versions" ("product_id", "version");
CREATE        INDEX IF NOT EXISTS "idx_sdk_versions_product"          ON "sdk_versions" ("product_id");
CREATE        INDEX IF NOT EXISTS "idx_sdk_versions_version"          ON "sdk_versions" ("version");
CREATE        INDEX IF NOT EXISTS "idx_sdk_versions_status"           ON "sdk_versions" ("status");
CREATE        INDEX IF NOT EXISTS "idx_sdk_versions_channel"          ON "sdk_versions" ("channel");
CREATE        INDEX IF NOT EXISTS "idx_sdk_versions_security_revoked" ON "sdk_versions" ("is_security_revoked");

-- ─── SDK Version Compatibility ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "sdk_version_compatibility" (
  "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "version_id"          UUID          NOT NULL REFERENCES "sdk_versions" ("id") ON DELETE CASCADE,
  "api_version"         VARCHAR(20)   NOT NULL,
  "is_fully_supported"  BOOLEAN       NOT NULL DEFAULT TRUE,
  "notes"               TEXT,
  "created_at"          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT "uq_sdk_version_compat_version_api" UNIQUE ("version_id", "api_version")
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_sdk_version_compat_version_api" ON "sdk_version_compatibility" ("version_id", "api_version");
CREATE        INDEX IF NOT EXISTS "idx_sdk_version_compat_version"      ON "sdk_version_compatibility" ("version_id");

-- ─── SDK Artifacts ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "sdk_artifacts" (
  "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "version_id"          UUID          NOT NULL REFERENCES "sdk_versions" ("id") ON DELETE RESTRICT,
  "file_name"           VARCHAR(255)  NOT NULL,
  "checksum"            VARCHAR(128)  NOT NULL,
  "checksum_algorithm"  VARCHAR(20)   NOT NULL DEFAULT 'sha256',
  "size_bytes"          VARCHAR(30),
  "registry_ref"        TEXT,
  "signature_metadata"  JSONB         NOT NULL DEFAULT '{}',
  "created_at"          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_sdk_artifacts_version"  ON "sdk_artifacts" ("version_id");
CREATE INDEX IF NOT EXISTS "idx_sdk_artifacts_checksum" ON "sdk_artifacts" ("checksum");

-- ─── SDK Licenses ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "sdk_licenses" (
  "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id"     UUID          NOT NULL REFERENCES "organizations" ("id") ON DELETE CASCADE,
  "product_id"          UUID          NOT NULL REFERENCES "sdk_products" ("id") ON DELETE RESTRICT,
  "status"              VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
  "license_type"        VARCHAR(30)   NOT NULL DEFAULT 'SUBSCRIPTION',
  "license_key_prefix"  VARCHAR(50),
  "license_key_hash"    TEXT,
  "issued_at"           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "starts_at"           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "expires_at"          TIMESTAMPTZ,
  "revoked_at"          TIMESTAMPTZ,
  "revoked_reason"      TEXT,
  "suspended_at"        TIMESTAMPTZ,
  "suspended_reason"    TEXT,
  "subscription_id"     UUID          REFERENCES "subscriptions" ("id") ON DELETE SET NULL,
  "metadata"            JSONB         NOT NULL DEFAULT '{}',
  "created_at"          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updated_at"          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT "chk_sdk_licenses_status" CHECK (
    "status" IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED')
  ),
  CONSTRAINT "chk_sdk_licenses_type" CHECK (
    "license_type" IN ('SUBSCRIPTION', 'TRIAL', 'ENTERPRISE', 'DEVELOPMENT', 'EVALUATION')
  )
);

CREATE INDEX IF NOT EXISTS "idx_sdk_licenses_organization"   ON "sdk_licenses" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_sdk_licenses_product"        ON "sdk_licenses" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_sdk_licenses_org_product"    ON "sdk_licenses" ("organization_id", "product_id");
CREATE INDEX IF NOT EXISTS "idx_sdk_licenses_status"         ON "sdk_licenses" ("status");
CREATE INDEX IF NOT EXISTS "idx_sdk_licenses_key_hash"       ON "sdk_licenses" ("license_key_hash");
CREATE INDEX IF NOT EXISTS "idx_sdk_licenses_subscription"   ON "sdk_licenses" ("subscription_id");
CREATE INDEX IF NOT EXISTS "idx_sdk_licenses_expires"        ON "sdk_licenses" ("expires_at");

-- ─── License Entitlements ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "license_entitlements" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "license_id"   UUID          NOT NULL REFERENCES "sdk_licenses" ("id") ON DELETE CASCADE,
  "feature_code" VARCHAR(100)  NOT NULL,
  "is_enabled"   BOOLEAN       NOT NULL DEFAULT TRUE,
  "metadata"     JSONB         NOT NULL DEFAULT '{}',
  "created_at"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT "uq_license_entitlements_license_feature" UNIQUE ("license_id", "feature_code")
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_license_entitlements_license_feature" ON "license_entitlements" ("license_id", "feature_code");
CREATE        INDEX IF NOT EXISTS "idx_license_entitlements_license"          ON "license_entitlements" ("license_id");
CREATE        INDEX IF NOT EXISTS "idx_license_entitlements_feature"          ON "license_entitlements" ("feature_code");

-- ─── SDK Access ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "sdk_access" (
  "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "license_id"          UUID          NOT NULL REFERENCES "sdk_licenses" ("id") ON DELETE CASCADE,
  "application_id"      UUID          NOT NULL REFERENCES "applications" ("id") ON DELETE CASCADE,
  "product_id"          UUID          NOT NULL REFERENCES "sdk_products" ("id") ON DELETE RESTRICT,
  "version_policy"      VARCHAR(30)   NOT NULL DEFAULT 'LATEST_COMPATIBLE',
  "version_constraint"  VARCHAR(50),
  "status"              VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
  "granted_at"          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "revoked_at"          TIMESTAMPTZ,
  "revoked_reason"      TEXT,
  "metadata"            JSONB         NOT NULL DEFAULT '{}',
  "created_at"          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updated_at"          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT "uq_sdk_access_license_app_product" UNIQUE ("license_id", "application_id", "product_id"),
  CONSTRAINT "chk_sdk_access_version_policy" CHECK (
    "version_policy" IN ('LATEST_COMPATIBLE', 'FIXED_VERSION', 'MAJOR_VERSION')
  ),
  CONSTRAINT "chk_sdk_access_status" CHECK (
    "status" IN ('ACTIVE', 'REVOKED', 'SUSPENDED')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_sdk_access_license_app_product" ON "sdk_access" ("license_id", "application_id", "product_id");
CREATE        INDEX IF NOT EXISTS "idx_sdk_access_license"              ON "sdk_access" ("license_id");
CREATE        INDEX IF NOT EXISTS "idx_sdk_access_application"          ON "sdk_access" ("application_id");
CREATE        INDEX IF NOT EXISTS "idx_sdk_access_product"              ON "sdk_access" ("product_id");
CREATE        INDEX IF NOT EXISTS "idx_sdk_access_status"               ON "sdk_access" ("status");

-- ─── Package Credentials ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "package_credentials" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id"  UUID          NOT NULL REFERENCES "organizations" ("id") ON DELETE CASCADE,
  "application_id"   UUID          NOT NULL REFERENCES "applications" ("id") ON DELETE CASCADE,
  "name"             VARCHAR(255)  NOT NULL,
  "token_prefix"     VARCHAR(30)   NOT NULL,
  "token_hash"       TEXT          NOT NULL,
  "allowed_packages" JSONB         NOT NULL DEFAULT '[]',
  "status"           VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
  "expires_at"       TIMESTAMPTZ,
  "revoked_at"       TIMESTAMPTZ,
  "last_used_at"     TIMESTAMPTZ,
  "created_by"       UUID          REFERENCES "users" ("id") ON DELETE SET NULL,
  "created_at"       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT "chk_package_credentials_status" CHECK (
    "status" IN ('ACTIVE', 'EXPIRED', 'REVOKED')
  )
);

CREATE INDEX IF NOT EXISTS "idx_package_credentials_org"     ON "package_credentials" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_package_credentials_app"     ON "package_credentials" ("application_id");
CREATE INDEX IF NOT EXISTS "idx_package_credentials_status"  ON "package_credentials" ("status");
CREATE INDEX IF NOT EXISTS "idx_package_credentials_hash"    ON "package_credentials" ("token_hash");
CREATE INDEX IF NOT EXISTS "idx_package_credentials_expires" ON "package_credentials" ("expires_at");

-- ─── SDK Downloads ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "sdk_downloads" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id"  UUID          NOT NULL REFERENCES "organizations" ("id") ON DELETE RESTRICT,
  "application_id"   UUID          REFERENCES "applications" ("id") ON DELETE SET NULL,
  "product_id"       UUID          NOT NULL REFERENCES "sdk_products" ("id") ON DELETE RESTRICT,
  "version_id"       UUID          REFERENCES "sdk_versions" ("id") ON DELETE SET NULL,
  "version_string"   VARCHAR(50),
  "environment"      VARCHAR(20),
  "ip_address_hash"  VARCHAR(128),
  "user_agent"       TEXT,
  "download_method"  VARCHAR(30),
  "metadata"         JSONB         NOT NULL DEFAULT '{}',
  "created_at"       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_sdk_downloads_org"     ON "sdk_downloads" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_sdk_downloads_app"     ON "sdk_downloads" ("application_id");
CREATE INDEX IF NOT EXISTS "idx_sdk_downloads_product" ON "sdk_downloads" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_sdk_downloads_version" ON "sdk_downloads" ("version_id");
CREATE INDEX IF NOT EXISTS "idx_sdk_downloads_created" ON "sdk_downloads" ("created_at");

-- ─── SDK License Audit ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "sdk_license_audit" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "license_id"      UUID          NOT NULL REFERENCES "sdk_licenses" ("id") ON DELETE RESTRICT,
  "organization_id" UUID          NOT NULL REFERENCES "organizations" ("id") ON DELETE RESTRICT,
  "product_id"      UUID          REFERENCES "sdk_products" ("id") ON DELETE SET NULL,
  "event"           VARCHAR(50)   NOT NULL,
  "performed_by"    UUID          REFERENCES "users" ("id") ON DELETE SET NULL,
  "reason"          TEXT,
  "metadata"        JSONB         NOT NULL DEFAULT '{}',
  "created_at"      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT "chk_sdk_license_audit_event" CHECK (
    "event" IN (
      'CREATED', 'ACTIVATED', 'SUSPENDED', 'REACTIVATED',
      'EXPIRED', 'REVOKED', 'KEY_VIEWED', 'VALIDATED', 'VALIDATION_FAILED'
    )
  )
);

CREATE INDEX IF NOT EXISTS "idx_sdk_license_audit_license" ON "sdk_license_audit" ("license_id");
CREATE INDEX IF NOT EXISTS "idx_sdk_license_audit_org"     ON "sdk_license_audit" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_sdk_license_audit_event"   ON "sdk_license_audit" ("event");
CREATE INDEX IF NOT EXISTS "idx_sdk_license_audit_created" ON "sdk_license_audit" ("created_at");
