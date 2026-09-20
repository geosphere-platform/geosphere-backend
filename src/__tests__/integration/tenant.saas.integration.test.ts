import { OrganizationService } from "../../core/tenant/organization.service";
import { WorkspaceService } from "../../core/tenant/workspace.service";
import { MembershipService } from "../../core/tenant/membership.service";
import { InvitationService } from "../../core/tenant/invitation.service";
import { db } from "../../database";
import { usersTable } from "../../database/schema";
import { hashPassword } from "../../core/auth/password";
import { TenantMemoryStore } from "../../core/tenant/tenant-memory-store";
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
        id: `saas_user_${crypto.randomUUID()}`,
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

export async function runTenantSaaSIntegrationTests() {
  console.log("   --> 1. Creating Seed Test Users for Integration Flow...");
  const userA = await createTestUser(
    `saas_owner_a_${Date.now()}@test.com`,
    "Owner",
    "Alpha",
    "TENANT_OWNER",
  );
  const userB = await createTestUser(
    `saas_member_b_${Date.now()}@test.com`,
    "Member",
    "Beta",
    "MEMBER",
  );

  console.log("   --> 2. Creating Organization with Owner User A...");
  const slug = `saas-org-${Date.now()}`;
  const orgResult = await OrganizationService.createOrganization(
    {
      name: "Integration Test Org",
      slug,
      timezone: "UTC",
    },
    userA.id,
  );

  assert.ok(orgResult.organization.id);
  assert.strictEqual(orgResult.organization.ownerId, userA.id);
  assert.strictEqual(orgResult.defaultWorkspace.name, "Main Workspace");
  assert.strictEqual(orgResult.membership.role, "OWNER");

  console.log("   --> 3. Inviting User B & Accepting Token...");
  const inviteResult = await InvitationService.createInvitation(
    orgResult.organization.id,
    { email: userB.email, role: "ADMIN" },
    userA.id,
  );

  assert.ok(inviteResult.rawToken);
  assert.strictEqual(inviteResult.invitation.email, userB.email);

  const acceptResult = await InvitationService.acceptInvitation(
    inviteResult.rawToken,
    userB.id,
  );
  assert.strictEqual(acceptResult.membership.role, "ADMIN");
  assert.strictEqual(acceptResult.membership.status, "ACTIVE");

  console.log(
    "   --> 4. Testing Workspace Creation & Composite Unique Slug...",
  );
  const ws1 = await WorkspaceService.createWorkspace(
    orgResult.organization.id,
    { name: "Analytics Zone", slug: "analytics" },
    userA.id,
  );
  assert.strictEqual(ws1.slug, "analytics");

  await assert.rejects(
    () =>
      WorkspaceService.createWorkspace(
        orgResult.organization.id,
        { name: "Analytics Duplicate", slug: "analytics" },
        userA.id,
      ),
    /already exists/,
  );

  console.log(
    "   --> 5. Testing Transactional Ownership Transfer (User A -> User B)...",
  );
  const updatedOrg = await OrganizationService.transferOwnership(
    orgResult.organization.id,
    userB.id,
    userA.id,
  );
  assert.strictEqual(updatedOrg.ownerId, userB.id);

  // Verify User B is now OWNER and User A is now ADMIN
  const membersList = await MembershipService.listMembers(
    orgResult.organization.id,
  );
  const memberA = membersList.members.find((m) => m.userId === userA.id);
  const memberB = membersList.members.find((m) => m.userId === userB.id);

  assert.strictEqual(memberB?.role, "OWNER");
  assert.strictEqual(memberA?.role, "ADMIN");

  console.log(
    "   --> 6. Testing Sole Owner Protection Guard on Member Removal...",
  );
  await assert.rejects(
    () =>
      MembershipService.removeMember(
        orgResult.organization.id,
        memberB!.membershipId,
        userA.id,
      ),
    /sole owner/,
  );

  console.log("   --> 7. Archiving Workspace...");
  const archivedWs = await WorkspaceService.archiveWorkspace(ws1.id, {
    userId: userB.id,
    userRole: "TENANT_OWNER",
    organizationId: orgResult.organization.id,
    organizationSlug: orgResult.organization.slug,
    workspaceId: ws1.id,
    membership: { id: memberB!.membershipId, role: "OWNER", status: "ACTIVE" },
    permissions: [],
    isPlatformAdmin: false,
  });
  assert.strictEqual(archivedWs.status, "ARCHIVED");

  console.log("   ✅ Multi-Tenant SaaS Integration Tests Passed.");
}

if (require.main === module) {
  runTenantSaaSIntegrationTests();
}
