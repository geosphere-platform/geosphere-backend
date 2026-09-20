/**
 * GeoSphere Permission-Aware UI Contracts
 */

export type PermissionStatus = "granted" | "denied" | "unavailable" | "loading";

export type VisualAuthorizationMode = "hide" | "disable" | "read-only";

export interface GeoSpherePermissionContext {
  requiredPermission: string;
  status: PermissionStatus;
  mode: VisualAuthorizationMode;
  fallbackMessage?: string;
}

export function evaluatePermissionState(
  userPermissions: string[],
  requiredPermission: string,
  mode: VisualAuthorizationMode = "hide"
): GeoSpherePermissionContext {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return {
      requiredPermission,
      status: "unavailable",
      mode,
      fallbackMessage: "Permission evaluation unavailable."
    };
  }

  const isGranted = userPermissions.includes(requiredPermission) || userPermissions.includes("*");

  return {
    requiredPermission,
    status: isGranted ? "granted" : "denied",
    mode,
    fallbackMessage: isGranted ? undefined : `Access requires '${requiredPermission}' permission.`
  };
}
