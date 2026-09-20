/**
 * GeoSphere Core Security & Audit Engine — Framework-Independent Domain Models
 *
 * Defines pure TypeScript models for TenantContext, SecurityPermission, SecurityRole,
 * AuditEvent, RateLimitPolicy, PII Redaction, and typed errors.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, Android/iOS UI, database ORMs, or vehicle PII.
 */

export type SecurityPermission =
  | "VIEW_FEATURE"
  | "EDIT_FEATURE"
  | "DELETE_FEATURE"
  | "PUBLISH_APP"
  | "EXPORT_DATA"
  | "MANAGE_USERS"
  | "MANAGE_TENANT"
  | "ADMIN_ALL";

export interface SecurityRole {
  roleId: string;
  name: string;
  permissions: SecurityPermission[];
}

export interface TenantContext {
  tenantId: string;
  userId: string;
  applicationId?: string;
  roles: string[];
  permissions: SecurityPermission[];
  isSuperAdmin?: boolean;
}

export interface AuditEvent {
  id?: string;
  tenantId: string;
  userId: string;
  action: string; // e.g. "USER_LOGIN", "DATA_EXPORT", "CONFIG_PUBLISH", "FEATURE_DELETE"
  resource: string;
  correlationId?: string; // Auto-generated UUID if missing
  ipAddress?: string;
  userAgent?: string;
  timestamp?: string; // ISO 8601 UTC
  metadata?: Record<string, unknown>;
}

export interface RateLimitPolicy {
  policyId: string;
  endpointCategory: string; // e.g. "AUTH", "GIS_QUERY", "UPLOAD", "ADMIN"
  maxRequests: number;
  windowSeconds: number;
}

export type SecurityErrorCode =
  | "TENANT_ACCESS_DENIED"
  | "INSUFFICIENT_PERMISSIONS"
  | "UNAUTHENTICATED"
  | "RATE_LIMIT_EXCEEDED"
  | "SSRF_BLOCKED"
  | "INVALID_TOKEN";

export class SecurityError extends Error {
  constructor(
    public readonly code: SecurityErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(`[SECURITY_ERROR:${code}] ${message}`);
    this.name = "SecurityError";
  }
}

export type AuditEventListener = (event: AuditEvent) => void;
