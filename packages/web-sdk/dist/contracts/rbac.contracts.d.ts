/**
 * GeoSphere Platform Role-Based Access Control (RBAC) Contracts
 */
export type GeoSphereRole = "PLATFORM_ADMIN" | "TENANT_OWNER" | "TENANT_ADMIN" | "ORG_ADMIN" | "MANAGER" | "OPERATOR" | "DISPATCHER" | "FIELD_AGENT" | "DRIVER" | "VIEWER" | string;
export type GeoSpherePermission = "gis.map.read" | "gis.feature.read" | "gis.feature.create" | "gis.feature.update" | "gis.feature.delete" | "gis.geometry.edit" | "location.read" | "location.ingest" | "tracking.live.read" | "tracking.history.read" | "tracking.playback" | "routing.calculate" | "geofence.read" | "geofence.create" | "geofence.update" | "geofence.delete" | "field_force.task.read" | "field_force.task.create" | "field_force.task.update" | "field_force.visit.read" | "field_force.checkin" | "offline.sync" | "report.read" | "report.export" | "admin.users" | "admin.roles" | "admin.tenant" | string;
export interface GeoSphereRoleAssignment {
    userId: string;
    tenantId: string;
    role: GeoSphereRole;
    assignedAt: string;
}
export interface GeoSphereAuthorizationContext {
    tenantId: string;
    userId: string;
    roles: string[];
    permissions: string[];
    isSuperAdmin?: boolean;
    can(permission: GeoSpherePermission): boolean;
    hasRole(role: GeoSphereRole): boolean;
    canAccess(resource: string): boolean;
}
export declare function createAuthorizationContext(params: {
    tenantId: string;
    userId: string;
    roles: string[];
    permissions: string[];
    isSuperAdmin?: boolean;
}): GeoSphereAuthorizationContext;
//# sourceMappingURL=rbac.contracts.d.ts.map