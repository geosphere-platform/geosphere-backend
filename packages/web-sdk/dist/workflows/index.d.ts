import { HTTPClient } from "../http/index.js";
import { Workflow, APIResponse } from "../types/index.js";
import { GeoSphereWorkflowSDK, GeoSphereWorkflowConfig, GeoSphereWorkflowProvider } from "../contracts/workflow.contracts.js";
export declare class WorkflowsModule {
    private http;
    constructor(http: HTTPClient);
    listWorkflows(): Promise<APIResponse<Workflow[]>>;
    triggerWorkflow(workflowId: string, payload: Record<string, unknown>): Promise<APIResponse<void>>;
    createWorkflowSDK(config?: GeoSphereWorkflowConfig, provider?: GeoSphereWorkflowProvider): GeoSphereWorkflowSDK;
}
export * from "../contracts/workflow.contracts.js";
export * from "../contracts/workflow-ui.contracts.js";
//# sourceMappingURL=index.d.ts.map