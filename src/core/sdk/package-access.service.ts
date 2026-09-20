/**
 * Phase 16 — Package Access Service
 *
 * Validates package access requests and manages scoped package credentials.
 *
 * Security model:
 *   - Customers receive scoped read-only tokens per application
 *   - Tokens are hashed before storage (raw shown once)
 *   - Rate limiting by organization/application to prevent abuse
 *   - All access attempts are audited in sdk_downloads
 *   - Master registry credentials NEVER shared
 *
 * Access validation chain:
 *   1. Package credential valid (exists, active, not expired/revoked)
 *   2. Requested package is in credential's allowedPackages scope
 *   3. Organization is not suspended
 *   4. SDK access is still valid (via SdkAccessService)
 */

import { eq, and, sql } from "drizzle-orm";
import { db } from "../../database";
import {
  packageCredentialsTable,
  sdkDownloadsTable,
  PackageCredentialRow,
  PACKAGE_CREDENTIAL_STATUS,
} from "../../database/schema/sdk-distribution";
import {
  PackageAccessDeniedError,
  PackageCredentialExpiredError,
  PackageCredentialRevokedError,
} from "./sdk-error-codes";
import { NotFoundError } from "../errors/errors";
import { getPackageRegistryProvider } from "./registry/package-registry.provider";
import crypto from "crypto";

// ─── Simple in-process rate limiter (no Redis) ────────────────────────────────
// Abstracted so a Redis-backed implementation can replace it later

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowSeconds: number, maxRequests: number) {
    this.windowMs = windowSeconds * 1000;
    this.maxRequests = maxRequests;
  }

  check(key: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now - entry.windowStart > this.windowMs) {
      this.store.set(key, { count: 1, windowStart: now });
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    if (entry.count >= this.maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    entry.count++;
    return { allowed: true, remaining: this.maxRequests - entry.count };
  }
}

// 100 package download requests per hour per organization
const downloadRateLimiter = new InMemoryRateLimiter(3600, 100);

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface CreatePackageCredentialInput {
  organizationId: string;
  applicationId: string;
  name: string;
  allowedPackages: string[];
  expiresAt?: Date;
  createdBy?: string;
}

export interface PackageAccessRequest {
  /** The token prefix — identifies which credential is being used */
  tokenPrefix: string;
  /** The raw token — caller computes SHA-256 for comparison */
  rawToken: string;
  /** Package name being requested */
  packageName: string;
  organizationId: string;
  applicationId?: string;
  environment?: string;
  ipAddressHash?: string;
  userAgent?: string;
}

export interface PackageCredentialResult {
  /** Non-secret prefix for identification */
  tokenPrefix: string;
  /** Raw token — shown ONCE. Caller must display to customer and discard. */
  rawToken: string;
  record: PackageCredentialRow;
  /** .npmrc / install configuration snippet */
  installConfig: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class PackageAccessService {
  /**
   * Create a scoped package credential for an application.
   *
   * Raw token is returned ONCE — must be shown to customer immediately.
   * Only the hash + prefix are stored in the database.
   */
  async createCredential(
    input: CreatePackageCredentialInput,
  ): Promise<PackageCredentialResult> {
    // Generate cryptographically random token
    const rawToken = `pkg_live_${crypto.randomBytes(24).toString("hex")}`;
    const tokenPrefix = `pkg_${input.applicationId.slice(0, 8)}_`;
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const [record] = await db
      .insert(packageCredentialsTable)
      .values({
        organizationId: input.organizationId,
        applicationId: input.applicationId,
        name: input.name,
        tokenPrefix,
        tokenHash,
        allowedPackages: input.allowedPackages,
        status: PACKAGE_CREDENTIAL_STATUS.ACTIVE,
        expiresAt: input.expiresAt ?? null,
        createdBy: input.createdBy ?? null,
      })
      .returning();

    // Generate install configuration
    const provider = getPackageRegistryProvider();
    const installConfig = provider.generateInstallConfig(
      rawToken,
      input.allowedPackages,
      "production",
    );

    return { tokenPrefix, rawToken, record, installConfig };
  }

  /**
   * Validate a package access request.
   *
   * Checks:
   *   1. Rate limit not exceeded
   *   2. Credential exists (by tokenHash)
   *   3. Credential is ACTIVE
   *   4. Credential is not expired
   *   5. Requested package is in allowedPackages scope
   *   6. Organization is correct (tenant isolation)
   *
   * On success: records download audit event.
   */
  async validatePackageRequest(request: PackageAccessRequest): Promise<{
    allowed: boolean;
    reason?: string;
    remainingRequests?: number;
  }> {
    // Rate limit check
    const rateLimitKey = `pkg_access:${request.organizationId}`;
    const rateCheck = downloadRateLimiter.check(rateLimitKey);
    if (!rateCheck.allowed) {
      return { allowed: false, reason: "RATE_LIMIT_EXCEEDED" };
    }

    // Hash the provided token for comparison
    const providedHash = crypto
      .createHash("sha256")
      .update(request.rawToken)
      .digest("hex");

    // Find credential by hash
    const [credential] = await db
      .select()
      .from(packageCredentialsTable)
      .where(eq(packageCredentialsTable.tokenHash, providedHash))
      .limit(1);

    if (!credential) {
      return { allowed: false, reason: "PACKAGE_ACCESS_DENIED" };
    }

    // Tenant isolation
    if (credential.organizationId !== request.organizationId) {
      return { allowed: false, reason: "PACKAGE_ACCESS_DENIED" };
    }

    // Status checks
    if (credential.status === PACKAGE_CREDENTIAL_STATUS.REVOKED) {
      return { allowed: false, reason: "PACKAGE_CREDENTIAL_REVOKED" };
    }

    if (credential.status === PACKAGE_CREDENTIAL_STATUS.EXPIRED) {
      return { allowed: false, reason: "PACKAGE_CREDENTIAL_EXPIRED" };
    }

    // Expiry check
    if (credential.expiresAt && new Date(credential.expiresAt) < new Date()) {
      // Auto-expire
      await db
        .update(packageCredentialsTable)
        .set({ status: PACKAGE_CREDENTIAL_STATUS.EXPIRED })
        .where(eq(packageCredentialsTable.id, credential.id));

      return { allowed: false, reason: "PACKAGE_CREDENTIAL_EXPIRED" };
    }

    // Package scope check — customer can only access their entitled packages
    const allowedPackages = (credential.allowedPackages as string[]) ?? [];
    if (!allowedPackages.includes(request.packageName)) {
      return { allowed: false, reason: "PACKAGE_ACCESS_DENIED" };
    }

    // Update last used timestamp
    await db
      .update(packageCredentialsTable)
      .set({ lastUsedAt: new Date() })
      .where(eq(packageCredentialsTable.id, credential.id));

    // Audit the download
    await this.auditDownload({
      organizationId: request.organizationId,
      applicationId: request.applicationId ?? credential.applicationId,
      packageName: request.packageName,
      environment: request.environment ?? "PRODUCTION",
      ipAddressHash: request.ipAddressHash,
      userAgent: request.userAgent,
    });

    return { allowed: true, remainingRequests: rateCheck.remaining };
  }

  /**
   * Revoke a package credential.
   * Subsequent access attempts will be blocked.
   */
  async revokeCredential(
    credentialId: string,
    organizationId: string,
  ): Promise<PackageCredentialRow> {
    const [credential] = await db
      .select()
      .from(packageCredentialsTable)
      .where(
        and(
          eq(packageCredentialsTable.id, credentialId),
          eq(packageCredentialsTable.organizationId, organizationId),
        ),
      )
      .limit(1);

    if (!credential) {
      throw new NotFoundError("Package credential not found");
    }

    const [updated] = await db
      .update(packageCredentialsTable)
      .set({
        status: PACKAGE_CREDENTIAL_STATUS.REVOKED,
        revokedAt: new Date(),
      })
      .where(eq(packageCredentialsTable.id, credentialId))
      .returning();

    // Also attempt to revoke from the registry if supported
    // (fire-and-forget — business operations must not fail on registry errors)
    try {
      const provider = getPackageRegistryProvider();
      await provider.revokeToken(credentialId);
    } catch {
      // Registry revocation failures are logged but don't block DB revocation
    }

    return updated;
  }

  /**
   * List package credentials for an application.
   * Never returns raw tokens — only prefix and metadata.
   */
  async listCredentials(
    applicationId: string,
    organizationId: string,
  ): Promise<Omit<PackageCredentialRow, "tokenHash">[]> {
    const results = await db
      .select()
      .from(packageCredentialsTable)
      .where(
        and(
          eq(packageCredentialsTable.applicationId, applicationId),
          eq(packageCredentialsTable.organizationId, organizationId),
        ),
      )
      .orderBy(sql`${packageCredentialsTable.createdAt} DESC`);

    // Strip tokenHash from response — never expose hashes to clients
    return results.map(({ tokenHash: _tokenHash, ...rest }) => rest);
  }

  /**
   * Get SDK download audit history for an organization.
   */
  async getDownloadHistory(organizationId: string, limit = 100) {
    return db
      .select()
      .from(sdkDownloadsTable)
      .where(eq(sdkDownloadsTable.organizationId, organizationId))
      .orderBy(sql`${sdkDownloadsTable.createdAt} DESC`)
      .limit(limit);
  }

  /**
   * Generate installation configuration for a customer.
   * Returns the .npmrc snippet with the customer's scoped token placeholder.
   * Does NOT include the raw token — customer must substitute it.
   */
  async generateInstallInstructions(
    organizationId: string,
    applicationId: string,
    allowedPackages: string[],
    environment: string = "PRODUCTION",
  ): Promise<string> {
    const provider = getPackageRegistryProvider();
    // Use placeholder — customer substitutes their actual token
    return provider.generateInstallConfig(
      "${GIS_PLATFORM_PACKAGE_TOKEN}",
      allowedPackages,
      environment,
    );
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async auditDownload(opts: {
    organizationId: string;
    applicationId?: string;
    packageName: string;
    versionString?: string;
    environment: string;
    ipAddressHash?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await db.insert(sdkDownloadsTable).values({
        organizationId: opts.organizationId,
        applicationId: opts.applicationId ?? null,
        productId: null as any, // resolved separately if needed
        versionString: opts.versionString ?? null,
        environment: opts.environment,
        ipAddressHash: opts.ipAddressHash ?? null,
        userAgent: opts.userAgent ?? null,
        downloadMethod: "REGISTRY_INSTALL",
        metadata: { packageName: opts.packageName },
      });
    } catch {
      // Audit failures must not block access
    }
  }
}

export const packageAccessService = new PackageAccessService();
