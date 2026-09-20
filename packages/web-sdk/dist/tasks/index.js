import { GeoSphereTaskSDK } from "../contracts/task.contracts.js";
export class TasksModule {
    http;
    constructor(http) {
        this.http = http;
    }
    async listTasks() {
        return this.http.get("/api/tasks");
    }
    async updateTaskStatus(taskId, status) {
        return this.http.patch(`/api/tasks/${taskId}`, { status });
    }
    createTaskSDK(config, provider) {
        return new GeoSphereTaskSDK(config, provider);
    }
}
export * from "../contracts/task.contracts.js";
export * from "../contracts/task-ui.contracts.js";
//# sourceMappingURL=index.js.map