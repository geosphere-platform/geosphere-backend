/**
 * Phase 16 — SDK Version Service
 *
 * Manages the lifecycle of SDK versions following Semantic Versioning.
 *
 * Immutability rules (enforced here AND at DB level via unique constraint):
 *   - Once a version is RELEASED, checksum and package contents are FROZEN
 *   - No re-publishing of the same version string with different contents
 *   - Version collision → SdkVersionCollisionError
 *
 * Version resolution:
 *   - LATEST_COMPATIBLE: highest released patch within the constrained major
 *   - FIXED_VERSION: exactly the pinned version
 *   - MAJOR_VERSION: any released version within the major
 *
 * Security revocation:
 *   - isSecurityRevoked=true blocks new installations immediately
 *   - Different from DEPRECATED — shows high-priority warning in portal
 *   - Does NOT auto-revoke existing access (follows migration policy)
 */

import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../../database";
import {
  sdkVersionsTable,
  sdkVersionCompatibilityTable,
  sdkArtifactsTable,
  sdkProductsTable,
  SdkVersionRow,
  SdkArtifactRow,
  SdkVersionCompatibilityRow,
  SDK_VERSION_STATUS,
  SDK_CHANNEL,
  SDK_PRODUCT_STATUS,
} from "../../database/schema/sdk-distribution";
import {
  SdkVersionNotFoundError,
  SdkVersionImmutableError,
  SdkVersionCollisionError,
  SdkVersionSecurityRevokedError,
  SdkVersionRetiredError,
  SdkProductNotFoundError,
} from "./sdk-error-codes";
import { BadRequestError, ConflictError } from "../errors/errors";

// Semver comparison helper
function parseSemver(v: string): {
  major: number;
  minor: number;
  patch: number;
  pre: string | null;
} {
  const match = v.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) throw new BadRequestError(`Invalid semantic version: '${v}'`);
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    pre: match[4] ?? null,
  };
}

/** Returns positive if a > b, negative if a < b, 0 if equal */
function compareSemver(a: string, b: string): number {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  if (pa.patch !== pb.patch) return pa.patch - pb.patch;
  // Pre-release versions sort before the release version
  if (pa.pre && !pb.pre) return -1;
  if (!pa.pre && pb.pre) return 1;
  return 0;
}

export interface CreateSdkVersionInput {
  productId: string;
  version: string;
  channel?: string;
  preRelease?: string;
  minimumApiVersion?: string;
  maximumApiVersion?: string;
  packageName?: string;
  packageRegistry?: string;
  releaseNotes?: string;
  packageMetadata?: Record<string, unknown>;
  commitSha?: string;
}

export interface ReleaseVersionInput {
  checksum: string;
  commitSha?: string;
  buildTimestamp?: Date;
  releaseNotes?: string;
  artifactFileName?: string;
  artifactSizeBytes?: string;
  registryRef?: string;
  apiCompatibility?: { apiVersion: string; isFullySupported?: boolean }[];
}

export interface SdkVersionWithCompat extends SdkVersionRow {
  compatibility: SdkVersionCompatibilityRow[];
  artifacts: SdkArtifactRow[];
}

export class SdkVersionService {
  /**
   * Create a new SDK version in DRAFT status.
   * Validates semantic versioning format.
   * Prevents version collision at application layer (DB constraint is the backup).
   */
  async createVersion(input: CreateSdkVersionInput): Promise<SdkVersionRow> {
    // Validate semver
    parseSemver(input.version);

    // Verify product exists
    const [product] = await db
      .select()
      .from(sdkProductsTable)
      .where(eq(sdkProductsTable.id, input.productId))
      .limit(1);

    if (!product) throw new SdkProductNotFoundError();

    if (
      product.status === SDK_PRODUCT_STATUS.RETIRED ||
      product.status === SDK_PRODUCT_STATUS.DEPRECATED
    ) {
      throw new BadRequestError(
        `Cannot create versions for a ${product.status} SDK product`,
      );
    }

    // Check for version collision
    const existing = await db
      .select({ id: sdkVersionsTable.id })
      .from(sdkVersionsTable)
      .where(
        and(
          eq(sdkVersionsTable.productId, input.productId),
          eq(sdkVersionsTable.version, input.version),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new SdkVersionCollisionError(input.version);
    }

    const parsed = parseSemver(input.version);
    const channel =
      input.channel ?? (parsed.pre ? SDK_CHANNEL.BETA : SDK_CHANNEL.STABLE);

    const [version] = await db
      .insert(sdkVersionsTable)
      .values({
        productId: input.productId,
        version: input.version,
        status: SDK_VERSION_STATUS.DRAFT,
        channel,
        preRelease: input.preRelease ?? parsed.pre ?? null,
        minimumApiVersion: input.minimumApiVersion ?? null,
        maximumApiVersion: input.maximumApiVersion ?? null,
        packageName: input.packageName ?? null,
        packageRegistry: input.packageRegistry ?? null,
        releaseNotes: input.releaseNotes ?? null,
        packageMetadata: input.packageMetadata ?? {},
        commitSha: input.commitSha ?? null,
      })
      .returning();

    return version;
  }

  /**
   * Promote a DRAFT version to RELEASE_CANDIDATE
   */
  async promoteToRc(versionId: string): Promise<SdkVersionRow> {
    const v = await this.getVersion(versionId);

    if (v.status !== SDK_VERSION_STATUS.DRAFT) {
      throw new BadRequestError(
        `Only DRAFT versions can be promoted to RC. Current status: ${v.status}`,
      );
    }

    const [updated] = await db
      .update(sdkVersionsTable)
      .set({
        status: SDK_VERSION_STATUS.RELEASE_CANDIDATE,
        updatedAt: new Date(),
      })
      .where(eq(sdkVersionsTable.id, versionId))
      .returning();

    return updated;
  }

  /**
   * Release a version (RC or DRAFT → RELEASED).
   * After release, the version becomes IMMUTABLE.
   * Checksum is recorded and must remain stable forever.
   */
  async releaseVersion(
    versionId: string,
    input: ReleaseVersionInput,
  ): Promise<SdkVersionRow> {
    const v = await this.getVersion(versionId);

    if (
      v.status !== SDK_VERSION_STATUS.DRAFT &&
      v.status !== SDK_VERSION_STATUS.RELEASE_CANDIDATE
    ) {
      throw new SdkVersionImmutableError();
    }

    if (!input.checksum) {
      throw new BadRequestError(
        "Checksum is required to release an SDK version",
      );
    }

    const now = new Date();

    // Record artifact
    if (input.artifactFileName) {
      await db.insert(sdkArtifactsTable).values({
        versionId,
        fileName: input.artifactFileName,
        checksum: input.checksum,
        checksumAlgorithm: "sha256",
        sizeBytes: input.artifactSizeBytes ?? null,
        registryRef: input.registryRef ?? null,
      });
    }

    // Record API compatibility
    if (input.apiCompatibility?.length) {
      await db.insert(sdkVersionCompatibilityTable).values(
        input.apiCompatibility.map((c) => ({
          versionId,
          apiVersion: c.apiVersion,
          isFullySupported: c.isFullySupported ?? true,
        })),
      );
    }

    const [updated] = await db
      .update(sdkVersionsTable)
      .set({
        status: SDK_VERSION_STATUS.RELEASED,
        releaseDate: input.buildTimestamp ?? now,
        checksum: input.checksum,
        commitSha: input.commitSha ?? v.commitSha,
        buildTimestamp: input.buildTimestamp ?? now,
        releaseNotes: input.releaseNotes ?? v.releaseNotes,
        updatedAt: now,
      })
      .where(eq(sdkVersionsTable.id, versionId))
      .returning();

    return updated;
  }

  /**
   * Deprecate a RELEASED version.
   * Deprecated versions remain accessible — migration warning shown.
   */
  async deprecateVersion(
    versionId: string,
    recommendedVersion?: string,
  ): Promise<SdkVersionRow> {
    const v = await this.getVersion(versionId);

    if (v.status !== SDK_VERSION_STATUS.RELEASED) {
      throw new BadRequestError(
        `Only RELEASED versions can be deprecated. Current status: ${v.status}`,
      );
    }

    const [updated] = await db
      .update(sdkVersionsTable)
      .set({
        status: SDK_VERSION_STATUS.DEPRECATED,
        deprecatedAt: new Date(),
        recommendedVersion: recommendedVersion ?? null,
        updatedAt: new Date(),
      })
      .where(eq(sdkVersionsTable.id, versionId))
      .returning();

    return updated;
  }

  /**
   * Retire a DEPRECATED version.
   * Retired versions are no longer available for new installations.
   */
  async retireVersion(versionId: string): Promise<SdkVersionRow> {
    const v = await this.getVersion(versionId);

    if (v.status !== SDK_VERSION_STATUS.DEPRECATED) {
      throw new BadRequestError(
        `Only DEPRECATED versions can be retired. Current status: ${v.status}`,
      );
    }

    const [updated] = await db
      .update(sdkVersionsTable)
      .set({
        status: SDK_VERSION_STATUS.RETIRED,
        retiredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sdkVersionsTable.id, versionId))
      .returning();

    return updated;
  }

  /**
   * Security-revoke a version.
   * This is an EMERGENCY action — distinct from normal deprecation.
   *
   * Effects:
   *   - Not recommended for any installations
   *   - Blocked for new installations
   *   - High-priority security warning shown to customers using it
   *   - Does NOT automatically revoke existing customer access
   */
  async securityRevokeVersion(
    versionId: string,
    reason: string,
  ): Promise<SdkVersionRow> {
    const v = await this.getVersion(versionId);

    if (v.isSecurityRevoked) {
      throw new BadRequestError("Version is already security-revoked");
    }

    const [updated] = await db
      .update(sdkVersionsTable)
      .set({
        isSecurityRevoked: true,
        securityRevokedAt: new Date(),
        securityRevokedReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(sdkVersionsTable.id, versionId))
      .returning();

    return updated;
  }

  /**
   * Get a version by ID (with compatibility and artifacts)
   */
  async getVersion(versionId: string): Promise<SdkVersionRow> {
    const [v] = await db
      .select()
      .from(sdkVersionsTable)
      .where(eq(sdkVersionsTable.id, versionId))
      .limit(1);

    if (!v) throw new SdkVersionNotFoundError();
    return v;
  }

  /**
   * Get version with full details (compatibility + artifacts)
   */
  async getVersionWithDetails(
    versionId: string,
  ): Promise<SdkVersionWithCompat> {
    const version = await this.getVersion(versionId);

    const [compatibility, artifacts] = await Promise.all([
      db
        .select()
        .from(sdkVersionCompatibilityTable)
        .where(eq(sdkVersionCompatibilityTable.versionId, versionId)),
      db
        .select()
        .from(sdkArtifactsTable)
        .where(eq(sdkArtifactsTable.versionId, versionId)),
    ]);

    return { ...version, compatibility, artifacts };
  }

  /**
   * List all versions for a product (admin view — all statuses)
   */
  async listVersionsByProduct(productId: string): Promise<SdkVersionRow[]> {
    return db
      .select()
      .from(sdkVersionsTable)
      .where(eq(sdkVersionsTable.productId, productId))
      .orderBy(desc(sdkVersionsTable.createdAt));
  }

  /**
   * List customer-visible versions for a product
   * Excludes DRAFT versions. Includes RELEASED, DEPRECATED, RETIRED (for migration info).
   */
  async listCustomerVersionsByProduct(
    productId: string,
  ): Promise<SdkVersionRow[]> {
    return db
      .select()
      .from(sdkVersionsTable)
      .where(
        and(
          eq(sdkVersionsTable.productId, productId),
          sql`${sdkVersionsTable.status} != ${SDK_VERSION_STATUS.DRAFT}`,
        ),
      )
      .orderBy(desc(sdkVersionsTable.releaseDate));
  }

  /**
   * Get the latest stable released version for a product.
   * Returns the highest semver among RELEASED versions on the stable channel.
   */
  async getLatestStableVersion(
    productId: string,
  ): Promise<SdkVersionRow | null> {
    const versions = await db
      .select()
      .from(sdkVersionsTable)
      .where(
        and(
          eq(sdkVersionsTable.productId, productId),
          eq(sdkVersionsTable.status, SDK_VERSION_STATUS.RELEASED),
          eq(sdkVersionsTable.channel, SDK_CHANNEL.STABLE),
          eq(sdkVersionsTable.isSecurityRevoked, false),
        ),
      );

    if (versions.length === 0) return null;

    // Sort by semver descending and return the highest
    return versions.sort((a, b) => compareSemver(b.version, a.version))[0];
  }

  /**
   * Resolve allowed versions based on version policy.
   *
   * @param productId - SDK product
   * @param versionPolicy - LATEST_COMPATIBLE | FIXED_VERSION | MAJOR_VERSION
   * @param versionConstraint - major number or exact version string
   * @returns list of allowable versions (sorted highest to lowest)
   */
  async resolveAllowedVersions(
    productId: string,
    versionPolicy: string,
    versionConstraint: string | null,
  ): Promise<SdkVersionRow[]> {
    // Load all released, non-retired versions
    const released = await db
      .select()
      .from(sdkVersionsTable)
      .where(
        and(
          eq(sdkVersionsTable.productId, productId),
          sql`${sdkVersionsTable.status} IN ('RELEASED', 'DEPRECATED')`,
        ),
      );

    if (released.length === 0) return [];

    let filtered: SdkVersionRow[];

    switch (versionPolicy) {
      case "FIXED_VERSION":
        filtered = released.filter((v) => v.version === versionConstraint);
        break;

      case "MAJOR_VERSION": {
        const major = parseInt(versionConstraint ?? "1", 10);
        filtered = released.filter((v) => {
          try {
            return parseSemver(v.version).major === major;
          } catch {
            return false;
          }
        });
        break;
      }

      case "LATEST_COMPATIBLE":
      default: {
        const major = parseInt(versionConstraint ?? "1", 10);
        filtered = released.filter((v) => {
          try {
            return parseSemver(v.version).major === major;
          } catch {
            return false;
          }
        });
        // For LATEST_COMPATIBLE, return only the single latest
        const sorted = filtered.sort((a, b) =>
          compareSemver(b.version, a.version),
        );
        return sorted.slice(0, 1);
      }
    }

    return filtered.sort((a, b) => compareSemver(b.version, a.version));
  }

  /**
   * Check API version compatibility for a given SDK version.
   * Returns null if compatible, error description if not.
   */
  async checkApiCompatibility(
    versionId: string,
    apiVersion: string,
  ): Promise<{ compatible: boolean; fullySupported: boolean; notes?: string }> {
    const compat = await db
      .select()
      .from(sdkVersionCompatibilityTable)
      .where(
        and(
          eq(sdkVersionCompatibilityTable.versionId, versionId),
          eq(sdkVersionCompatibilityTable.apiVersion, apiVersion),
        ),
      )
      .limit(1);

    if (compat.length === 0) {
      return { compatible: false, fullySupported: false };
    }

    return {
      compatible: true,
      fullySupported: compat[0].isFullySupported,
      notes: compat[0].notes ?? undefined,
    };
  }
}

export const sdkVersionService = new SdkVersionService();
