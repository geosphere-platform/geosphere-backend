/**
 * GeoSphere Web SDK — Embedded Fleet Telemetry Panel Controller & UI
 */
export class GeoSphereTelemetryController {
    agents;
    constructor(agents) {
        this.agents = agents;
    }
    getAgents() {
        return this.agents;
    }
    renderHTML() {
        return `<div class="geosphere-telemetry-panel" style="background: #0f172a; border: 1px solid rgba(99,102,241,0.3); border-radius: 10px; padding: 1rem;">
      <h3 style="font-size: 0.75rem; font-family: monospace; font-weight: 700; color: #a5b4fc; uppercase; margin-bottom: 0.75rem;">Fleet Telemetry Roster</h3>
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        ${this.agents
            .map((a) => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem; background: #020617; border: 1px solid #1e293b; border-radius: 6px; font-family: monospace; font-size: 0.75rem;">
            <div>
              <div style="font-weight: 700; color: #f1f5f9;">${a.name}</div>
              <div style="font-size: 0.65rem; color: #10b981;">📍 ${a.lat}° N, ${a.lng}° E</div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; background: rgba(16,185,129,0.2); color: #10b981;">${a.availability}</span>
              <div style="font-size: 0.65rem; color: #f59e0b; margin-top: 0.2rem;">🔋 ${a.batteryLevel}%</div>
            </div>
          </div>`)
            .join("")}
      </div>
    </div>`;
    }
}
//# sourceMappingURL=telemetry-panel.js.map