import { HTTPClient } from "../http/index.js";
import { Task, APIResponse } from "../types/index.js";
import { GeoSphereTaskSDK, GeoSphereTaskConfig, GeoSphereTaskProvider } from "../contracts/task.contracts.js";
export declare class TasksModule {
    private http;
    constructor(http: HTTPClient);
    listTasks(): Promise<APIResponse<Task[]>>;
    updateTaskStatus(taskId: string, status: Task["status"]): Promise<APIResponse<Task>>;
    createTaskSDK(config?: GeoSphereTaskConfig, provider?: GeoSphereTaskProvider): GeoSphereTaskSDK;
}
export * from "../contracts/task.contracts.js";
export * from "../contracts/task-ui.contracts.js";
//# sourceMappingURL=index.d.ts.map