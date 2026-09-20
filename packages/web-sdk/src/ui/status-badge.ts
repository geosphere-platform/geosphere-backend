/**
 * GeoSphere Web SDK — UI Status Badge Component
 */

export interface GeoSphereStatusBadgeProps {
  status: "OK" | "DEGRADED" | "ERROR";
  modulesCount: number;
}

export function renderSDKStatusBadgeHtml(props: GeoSphereStatusBadgeProps): string {
  const isOk = props.status === "OK";
  const badgeClass = isOk ? "geosphere-status-badge" : "geosphere-status-badge degraded";
  return `<div class="${badgeClass}">
    <span class="indicator"></span>
    <span>SDK Status: ${props.status}</span>
    <span style="opacity: 0.7;">(${props.modulesCount} Active Engines)</span>
  </div>`;
}
