import { HTTPClient } from "../http/index.js";
import { Task, APIResponse } from "../types/index.js";
import { GeoSphereTaskSDK, GeoSphereTaskConfig, GeoSphereTaskProvider } from "../contracts/task.contracts.js";

export class TasksModule {
  constructor(private http: HTTPClient) {}

  public async listTasks(): Promise<APIResponse<Task[]>> {
    return this.http.get<Task[]>("/api/tasks");
  }

  public async updateTaskStatus(taskId: string, status: Task["status"]): Promise<APIResponse<Task>> {
    return this.http.patch<Task>(`/api/tasks/${taskId}`, { status });
  }

  public createTaskSDK(
    config?: GeoSphereTaskConfig,
    provider?: GeoSphereTaskProvider
  ): GeoSphereTaskSDK {
    return new GeoSphereTaskSDK(config, provider);
  }
}

export * from "../contracts/task.contracts.js";
export * from "../contracts/task-ui.contracts.js";
