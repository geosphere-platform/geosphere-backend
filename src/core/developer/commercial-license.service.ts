/**
 * Phase 15 — Commercial License Foundation Service
 *
 * Establishes license concepts (License, LicenseStatus, LicenseProvider)
 * separate from Subscriptions. Includes in-memory fallback store for offline test environments.
 */

import { eq, and, sql } from "drizzle-orm";
import { db } from "../../database";
import {
  licensesTable,
  LicenseRow,
  LICENSE_STATUS,
  LicenseStatus,
} from "../../database/schema/developer-portal";
import crypto from "crypto";

export interface CreateLicenseInput {
  organizationId: string;
  applicationId?: string;
  productName: string;
  maxSeats?: number;
  expiresAt?: Date;
}

const inMemoryLicenses = new Map<string, LicenseRow>();

export class CommercialLicenseService {
  /**
   * Issue a new Commercial License
   */
  async createLicense(input: CreateLicenseInput): Promise<LicenseRow> {
    const { organizationId, applicationId, productName, maxSeats, expiresAt } =
      input;

    const licenseKey = `LIC-${productName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

    const licenseRecord: LicenseRow = {
      id: `lic_${crypto.randomBytes(8).toString("hex")}`,
      organizationId,
      applicationId: applicationId ?? null,
      licenseKey,
      productName,
      status: LICENSE_STATUS.ACTIVE,
      maxSeats: maxSeats ?? null,
      expiresAt: expiresAt ?? null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const [license] = await db
        .insert(licensesTable)
        .values(licenseRecord)
        .returning();

      inMemoryLicenses.set(licenseKey, license);
      return license;
    } catch {
      inMemoryLicenses.set(licenseKey, licenseRecord);
      return licenseRecord;
    }
  }

  /**
   * Verify License Key
   */
  async verifyLicense(licenseKey: string): Promise<{
    isValid: boolean;
    license?: LicenseRow;
    reason?: string;
  }> {
    let license: LicenseRow | undefined;

    try {
      const licenses = await db
        .select()
        .from(licensesTable)
        .where(eq(licensesTable.licenseKey, licenseKey));
      if (licenses.length > 0) license = licenses[0];
    } catch {}

    if (!license) {
      license = inMemoryLicenses.get(licenseKey);
    }

    if (!license) {
      return { isValid: false, reason: "LICENSE_NOT_FOUND" };
    }

    if (license.status !== LICENSE_STATUS.ACTIVE) {
      return { isValid: false, reason: `LICENSE_${license.status}`, license };
    }

    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      license.status = LICENSE_STATUS.EXPIRED;
      return { isValid: false, reason: "LICENSE_EXPIRED", license };
    }

    return { isValid: true, license };
  }

  /**
   * List Organization Licenses
   */
  async listLicenses(organizationId: string): Promise<LicenseRow[]> {
    try {
      const res = await db
        .select()
        .from(licensesTable)
        .where(eq(licensesTable.organizationId, organizationId))
        .orderBy(sql`${licensesTable.createdAt} DESC`);
      if (res.length > 0) return res;
    } catch {}

    return Array.from(inMemoryLicenses.values()).filter(
      (l) => l.organizationId === organizationId,
    );
  }

  /**
   * Revoke License
   */
  async revokeLicense(
    licenseKey: string,
    organizationId: string,
  ): Promise<void> {
    try {
      await db
        .update(licensesTable)
        .set({ status: LICENSE_STATUS.REVOKED, updatedAt: new Date() })
        .where(
          and(
            eq(licensesTable.licenseKey, licenseKey),
            eq(licensesTable.organizationId, organizationId),
          ),
        );
    } catch {}

    const lic = inMemoryLicenses.get(licenseKey);
    if (lic) {
      lic.status = LICENSE_STATUS.REVOKED;
      lic.updatedAt = new Date();
    }
  }
}

export const commercialLicenseService = new CommercialLicenseService();
