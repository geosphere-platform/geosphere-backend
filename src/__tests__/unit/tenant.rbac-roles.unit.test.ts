import assert from "node:assert";
import { USER_ROLES, PERMISSIONS, UserRole } from "../../core/constants";
import {
  ROLE_PERMISSIONS,
  hasPermission,
  getPermissionsForRole,
} from "../../core/auth/permissions";

export function runAllRolesCredentialsUnitTest() {
  console.log(
    "   --> Testing Role Permission Matrix & Test Credentials for All Roles...",
  );

  const ALL_TEST_CREDENTIALS: Array<{ role: UserRole; email: string }> = [
    { role: USER_ROLES.PLATFORM_ADMIN, email: "platformadmin@gisplatform.com" },
    { role: USER_ROLES.SUPER_ADMIN, email: "admin@fleet.com" },
    { role: USER_ROLES.TENANT_OWNER, email: "owner@acmefleet.com" },
    { role: USER_ROLES.TENANT_ADMIN, email: "tenantadmin@acmefleet.com" },
    { role: USER_ROLES.ORG_ADMIN, email: "manager@acmefleet.com" },
    { role: USER_ROLES.MANAGER, email: "manager.gis@acmefleet.com" },
    { role: USER_ROLES.OPERATOR, email: "operator@acmefleet.com" },
    { role: USER_ROLES.DISPATCHER, email: "dispatcher@acmefleet.com" },
    { role: USER_ROLES.FIELD_AGENT, email: "fieldagent@acmefleet.com" },
    { role: USER_ROLES.DRIVER, email: "driver@acmefleet.com" },
    { role: USER_ROLES.VIEWER, email: "viewer@acmefleet.com" },
  ];

  for (const cred of ALL_TEST_CREDENTIALS) {
    const perms = getPermissionsForRole(cred.role);
    assert.ok(
      Array.isArray(perms),
      `Permissions for ${cred.role} must be an array`,
    );

    // Verify Read Map permission
    assert.strictEqual(
      hasPermission(cred.role, PERMISSIONS.GIS_MAP_READ),
      true,
      `${cred.role} must have GIS_MAP_READ permission`,
    );
  }

  // Admin roles have create/delete feature permissions
  assert.strictEqual(
    hasPermission(USER_ROLES.PLATFORM_ADMIN, PERMISSIONS.GIS_FEATURE_CREATE),
    true,
  );
  assert.strictEqual(
    hasPermission(USER_ROLES.TENANT_OWNER, PERMISSIONS.GIS_FEATURE_DELETE),
    true,
  );

  // Viewer role cannot create features
  assert.strictEqual(
    hasPermission(USER_ROLES.VIEWER, PERMISSIONS.GIS_FEATURE_CREATE),
    false,
  );

  console.log(
    `   ✅ Verified test credentials for ${ALL_TEST_CREDENTIALS.length} platform & tenant roles.`,
  );
}
