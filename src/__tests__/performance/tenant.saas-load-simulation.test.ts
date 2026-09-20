import { TenantContextService } from "../../core/tenant/tenant-context";
import { OrganizationService } from "../../core/tenant/organization.service";
import { db } from "../../database";
import { usersTable } from "../../database/schema";
import { hashPassword } from "../../core/auth/password";
import { TenantMemoryStore } from "../../core/tenant/tenant-memory-store";
import { NextRequest } from "next/server";
import crypto from "crypto";
import assert from "assert";

async function createTestUser(
  email: string,
  firstName: string,
  lastName: string,
  role: string,
) {
  const pwd = await hashPassword("12345678");
  try {
    const [user] = await db
      .insert(usersTable)
      .values({
        email,
        passwordHash: pwd,
        firstName,
        lastName,
        role,
      })
      .returning();
    return user;
  } catch (err) {
    if (TenantMemoryStore.isConnRefused(err)) {
      return {
        id: `sim_user_${crypto.randomUUID()}`,
        email,
        passwordHash: pwd,
        firstName,
        lastName,
        role,
      };
    }
    throw err;
  }
}

export async function runTenantSaaSLoadSimulationTests() {
  console.log(
    "   --> Initializing Multi-Tenant SaaS Load Simulation Dataset...",
  );
  const simOwner = await createTestUser(
    `sim_owner_${Date.now()}@test.com`,
    "Sim",
    "Owner",
    "TENANT_OWNER",
  );

  const simOrg = await OrganizationService.createOrganization(
    { name: "Load Sim Org", slug: `load-sim-${Date.now()}` },
    simOwner.id,
  );

  const req = new NextRequest("http://localhost/api/v1/workspaces", {
    headers: {
      "x-organization-id": simOrg.organization.id,
      "x-workspace-id": simOrg.defaultWorkspace.id,
    },
  });

  const runBatch = async (batchSize: number) => {
    const startTime = Date.now();
    const promises = [];
    for (let i = 0; i < batchSize; i++) {
      promises.push(
        TenantContextService.resolveTenantContext(
          simOwner.id,
          "TENANT_OWNER",
          req,
        ),
      );
    }

    const results = await Promise.all(promises);
    const elapsed = Date.now() - startTime;
    assert.strictEqual(results.length, batchSize);
    return {
      elapsed,
      opsPerSec: Math.round((batchSize / (elapsed || 1)) * 1000),
    };
  };

  console.log("   --> Simulating 50 concurrent context resolutions...");
  const perf50 = await runBatch(50);
  console.log(
    `      ⏱️  50 users: ${perf50.elapsed}ms (${perf50.opsPerSec} ops/sec)`,
  );

  console.log("   --> Simulating 150 concurrent context resolutions...");
  const perf150 = await runBatch(150);
  console.log(
    `      ⏱️  150 users: ${perf150.elapsed}ms (${perf150.opsPerSec} ops/sec)`,
  );

  console.log("   --> Simulating 300 concurrent context resolutions...");
  const perf300 = await runBatch(300);
  console.log(
    `      ⏱️  300 users: ${perf300.elapsed}ms (${perf300.opsPerSec} ops/sec)`,
  );

  console.log("   ✅ Multi-Tenant SaaS Load Simulation Tests Passed.");
}

if (require.main === module) {
  runTenantSaaSLoadSimulationTests();
}
