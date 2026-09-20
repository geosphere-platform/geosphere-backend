/**
 * Phase 16 — SDK Distribution Error Codes
 *
 * Standardized error codes for the SDK distribution system.
 * All SDK-related errors should use these codes for consistent API responses.
 *
 * Error code conventions:
 *   LICENSE_*          — License validation and lifecycle errors
 *   SDK_*              — SDK product, version, and access errors
 *   PACKAGE_*          — Package registry and credential errors
 *   INCOMPATIBLE_*     — Compatibility errors between SDK and API versions
 */

import { AppError } from "../errors/errors";

// ─── Error Codes ──────────────────────────────────────────────────────────────

export const SDK_ERROR_CODE = {
  // License errors
  LICENSE_REQUIRED: "LICENSE_REQUIRED",
  LICENSE_NOT_FOUND: "LICENSE_NOT_FOUND",
  LICENSE_EXPIRED: "LICENSE_EXPIRED",
  LICENSE_REVOKED: "LICENSE_REVOKED",
  LICENSE_SUSPENDED: "LICENSE_SUSPENDED",
  LICENSE_PENDING: "LICENSE_PENDING",
  LICENSE_ALREADY_ACTIVE: "LICENSE_ALREADY_ACTIVE",

  // SDK product / access errors
  SDK_NOT_ENTITLED: "SDK_NOT_ENTITLED",
  SDK_PRODUCT_NOT_FOUND: "SDK_PRODUCT_NOT_FOUND",
  SDK_PRODUCT_DEPRECATED: "SDK_PRODUCT_DEPRECATED",
  SDK_PRODUCT_RETIRED: "SDK_PRODUCT_RETIRED",
  SDK_ACCESS_NOT_FOUND: "SDK_ACCESS_NOT_FOUND",
  SDK_ACCESS_DENIED: "SDK_ACCESS_DENIED",
  SDK_ACCESS_REVOKED: "SDK_ACCESS_REVOKED",

  // SDK version errors
  SDK_VERSION_NOT_FOUND: "SDK_VERSION_NOT_FOUND",
  SDK_VERSION_NOT_ALLOWED: "SDK_VERSION_NOT_ALLOWED",
  SDK_VERSION_DRAFT: "SDK_VERSION_DRAFT",
  SDK_VERSION_RETIRED: "SDK_VERSION_RETIRED",
  SDK_VERSION_SECURITY_REVOKED: "SDK_VERSION_SECURITY_REVOKED",
  SDK_VERSION_IMMUTABLE: "SDK_VERSION_IMMUTABLE",
  SDK_VERSION_COLLISION: "SDK_VERSION_COLLISION",

  // Package credential errors
  PACKAGE_ACCESS_DENIED: "PACKAGE_ACCESS_DENIED",
  PACKAGE_CREDENTIAL_NOT_FOUND: "PACKAGE_CREDENTIAL_NOT_FOUND",
  PACKAGE_CREDENTIAL_EXPIRED: "PACKAGE_CREDENTIAL_EXPIRED",
  PACKAGE_CREDENTIAL_REVOKED: "PACKAGE_CREDENTIAL_REVOKED",

  // Compatibility errors
  INCOMPATIBLE_API_VERSION: "INCOMPATIBLE_API_VERSION",

  // Provisioning errors
  PROVISIONING_FAILED: "PROVISIONING_FAILED",
  DUPLICATE_PROVISIONING: "DUPLICATE_PROVISIONING",
} as const;

export type SdkErrorCode = (typeof SDK_ERROR_CODE)[keyof typeof SDK_ERROR_CODE];

// ─── Error Classes ────────────────────────────────────────────────────────────

export class LicenseRequiredError extends AppError {
  constructor(message = "A valid license is required to access this SDK") {
    super(message, 403, SDK_ERROR_CODE.LICENSE_REQUIRED);
  }
}

export class LicenseNotFoundError extends AppError {
  constructor(message = "License not found") {
    super(message, 404, SDK_ERROR_CODE.LICENSE_NOT_FOUND);
  }
}

export class LicenseExpiredError extends AppError {
  constructor(message = "License has expired") {
    super(message, 403, SDK_ERROR_CODE.LICENSE_EXPIRED);
  }
}

export class LicenseRevokedError extends AppError {
  constructor(message = "License has been revoked") {
    super(message, 403, SDK_ERROR_CODE.LICENSE_REVOKED);
  }
}

export class LicenseSuspendedError extends AppError {
  constructor(message = "License is currently suspended") {
    super(message, 403, SDK_ERROR_CODE.LICENSE_SUSPENDED);
  }
}

export class LicensePendingError extends AppError {
  constructor(message = "License is pending activation") {
    super(message, 403, SDK_ERROR_CODE.LICENSE_PENDING);
  }
}

export class SdkNotEntitledError extends AppError {
  constructor(message = "Organization is not entitled to this SDK product") {
    super(message, 403, SDK_ERROR_CODE.SDK_NOT_ENTITLED);
  }
}

export class SdkProductNotFoundError extends AppError {
  constructor(message = "SDK product not found") {
    super(message, 404, SDK_ERROR_CODE.SDK_PRODUCT_NOT_FOUND);
  }
}

export class SdkVersionNotFoundError extends AppError {
  constructor(message = "SDK version not found") {
    super(message, 404, SDK_ERROR_CODE.SDK_VERSION_NOT_FOUND);
  }
}

export class SdkVersionNotAllowedError extends AppError {
  constructor(message = "SDK version is not allowed by the version policy") {
    super(message, 403, SDK_ERROR_CODE.SDK_VERSION_NOT_ALLOWED);
  }
}

export class SdkVersionRetiredError extends AppError {
  constructor(
    message = "SDK version has been retired and is no longer available",
  ) {
    super(message, 410, SDK_ERROR_CODE.SDK_VERSION_RETIRED);
  }
}

export class SdkVersionSecurityRevokedError extends AppError {
  constructor(
    message = "SDK version has been security-revoked due to a known vulnerability. Please upgrade immediately.",
  ) {
    super(message, 403, SDK_ERROR_CODE.SDK_VERSION_SECURITY_REVOKED);
  }
}

export class SdkVersionImmutableError extends AppError {
  constructor(
    message = "A released SDK version is immutable. Create a new version to publish changes.",
  ) {
    super(message, 409, SDK_ERROR_CODE.SDK_VERSION_IMMUTABLE);
  }
}

export class SdkVersionCollisionError extends AppError {
  constructor(version: string) {
    super(
      `SDK version ${version} already exists for this product. Released versions cannot be overwritten.`,
      409,
      SDK_ERROR_CODE.SDK_VERSION_COLLISION,
    );
  }
}

export class PackageAccessDeniedError extends AppError {
  constructor(message = "Package access denied") {
    super(message, 403, SDK_ERROR_CODE.PACKAGE_ACCESS_DENIED);
  }
}

export class PackageCredentialExpiredError extends AppError {
  constructor(message = "Package credential has expired") {
    super(message, 401, SDK_ERROR_CODE.PACKAGE_CREDENTIAL_EXPIRED);
  }
}

export class PackageCredentialRevokedError extends AppError {
  constructor(message = "Package credential has been revoked") {
    super(message, 401, SDK_ERROR_CODE.PACKAGE_CREDENTIAL_REVOKED);
  }
}

export class IncompatibleApiVersionError extends AppError {
  constructor(sdkVersion: string, apiVersion: string) {
    super(
      `SDK version ${sdkVersion} is not compatible with API version ${apiVersion}`,
      400,
      SDK_ERROR_CODE.INCOMPATIBLE_API_VERSION,
      { sdkVersion, apiVersion },
    );
  }
}

export class SdkAccessDeniedError extends AppError {
  constructor(message = "SDK access denied") {
    super(message, 403, SDK_ERROR_CODE.SDK_ACCESS_DENIED);
  }
}

export class DuplicateProvisioningError extends AppError {
  constructor(message = "Customer SDK access has already been provisioned") {
    super(message, 409, SDK_ERROR_CODE.DUPLICATE_PROVISIONING);
  }
}
