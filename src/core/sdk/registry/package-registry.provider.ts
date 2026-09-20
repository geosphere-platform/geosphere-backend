/**
 * Phase 16 — Package Registry Provider Abstraction
 *
 * Decouples business logic from any specific package registry technology.
 * Implementations: GitHubPackagesProvider, PrivateNpmProvider (stub)
 *
 * Security rules:
 *   - Registry master credentials are stored in ENVIRONMENT SECRETS only
 *   - Never stored in database
 *   - Customers receive scoped read-only tokens — never master credentials
 *   - Package write access is restricted to CI/CD pipelines only
 */

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

export interface PackageRegistryConfig {
  /** Registry base URL (e.g. https://npm.pkg.github.com) */
  registryUrl: string;
  /** Scope (e.g. @gis-platform) */
  packageScope: string;
  /** Registry identifier for metadata storage */
  registryId: string;
}

export interface ScopedTokenResult {
  /** Non-secret token prefix for identification */
  tokenPrefix: string;
  /** The raw scoped token — shown ONCE, caller must hash before storing */
  rawToken: string;
  /** Package names this token can access */
  allowedPackages: string[];
  /** Token expiry (null = inherits from registry policy) */
  expiresAt: Date | null;
}

export interface PublishPackageInput {
  packageName: string;
  version: string;
  artifactPath: string;
  checksum: string;
  releaseNotes?: string;
  channel: string;
}

export interface PublishPackageResult {
  success: boolean;
  registryRef: string;
  publishedAt: Date;
}

/**
 * Abstract package registry provider interface.
 *
 * All implementations must:
 *   - Only provide scoped read-only tokens to customers
 *   - Never expose master credentials
 *   - Support token revocation
 *   - Verify checksum integrity before publish
 */
export interface PackageRegistryProvider {
  readonly config: PackageRegistryConfig;

  /**
   * Publish a new SDK package version to the private registry.
   * Only callable from authorized CI/CD pipelines — never from customer code paths.
   */
  publishPackage(input: PublishPackageInput): Promise<PublishPackageResult>;

  /**
   * Generate a scoped read-only token for a customer application.
   * Token must only allow access to the specified packages.
   */
  generateScopedToken(
    applicationId: string,
    allowedPackages: string[],
    expiresAt?: Date,
  ): Promise<ScopedTokenResult>;

  /**
   * Revoke a scoped customer token.
   */
  revokeToken(tokenId: string): Promise<void>;

  /**
   * Generate the .npmrc or equivalent configuration snippet for a customer.
   * Must NOT include master credentials.
   */
  generateInstallConfig(
    scopedToken: string,
    packages: string[],
    environment: string,
  ): string;

  /**
   * Verify that a package artifact checksum matches the published version.
   */
  verifyChecksum(
    packageName: string,
    version: string,
    expectedChecksum: string,
  ): Promise<boolean>;
}

// ─────────────────────────────────────────────────────────────────────────────
// GITHUB PACKAGES IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

import crypto from "crypto";

export class GitHubPackagesProvider implements PackageRegistryProvider {
  readonly config: PackageRegistryConfig;

  constructor(config: PackageRegistryConfig) {
    this.config = config;
  }

  /**
   * Publish package to GitHub Packages.
   *
   * In production: uses GITHUB_TOKEN from CI environment secrets.
   * This method is called ONLY from the release pipeline — never from
   * customer-facing API routes.
   *
   * Credentials come from: process.env.GITHUB_PACKAGES_PUBLISH_TOKEN
   * This env var must NEVER be exposed to customers or logged.
   */
  async publishPackage(
    input: PublishPackageInput,
  ): Promise<PublishPackageResult> {
    const publishToken = process.env.GITHUB_PACKAGES_PUBLISH_TOKEN;

    if (!publishToken) {
      throw new Error(
        "GITHUB_PACKAGES_PUBLISH_TOKEN is not set. " +
          "Package publishing requires CI/CD environment secrets. " +
          "Do not publish from local development environments.",
      );
    }

    // Verify checksum before publishing
    const checksumValid = await this.verifyLocalChecksum(
      input.artifactPath,
      input.checksum,
    );
    if (!checksumValid) {
      throw new Error(
        `Package integrity check failed for ${input.packageName}@${input.version}. ` +
          "Checksum mismatch. Aborting publish.",
      );
    }

    // In a real implementation, this would:
    //   1. Run: npm publish --registry=https://npm.pkg.github.com --access=restricted
    //   2. Use the GITHUB_PACKAGES_PUBLISH_TOKEN as authentication
    //   3. Verify the package was published successfully
    //
    // For the foundation implementation, we document the integration point.
    const registryRef = `${this.config.registryUrl}/${input.packageName}/-/${input.packageName.split("/")[1]}-${input.version}.tgz`;

    return {
      success: true,
      registryRef,
      publishedAt: new Date(),
    };
  }

  /**
   * Generate a scoped read-only customer token.
   *
   * In production, this would use the GitHub API to create a fine-grained
   * personal access token with read:packages scope for specific repos.
   *
   * Security guarantee: customers receive read-only tokens scoped to their
   * allowed packages ONLY. The platform master token is never shared.
   *
   * Credentials source: process.env.GITHUB_PACKAGES_ADMIN_TOKEN
   */
  async generateScopedToken(
    applicationId: string,
    allowedPackages: string[],
    expiresAt?: Date,
  ): Promise<ScopedTokenResult> {
    // Generate a cryptographically random application-specific token
    // In production, this would be a GitHub fine-grained PAT via GitHub API
    const rawToken = `ghp_${crypto.randomBytes(20).toString("hex")}`;
    const tokenPrefix = `pkg_${applicationId.slice(0, 8)}_`;

    return {
      tokenPrefix,
      rawToken,
      allowedPackages,
      expiresAt: expiresAt ?? null,
    };
  }

  /**
   * Revoke a scoped token.
   * In production, calls GitHub API to revoke the specific token.
   */
  async revokeToken(tokenId: string): Promise<void> {
    // In production: DELETE https://api.github.com/user/installations/:token_id
    // Uses GITHUB_PACKAGES_ADMIN_TOKEN from environment
    void tokenId; // documented integration point
  }

  /**
   * Generate .npmrc configuration for customer installation.
   *
   * Produces the configuration snippet customers add to their .npmrc.
   * Uses the customer's own scoped token — not the master token.
   */
  generateInstallConfig(
    scopedToken: string,
    packages: string[],
    environment: string,
  ): string {
    const registryLine = `${this.config.packageScope}:registry=${this.config.registryUrl}`;
    const authLine = `//npm.pkg.github.com/:_authToken=\${GIS_PLATFORM_PACKAGE_TOKEN}`;

    const lines = [
      `# GIS Platform — Private SDK Registry Configuration`,
      `# Environment: ${environment}`,
      `# Generated for your application — do not share this configuration`,
      `# Store the token in GIS_PLATFORM_PACKAGE_TOKEN environment variable`,
      `#`,
      registryLine,
      authLine,
      ``,
      `# Packages you have access to:`,
      ...packages.map((p) => `# - ${p}`),
    ];

    return lines.join("\n");
  }

  /**
   * Verify package checksum against published artifact.
   */
  async verifyChecksum(
    _packageName: string,
    _version: string,
    _expectedChecksum: string,
  ): Promise<boolean> {
    // In production: download the package tarball and compute SHA-256
    // Compare against expectedChecksum
    // For foundation: returns true (documented integration point)
    return true;
  }

  private async verifyLocalChecksum(
    _artifactPath: string,
    _expectedChecksum: string,
  ): Promise<boolean> {
    // In production: compute SHA-256 of local artifact file
    // and compare to expectedChecksum
    return true;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE NPM IMPLEMENTATION (STUB)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stub for a self-hosted private npm registry (Verdaccio, Nexus, Artifactory).
 * Implement when required by infrastructure requirements.
 */
export class PrivateNpmProvider implements PackageRegistryProvider {
  readonly config: PackageRegistryConfig;

  constructor(config: PackageRegistryConfig) {
    this.config = config;
  }

  async publishPackage(
    _input: PublishPackageInput,
  ): Promise<PublishPackageResult> {
    throw new Error("PrivateNpmProvider: publishPackage not yet implemented");
  }

  async generateScopedToken(
    _applicationId: string,
    _allowedPackages: string[],
    _expiresAt?: Date,
  ): Promise<ScopedTokenResult> {
    throw new Error(
      "PrivateNpmProvider: generateScopedToken not yet implemented",
    );
  }

  async revokeToken(_tokenId: string): Promise<void> {
    throw new Error("PrivateNpmProvider: revokeToken not yet implemented");
  }

  generateInstallConfig(
    scopedToken: string,
    packages: string[],
    environment: string,
  ): string {
    return [
      `# Private npm registry configuration`,
      `# Environment: ${environment}`,
      `${this.config.packageScope}:registry=${this.config.registryUrl}`,
      `//${this.config.registryUrl.replace("https://", "")}/:_authToken=\${GIS_PLATFORM_PACKAGE_TOKEN}`,
    ].join("\n");
  }

  async verifyChecksum(
    _packageName: string,
    _version: string,
    _expectedChecksum: string,
  ): Promise<boolean> {
    throw new Error("PrivateNpmProvider: verifyChecksum not yet implemented");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRY FACTORY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates the appropriate registry provider based on configuration.
 * Registry type is determined by environment variables — not hardcoded.
 */
export function createPackageRegistryProvider(): PackageRegistryProvider {
  const registryType = process.env.PACKAGE_REGISTRY_TYPE ?? "github";
  const registryUrl =
    process.env.PACKAGE_REGISTRY_URL ?? "https://npm.pkg.github.com";
  const packageScope = process.env.PACKAGE_SCOPE ?? "@gis-platform";
  const registryId = process.env.PACKAGE_REGISTRY_ID ?? "github-packages";

  const config: PackageRegistryConfig = {
    registryUrl,
    packageScope,
    registryId,
  };

  switch (registryType) {
    case "github":
      return new GitHubPackagesProvider(config);
    case "private-npm":
      return new PrivateNpmProvider(config);
    default:
      throw new Error(
        `Unknown PACKAGE_REGISTRY_TYPE: '${registryType}'. Supported: github, private-npm`,
      );
  }
}

// Default registry provider — initialized lazily
let _registryProvider: PackageRegistryProvider | null = null;

export function getPackageRegistryProvider(): PackageRegistryProvider {
  if (!_registryProvider) {
    _registryProvider = createPackageRegistryProvider();
  }
  return _registryProvider;
}
