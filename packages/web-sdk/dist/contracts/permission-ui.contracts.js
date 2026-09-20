/**
 * GeoSphere Permission-Aware UI Contracts
 */
export function evaluatePermissionState(userPermissions, requiredPermission, mode = "hide") {
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
//# sourceMappingURL=permission-ui.contracts.js.map