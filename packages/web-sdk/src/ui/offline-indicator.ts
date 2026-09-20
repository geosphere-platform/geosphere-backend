/**
 * GeoSphere Web SDK — Level 2 Reusable UI Component: GeoSphereOfflineIndicator
 */

export interface GeoSphereOfflineIndicatorProps {
  isOnline: boolean;
  pendingSyncCount: number;
}

export function renderGeoSphereOfflineIndicatorHtml(props: GeoSphereOfflineIndicatorProps): string {
  const statusText = props.isOnline ? "ONLINE" : "OFFLINE";
  const badgeClass = props.isOnline ? "geosphere-status-badge" : "geosphere-status-badge degraded";

  return `<div class="${badgeClass}" data-geosphere-ui="offline-indicator">
    <span class="indicator"></span>
    <span>Sync Engine: ${statusText}</span>
    <span style="opacity: 0.75;">(${props.pendingSyncCount} Queued Ops)</span>
  </div>`;
}
