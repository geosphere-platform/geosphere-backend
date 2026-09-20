/**
 * Phase 16 — SDK License Service
 *
 * Central license lifecycle management for SDK distribution.
 *
 * License key security:
 *   - Raw key generated at creation, shown ONCE to customer, then discarded
 *   - DB stores: licenseKeyHash (SHA-256) + licenseKeyPrefix (first 8 chars)
 *   - Pattern matches existing apiKeysTable security model
 *
 * License lifecycle:
 *   PENDING → ACTIVE (activate)
 *   ACTIVE → SUSPENDED (suspend) → ACTIVE (reactivate)
 *   ACTIVE / SUSPENDED → EXPIRED (system, on expiresAt)
 *   ACTIVE / SUSPENDED → REVOKED (admin, manual)
 *
 * All lifecycle transitions are recorded in sdk_license_audit.
 *
 * Precedence for effective access:
 *   1. License status (ACTIVE required)
 *   2. License expiresAt (not expired)
 *   3. Subscription status (linked subscription must be active)
 *   4. License entitlements (feature must be enabled)
 */

import { eq, and, sql } from "drizzle-orm";
import { db } from "../../database";
import {
  sdkLicensesTable,
  sdkLicenseAuditTable,
  licenseEntitlementsTable,
  sdkProductsTable,
  SdkLicenseRow,
  LicenseEntitlementRow,
  SDK_LICENSE_STATUS,
  SDK_LICENSE_TYPE,
  LICENSE_AUDIT_EVENT,
  SDK_PRODUCT_STATUS,
} from "../../database/schema/sdk-distribution";
import {
  subscriptionsTable,
  ACTIVE_SUBSCRIPTION_STATUSES,
} from "../../database/schema/subscription";
import { organizationsTable } from "../../database/schema/tenant-saas";
import {
  LicenseNotFoundError,
  LicenseExpiredError,
  LicenseRevokedError,
  LicenseSuspendedError,
  LicensePendingError,
  SdkProductNotFoundError,
} from "./sdk-error-codes";
import { BadRequestError, ConflictError } from "../errors/errors";
import crypto from "crypto";

// Re-export for convenience
export { SDK_LICENSE_STATUS, SDK_LICENSE_TYPE };

// ─── In-memory TTL cache (no Redis required) ──────────────────────────────────
// Abstracted behind LicenseCacheProvider for future Redis swap-in

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class InMemoryTtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;

  constructor(ttlSeconds: number) {
    this.ttlMs = ttlSeconds * 1000;
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }
}

// License validation cache — 60 second TTL
// When license status changes, cache is invalidated immediately
const licenseValidationCache = new InMemoryTtlCache<{
  isValid: boolean;
  reason?: string;
}>(60);

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface CreateLicenseInput {
  organizationId: string;
  productId: string;
  licenseType?: string;
  subscriptionId?: string;
  startsAt?: Date;
  expiresAt?: Date;
  featureCodes?: string[];
  metadata?: Record<string, unknown>;
  /** User performing the action (for audit) */
  performedBy?: string;
}

export interface LicenseValidationResult {
  isValid: boolean;
  license?: SdkLicenseRow;
  entitlements?: LicenseEntitlementRow[];
  reason?: string;
  /** Warning to display if deprecated/security-revoked */
  warning?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class LicenseService {
  /**
   * Create a new SDK license.
   *
   * Generates a license key, stores only the hash + prefix.
   * Returns the raw key ONCE — caller must display it to the customer.
   *
   * @returns { license, rawLicenseKey } — rawLicenseKey is shown ONCE only
   */
  async createLicense(input: CreateLicenseInput): Promise<{
    license: SdkLicenseRow;
    rawLicenseKey: string;
  }> {
    // Verify product exists and is active
    const [product] = await db
      .select()
      .from(sdkProductsTable)
      .where(eq(sdkProductsTable.id, input.productId))
      .limit(1);

    if (!product) throw new SdkProductNotFoundError();
    if (product.status === SDK_PRODUCT_STATUS.RETIRED) {
      throw new BadRequestError(
        "Cannot issue a license for a retired SDK product",
      );
    }

    // Generate secure license key — never predictable
    const rawSecret = crypto.randomBytes(32).toString("hex");
    const prefix = `LIC-${product.slug.slice(0, 6).toUpperCase().replace(/-/g, "")}-`;
    const rawKey = `${prefix}${rawSecret.slice(0, 16).toUpperCase()}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.slice(0, Math.min(rawKey.indexOf("-", 8) + 9, 20));

    const [license] = await db
      .insert(sdkLicensesTable)
      .values({
        organizationId: input.organizationId,
        productId: input.productId,
        status: SDK_LICENSE_STATUS.PENDING,
        licenseType: input.licenseType ?? SDK_LICENSE_TYPE.SUBSCRIPTION,
        licenseKeyPrefix: keyPrefix,
        licenseKeyHash: keyHash,
        startsAt: input.startsAt ?? new Date(),
        expiresAt: input.expiresAt ?? null,
        subscriptionId: input.subscriptionId ?? null,
        metadata: input.metadata ?? {},
      })
      .returning();

    // Grant entitlements
    if (input.featureCodes?.length) {
      await db.insert(licenseEntitlementsTable).values(
        input.featureCodes.map((code) => ({
          licenseId: license.id,
          featureCode: code,
          isEnabled: true,
        })),
      );
    }

    // Audit
    await this.recordAudit(license.id, input.organizationId, input.productId, {
      event: LICENSE_AUDIT_EVENT.CREATED,
      performedBy: input.performedBy,
    });

    return { license, rawLicenseKey: rawKey };
  }

  /**
   * Activate a PENDING license.
   * Checks that the start date has arrived.
   */
  async activateLicense(
    licenseId: string,
    performedBy?: string,
  ): Promise<SdkLicenseRow> {
    const license = await this.getLicense(licenseId);

    if (license.status === SDK_LICENSE_STATUS.ACTIVE) {
      throw new ConflictError("License is already active");
    }
    if (license.status !== SDK_LICENSE_STATUS.PENDING) {
      throw new BadRequestError(
        `Only PENDING licenses can be activated. Current: ${license.status}`,
      );
    }
    if (new Date(license.startsAt) > new Date()) {
      throw new BadRequestError("License start date has not arrived yet");
    }

    const [updated] = await db
      .update(sdkLicensesTable)
      .set({ status: SDK_LICENSE_STATUS.ACTIVE, updatedAt: new Date() })
      .where(eq(sdkLicensesTable.id, licenseId))
      .returning();

    licenseValidationCache.invalidate(licenseId);

    await this.recordAudit(
      licenseId,
      license.organizationId,
      license.productId,
      {
        event: LICENSE_AUDIT_EVENT.ACTIVATED,
        performedBy,
      },
    );

    return updated;
  }

  /**
   * Suspend an ACTIVE license (temporary hold).
   * Suspended licenses block SDK access but retain their records.
   */
  async suspendLicense(
    licenseId: string,
    reason: string,
    performedBy?: string,
  ): Promise<SdkLicenseRow> {
    const license = await this.getLicense(licenseId);

    if (license.status !== SDK_LICENSE_STATUS.ACTIVE) {
      throw new BadRequestError(
        `Only ACTIVE licenses can be suspended. Current: ${license.status}`,
      );
    }

    const [updated] = await db
      .update(sdkLicensesTable)
      .set({
        status: SDK_LICENSE_STATUS.SUSPENDED,
        suspendedAt: new Date(),
        suspendedReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(sdkLicensesTable.id, licenseId))
      .returning();

    licenseValidationCache.invalidate(licenseId);

    await this.recordAudit(
      licenseId,
      license.organizationId,
      license.productId,
      {
        event: LICENSE_AUDIT_EVENT.SUSPENDED,
        performedBy,
        reason,
      },
    );

    return updated;
  }

  /**
   * Reactivate a SUSPENDED license.
   */
  async reactivateLicense(
    licenseId: string,
    performedBy?: string,
  ): Promise<SdkLicenseRow> {
    const license = await this.getLicense(licenseId);

    if (license.status !== SDK_LICENSE_STATUS.SUSPENDED) {
      throw new BadRequestError(
        `Only SUSPENDED licenses can be reactivated. Current: ${license.status}`,
      );
    }

    const [updated] = await db
      .update(sdkLicensesTable)
      .set({
        status: SDK_LICENSE_STATUS.ACTIVE,
        suspendedAt: null,
        suspendedReason: null,
        updatedAt: new Date(),
      })
      .where(eq(sdkLicensesTable.id, licenseId))
      .returning();

    licenseValidationCache.invalidate(licenseId);

    await this.recordAudit(
      licenseId,
      license.organizationId,
      license.productId,
      {
        event: LICENSE_AUDIT_EVENT.REACTIVATED,
        performedBy,
      },
    );

    return updated;
  }

  /**
   * Permanently revoke a license.
   * Revoked licenses can never be reactivated.
   * Access is blocked immediately.
   */
  async revokeLicense(
    licenseId: string,
    reason: string,
    performedBy?: string,
  ): Promise<SdkLicenseRow> {
    const license = await this.getLicense(licenseId);

    if (license.status === SDK_LICENSE_STATUS.REVOKED) {
      throw new ConflictError("License is already revoked");
    }
    if (license.status === SDK_LICENSE_STATUS.EXPIRED) {
      throw new BadRequestError(
        "Expired licenses cannot be revoked; they are already inactive",
      );
    }

    const [updated] = await db
      .update(sdkLicensesTable)
      .set({
        status: SDK_LICENSE_STATUS.REVOKED,
        revokedAt: new Date(),
        revokedReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(sdkLicensesTable.id, licenseId))
      .returning();

    licenseValidationCache.invalidate(licenseId);

    await this.recordAudit(
      licenseId,
      license.organizationId,
      license.productId,
      {
        event: LICENSE_AUDIT_EVENT.REVOKED,
        performedBy,
        reason,
      },
    );

    return updated;
  }

  /**
   * Expire a license (system-triggered when expiresAt has passed).
   * This is idempotent — safe to call multiple times.
   */
  async expireLicense(licenseId: string): Promise<SdkLicenseRow | null> {
    const license = await this.getLicense(licenseId);

    if (license.status === SDK_LICENSE_STATUS.EXPIRED) return license;
    if (
      license.status === SDK_LICENSE_STATUS.REVOKED ||
      license.status === SDK_LICENSE_STATUS.PENDING
    ) {
      return license;
    }

    if (!license.expiresAt || new Date(license.expiresAt) > new Date()) {
      return license; // not expired yet
    }

    const [updated] = await db
      .update(sdkLicensesTable)
      .set({ status: SDK_LICENSE_STATUS.EXPIRED, updatedAt: new Date() })
      .where(eq(sdkLicensesTable.id, licenseId))
      .returning();

    licenseValidationCache.invalidate(licenseId);

    await this.recordAudit(
      licenseId,
      license.organizationId,
      license.productId,
      {
        event: LICENSE_AUDIT_EVENT.EXPIRED,
      },
    );

    return updated;
  }

  /**
   * Validate a license — checks all conditions.
   * Uses short-lived cache (60s TTL) to reduce DB load.
   * Cache is invalidated on any status change.
   *
   * Checks:
   *   1. License exists
   *   2. Status is ACTIVE
   *   3. Not expired (expiresAt)
   *   4. Linked subscription is active (if present)
   */
  async validateLicense(licenseId: string): Promise<LicenseValidationResult> {
    const cached = licenseValidationCache.get(licenseId);
    if (cached) {
      if (cached.isValid) {
        // Re-fetch full details for entitlements (cache only stores validation decision)
        const license = await this.getLicense(licenseId);
        const entitlements = await this.getLicenseEntitlements(licenseId);
        return { isValid: true, license, entitlements };
      }
      return cached;
    }

    let license: SdkLicenseRow;
    try {
      license = await this.getLicense(licenseId);
    } catch {
      const result = { isValid: false, reason: "LICENSE_NOT_FOUND" };
      licenseValidationCache.set(licenseId, result);

      await this.recordValidationFailure(licenseId, "LICENSE_NOT_FOUND");
      return result;
    }

    // Status checks
    if (license.status === SDK_LICENSE_STATUS.PENDING) {
      const result = { isValid: false, reason: "LICENSE_PENDING" };
      licenseValidationCache.set(licenseId, result);
      return result;
    }

    if (license.status === SDK_LICENSE_STATUS.SUSPENDED) {
      const result = { isValid: false, reason: "LICENSE_SUSPENDED" };
      licenseValidationCache.set(licenseId, result);
      await this.recordValidationFailure(
        licenseId,
        "LICENSE_SUSPENDED",
        license,
      );
      return result;
    }

    if (license.status === SDK_LICENSE_STATUS.REVOKED) {
      const result = { isValid: false, reason: "LICENSE_REVOKED" };
      licenseValidationCache.set(licenseId, result);
      await this.recordValidationFailure(licenseId, "LICENSE_REVOKED", license);
      return result;
    }

    if (license.status === SDK_LICENSE_STATUS.EXPIRED) {
      const result = { isValid: false, reason: "LICENSE_EXPIRED" };
      licenseValidationCache.set(licenseId, result);
      await this.recordValidationFailure(licenseId, "LICENSE_EXPIRED", license);
      return result;
    }

    // Expiry check (auto-expire if needed)
    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      await this.expireLicense(licenseId);
      const result = { isValid: false, reason: "LICENSE_EXPIRED" };
      licenseValidationCache.set(licenseId, result);
      return result;
    }

    // Subscription check (if linked)
    if (license.subscriptionId) {
      const [sub] = await db
        .select({ status: subscriptionsTable.status })
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.id, license.subscriptionId))
        .limit(1);

      if (!sub || !ACTIVE_SUBSCRIPTION_STATUSES.includes(sub.status as any)) {
        const result = { isValid: false, reason: "SUBSCRIPTION_NOT_ACTIVE" };
        licenseValidationCache.set(licenseId, result);
        return result;
      }
    }

    // Valid!
    licenseValidationCache.set(licenseId, { isValid: true });

    await db.insert(sdkLicenseAuditTable).values({
      licenseId: license.id,
      organizationId: license.organizationId,
      productId: license.productId,
      event: LICENSE_AUDIT_EVENT.VALIDATED,
    });

    const entitlements = await this.getLicenseEntitlements(licenseId);
    return { isValid: true, license, entitlements };
  }

  /**
   * Get license by ID
   */
  async getLicense(licenseId: string): Promise<SdkLicenseRow> {
    const [license] = await db
      .select()
      .from(sdkLicensesTable)
      .where(eq(sdkLicensesTable.id, licenseId))
      .limit(1);

    if (!license) throw new LicenseNotFoundError();
    return license;
  }

  /**
   * List licenses for an organization
   */
  async listLicenses(organizationId: string): Promise<SdkLicenseRow[]> {
    return db
      .select()
      .from(sdkLicensesTable)
      .where(eq(sdkLicensesTable.organizationId, organizationId))
      .orderBy(sql`${sdkLicensesTable.createdAt} DESC`);
  }

  /**
   * List licenses for an organization and product
   */
  async listLicensesByProduct(
    organizationId: string,
    productId: string,
  ): Promise<SdkLicenseRow[]> {
    return db
      .select()
      .from(sdkLicensesTable)
      .where(
        and(
          eq(sdkLicensesTable.organizationId, organizationId),
          eq(sdkLicensesTable.productId, productId),
        ),
      )
      .orderBy(sql`${sdkLicensesTable.createdAt} DESC`);
  }

  /**
   * Get entitlements for a license
   */
  async getLicenseEntitlements(
    licenseId: string,
  ): Promise<LicenseEntitlementRow[]> {
    return db
      .select()
      .from(licenseEntitlementsTable)
      .where(eq(licenseEntitlementsTable.licenseId, licenseId));
  }

  /**
   * Check if a specific feature is enabled for a license
   */
  async isFeatureEnabled(
    licenseId: string,
    featureCode: string,
  ): Promise<boolean> {
    const [entitlement] = await db
      .select()
      .from(licenseEntitlementsTable)
      .where(
        and(
          eq(licenseEntitlementsTable.licenseId, licenseId),
          eq(licenseEntitlementsTable.featureCode, featureCode),
          eq(licenseEntitlementsTable.isEnabled, true),
        ),
      )
      .limit(1);

    return !!entitlement;
  }

  /**
   * Get license audit log
   */
  async getLicenseAuditLog(licenseId: string) {
    return db
      .select()
      .from(sdkLicenseAuditTable)
      .where(eq(sdkLicenseAuditTable.licenseId, licenseId))
      .orderBy(sql`${sdkLicenseAuditTable.createdAt} DESC`);
  }

  /**
   * Admin: list all licenses (platform-wide)
   */
  async listAllLicenses(): Promise<SdkLicenseRow[]> {
    return db
      .select()
      .from(sdkLicensesTable)
      .orderBy(sql`${sdkLicensesTable.createdAt} DESC`);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async recordAudit(
    licenseId: string,
    organizationId: string,
    productId: string | null,
    opts: {
      event: string;
      performedBy?: string;
      reason?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    try {
      await db.insert(sdkLicenseAuditTable).values({
        licenseId,
        organizationId,
        productId: productId ?? undefined,
        event: opts.event,
        performedBy: opts.performedBy ?? null,
        reason: opts.reason ?? null,
        metadata: opts.metadata ?? {},
      });
    } catch {
      // Audit failures must not block business operations
    }
  }

  private async recordValidationFailure(
    licenseId: string,
    reason: string,
    license?: SdkLicenseRow,
  ): Promise<void> {
    if (!license) return;
    try {
      await db.insert(sdkLicenseAuditTable).values({
        licenseId,
        organizationId: license.organizationId,
        productId: license.productId,
        event: LICENSE_AUDIT_EVENT.VALIDATION_FAILED,
        metadata: { reason },
      });
    } catch {
      // Audit failures must not block business operations
    }
  }
}

export const licenseService = new LicenseService();

// ─── Re-export for backward compatibility with Phase 15 ───────────────────────
// CommercialLicenseService now delegates to LicenseService
export { licenseService as commercialLicenseServiceV2 };
