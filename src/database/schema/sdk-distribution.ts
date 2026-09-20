/**
 * Phase 16 — Private SDK Distribution, License Management,
 * Customer Provisioning & Package Access Control
 *
 * PostgreSQL + PostGIS with Drizzle ORM.
 * Strictly tenant-isolated. Multi-application architecture per organization.
 *
 * Architecture:
 *   Customer → Subscription → Entitlements → License → Application → SDK Access
 *   → Package Credentials → Private Registry → SDK Package
 *
 * Key separation of concerns:
 *   - Subscription (Phase 13): what was commercially purchased
 *   - License (Phase 16): permission to use a specific SDK software product
 *
 * Immutability rules:
 *   - RELEASED SDK versions are immutable (checksum must remain stable)
 *   - Released artifacts must NOT be overwritten (version collision prevention)
 *   - License history is never deleted (revoked/expired records retained)
 *   - Download audit records are never deleted
 *
 * Security rules:
 *   - Raw license keys are NEVER stored (hash + prefix only)
 *   - Raw package credentials are NEVER stored (hash + prefix only)
 *   - Registry master credentials are NEVER stored in the database
 *   - SECURITY_REVOKED is a distinct flag separate from DEPRECATED
 */

import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  uuid,
  jsonb,
  text,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizationsTable } from "./tenant-saas";
import { subscriptionsTable } from "./subscription";
import { applicationsTable } from "./developer-portal";
import { usersTable } from "./index";

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS & CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

// ─── SDK Product Type ─────────────────────────────────────────────────────────

export const SDK_PRODUCT_TYPE = {
  WEB_SDK: "WEB_SDK",
  MOBILE_SDK: "MOBILE_SDK",
  SERVER_SDK: "SERVER_SDK",
  CORE_LIBRARY: "CORE_LIBRARY",
  PLUGIN: "PLUGIN",
  OTHER: "OTHER",
} as const;

export type SdkProductType =
  (typeof SDK_PRODUCT_TYPE)[keyof typeof SDK_PRODUCT_TYPE];

// ─── SDK Product Status ───────────────────────────────────────────────────────

export const SDK_PRODUCT_STATUS = {
  /** Not yet published — visible only to platform admins */
  DRAFT: "DRAFT",
  /** Available for licensing and distribution */
  ACTIVE: "ACTIVE",
  /** Deprecated — still accessible but no new licenses issued */
  DEPRECATED: "DEPRECATED",
  /** Retired — no longer available for any access */
  RETIRED: "RETIRED",
} as const;

export type SdkProductStatus =
  (typeof SDK_PRODUCT_STATUS)[keyof typeof SDK_PRODUCT_STATUS];

// ─── SDK Version Status ───────────────────────────────────────────────────────

export const SDK_VERSION_STATUS = {
  /** Work in progress — not available externally */
  DRAFT: "DRAFT",
  /** Released for testing — available on beta/alpha channels */
  RELEASE_CANDIDATE: "RELEASE_CANDIDATE",
  /** Stable release — immutable once set */
  RELEASED: "RELEASED",
  /** Deprecated — still accessible but migration recommended */
  DEPRECATED: "DEPRECATED",
  /** Retired — no longer available for new installations */
  RETIRED: "RETIRED",
} as const;

export type SdkVersionStatus =
  (typeof SDK_VERSION_STATUS)[keyof typeof SDK_VERSION_STATUS];

// ─── SDK Channel ──────────────────────────────────────────────────────────────

export const SDK_CHANNEL = {
  /** Production-stable releases. Customer default. */
  STABLE: "stable",
  /** Beta releases — available to beta program participants */
  BETA: "beta",
  /** Alpha releases — early adopters / internal testing only */
  ALPHA: "alpha",
} as const;

export type SdkChannel = (typeof SDK_CHANNEL)[keyof typeof SDK_CHANNEL];

// ─── License Status ───────────────────────────────────────────────────────────

export const SDK_LICENSE_STATUS = {
  /** Issued but not yet activated */
  PENDING: "PENDING",
  /** Currently valid and in use */
  ACTIVE: "ACTIVE",
  /** Temporarily suspended (commercial hold, security incident, etc.) */
  SUSPENDED: "SUSPENDED",
  /** Past expiration date */
  EXPIRED: "EXPIRED",
  /** Permanently revoked by platform admin */
  REVOKED: "REVOKED",
} as const;

export type SdkLicenseStatus =
  (typeof SDK_LICENSE_STATUS)[keyof typeof SDK_LICENSE_STATUS];

/** Statuses that represent a currently valid license */
export const ACTIVE_LICENSE_STATUSES: SdkLicenseStatus[] = [
  SDK_LICENSE_STATUS.ACTIVE,
];

// ─── License Type ─────────────────────────────────────────────────────────────

export const SDK_LICENSE_TYPE = {
  /** Standard commercial license tied to a subscription */
  SUBSCRIPTION: "SUBSCRIPTION",
  /** Time-limited trial license */
  TRIAL: "TRIAL",
  /** Enterprise custom license */
  ENTERPRISE: "ENTERPRISE",
  /** Internal development use only — no production access */
  DEVELOPMENT: "DEVELOPMENT",
  /** Temporary evaluation license */
  EVALUATION: "EVALUATION",
} as const;

export type SdkLicenseType =
  (typeof SDK_LICENSE_TYPE)[keyof typeof SDK_LICENSE_TYPE];

// ─── License Audit Event ──────────────────────────────────────────────────────

export const LICENSE_AUDIT_EVENT = {
  CREATED: "CREATED",
  ACTIVATED: "ACTIVATED",
  SUSPENDED: "SUSPENDED",
  REACTIVATED: "REACTIVATED",
  EXPIRED: "EXPIRED",
  REVOKED: "REVOKED",
  KEY_VIEWED: "KEY_VIEWED",
  VALIDATED: "VALIDATED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
} as const;

export type LicenseAuditEvent =
  (typeof LICENSE_AUDIT_EVENT)[keyof typeof LICENSE_AUDIT_EVENT];

// ─── SDK Access Status ────────────────────────────────────────────────────────

export const SDK_ACCESS_STATUS = {
  ACTIVE: "ACTIVE",
  REVOKED: "REVOKED",
  SUSPENDED: "SUSPENDED",
} as const;

export type SdkAccessStatus =
  (typeof SDK_ACCESS_STATUS)[keyof typeof SDK_ACCESS_STATUS];

// ─── Version Policy ───────────────────────────────────────────────────────────

export const SDK_VERSION_POLICY = {
  /**
   * Install the latest compatible version for the licensed major.
   * Example: license for 1.x → always get latest 1.y.z
   */
  LATEST_COMPATIBLE: "LATEST_COMPATIBLE",
  /**
   * Pin to an exact version.
   * Example: exactly 1.4.2
   */
  FIXED_VERSION: "FIXED_VERSION",
  /**
   * Allow any version within a major range.
   * Example: any 2.x.x
   */
  MAJOR_VERSION: "MAJOR_VERSION",
} as const;

export type SdkVersionPolicy =
  (typeof SDK_VERSION_POLICY)[keyof typeof SDK_VERSION_POLICY];

// ─── Package Credential Status ────────────────────────────────────────────────

export const PACKAGE_CREDENTIAL_STATUS = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  REVOKED: "REVOKED",
} as const;

export type PackageCredentialStatus =
  (typeof PACKAGE_CREDENTIAL_STATUS)[keyof typeof PACKAGE_CREDENTIAL_STATUS];

// ─────────────────────────────────────────────────────────────────────────────
// TABLES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SDK Products Table
 *
 * Represents a distributable SDK product (e.g. "GIS Web SDK", "GIS React SDK").
 * Products are created by platform admins and never deleted.
 * Customer-facing products are those with status=ACTIVE.
 *
 * Naming: all slugs must be unique and URL-safe.
 */
export const sdkProductsTable = pgTable(
  "sdk_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Human-readable product name */
    name: varchar("name", { length: 255 }).notNull(),
    /** URL-safe unique slug: gis-web-sdk, gis-react-sdk */
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    description: text("description"),
    /** SDK product type: WEB_SDK, MOBILE_SDK, SERVER_SDK, CORE_LIBRARY, PLUGIN, OTHER */
    productType: varchar("product_type", { length: 50 })
      .notNull()
      .default(SDK_PRODUCT_TYPE.WEB_SDK),
    /** Lifecycle status: DRAFT, ACTIVE, DEPRECATED, RETIRED */
    status: varchar("status", { length: 20 })
      .notNull()
      .default(SDK_PRODUCT_STATUS.DRAFT),
    /** npm package scope, e.g. @gis-platform */
    packageScope: varchar("package_scope", { length: 100 }),
    /** Extensible metadata (homepage, repo URL, docs URL, etc.) */
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("idx_sdk_products_slug").on(table.slug),
    statusIdx: index("idx_sdk_products_status").on(table.status),
    productTypeIdx: index("idx_sdk_products_type").on(table.productType),
  }),
);

/**
 * SDK Versions Table
 *
 * Follows Semantic Versioning: MAJOR.MINOR.PATCH
 * Supports pre-release identifiers: 1.3.0-alpha.1, 1.3.0-beta.1, 1.3.0-rc.1
 *
 * Immutability rules:
 *   - Once status=RELEASED, the checksum and package contents are frozen.
 *   - Version (productId, version) has a unique constraint — no collision.
 *   - If package changes are needed: create a NEW version.
 *
 * SECURITY_REVOKED:
 *   - isSecurityRevoked=true means this version has a known security vulnerability.
 *   - This is separate from DEPRECATED — it blocks new installations immediately.
 *   - Does NOT automatically revoke existing customer access (per policy).
 */
export const sdkVersionsTable = pgTable(
  "sdk_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => sdkProductsTable.id, { onDelete: "restrict" }),
    /** Semantic version string: 1.2.3 or 1.3.0-beta.1 */
    version: varchar("version", { length: 50 }).notNull(),
    /** Lifecycle status: DRAFT, RELEASE_CANDIDATE, RELEASED, DEPRECATED, RETIRED */
    status: varchar("status", { length: 30 })
      .notNull()
      .default(SDK_VERSION_STATUS.DRAFT),
    /** Distribution channel: stable, beta, alpha */
    channel: varchar("channel", { length: 20 })
      .notNull()
      .default(SDK_CHANNEL.STABLE),
    /** Pre-release tag: alpha, beta, rc — null for stable releases */
    preRelease: varchar("pre_release", { length: 50 }),
    /** Date this version was officially released */
    releaseDate: timestamp("release_date"),
    /** Date this version was marked deprecated */
    deprecatedAt: timestamp("deprecated_at"),
    /** Date this version was fully retired */
    retiredAt: timestamp("retired_at"),
    /**
     * Security revocation flag — separate from normal DEPRECATED.
     * True = known security vulnerability. Blocks new installations.
     * Must generate a high-priority warning in developer portal.
     */
    isSecurityRevoked: boolean("is_security_revoked").notNull().default(false),
    securityRevokedAt: timestamp("security_revoked_at"),
    securityRevokedReason: text("security_revoked_reason"),
    /** Minimum platform API version this SDK requires (e.g. "v1") */
    minimumApiVersion: varchar("minimum_api_version", { length: 20 }),
    /** Maximum platform API version this SDK supports (null = no upper bound) */
    maximumApiVersion: varchar("maximum_api_version", { length: 20 }),
    /** npm/registry package name, e.g. @gis-platform/web-sdk */
    packageName: varchar("package_name", { length: 255 }),
    /** Registry identifier: github-packages, private-npm, etc. */
    packageRegistry: varchar("package_registry", { length: 100 }),
    /** SHA-256 checksum of the published package artifact */
    checksum: varchar("checksum", { length: 128 }),
    /** Git commit SHA associated with this release */
    commitSha: varchar("commit_sha", { length: 64 }),
    /** Timestamp when the build was produced */
    buildTimestamp: timestamp("build_timestamp"),
    /** Serializable package metadata (size, peer deps, exported modules, etc.) */
    packageMetadata: jsonb("package_metadata").notNull().default({}),
    /** Markdown release notes for this version */
    releaseNotes: text("release_notes"),
    /** Recommended version to migrate to (when deprecated/retired) */
    recommendedVersion: varchar("recommended_version", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    productVersionUniqueIdx: uniqueIndex("idx_sdk_versions_product_version").on(
      table.productId,
      table.version,
    ),
    productIdx: index("idx_sdk_versions_product").on(table.productId),
    versionIdx: index("idx_sdk_versions_version").on(table.version),
    statusIdx: index("idx_sdk_versions_status").on(table.status),
    channelIdx: index("idx_sdk_versions_channel").on(table.channel),
    securityRevokedIdx: index("idx_sdk_versions_security_revoked").on(
      table.isSecurityRevoked,
    ),
  }),
);

/**
 * SDK Version Compatibility Table
 *
 * Documents compatibility between SDK versions and platform API versions.
 * Used during access validation to prevent incompatible pairings.
 *
 * Example:
 *   SDK 1.x requires API v1
 *   SDK 2.x requires API v2 (with v1 backward compat)
 */
export const sdkVersionCompatibilityTable = pgTable(
  "sdk_version_compatibility",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    versionId: uuid("version_id")
      .notNull()
      .references(() => sdkVersionsTable.id, { onDelete: "cascade" }),
    /** Platform API version supported: v1, v2, etc. */
    apiVersion: varchar("api_version", { length: 20 }).notNull(),
    /** Whether this API version is fully supported (vs. partial/deprecated support) */
    isFullySupported: boolean("is_fully_supported").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    versionApiUniqueIdx: uniqueIndex("idx_sdk_version_compat_version_api").on(
      table.versionId,
      table.apiVersion,
    ),
    versionIdx: index("idx_sdk_version_compat_version").on(table.versionId),
  }),
);

/**
 * SDK Artifacts Table
 *
 * Stores package integrity metadata for each published artifact.
 * Supports future package signing (PKI) without redesigning the schema.
 *
 * Never delete artifact records — they are the audit trail for released packages.
 */
export const sdkArtifactsTable = pgTable(
  "sdk_artifacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    versionId: uuid("version_id")
      .notNull()
      .references(() => sdkVersionsTable.id, { onDelete: "restrict" }),
    /** Package file name: gis-web-sdk-1.2.3.tgz */
    fileName: varchar("file_name", { length: 255 }).notNull(),
    /** SHA-256 checksum of the artifact */
    checksum: varchar("checksum", { length: 128 }).notNull(),
    /** Algorithm used: sha256, sha512 */
    checksumAlgorithm: varchar("checksum_algorithm", { length: 20 })
      .notNull()
      .default("sha256"),
    /** Package size in bytes */
    sizeBytes: varchar("size_bytes", { length: 30 }),
    /** Registry distribution reference (e.g. GitHub Packages URL pattern) */
    registryRef: text("registry_ref"),
    /** Signature metadata for future PKI support */
    signatureMetadata: jsonb("signature_metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    versionIdx: index("idx_sdk_artifacts_version").on(table.versionId),
    checksumIdx: index("idx_sdk_artifacts_checksum").on(table.checksum),
  }),
);

/**
 * SDK Licenses Table
 *
 * Represents the commercial permission for an organization to use a specific SDK product.
 *
 * IMPORTANT: This is SEPARATE from Subscription (Phase 13):
 *   - Subscription: what the customer commercially purchased (plan, billing)
 *   - License: permission to use a specific SDK software product
 *
 * License key security:
 *   - Raw key shown ONCE at creation time — never again
 *   - Database stores: licenseKeyHash (SHA-256) + licenseKeyPrefix (first 8 chars)
 *   - Same pattern as apiKeysTable in developer-portal.ts
 *
 * License lifecycle:
 *   PENDING → ACTIVE → SUSPENDED → ACTIVE (reactivated)
 *              ↓                      ↓
 *           EXPIRED                REVOKED
 */
export const sdkLicensesTable = pgTable(
  "sdk_licenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Organization this license belongs to */
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    /** SDK product this license grants access to */
    productId: uuid("product_id")
      .notNull()
      .references(() => sdkProductsTable.id, { onDelete: "restrict" }),
    /** License lifecycle status */
    status: varchar("status", { length: 20 })
      .notNull()
      .default(SDK_LICENSE_STATUS.PENDING),
    /** License commercial type */
    licenseType: varchar("license_type", { length: 30 })
      .notNull()
      .default(SDK_LICENSE_TYPE.SUBSCRIPTION),
    /** Non-secret prefix for identification: LIC-GISWEB-a1b2c3d4 */
    licenseKeyPrefix: varchar("license_key_prefix", { length: 50 }),
    /** SHA-256 hash of the full license key — raw key is NEVER stored */
    licenseKeyHash: text("license_key_hash"),
    /** When the license was formally issued */
    issuedAt: timestamp("issued_at").defaultNow().notNull(),
    /** When the license becomes effective */
    startsAt: timestamp("starts_at").defaultNow().notNull(),
    /** When the license expires (null = no expiry) */
    expiresAt: timestamp("expires_at"),
    /** When the license was revoked */
    revokedAt: timestamp("revoked_at"),
    /** Human-readable reason for revocation */
    revokedReason: text("revoked_reason"),
    /** When the license was suspended */
    suspendedAt: timestamp("suspended_at"),
    suspendedReason: text("suspended_reason"),
    /**
     * Linked subscription — used to auto-expire license when subscription lapses.
     * Optional: TRIAL and DEVELOPMENT licenses may not have a subscription.
     */
    subscriptionId: uuid("subscription_id").references(
      () => subscriptionsTable.id,
      { onDelete: "set null" },
    ),
    /** Extensible metadata (max_seats, trial_days, custom terms, etc.) */
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("idx_sdk_licenses_organization").on(table.organizationId),
    productIdx: index("idx_sdk_licenses_product").on(table.productId),
    orgProductIdx: index("idx_sdk_licenses_org_product").on(
      table.organizationId,
      table.productId,
    ),
    statusIdx: index("idx_sdk_licenses_status").on(table.status),
    licenseKeyHashIdx: index("idx_sdk_licenses_key_hash").on(
      table.licenseKeyHash,
    ),
    subscriptionIdx: index("idx_sdk_licenses_subscription").on(
      table.subscriptionId,
    ),
    expiresIdx: index("idx_sdk_licenses_expires").on(table.expiresAt),
  }),
);

/**
 * License Entitlements Table
 *
 * Feature grants per license. Reuses Phase 13 FEATURE_CODE values.
 *
 * Example:
 *   GIS Web SDK Pro license grants:
 *     MAP, LAYERS, SPATIAL_QUERY, GEOFENCE, TRACKING, REALTIME
 *
 * The effective entitlement is resolved as:
 *   Subscription Plan entitlements ∩ License entitlements
 *   (both must be active for feature access)
 */
export const licenseEntitlementsTable = pgTable(
  "license_entitlements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    licenseId: uuid("license_id")
      .notNull()
      .references(() => sdkLicensesTable.id, { onDelete: "cascade" }),
    /** Feature code — matches Phase 13 FEATURE_CODE values */
    featureCode: varchar("feature_code", { length: 100 }).notNull(),
    isEnabled: boolean("is_enabled").notNull().default(true),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    licenseFeatureUniqueIdx: uniqueIndex(
      "idx_license_entitlements_license_feature",
    ).on(table.licenseId, table.featureCode),
    licenseIdx: index("idx_license_entitlements_license").on(table.licenseId),
    featureIdx: index("idx_license_entitlements_feature").on(table.featureCode),
  }),
);

/**
 * SDK Access Table
 *
 * Grants a specific application access to an SDK product under a license.
 *
 * Access validation checks (ALL must pass):
 *   1. License is ACTIVE
 *   2. Application is ACTIVE
 *   3. Subscription is ACTIVE (or TRIALING)
 *   4. Required entitlement is active
 *   5. SDK product is ACTIVE
 *   6. Requested version is within version policy and not security-revoked
 *
 * Version policy controls which SDK versions the application may install.
 */
export const sdkAccessTable = pgTable(
  "sdk_access",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** License this access grant is derived from */
    licenseId: uuid("license_id")
      .notNull()
      .references(() => sdkLicensesTable.id, { onDelete: "cascade" }),
    /** Application granted access */
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applicationsTable.id, { onDelete: "cascade" }),
    /** SDK product being accessed */
    productId: uuid("product_id")
      .notNull()
      .references(() => sdkProductsTable.id, { onDelete: "restrict" }),
    /** Version policy: LATEST_COMPATIBLE, FIXED_VERSION, MAJOR_VERSION */
    versionPolicy: varchar("version_policy", { length: 30 })
      .notNull()
      .default(SDK_VERSION_POLICY.LATEST_COMPATIBLE),
    /**
     * Version constraint value.
     * Meaning depends on versionPolicy:
     *   LATEST_COMPATIBLE: "1" (major version number)
     *   FIXED_VERSION: "1.4.2" (exact version)
     *   MAJOR_VERSION: "2" (any 2.x.x)
     */
    versionConstraint: varchar("version_constraint", { length: 50 }),
    /** Access grant status */
    status: varchar("status", { length: 20 })
      .notNull()
      .default(SDK_ACCESS_STATUS.ACTIVE),
    grantedAt: timestamp("granted_at").defaultNow().notNull(),
    revokedAt: timestamp("revoked_at"),
    revokedReason: text("revoked_reason"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    licenseAppProductUniqueIdx: uniqueIndex(
      "idx_sdk_access_license_app_product",
    ).on(table.licenseId, table.applicationId, table.productId),
    licenseIdx: index("idx_sdk_access_license").on(table.licenseId),
    applicationIdx: index("idx_sdk_access_application").on(table.applicationId),
    productIdx: index("idx_sdk_access_product").on(table.productId),
    statusIdx: index("idx_sdk_access_status").on(table.status),
  }),
);

/**
 * Package Credentials Table
 *
 * Scoped package access credentials per application.
 * Customers use these to authenticate against the private package registry.
 *
 * Security principles:
 *   - Raw tokens are NEVER stored (hash + prefix only)
 *   - Tokens are scoped to specific packages (not registry-wide)
 *   - Platform-owner master registry credentials are NEVER shared
 *   - Customers have READ-ONLY access — never write access
 */
export const packageCredentialsTable = pgTable(
  "package_credentials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applicationsTable.id, { onDelete: "cascade" }),
    /** Human-readable label for this credential */
    name: varchar("name", { length: 255 }).notNull(),
    /** Non-secret prefix for identification: pkg_live_a1b2c3d4 */
    tokenPrefix: varchar("token_prefix", { length: 30 }).notNull(),
    /** SHA-256 hash of the full token — raw token is NEVER stored */
    tokenHash: text("token_hash").notNull(),
    /** Packages this credential can access — JSON array of package names */
    allowedPackages: jsonb("allowed_packages").notNull().default([]),
    /** Credential status */
    status: varchar("status", { length: 20 })
      .notNull()
      .default(PACKAGE_CREDENTIAL_STATUS.ACTIVE),
    expiresAt: timestamp("expires_at"),
    revokedAt: timestamp("revoked_at"),
    lastUsedAt: timestamp("last_used_at"),
    createdBy: uuid("created_by").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("idx_package_credentials_org").on(table.organizationId),
    applicationIdx: index("idx_package_credentials_app").on(
      table.applicationId,
    ),
    statusIdx: index("idx_package_credentials_status").on(table.status),
    tokenHashIdx: index("idx_package_credentials_hash").on(table.tokenHash),
    expiresIdx: index("idx_package_credentials_expires").on(table.expiresAt),
  }),
);

/**
 * SDK Downloads Table
 *
 * Audit log for all SDK package download events.
 * Tracks package access for security, billing, and compliance purposes.
 *
 * Privacy rules:
 *   - Do NOT log raw IP addresses unless legally required
 *   - Do NOT log user credentials or tokens
 *   - Records are never deleted (append-only audit log)
 */
export const sdkDownloadsTable = pgTable(
  "sdk_downloads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "restrict" }),
    applicationId: uuid("application_id").references(
      () => applicationsTable.id,
      { onDelete: "set null" },
    ),
    productId: uuid("product_id")
      .notNull()
      .references(() => sdkProductsTable.id, { onDelete: "restrict" }),
    versionId: uuid("version_id").references(() => sdkVersionsTable.id, {
      onDelete: "set null",
    }),
    /** SDK version string at time of download */
    versionString: varchar("version_string", { length: 50 }),
    /** Application environment at time of download */
    environment: varchar("environment", { length: 20 }),
    /** Hashed IP for abuse detection (not raw) */
    ipAddressHash: varchar("ip_address_hash", { length: 128 }),
    userAgent: text("user_agent"),
    /** Download method: REGISTRY_INSTALL, DIRECT_DOWNLOAD */
    downloadMethod: varchar("download_method", { length: 30 }),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("idx_sdk_downloads_org").on(table.organizationId),
    applicationIdx: index("idx_sdk_downloads_app").on(table.applicationId),
    productIdx: index("idx_sdk_downloads_product").on(table.productId),
    versionIdx: index("idx_sdk_downloads_version").on(table.versionId),
    createdAtIdx: index("idx_sdk_downloads_created").on(table.createdAt),
  }),
);

/**
 * SDK License Audit Table
 *
 * Immutable audit log for all license lifecycle events.
 * Used for compliance, support, and security incident investigation.
 *
 * Events: CREATED, ACTIVATED, SUSPENDED, REACTIVATED, EXPIRED, REVOKED,
 *         KEY_VIEWED, VALIDATED, VALIDATION_FAILED
 */
export const sdkLicenseAuditTable = pgTable(
  "sdk_license_audit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    licenseId: uuid("license_id")
      .notNull()
      .references(() => sdkLicensesTable.id, { onDelete: "restrict" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "restrict" }),
    productId: uuid("product_id").references(() => sdkProductsTable.id, {
      onDelete: "set null",
    }),
    /** Lifecycle event type */
    event: varchar("event", { length: 50 }).notNull(),
    /** User who performed this action (null for system-automated events) */
    performedBy: uuid("performed_by").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    /** Human-readable reason or note */
    reason: text("reason"),
    /** Event-specific metadata (old status, new status, etc.) */
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    licenseIdx: index("idx_sdk_license_audit_license").on(table.licenseId),
    orgIdx: index("idx_sdk_license_audit_org").on(table.organizationId),
    eventIdx: index("idx_sdk_license_audit_event").on(table.event),
    createdAtIdx: index("idx_sdk_license_audit_created").on(table.createdAt),
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// INFERRED TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SdkProductRow = typeof sdkProductsTable.$inferSelect;
export type NewSdkProductRow = typeof sdkProductsTable.$inferInsert;

export type SdkVersionRow = typeof sdkVersionsTable.$inferSelect;
export type NewSdkVersionRow = typeof sdkVersionsTable.$inferInsert;

export type SdkVersionCompatibilityRow =
  typeof sdkVersionCompatibilityTable.$inferSelect;
export type NewSdkVersionCompatibilityRow =
  typeof sdkVersionCompatibilityTable.$inferInsert;

export type SdkArtifactRow = typeof sdkArtifactsTable.$inferSelect;
export type NewSdkArtifactRow = typeof sdkArtifactsTable.$inferInsert;

export type SdkLicenseRow = typeof sdkLicensesTable.$inferSelect;
export type NewSdkLicenseRow = typeof sdkLicensesTable.$inferInsert;

export type LicenseEntitlementRow =
  typeof licenseEntitlementsTable.$inferSelect;
export type NewLicenseEntitlementRow =
  typeof licenseEntitlementsTable.$inferInsert;

export type SdkAccessRow = typeof sdkAccessTable.$inferSelect;
export type NewSdkAccessRow = typeof sdkAccessTable.$inferInsert;

export type PackageCredentialRow = typeof packageCredentialsTable.$inferSelect;
export type NewPackageCredentialRow =
  typeof packageCredentialsTable.$inferInsert;

export type SdkDownloadRow = typeof sdkDownloadsTable.$inferSelect;
export type NewSdkDownloadRow = typeof sdkDownloadsTable.$inferInsert;

export type SdkLicenseAuditRow = typeof sdkLicenseAuditTable.$inferSelect;
export type NewSdkLicenseAuditRow = typeof sdkLicenseAuditTable.$inferInsert;
