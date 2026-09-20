/**
 * GeoSphere Platform Role-Based Access Control (RBAC) Contracts
 */

export type GeoSphereRole =
  | "PLATFORM_ADMIN"
  | "TENANT_OWNER"
  | "TENANT_ADMIN"
  | "ORG_ADMIN"
  | "MANAGER"
  | "OPERATOR"
  | "DISPATCHER"
  | "FIELD_AGENT"
  | "DRIVER"
  | "VIEWER"
  | string;

export type GeoSpherePermission =
  | "gis.map.read"
  | "gis.feature.read"
  | "gis.feature.create"
  | "gis.feature.update"
  | "gis.feature.delete"
  | "gis.geometry.edit"
  | "location.read"
  | "location.ingest"
  | "tracking.live.read"
  | "tracking.history.read"
  | "tracking.playback"
  | "routing.calculate"
  | "geofence.read"
  | "geofence.create"
  | "geofence.update"
  | "geofence.delete"
  | "field_force.task.read"
  | "field_force.task.create"
  | "field_force.task.update"
  | "field_force.visit.read"
  | "field_force.checkin"
  | "offline.sync"
  | "report.read"
  | "report.export"
  | "admin.users"
  | "admin.roles"
  | "admin.tenant"
  | string;

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

export function createAuthorizationContext(params: {
  tenantId: string;
  userId: string;
  roles: string[];
  permissions: string[];
  isSuperAdmin?: boolean;
}): GeoSphereAuthorizationContext {
  const isSuper = params.isSuperAdmin || params.roles.includes("PLATFORM_ADMIN") || params.roles.includes("SUPER_ADMIN");

  return {
    tenantId: params.tenantId,
    userId: params.userId,
    roles: params.roles,
    permissions: params.permissions,
    isSuperAdmin: isSuper,

    can(permission: string): boolean {
      if (isSuper) return true;
      if (!params.permissions || !Array.isArray(params.permissions)) return false;
      return params.permissions.includes(permission) || params.permissions.includes("*");
    },

    hasRole(role: string): boolean {
      if (isSuper) return true;
      if (!params.roles || !Array.isArray(params.roles)) return false;
      return params.roles.includes(role);
    },

    canAccess(resource: string): boolean {
      if (isSuper) return true;
      if (!params.permissions || !Array.isArray(params.permissions)) return false;
      return params.permissions.some((p) => p.startsWith(resource) || p === "*");
    }
  };
}
