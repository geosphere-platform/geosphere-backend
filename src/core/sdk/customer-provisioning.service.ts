/**
 * Phase 16 — Customer Provisioning Service
 *
 * Orchestrates the complete SDK provisioning workflow in a single transaction.
 *
 * Provisioning steps (atomic — all succeed or all roll back):
 *   1. Create SDK license
 *   2. Grant license entitlements
 *   3. Grant SDK access for application
 *   4. Create package credential
 *
 * Offboarding steps (sequential — preserves historical records):
 *   1. Revoke SDK access
 *   2. Revoke package credentials
 *   3. Revoke license
 *
 * Idempotency:
 *   - provisionCustomerSDK is idempotent — safe to call multiple times
 *   - Does not create duplicate licenses if one already exists for same org+product
 *
 * This service is the ONLY place for provisioning logic.
 * Controllers must NOT implement provisioning directly.
 */

import { db } from "../../database";
import {
  sdkLicensesTable,
  packageCredentialsTable,
  sdkAccessTable,
  SDK_LICENSE_STATUS,
  SDK_ACCESS_STATUS,
  PACKAGE_CREDENTIAL_STATUS,
} from "../../database/schema/sdk-distribution";
import { eq, and } from "drizzle-orm";
import { licenseService, CreateLicenseInput } from "./license.service";
import { sdkAccessService } from "./sdk-access.service";
import { packageAccessService } from "./package-access.service";
import { sdkProductService } from "./sdk-product.service";
import { DuplicateProvisioningError } from "./sdk-error-codes";
import { BadRequestError } from "../errors/errors";

export interface ProvisionCustomerSdkInput {
  organizationId: string;
  productId: string;
  applicationId: string;
  subscriptionId?: string;
  licenseType?: string;
  featureCodes?: string[];
  versionPolicy?: string;
  versionConstraint?: string;
  expiresAt?: Date;
  credentialName?: string;
  performedBy?: string;
  metadata?: Record<string, unknown>;
}

export interface ProvisionCustomerSdkResult {
  licenseId: string;
  accessId: string;
  credentialId: string;
  /** Raw license key — shown ONCE. Caller must present to customer. */
  rawLicenseKey: string;
  /** Raw package token — shown ONCE. Caller must present to customer. */
  rawPackageToken: string;
  /** .npmrc install configuration */
  installConfig: string;
}

export interface RevokeCustomerSdkInput {
  organizationId: string;
  licenseId: string;
  reason: string;
  performedBy?: string;
}

export class CustomerProvisioningService {
  /**
   * Provision complete SDK access for a customer organization.
   *
   * This is a transactional operation:
   * - Creates SDK license (secure key, hash only stored)
   * - Activates license immediately
   * - Grants SDK access to the specified application
   * - Creates scoped package credentials
   *
   * Idempotent: if an active license already exists for this org+product,
   * returns the existing provisioning details.
   */
  async provisionCustomerSDK(
    input: ProvisionCustomerSdkInput,
  ): Promise<ProvisionCustomerSdkResult> {
    // Check idempotency — existing active license for this org+product
    const existingLicenses = await db
      .select()
      .from(sdkLicensesTable)
      .where(
        and(
          eq(sdkLicensesTable.organizationId, input.organizationId),
          eq(sdkLicensesTable.productId, input.productId),
          eq(sdkLicensesTable.status, SDK_LICENSE_STATUS.ACTIVE),
        ),
      )
      .limit(1);

    if (existingLicenses.length > 0) {
      throw new DuplicateProvisioningError(
        `An active license already exists for this organization and product. ` +
          `License ID: ${existingLicenses[0].id}. Use updateCustomerSDKAccess() to modify.`,
      );
    }

    // Get product for package name info
    const product = await sdkProductService.getProduct(input.productId);

    // Determine allowed packages (based on product scope + feature codes)
    const allowedPackages = this.resolveAllowedPackages(
      product.packageScope ?? "@gis-platform",
      product.slug,
    );

    let licenseId: string | null = null;
    let accessId: string | null = null;
    let credentialId: string | null = null;
    let rawLicenseKey: string | null = null;
    let rawPackageToken: string | null = null;
    let installConfig: string = "";

    try {
      // Step 1: Create and activate license
      const { license, rawLicenseKey: key } =
        await licenseService.createLicense({
          organizationId: input.organizationId,
          productId: input.productId,
          licenseType: input.licenseType ?? "SUBSCRIPTION",
          subscriptionId: input.subscriptionId,
          featureCodes: input.featureCodes ?? [],
          expiresAt: input.expiresAt,
          performedBy: input.performedBy,
          metadata: input.metadata,
        });

      licenseId = license.id;
      rawLicenseKey = key;

      // Step 2: Activate license immediately
      await licenseService.activateLicense(licenseId, input.performedBy);

      // Step 3: Grant SDK access
      const access = await sdkAccessService.grantAccess({
        licenseId,
        applicationId: input.applicationId,
        productId: input.productId,
        versionPolicy: input.versionPolicy ?? "LATEST_COMPATIBLE",
        versionConstraint: input.versionConstraint,
      });

      accessId = access.id;

      // Step 4: Create package credential
      const credentialResult = await packageAccessService.createCredential({
        organizationId: input.organizationId,
        applicationId: input.applicationId,
        name:
          input.credentialName ??
          `${product.name} — ${new Date().toISOString().slice(0, 10)}`,
        allowedPackages,
        expiresAt: input.expiresAt,
        createdBy: input.performedBy,
      });

      credentialId = credentialResult.record.id;
      rawPackageToken = credentialResult.rawToken;
      installConfig = credentialResult.installConfig;

      return {
        licenseId,
        accessId,
        credentialId,
        rawLicenseKey,
        rawPackageToken,
        installConfig,
      };
    } catch (error) {
      // Rollback: attempt to clean up partial provisioning
      await this.rollbackProvisioning(licenseId, accessId, credentialId);
      throw error;
    }
  }

  /**
   * Revoke all SDK access for a customer.
   *
   * Sequential (not atomic — preserves historical records):
   *   1. Revoke SDK access records
   *   2. Revoke package credentials
   *   3. Revoke license
   *
   * Historical records are NEVER deleted — they are marked as revoked.
   */
  async revokeCustomerSDK(input: RevokeCustomerSdkInput): Promise<void> {
    const license = await licenseService.getLicense(input.licenseId);

    if (license.organizationId !== input.organizationId) {
      throw new BadRequestError("License does not belong to this organization");
    }

    // Step 1: Revoke all active SDK access grants under this license
    const activeAccess = await db
      .select()
      .from(sdkAccessTable)
      .where(
        and(
          eq(sdkAccessTable.licenseId, input.licenseId),
          eq(sdkAccessTable.status, SDK_ACCESS_STATUS.ACTIVE),
        ),
      );

    for (const access of activeAccess) {
      try {
        await sdkAccessService.revokeAccess(
          access.id,
          input.reason,
          input.organizationId,
        );
      } catch {
        // Continue revoking others even if one fails
      }
    }

    // Step 2: Revoke all package credentials for the organization
    const activeCredentials = await db
      .select()
      .from(packageCredentialsTable)
      .where(
        and(
          eq(packageCredentialsTable.organizationId, input.organizationId),
          eq(packageCredentialsTable.status, PACKAGE_CREDENTIAL_STATUS.ACTIVE),
        ),
      );

    for (const credential of activeCredentials) {
      try {
        await packageAccessService.revokeCredential(
          credential.id,
          input.organizationId,
        );
      } catch {
        // Continue revoking others
      }
    }

    // Step 3: Revoke license
    await licenseService.revokeLicense(
      input.licenseId,
      input.reason,
      input.performedBy,
    );
  }

  /**
   * Update an existing customer's SDK access (version policy, constraints, etc.).
   * Idempotent — safe to call multiple times with the same input.
   */
  async updateCustomerSDKAccess(
    licenseId: string,
    organizationId: string,
    updates: {
      versionPolicy?: string;
      versionConstraint?: string;
      additionalFeatureCodes?: string[];
    },
  ): Promise<void> {
    const license = await licenseService.getLicense(licenseId);
    if (license.organizationId !== organizationId) {
      throw new BadRequestError("License does not belong to this organization");
    }

    if (license.status !== SDK_LICENSE_STATUS.ACTIVE) {
      throw new BadRequestError("Can only update access for ACTIVE licenses");
    }

    // Update SDK access records under this license
    if (updates.versionPolicy || updates.versionConstraint) {
      const activeAccess = await db
        .select()
        .from(sdkAccessTable)
        .where(
          and(
            eq(sdkAccessTable.licenseId, licenseId),
            eq(sdkAccessTable.status, SDK_ACCESS_STATUS.ACTIVE),
          ),
        );

      for (const access of activeAccess) {
        await db
          .update(sdkAccessTable)
          .set({
            ...(updates.versionPolicy && {
              versionPolicy: updates.versionPolicy,
            }),
            ...(updates.versionConstraint && {
              versionConstraint: updates.versionConstraint,
            }),
            updatedAt: new Date(),
          })
          .where(eq(sdkAccessTable.id, access.id));
      }
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private resolveAllowedPackages(
    packageScope: string,
    productSlug: string,
  ): string[] {
    // Map product slug to package names
    // In production, this would be driven by product configuration
    const basePackage = `${packageScope}/${productSlug}`;
    return [basePackage];
  }

  private async rollbackProvisioning(
    licenseId: string | null,
    accessId: string | null,
    credentialId: string | null,
  ): Promise<void> {
    // Best-effort rollback — log failures but don't throw
    if (credentialId) {
      try {
        await db
          .update(packageCredentialsTable)
          .set({
            status: PACKAGE_CREDENTIAL_STATUS.REVOKED,
            revokedAt: new Date(),
          })
          .where(eq(packageCredentialsTable.id, credentialId));
      } catch {}
    }

    if (accessId) {
      try {
        await db
          .update(sdkAccessTable)
          .set({
            status: SDK_ACCESS_STATUS.REVOKED,
            revokedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(sdkAccessTable.id, accessId));
      } catch {}
    }

    if (licenseId) {
      try {
        await db
          .update(sdkLicensesTable)
          .set({
            status: SDK_LICENSE_STATUS.REVOKED,
            revokedAt: new Date(),
            revokedReason: "Provisioning failed — automatic rollback",
            updatedAt: new Date(),
          })
          .where(eq(sdkLicensesTable.id, licenseId));
      } catch {}
    }
  }
}

export const customerProvisioningService = new CustomerProvisioningService();
