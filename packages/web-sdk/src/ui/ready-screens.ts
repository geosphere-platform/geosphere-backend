/**
 * GeoSphere Web SDK — Level 3 Ready-Made Screen Controllers
 */

import { GeoSphereThemeManager } from "./theme.js";

export class GeoSphereMapScreenController {
  public renderScreen(): string {
    const theme = GeoSphereThemeManager.getTheme();
    return `<div class="geosphere-ui-root" style="padding: 1.5rem; background-color: ${theme.colors.background};">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: ${theme.colors.textPrimary}; margin: 0;">GeoSphere GIS Operations Map Screen</h2>
        <span class="geosphere-status-badge">Level 3 Ready Screen</span>
      </div>
      <div class="geosphere-map-container">
        <div class="geosphere-map-grid"></div>
        <div style="position: absolute; bottom: 1rem; left: 1rem;" class="geosphere-card">
          <span class="geosphere-card-title">Live GIS Layer Controls</span>
          <div style="font-size: 0.75rem; color: ${theme.colors.textSecondary}; margin-top: 0.25rem;">
            Vector Tiles • Geofence Overlays • Agent Markers
          </div>
        </div>
      </div>
    </div>`;
  }
}

export class GeoSphereOfflineScreenController {
  public renderScreen(pendingOps: number): string {
    const theme = GeoSphereThemeManager.getTheme();
    return `<div class="geosphere-ui-root" style="padding: 1.5rem; background-color: ${theme.colors.background};">
      <h2 style="font-size: 1.25rem; font-weight: 700; color: ${theme.colors.textPrimary}; margin-bottom: 1rem;">GeoSphere Offline Sync Manager Screen</h2>
      <div class="geosphere-card" style="margin-bottom: 1rem;">
        <span class="geosphere-card-title">Sync Engine Status</span>
        <p style="font-size: 0.875rem; color: ${theme.colors.textSecondary}; margin: 0.5rem 0;">
          All field agent check-ins, evidence files, and form submissions are saved locally with client operation IDs.
        </p>
        <div style="font-family: monospace; font-size: 0.75rem; color: ${theme.colors.accent};">
          Queued Operations: ${pendingOps} | Strategy: CLIENT_WIN_TIMESTAMP
        </div>
      </div>
    </div>`;
  }
}

export class GeoSphereNavigationScreenController {
  public renderScreen(maneuver: string, eta: number): string {
    const theme = GeoSphereThemeManager.getTheme();
    return `<div class="geosphere-ui-root" style="padding: 1.5rem; background-color: ${theme.colors.background};">
      <h2 style="font-size: 1.25rem; font-weight: 700; color: ${theme.colors.textPrimary}; margin-bottom: 1rem;">GeoSphere Navigation Screen</h2>
      <div class="geosphere-card" style="border-color: ${theme.colors.primary};">
        <span style="font-size: 0.75rem; font-family: monospace; color: ${theme.colors.accent}; font-weight: 600;">TURN-BY-TURN GUIDANCE</span>
        <h3 style="font-size: 1.5rem; font-weight: 700; margin: 0.5rem 0; color: #ffffff;">${maneuver}</h3>
        <div style="font-size: 0.875rem; color: ${theme.colors.success}; font-weight: 600;">ETA: ${eta} minutes remaining</div>
      </div>
    </div>`;
  }
}

export class GeoSphereKanbanScreenController {
  public renderScreen(): string {
    const theme = GeoSphereThemeManager.getTheme();
    return `<div class="geosphere-ui-root" style="padding: 1.5rem; background-color: ${theme.colors.background};">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: ${theme.colors.textPrimary};">GeoSphere Dispatch Kanban Screen</h2>
        <span class="geosphere-status-badge">Level 3 Ready Screen</span>
      </div>
    </div>`;
  }
}

export class GeoSphereFormScreenController {
  public renderScreen(formTitle: string): string {
    const theme = GeoSphereThemeManager.getTheme();
    return `<div class="geosphere-ui-root" style="padding: 1.5rem; background-color: ${theme.colors.background};">
      <h2 style="font-size: 1.25rem; font-weight: 700; color: ${theme.colors.textPrimary}; margin-bottom: 1rem;">${formTitle}</h2>
    </div>`;
  }
}

