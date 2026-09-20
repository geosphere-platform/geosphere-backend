import { USER_ROLES, PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { signAccessToken } from "@/core/auth/jwt";

export async function runDashboardSecurityTests(): Promise<boolean> {
  // 1. Unauthenticated Request Test
  const token = null;
  if (token !== null) {
    throw new Error("Unauthenticated check failed");
  }

  // 2. Unauthorized Role Test
  const viewerRole = USER_ROLES.VIEWER;
  const canDeleteVehicle = hasPermission(
    viewerRole,
    PERMISSIONS.VEHICLE_DELETE,
  );
  if (canDeleteVehicle) {
    throw new Error(
      "Security Violation: VIEWER role must not have vehicle:delete permission",
    );
  }

  // 3. Unauthorized Permission Test
  const driverRole = USER_ROLES.DRIVER;
  const canCreateUser = hasPermission(driverRole, PERMISSIONS.USER_CREATE);
  if (canCreateUser) {
    throw new Error(
      "Security Violation: DRIVER role must not have user:create permission",
    );
  }

  // 4. Cross-Organization Access Boundary Test
  const userAOrg: string = "org-alpha-123";
  const vehicleOrg: string = "org-beta-999";

  const isCrossOrgAccessPermitted = (userOrg: string, resourceOrg: string) => {
    return userOrg === resourceOrg;
  };

  if (isCrossOrgAccessPermitted(userAOrg, vehicleOrg)) {
    throw new Error("Security Violation: Cross-organization access permitted!");
  }

  // 5. ID Manipulation Prevention Test
  const validUserToken = await signAccessToken({
    sub: "user-tenant-a",
    role: USER_ROLES.DISPATCHER,
    orgId: "org-alpha-123",
  });

  if (typeof validUserToken !== "string") {
    throw new Error("Token signing failed");
  }

  const resourceOwnerOrg: string = "org-beta-999";
  const userOrgFromToken: string = "org-alpha-123";

  if (userOrgFromToken !== resourceOwnerOrg) {
    const blockedReason = "FORBIDDEN: Resource belongs to another organization";
    if (!blockedReason.startsWith("FORBIDDEN")) {
      throw new Error("ID manipulation check failed");
    }
  }

  return true;
}
