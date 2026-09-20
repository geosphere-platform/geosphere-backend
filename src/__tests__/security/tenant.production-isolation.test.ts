import { signAccessToken } from "@/core/auth/jwt";
import { DatabaseJobQueueProvider } from "@/core/jobs/database-job-queue";

export async function runProductionTenantIsolationSecurityTests() {
  console.log(
    "🛡️ Running Phase 17 Production Tenant Isolation Security Tests...",
  );

  const tenantAToken = await signAccessToken({
    sub: "user_tenant_a",
    role: "TENANT_ADMIN" as any,
    orgId: "org_tenant_a",
  });

  const queue = new DatabaseJobQueueProvider();

  // Tenant A enqueues job
  const jobA = await queue.enqueueJob({
    tenantId: "org_tenant_a",
    organizationId: "org_tenant_a",
    type: "SPATIAL_EXPORT",
    payload: { layer: "secret_a" },
  });

  // Tenant B attempts to fetch Tenant A job
  const attemptB = await queue.getJob(jobA.id, "org_tenant_b");
  if (attemptB !== null) {
    throw new Error(
      "SECURITY VIOLATION: Tenant B accessed Tenant A background job payload!",
    );
  }

  // Tenant B attempts to cancel Tenant A job
  const cancelSuccess = await queue.cancelJob(jobA.id, "org_tenant_b");
  if (cancelSuccess) {
    throw new Error(
      "SECURITY VIOLATION: Tenant B cancelled Tenant A background job!",
    );
  }

  console.log("✅ All Phase 17 Tenant Isolation Security Tests Passed!");
  return true;
}
