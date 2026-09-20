/**
 * Phase 16 — SDK Access Service
 *
 * Manages application-level SDK access grants derived from licenses.
 *
 * Access validation checklist (ALL must pass):
 *   1. License is ACTIVE and not expired
 *   2. Application is ACTIVE
 *   3. Subscription is ACTIVE (or TRIALING) — if linked
 *   4. License entitlement for the SDK feature is active
 *   5. SDK product is ACTIVE (or DEPRECATED — with warning)
 *   6. Requested version is within version policy
 *   7. Version is not security-revoked (blocks new installs)
 *   8. Version is not RETIRED (blocks all access)
 *
 * Version policy precedence:
 *   LATEST_COMPATIBLE → resolves to highest compatible semver patch
 *   FIXED_VERSION     → exactly pinned version
 *   MAJOR_VERSION     → any version in the major range
 */

import { eq, and, sql } from "drizzle-orm";
import { db } from "../../database";
import {
  sdkAccessTable,
  sdkLicensesTable,
  sdkProductsTable,
  sdkVersionsTable,
  SdkAccessRow,
  SdkVersionRow,
  SDK_ACCESS_STATUS,
  SDK_LICENSE_STATUS,
  SDK_PRODUCT_STATUS,
  SDK_VERSION_STATUS,
} from "../../database/schema/sdk-distribution";
import {
  applicationsTable,
  APPLICATION_STATUS,
} from "../../database/schema/developer-portal";
import {
  LicenseNotFoundError,
  LicenseExpiredError,
  LicenseRevokedError,
  LicenseSuspendedError,
  SdkNotEntitledError,
  SdkProductNotFoundError,
  SdkVersionNotFoundError,
  SdkVersionNotAllowedError,
  SdkVersionRetiredError,
  SdkVersionSecurityRevokedError,
  SdkAccessDeniedError,
  DuplicateProvisioningError,
} from "./sdk-error-codes";
import { licenseService } from "./license.service";
import { sdkVersionService } from "./sdk-version.service";
import { BadRequestError, NotFoundError } from "../errors/errors";

export interface GrantSdkAccessInput {
  licenseId: string;
  applicationId: string;
  productId: string;
  versionPolicy?: string;
  versionConstraint?: string;
  metadata?: Record<string, unknown>;
}

export interface SdkAccessValidationResult {
  allowed: boolean;
  accessRecord?: SdkAccessRow;
  allowedVersions?: SdkVersionRow[];
  recommendedVersion?: SdkVersionRow | null;
  reason?: string;
  /** Deprecation / security warning to surface in developer portal */
  warning?: string | null;
}

export class SdkAccessService {
  /**
   * Grant SDK access to an application under a license.
   * Idempotent: if access already exists, returns existing record.
   *
   * @throws DuplicateProvisioningError if already granted with different settings
   */
  async grantAccess(input: GrantSdkAccessInput): Promise<SdkAccessRow> {
    // Verify license is valid and belongs to the application's org
    const license = await licenseService.getLicense(input.licenseId);
    if (license.status === SDK_LICENSE_STATUS.REVOKED) {
      throw new LicenseRevokedError();
    }
    if (license.status === SDK_LICENSE_STATUS.EXPIRED) {
      throw new LicenseExpiredError();
    }

    // Verify application exists
    const [app] = await db
      .select({
        id: applicationsTable.id,
        status: applicationsTable.status,
        organizationId: applicationsTable.organizationId,
      })
      .from(applicationsTable)
      .where(eq(applicationsTable.id, input.applicationId))
      .limit(1);

    if (!app) throw new NotFoundError("Application not found");
    if (app.status !== APPLICATION_STATUS.ACTIVE) {
      throw new SdkAccessDeniedError("Application is not active");
    }

    // Verify tenant isolation — application must belong to the license's organization
    if (app.organizationId !== license.organizationId) {
      throw new SdkAccessDeniedError(
        "Application does not belong to the license organization",
      );
    }

    // Idempotency: check if access already exists
    const [existing] = await db
      .select()
      .from(sdkAccessTable)
      .where(
        and(
          eq(sdkAccessTable.licenseId, input.licenseId),
          eq(sdkAccessTable.applicationId, input.applicationId),
          eq(sdkAccessTable.productId, input.productId),
        ),
      )
      .limit(1);

    if (existing) {
      if (existing.status === SDK_ACCESS_STATUS.ACTIVE) {
        return existing; // Idempotent — return existing
      }
      // Reinstate if revoked/suspended
      const [reinstated] = await db
        .update(sdkAccessTable)
        .set({
          status: SDK_ACCESS_STATUS.ACTIVE,
          revokedAt: null,
          revokedReason: null,
          versionPolicy: input.versionPolicy ?? existing.versionPolicy,
          versionConstraint:
            input.versionConstraint ?? existing.versionConstraint,
          updatedAt: new Date(),
        })
        .where(eq(sdkAccessTable.id, existing.id))
        .returning();
      return reinstated;
    }

    // Create new access grant
    const [access] = await db
      .insert(sdkAccessTable)
      .values({
        licenseId: input.licenseId,
        applicationId: input.applicationId,
        productId: input.productId,
        versionPolicy: input.versionPolicy ?? "LATEST_COMPATIBLE",
        versionConstraint: input.versionConstraint ?? null,
        status: SDK_ACCESS_STATUS.ACTIVE,
        metadata: input.metadata ?? {},
      })
      .returning();

    return access;
  }

  /**
   * Revoke SDK access for an application.
   */
  async revokeAccess(
    accessId: string,
    reason: string,
    organizationId: string,
  ): Promise<SdkAccessRow> {
    const [access] = await db
      .select()
      .from(sdkAccessTable)
      .where(eq(sdkAccessTable.id, accessId))
      .limit(1);

    if (!access) throw new NotFoundError("SDK access record not found");

    // Verify tenant isolation
    const [license] = await db
      .select({ organizationId: sdkLicensesTable.organizationId })
      .from(sdkLicensesTable)
      .where(eq(sdkLicensesTable.id, access.licenseId))
      .limit(1);

    if (!license || license.organizationId !== organizationId) {
      throw new SdkAccessDeniedError(
        "Access record not found in your organization",
      );
    }

    const [updated] = await db
      .update(sdkAccessTable)
      .set({
        status: SDK_ACCESS_STATUS.REVOKED,
        revokedAt: new Date(),
        revokedReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(sdkAccessTable.id, accessId))
      .returning();

    return updated;
  }

  /**
   * Comprehensive access validation.
   *
   * Returns: allowed + allowedVersions + recommendedVersion + any warnings.
   * All 8 conditions are checked. First failure short-circuits.
   */
  async validateAccess(
    applicationId: string,
    productId: string,
    organizationId: string,
    requestedVersion?: string,
  ): Promise<SdkAccessValidationResult> {
    // Find active access grant for this app + product
    const [access] = await db
      .select()
      .from(sdkAccessTable)
      .innerJoin(
        sdkLicensesTable,
        eq(sdkAccessTable.licenseId, sdkLicensesTable.id),
      )
      .where(
        and(
          eq(sdkAccessTable.applicationId, applicationId),
          eq(sdkAccessTable.productId, productId),
          eq(sdkAccessTable.status, SDK_ACCESS_STATUS.ACTIVE),
          eq(sdkLicensesTable.organizationId, organizationId),
        ),
      )
      .limit(1);

    if (!access) {
      return { allowed: false, reason: "SDK_ACCESS_NOT_FOUND" };
    }

    const accessRow = access.sdk_access;
    const licenseRow = access.sdk_licenses;

    // 1. License status check
    const licenseValidation = await licenseService.validateLicense(
      licenseRow.id,
    );
    if (!licenseValidation.isValid) {
      return { allowed: false, reason: licenseValidation.reason };
    }

    // 2. SDK Product check
    const [product] = await db
      .select()
      .from(sdkProductsTable)
      .where(eq(sdkProductsTable.id, productId))
      .limit(1);

    if (!product) {
      return { allowed: false, reason: "SDK_PRODUCT_NOT_FOUND" };
    }

    if (product.status === SDK_PRODUCT_STATUS.RETIRED) {
      return { allowed: false, reason: "SDK_PRODUCT_RETIRED" };
    }

    let productWarning: string | null = null;
    if (product.status === SDK_PRODUCT_STATUS.DEPRECATED) {
      productWarning = "This SDK product is deprecated. Please plan migration.";
    }

    // 3. Resolve allowed versions
    const allowedVersions = await sdkVersionService.resolveAllowedVersions(
      productId,
      accessRow.versionPolicy,
      accessRow.versionConstraint,
    );

    // 4. Requested version validation (if specified)
    if (requestedVersion) {
      const isAllowed = allowedVersions.some(
        (v) => v.version === requestedVersion,
      );
      if (!isAllowed) {
        return {
          allowed: false,
          reason: "SDK_VERSION_NOT_ALLOWED",
          allowedVersions,
        };
      }

      // Find the specific version record
      const [versionRecord] = await db
        .select()
        .from(sdkVersionsTable)
        .where(
          and(
            eq(sdkVersionsTable.productId, productId),
            eq(sdkVersionsTable.version, requestedVersion),
          ),
        )
        .limit(1);

      if (!versionRecord) {
        return { allowed: false, reason: "SDK_VERSION_NOT_FOUND" };
      }

      if (versionRecord.status === SDK_VERSION_STATUS.RETIRED) {
        return { allowed: false, reason: "SDK_VERSION_RETIRED" };
      }

      if (versionRecord.isSecurityRevoked) {
        return {
          allowed: false,
          reason: "SDK_VERSION_SECURITY_REVOKED",
          warning: `⚠️ SECURITY: Version ${requestedVersion} has a known vulnerability. Upgrade immediately.`,
        };
      }
    }

    // 5. Recommended version
    const recommendedVersion =
      await sdkVersionService.getLatestStableVersion(productId);

    // Build warnings
    const warnings: string[] = [];
    if (productWarning) warnings.push(productWarning);

    return {
      allowed: true,
      accessRecord: accessRow,
      allowedVersions,
      recommendedVersion,
      warning: warnings.length > 0 ? warnings.join(" | ") : null,
    };
  }

  /**
   * List all SDK access grants for an organization.
   * Tenant-isolated.
   */
  async listAccessForOrganization(
    organizationId: string,
  ): Promise<SdkAccessRow[]> {
    const results = await db
      .select({ sdkAccess: sdkAccessTable })
      .from(sdkAccessTable)
      .innerJoin(
        sdkLicensesTable,
        eq(sdkAccessTable.licenseId, sdkLicensesTable.id),
      )
      .where(eq(sdkLicensesTable.organizationId, organizationId))
      .orderBy(sql`${sdkAccessTable.createdAt} DESC`);

    return results.map((r) => r.sdkAccess);
  }

  /**
   * List SDK access for a specific application.
   */
  async listAccessForApplication(
    applicationId: string,
  ): Promise<SdkAccessRow[]> {
    return db
      .select()
      .from(sdkAccessTable)
      .where(eq(sdkAccessTable.applicationId, applicationId))
      .orderBy(sql`${sdkAccessTable.createdAt} DESC`);
  }

  /**
   * Admin: list all SDK access records (platform-wide).
   */
  async listAllAccess(): Promise<SdkAccessRow[]> {
    return db
      .select()
      .from(sdkAccessTable)
      .orderBy(sql`${sdkAccessTable.createdAt} DESC`);
  }
}

export const sdkAccessService = new SdkAccessService();
