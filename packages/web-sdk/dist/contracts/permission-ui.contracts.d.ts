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
export declare function evaluatePermissionState(userPermissions: string[], requiredPermission: string, mode?: VisualAuthorizationMode): GeoSpherePermissionContext;
//# sourceMappingURL=permission-ui.contracts.d.ts.map