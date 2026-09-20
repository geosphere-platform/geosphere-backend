import { TenantContextService } from "../../core/tenant/tenant-context";
import { OrganizationService } from "../../core/tenant/organization.service";
import { MembershipService } from "../../core/tenant/membership.service";
import { db } from "../../database";
import { usersTable } from "../../database/schema";
import { hashPassword } from "../../core/auth/password";
import { TenantMemoryStore } from "../../core/tenant/tenant-memory-store";
import { NextRequest } from "next/server";
import { USER_ROLES } from "../../core/constants";
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
        id: `sec_user_${crypto.randomUUID()}`,
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

export async function runTenantIsolationSecurityTests() {
  console.log(
    "   --> 1. Creating Isolated Test Users & Organizations (Org Alpha vs Org Beta)...",
  );

  const userAlpha = await createTestUser(
    `sec_user_alpha_${Date.now()}@test.com`,
    "Alpha",
    "User",
    "TENANT_OWNER",
  );
  const userBeta = await createTestUser(
    `sec_user_beta_${Date.now()}@test.com`,
    "Beta",
    "User",
    "TENANT_OWNER",
  );

  const orgAlpha = await OrganizationService.createOrganization(
    { name: "Alpha Tenant", slug: `org-alpha-${Date.now()}` },
    userAlpha.id,
  );

  const orgBeta = await OrganizationService.createOrganization(
    { name: "Beta Tenant", slug: `org-beta-${Date.now()}` },
    userBeta.id,
  );

  console.log(
    "   --> 2. Verifying User Alpha cannot resolve context for Org Beta...",
  );
  const reqBetaOrg = new NextRequest("http://localhost/api/v1/workspaces", {
    headers: { "x-organization-id": orgBeta.organization.id },
  });

  await assert.rejects(
    () =>
      TenantContextService.resolveTenantContext(
        userAlpha.id,
        "TENANT_OWNER",
        reqBetaOrg,
      ),
    /not a member of this organization/,
  );

  console.log(
    "   --> 3. Verifying User Alpha cannot access Workspace in Org Beta...",
  );
  const reqBetaWs = new NextRequest("http://localhost/api/v1/workspaces", {
    headers: {
      "x-organization-id": orgAlpha.organization.id,
      "x-workspace-id": orgBeta.defaultWorkspace.id,
    },
  });

  const ctxAlpha = await TenantContextService.resolveTenantContext(
    userAlpha.id,
    "TENANT_OWNER",
    reqBetaWs,
  );
  assert.strictEqual(ctxAlpha.organizationId, orgAlpha.organization.id);
  assert.notStrictEqual(ctxAlpha.workspaceId, orgBeta.defaultWorkspace.id);

  console.log(
    "   --> 4. Verifying Suspended Organization API Access is Blocked...",
  );
  await OrganizationService.suspendOrganization(
    orgAlpha.organization.id,
    userAlpha.id,
  );

  const reqAlphaOrg = new NextRequest("http://localhost/api/v1/workspaces", {
    headers: { "x-organization-id": orgAlpha.organization.id },
  });

  await assert.rejects(
    () =>
      TenantContextService.resolveTenantContext(
        userAlpha.id,
        "TENANT_OWNER",
        reqAlphaOrg,
      ),
    /suspended/,
  );

  console.log("   --> 5. Verifying Suspended Member Access is Blocked...");
  const memberInBeta = await MembershipService.addMember(
    orgBeta.organization.id,
    userAlpha.id,
    "MEMBER",
    userBeta.id,
  );

  await MembershipService.updateMemberStatus(
    orgBeta.organization.id,
    memberInBeta.id,
    "SUSPENDED",
    userBeta.id,
  );

  const reqBetaMember = new NextRequest("http://localhost/api/v1/workspaces", {
    headers: { "x-organization-id": orgBeta.organization.id },
  });

  await assert.rejects(
    () =>
      TenantContextService.resolveTenantContext(
        userAlpha.id,
        USER_ROLES.OPERATOR,
        reqBetaMember,
      ),
    /suspended/,
  );

  console.log("   ✅ Cross-Tenant Isolation & Security Tests Passed.");
}

if (require.main === module) {
  runTenantIsolationSecurityTests();
}
