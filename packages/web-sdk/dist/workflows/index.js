import { GeoSphereWorkflowSDK } from "../contracts/workflow.contracts.js";
export class WorkflowsModule {
    http;
    constructor(http) {
        this.http = http;
    }
    async listWorkflows() {
        return this.http.get("/api/workflows");
    }
    async triggerWorkflow(workflowId, payload) {
        return this.http.post(`/api/workflows/${workflowId}/trigger`, payload);
    }
    createWorkflowSDK(config, provider) {
        return new GeoSphereWorkflowSDK(config, provider);
    }
}
export * from "../contracts/workflow.contracts.js";
export * from "../contracts/workflow-ui.contracts.js";
//# sourceMappingURL=index.js.map