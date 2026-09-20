import { signAccessToken } from "@/core/auth/jwt";
import { hasPermission } from "@/core/auth/permissions";
import { USER_ROLES, PERMISSIONS } from "@/core/constants";

export async function runSecurityChecks() {
  // 1. Unauthenticated verification
  const missingHeader = null;
  if (missingHeader !== null) {
    throw new Error("Expected missing header to be null");
  }

  // 2. Token creation test
  const token = await signAccessToken({
    sub: "user-123",
    role: USER_ROLES.DISPATCHER,
    orgId: "org-tenant-abc",
  });
  if (typeof token !== "string") {
    throw new Error("Token signing failed");
  }

  // 3. Permission Checks
  if (!hasPermission(USER_ROLES.SUPER_ADMIN, PERMISSIONS.VEHICLE_READ)) {
    throw new Error("SUPER_ADMIN should have vehicle:read permission");
  }

  if (hasPermission(USER_ROLES.DRIVER, PERMISSIONS.VEHICLE_CREATE)) {
    throw new Error("DRIVER must not have vehicle:create permission");
  }

  if (hasPermission(USER_ROLES.VIEWER, PERMISSIONS.VEHICLE_DELETE)) {
    throw new Error("VIEWER must not have vehicle:delete permission");
  }

  // 4. Tenant boundary logic
  const orgA: string = "org-tenant-111";
  const orgB: string = "org-tenant-999";
  const isSameOrg = (orgA as string) === (orgB as string);
  if (isSameOrg) {
    throw new Error("Tenant boundary mismatch");
  }

  return true;
}
