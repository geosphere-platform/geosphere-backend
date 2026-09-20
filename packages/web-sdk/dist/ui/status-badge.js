/**
 * GeoSphere Web SDK — UI Status Badge Component
 */
export function renderSDKStatusBadgeHtml(props) {
    const isOk = props.status === "OK";
    const badgeClass = isOk ? "geosphere-status-badge" : "geosphere-status-badge degraded";
    return `<div class="${badgeClass}">
    <span class="indicator"></span>
    <span>SDK Status: ${props.status}</span>
    <span style="opacity: 0.7;">(${props.modulesCount} Active Engines)</span>
  </div>`;
}
//# sourceMappingURL=status-badge.js.map