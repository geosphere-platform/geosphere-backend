/**
 * GeoSphere Platform Role-Based Access Control (RBAC) Contracts
 */
export function createAuthorizationContext(params) {
    const isSuper = params.isSuperAdmin || params.roles.includes("PLATFORM_ADMIN") || params.roles.includes("SUPER_ADMIN");
    return {
        tenantId: params.tenantId,
        userId: params.userId,
        roles: params.roles,
        permissions: params.permissions,
        isSuperAdmin: isSuper,
        can(permission) {
            if (isSuper)
                return true;
            if (!params.permissions || !Array.isArray(params.permissions))
                return false;
            return params.permissions.includes(permission) || params.permissions.includes("*");
        },
        hasRole(role) {
            if (isSuper)
                return true;
            if (!params.roles || !Array.isArray(params.roles))
                return false;
            return params.roles.includes(role);
        },
        canAccess(resource) {
            if (isSuper)
                return true;
            if (!params.permissions || !Array.isArray(params.permissions))
                return false;
            return params.permissions.some((p) => p.startsWith(resource) || p === "*");
        }
    };
}
//# sourceMappingURL=rbac.contracts.js.map