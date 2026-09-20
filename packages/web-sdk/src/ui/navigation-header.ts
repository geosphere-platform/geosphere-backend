/**
 * GeoSphere Web SDK — Level 2 Reusable UI Component: GeoSphereNavigationHeader
 */

export interface GeoSphereNavigationHeaderProps {
  currentManeuver: string;
  nextManeuverDistanceMeters: number;
  etaMinutes: number;
  remainingDistanceKm: number;
}

export function renderGeoSphereNavigationHeaderHtml(props: GeoSphereNavigationHeaderProps): string {
  return `<div class="geosphere-card" data-geosphere-ui="navigation-header" style="background-color: #020617; border-color: #4f46e5;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <span style="font-size: 0.625rem; color: #818cf8; text-transform: uppercase; font-family: monospace;">Next Maneuver in ${props.nextManeuverDistanceMeters}m</span>
        <h4 style="font-size: 1.125rem; font-weight: 700; margin: 0.25rem 0 0 0; color: #ffffff;">${props.currentManeuver}</h4>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 1.25rem; font-weight: 700; color: #34d399;">${props.etaMinutes} min</span>
        <div style="font-size: 0.75rem; color: #94a3b8;">${props.remainingDistanceKm} km remaining</div>
      </div>
    </div>
  </div>`;
}
