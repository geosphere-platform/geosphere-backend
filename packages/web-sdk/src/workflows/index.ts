import { HTTPClient } from "../http/index.js";
import { Workflow, APIResponse } from "../types/index.js";
import { GeoSphereWorkflowSDK, GeoSphereWorkflowConfig, GeoSphereWorkflowProvider } from "../contracts/workflow.contracts.js";

export class WorkflowsModule {
  constructor(private http: HTTPClient) {}

  public async listWorkflows(): Promise<APIResponse<Workflow[]>> {
    return this.http.get<Workflow[]>("/api/workflows");
  }

  public async triggerWorkflow(workflowId: string, payload: Record<string, unknown>): Promise<APIResponse<void>> {
    return this.http.post<void>(`/api/workflows/${workflowId}/trigger`, payload);
  }

  public createWorkflowSDK(
    config?: GeoSphereWorkflowConfig,
    provider?: GeoSphereWorkflowProvider
  ): GeoSphereWorkflowSDK {
    return new GeoSphereWorkflowSDK(config, provider);
  }
}

export * from "../contracts/workflow.contracts.js";
export * from "../contracts/workflow-ui.contracts.js";
