/**
 * GeoSphere Web SDK — Embedded Security Audit Stream Controller & UI
 */
export class GeoSphereAuditStreamController {
    events;
    constructor(events) {
        this.events = events;
    }
    renderHTML() {
        return `<div class="geosphere-audit-stream" style="background: #0f172a; border: 1px solid rgba(99,102,241,0.3); border-radius: 10px; padding: 1rem;">
      <h3 style="font-size: 0.75rem; font-family: monospace; font-weight: 700; color: #f43f5e; uppercase; margin-bottom: 0.75rem;">Security Audit Stream</h3>
      <table style="width: 100%; text-align: left; font-family: monospace; font-size: 0.7rem; border-collapse: collapse; color: #cbd5e1;">
        <thead>
          <tr style="border-b: 1px solid #1e293b; color: #64748b;">
            <th style="padding: 0.4rem;">Actor</th>
            <th style="padding: 0.4rem;">Action</th>
            <th style="padding: 0.4rem;">Target</th>
            <th style="padding: 0.4rem;">Result</th>
          </tr>
        </thead>
        <tbody>
          ${this.events
            .map((e) => `
            <tr style="border-b: 1px solid rgba(30,41,59,0.5);">
              <td style="padding: 0.4rem; color: #a5b4fc;">${e.actor}</td>
              <td style="padding: 0.4rem; font-weight: 700; color: #f1f5f9;">${e.action}</td>
              <td style="padding: 0.4rem; color: #94a3b8;">${e.target}</td>
              <td style="padding: 0.4rem;"><span style="color: #10b981; background: rgba(16,185,129,0.15); padding: 1px 4px; border-radius: 3px;">${e.result}</span></td>
            </tr>`)
            .join("")}
        </tbody>
      </table>
    </div>`;
    }
}
//# sourceMappingURL=audit-stream.js.map