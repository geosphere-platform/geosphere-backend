/**
 * GeoSphere Web SDK — Embedded Work Order Task Kanban Board Controller & UI
 */
export interface SDKKanbanTask {
    id: string;
    title: string;
    type: string;
    priority: "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
    status: "ASSIGNED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
    address: string;
    assignedAgentName: string;
}
export declare class GeoSphereTaskKanbanController {
    private tasks;
    constructor(tasks: SDKKanbanTask[]);
    getTasksByStatus(status: SDKKanbanTask["status"]): SDKKanbanTask[];
    transitionTaskStatus(taskId: string, newStatus: SDKKanbanTask["status"]): SDKKanbanTask | null;
    renderHTML(): string;
}
//# sourceMappingURL=kanban-board.d.ts.map