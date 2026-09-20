/**
 * GeoSphere Web SDK — Embedded Work Order Task Kanban Board Controller & UI
 */
export class GeoSphereTaskKanbanController {
    tasks;
    constructor(tasks) {
        this.tasks = tasks;
    }
    getTasksByStatus(status) {
        return this.tasks.filter((t) => t.status === status);
    }
    transitionTaskStatus(taskId, newStatus) {
        const task = this.tasks.find((t) => t.id === taskId);
        if (task) {
            task.status = newStatus;
            return task;
        }
        return null;
    }
    renderHTML() {
        const statuses = ["ASSIGNED", "ACCEPTED", "IN_PROGRESS", "COMPLETED"];
        return `<div class="geosphere-kanban-root" style="display: flex; gap: 1rem; width: 100%; overflow-x: auto;">
      ${statuses
            .map((status) => `
        <div class="geosphere-kanban-col" style="flex: 1; min-width: 220px; background: rgba(15,23,42,0.8); border: 1px solid rgba(99,102,241,0.2); border-radius: 8px; padding: 1rem;">
          <h3 style="font-size: 0.75rem; font-family: monospace; text-transform: uppercase; color: #a5b4fc; margin-bottom: 0.75rem;">${status} (${this.getTasksByStatus(status).length})</h3>
          ${this.getTasksByStatus(status)
            .map((t) => `
            <div class="geosphere-card" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #020617; border: 1px solid rgba(99,102,241,0.3); border-radius: 6px;">
              <div style="font-size: 0.75rem; font-weight: 700; color: #f1f5f9;">${t.title}</div>
              <div style="font-size: 0.65rem; color: #94a3b8; margin-top: 0.25rem;">📍 ${t.address}</div>
              <div style="font-size: 0.65rem; color: #6366f1; margin-top: 0.25rem; font-family: monospace;">👤 ${t.assignedAgentName}</div>
            </div>`)
            .join("")}
        </div>`)
            .join("")}
    </div>`;
    }
}
//# sourceMappingURL=kanban-board.js.map