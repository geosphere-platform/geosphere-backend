/**
 * GeoSphere Web SDK — Embedded Geofence Perimeter Editor Controller & UI
 */
export class GeoSphereGeofenceController {
    config;
    constructor(config) {
        this.config = config;
    }
    setRadius(radiusMeters) {
        this.config.radiusMeters = Math.max(50, Math.min(5000, radiusMeters));
    }
    getConfig() {
        return this.config;
    }
    renderHTML() {
        return `<div class="geosphere-geofence-editor" style="background: #0f172a; border: 1px solid rgba(99,102,241,0.3); border-radius: 10px; padding: 1.25rem; color: #f1f5f9;">
      <h3 style="font-size: 0.875rem; font-family: monospace; font-weight: 700; color: #a5b4fc; text-transform: uppercase;">Geofence Perimeter Configurator</h3>
      <div style="font-size: 1rem; font-weight: 700; margin-top: 0.5rem;">${this.config.name}</div>
      <div style="font-family: monospace; font-size: 0.75rem; color: #10b981; margin-top: 0.25rem;">Center: ${this.config.lat}° N, ${this.config.lng}° E</div>
      <div style="margin-top: 1rem; padding: 0.75rem; background: #020617; border-radius: 6px; border: 1px solid #1e293b;">
        <span style="font-size: 0.75rem; font-family: monospace; color: #94a3b8;">Perimeter Radius: <b style="color: #6366f1;">${this.config.radiusMeters}m</b></span>
        <div style="font-size: 0.65rem; color: #64748b; margin-top: 0.25rem;">Triggers: ${this.config.triggers.join(", ")}</div>
      </div>
    </div>`;
    }
}
//# sourceMappingURL=geofence-editor.js.map