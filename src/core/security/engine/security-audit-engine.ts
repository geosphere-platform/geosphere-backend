/**
 * Framework-Independent SecurityAuditEngine Class
 *
 * Provides multi-tenant isolation guards, RBAC permission matrix verification,
 * correlation ID generation, PII redaction, rate limit policy execution, SSRF IP validation,
 * and structured audit event broadcasting.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, Android/iOS UI, or vehicle PII.
 */

import {
  TenantContext,
  SecurityPermission,
  AuditEvent,
  RateLimitPolicy,
  SecurityError,
  AuditEventListener,
} from "../types/security.types";

export class SecurityAuditEngine {
  private readonly auditLogs: AuditEvent[] = [];
  private readonly rateLimitMap = new Map<string, number[]>(); // Key -> Array of timestamps ms
  private readonly auditListeners = new Set<AuditEventListener>();

  public subscribeAudit(listener: AuditEventListener): () => void {
    this.auditListeners.add(listener);
    return () => this.auditListeners.delete(listener);
  }

  private notifyAuditListeners(event: AuditEvent): void {
    for (const listener of this.auditListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error("[SECURITY-ENGINE:ERR] Audit listener error:", err);
      }
    }
  }

  /**
   * Multi-Tenant Context Boundary Guard
   * Throws TENANT_ACCESS_DENIED if context tenantId does not match targetTenantId
   */
  public validateTenantAccess(context: TenantContext, targetTenantId: string): boolean {
    if (!context || !context.tenantId) {
      throw new SecurityError("UNAUTHENTICATED", "TenantContext is missing or unauthenticated");
    }
    if (context.isSuperAdmin) {
      return true; // Super Admin cross-tenant access allowed
    }
    if (context.tenantId !== targetTenantId) {
      throw new SecurityError(
        "TENANT_ACCESS_DENIED",
        `User '${context.userId}' from tenant '${context.tenantId}' denied access to target tenant '${targetTenantId}'`,
      );
    }
    return true;
  }

  /**
   * RBAC Permission Matrix Verification
   */
  public hasPermission(context: TenantContext, permission: SecurityPermission): boolean {
    if (!context) return false;
    if (context.isSuperAdmin || context.permissions.includes("ADMIN_ALL")) {
      return true;
    }
    return context.permissions.includes(permission);
  }

  public enforcePermission(context: TenantContext, permission: SecurityPermission): void {
    if (!this.hasPermission(context, permission)) {
      throw new SecurityError(
        "INSUFFICIENT_PERMISSIONS",
        `User '${context?.userId}' lacks required permission '${permission}'`,
      );
    }
  }

  /**
   * PII & Secret Redaction
   */
  public redactPII<T = unknown>(data: T): T {
    if (!data || typeof data !== "object") return data;

    const SensitiveKeys = ["password", "token", "secret", "apikey", "api_key", "authorization", "creditcard", "ssn", "privatekey"];

    const redactObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(redactObject);
      }
      if (obj !== null && typeof obj === "object") {
        const copy: any = {};
        for (const [key, value] of Object.entries(obj)) {
          const lowerKey = key.toLowerCase();
          if (SensitiveKeys.some((k) => lowerKey.includes(k))) {
            copy[key] = "[REDACTED_SECRET]";
          } else {
            copy[key] = redactObject(value);
          }
        }
        return copy;
      }
      return obj;
    };

    return redactObject(data);
  }

  /**
   * Log Security Audit Event with Correlation ID and PII Redaction
   */
  public logAuditEvent(event: AuditEvent): AuditEvent {
    if (!event.tenantId || !event.userId || !event.action) {
      throw new SecurityError("SECURITY_ERROR" as any, "AuditEvent must include tenantId, userId, and action");
    }

    const correlationId = event.correlationId ?? `corr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = event.timestamp ?? new Date().toISOString();
    const redactedMetadata = event.metadata ? this.redactPII(event.metadata) : undefined;

    const auditEntry: AuditEvent = {
      id: event.id ?? `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenantId: event.tenantId,
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      correlationId,
      ipAddress: event.ipAddress ?? "127.0.0.1",
      userAgent: event.userAgent ?? "GeoSphere-SDK",
      timestamp,
      metadata: redactedMetadata,
    };

    this.auditLogs.push(auditEntry);
    this.notifyAuditListeners(auditEntry);
    return auditEntry;
  }

  public getAuditLogs(tenantId?: string): AuditEvent[] {
    if (!tenantId) return this.auditLogs.map((e) => ({ ...e }));
    return this.auditLogs.filter((e) => e.tenantId === tenantId).map((e) => ({ ...e }));
  }

  /**
   * Rate Limit Policy Enforcement
   */
  public isRateLimited(key: string, policy: RateLimitPolicy): boolean {
    const now = Date.now();
    const windowMs = policy.windowSeconds * 1000;

    let timestamps = this.rateLimitMap.get(key) ?? [];
    // Filter timestamps within window
    timestamps = timestamps.filter((t) => now - t < windowMs);

    if (timestamps.length >= policy.maxRequests) {
      this.rateLimitMap.set(key, timestamps);
      return true; // Rate limit exceeded
    }

    timestamps.push(now);
    this.rateLimitMap.set(key, timestamps);
    return false;
  }

  /**
   * SSRF IP Guard Verification
   * Blocks internal / cloud metadata IPs (localhost, 127.0.0.1, 169.254.169.254, 10.x.x.x, 172.16.x.x, 192.168.x.x)
   */
  public isIpBlockedSSRF(ipOrHostname: string): boolean {
    if (!ipOrHostname) return true;
    const clean = ipOrHostname.trim().toLowerCase();

    if (clean === "localhost" || clean === "127.0.0.1" || clean === "::1" || clean === "169.254.169.254") {
      return true;
    }

    // Match private IP subnets: 10.x.x.x, 172.16-31.x.x, 192.168.x.x
    if (
      clean.startsWith("10.") ||
      clean.startsWith("192.168.") ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(clean)
    ) {
      return true;
    }

    return false; // Safe external IP
  }
}
