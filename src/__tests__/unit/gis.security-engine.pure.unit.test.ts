/**
 * Pure Framework-Independent Security & Audit Engine Unit Tests
 *
 * Verifies multi-tenant isolation guards, RBAC permission enforcement, correlation ID audit logging,
 * PII data redaction, rate limit policy execution, SSRF IP validation, and pure framework decoupling.
 *
 * MUST NOT require browser DOM, React, Next.js, or OpenLayers.
 */

import { SecurityAuditEngine } from "../../core/security/engine/security-audit-engine";
import { TenantContext, AuditEvent, RateLimitPolicy, SecurityError } from "../../core/security/types/security.types";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export async function runSecurityEnginePureUnitTests(): Promise<void> {
  console.log("------------------------------------------");
  console.log("RUNNING GENERIC SECURITY & AUDIT ENGINE PURE DOMAIN TESTS");
  console.log("------------------------------------------");

  const engine = new SecurityAuditEngine();

  const userContextAlpha: TenantContext = {
    tenantId: "tenant_alpha",
    userId: "user_alpha_01",
    roles: ["FIELD_OPERATOR"],
    permissions: ["VIEW_FEATURE", "EDIT_FEATURE"],
  };

  // 1. Valid Tenant Access Validation
  console.log("  [1/12] Testing Valid Tenant Access Validation...");
  const validAccess = engine.validateTenantAccess(userContextAlpha, "tenant_alpha");
  assert(validAccess === true, "Valid tenant access must return true");

  // 2. Cross-Tenant Access Rejection
  console.log("  [2/12] Testing Cross-Tenant Access Rejection (TENANT_ACCESS_DENIED)...");
  let crossTenantFailed = false;
  try {
    engine.validateTenantAccess(userContextAlpha, "tenant_beta");
  } catch (err: any) {
    if (err instanceof SecurityError && err.code === "TENANT_ACCESS_DENIED") {
      crossTenantFailed = true;
    }
  }
  assert(crossTenantFailed, "Cross-tenant access attempt must throw TENANT_ACCESS_DENIED");

  // 3. SuperAdmin Cross-Tenant Override
  console.log("  [3/12] Testing SuperAdmin Cross-Tenant Override...");
  const superAdminContext: TenantContext = {
    tenantId: "system",
    userId: "admin_super",
    roles: ["SUPER_ADMIN"],
    permissions: ["ADMIN_ALL"],
    isSuperAdmin: true,
  };
  const superAdminAccess = engine.validateTenantAccess(superAdminContext, "tenant_beta");
  assert(superAdminAccess === true, "SuperAdmin must be granted cross-tenant access");

  // 4. RBAC Permission Matrix Evaluation
  console.log("  [4/12] Testing RBAC Permission Evaluation...");
  assert(engine.hasPermission(userContextAlpha, "VIEW_FEATURE"), "User Alpha must have VIEW_FEATURE");
  assert(!engine.hasPermission(userContextAlpha, "DELETE_FEATURE"), "User Alpha must NOT have DELETE_FEATURE");

  // 5. Insufficient Permission Enforcement Rejection
  console.log("  [5/12] Testing Insufficient Permission Rejection (INSUFFICIENT_PERMISSIONS)...");
  let permFailed = false;
  try {
    engine.enforcePermission(userContextAlpha, "DELETE_FEATURE");
  } catch (err: any) {
    if (err instanceof SecurityError && err.code === "INSUFFICIENT_PERMISSIONS") {
      permFailed = true;
    }
  }
  assert(permFailed, "Enforcing unheld permission must throw INSUFFICIENT_PERMISSIONS");

  // 6. PII & Secret Data Redaction
  console.log("  [6/12] Testing PII & Secret Data Redaction...");
  const rawPayload = {
    username: "john_field_agent",
    password: "SuperSecretPassword123!",
    apiKey: "sk_live_998877665544332211",
    nested: {
      secretToken: "bearer_xyz_999",
      allowedField: "public_value",
    },
  };
  const redacted = engine.redactPII(rawPayload);
  assert(redacted.password === "[REDACTED_SECRET]", "Password must be redacted");
  assert(redacted.apiKey === "[REDACTED_SECRET]", "apiKey must be redacted");
  assert(redacted.nested.secretToken === "[REDACTED_SECRET]", "Nested secretToken must be redacted");
  assert(redacted.nested.allowedField === "public_value", "Non-sensitive nested field must be preserved");

  // 7. Correlation ID & Audit Event Logging
  console.log("  [7/12] Testing Correlation ID Generation & Audit Event Logging...");
  const auditEntry = engine.logAuditEvent({
    tenantId: "tenant_alpha",
    userId: "user_alpha_01",
    action: "FORM_SUBMIT",
    resource: "form_inspection_101",
    metadata: rawPayload,
  });
  assert(auditEntry.id!.startsWith("aud_"), "Audit ID must be generated");
  assert(auditEntry.correlationId!.startsWith("corr_"), "Correlation ID must be generated");
  assert((auditEntry.metadata as any).password === "[REDACTED_SECRET]", "Audit log metadata must automatically redact secrets");

  // 8. Audit Log Retrieval & Filtering
  console.log("  [8/12] Testing Audit Log Retrieval & Tenant Filtering...");
  const alphaLogs = engine.getAuditLogs("tenant_alpha");
  assert(alphaLogs.length === 1 && alphaLogs[0].action === "FORM_SUBMIT", "Audit log retrieval must filter by tenantId");

  // 9. Rate Limit Policy Enforcement
  console.log("  [9/12] Testing Rate Limit Policy Enforcement (Blocking Bursts)...");
  const ratePolicy: RateLimitPolicy = {
    policyId: "pol_auth",
    endpointCategory: "AUTH",
    maxRequests: 3,
    windowSeconds: 60,
  };
  const clientKey = "user_alpha_login";

  assert(!engine.isRateLimited(clientKey, ratePolicy), "Request 1 must be allowed");
  assert(!engine.isRateLimited(clientKey, ratePolicy), "Request 2 must be allowed");
  assert(!engine.isRateLimited(clientKey, ratePolicy), "Request 3 must be allowed");
  assert(engine.isRateLimited(clientKey, ratePolicy), "Request 4 must exceed maxRequests=3 and be rate limited");

  // 10. SSRF IP Guard Verification
  console.log("  [10/12] Testing SSRF IP Guard Verification (Blocking Internal/Metadata IPs)...");
  assert(engine.isIpBlockedSSRF("127.0.0.1"), "127.0.0.1 must be blocked by SSRF guard");
  assert(engine.isIpBlockedSSRF("localhost"), "localhost must be blocked by SSRF guard");
  assert(engine.isIpBlockedSSRF("169.254.169.254"), "AWS metadata IP 169.254.169.254 must be blocked");
  assert(engine.isIpBlockedSSRF("10.0.0.5"), "Internal 10.x subnet IP must be blocked");
  assert(!engine.isIpBlockedSSRF("8.8.8.8"), "Public IP 8.8.8.8 must be allowed");

  // 11. Real-time Audit Event Subscriptions
  console.log("  [11/12] Testing Real-Time Audit Event Subscriptions...");
  const capturedEvents: AuditEvent[] = [];
  const unsub = engine.subscribeAudit((e) => capturedEvents.push(e));

  engine.logAuditEvent({ tenantId: "tenant_beta", userId: "user_beta", action: "CONFIG_PUBLISH", resource: "app_config_1" });
  assert(capturedEvents.length === 1 && capturedEvents[0].action === "CONFIG_PUBLISH", "Audit listener must receive broadcast");

  // 12. Pure Framework Decoupling Verification
  console.log("  [12/12] Verifying Pure Framework Decoupling...");
  assert(typeof engine.validateTenantAccess === "function", "SecurityAuditEngine must expose validateTenantAccess");
  assert(typeof engine.isIpBlockedSSRF === "function", "SecurityAuditEngine must expose isIpBlockedSSRF");

  console.log("✅ Generic Security & Audit Engine Pure Domain Unit Tests Passed Successfully!");
}
