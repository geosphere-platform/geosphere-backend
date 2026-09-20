/**
 * GeoSphere Web SDK — UI Status Badge Component
 */
export interface GeoSphereStatusBadgeProps {
    status: "OK" | "DEGRADED" | "ERROR";
    modulesCount: number;
}
export declare function renderSDKStatusBadgeHtml(props: GeoSphereStatusBadgeProps): string;
//# sourceMappingURL=status-badge.d.ts.map