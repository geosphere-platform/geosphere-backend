import { USER_ROLES, PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";

export function runTenantRbacUnitTests() {
  // 1. Platform Admin permissions
  if (!hasPermission(USER_ROLES.PLATFORM_ADMIN, PERMISSIONS.TENANT_MANAGE)) {
    throw new Error("RBAC: PLATFORM_ADMIN must have tenant:manage permission");
  }

  // 2. Tenant Owner permissions
  if (!hasPermission(USER_ROLES.TENANT_OWNER, PERMISSIONS.MODULE_MANAGE)) {
    throw new Error("RBAC: TENANT_OWNER must have module:manage permission");
  }

  // 3. Generic GIS permissions
  if (!hasPermission(USER_ROLES.OPERATOR, PERMISSIONS.GIS_MAP_READ)) {
    throw new Error("RBAC: OPERATOR role must have gis:map:read permission");
  }

  // 4. Viewer Restrictions
  if (hasPermission(USER_ROLES.VIEWER, PERMISSIONS.GIS_FEATURE_DELETE)) {
    throw new Error(
      "RBAC Violation: VIEWER role must not have gis:feature:delete permission",
    );
  }

  return true;
}
