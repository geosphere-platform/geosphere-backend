/**
 * GeoSphere Workflow & Process Automation SDK Core Contracts
 * Framework-Neutral Versioned Definition, Deterministic State Machine, Approvals, Timers & Audit Trail Engine
 */
export class GeoSphereWorkflowError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(`[WORKFLOW_ERROR:${code}] ${message}`);
        this.code = code;
        this.details = details;
        this.name = "GeoSphereWorkflowError";
    }
}
export class GeoSphereMockWorkflowProvider {
    definitions = new Map();
    executions = new Map();
    approvals = new Map();
    history = new Map();
    constructor() {
        const seedDef = {
            workflowId: "wf_seed_001",
            version: "1.0",
            name: "Generic Asset Approval Process",
            description: "Standard multi-stage process automation.",
            initialState: "state_draft",
            states: [
                { id: "state_draft", name: "Draft", type: "INITIAL" },
                { id: "state_approval", name: "Pending Approval", type: "APPROVAL" },
                { id: "state_completed", name: "Completed", type: "COMPLETED" },
                { id: "state_cancelled", name: "Cancelled", type: "CANCELLED" }
            ],
            transitions: [
                { transitionId: "tr_submit", fromState: "state_draft", toState: "state_approval" },
                { transitionId: "tr_approve", fromState: "state_approval", toState: "state_completed" },
                { transitionId: "tr_cancel", fromState: "state_draft", toState: "state_cancelled" }
            ]
        };
        this.definitions.set(seedDef.workflowId, seedDef);
    }
    getProviderInfo() {
        return { name: "GeoSphereMockWorkflowProvider", version: "1.0.0" };
    }
    getCapabilities() {
        return [
            "WORKFLOW_EXECUTION",
            "STATE_TRANSITIONS",
            "APPROVALS",
            "ASSIGNMENTS",
            "TIMERS",
            "ESCALATIONS",
            "FORM_INTEGRATION",
            "OFFLINE_QUEUEING",
            "AUDIT_HISTORY",
            "REALTIME_NOTIFICATIONS"
        ];
    }
    async getWorkflowDefinition(workflowId) {
        const def = this.definitions.get(workflowId);
        if (!def)
            throw new GeoSphereWorkflowError("DEFINITION_INVALID", `Workflow definition ID ${workflowId} not found.`);
        return JSON.parse(JSON.stringify(def));
    }
    async startWorkflow(workflowId, initialContext = {}) {
        const def = await this.getWorkflowDefinition(workflowId);
        const nowIso = new Date().toISOString();
        const execution = {
            executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            workflowId,
            workflowVersion: def.version,
            currentState: def.initialState,
            startedAt: nowIso,
            updatedAt: nowIso,
            context: initialContext,
            status: "ACTIVE",
            versionNumber: 1
        };
        this.executions.set(execution.executionId, execution);
        this.recordHistory(execution.executionId, undefined, "", def.initialState, "system");
        return JSON.parse(JSON.stringify(execution));
    }
    async transitionWorkflow(executionId, transitionId, contextUpdates = {}) {
        const exec = this.executions.get(executionId);
        if (!exec)
            throw new GeoSphereWorkflowError("EXECUTION_FAILED", `Execution ID ${executionId} not found.`);
        const def = await this.getWorkflowDefinition(exec.workflowId);
        const transition = def.transitions.find((t) => t.transitionId === transitionId);
        if (!transition || transition.fromState !== exec.currentState) {
            throw new GeoSphereWorkflowError("TRANSITION_INVALID", `Transition ID ${transitionId} is invalid for current state ${exec.currentState}.`);
        }
        const targetState = def.states.find((s) => s.id === transition.toState);
        const fromState = exec.currentState;
        const nowIso = new Date().toISOString();
        exec.currentState = transition.toState;
        exec.updatedAt = nowIso;
        exec.context = { ...exec.context, ...contextUpdates };
        exec.versionNumber += 1;
        if (targetState?.type === "COMPLETED" || targetState?.type === "CANCELLED" || targetState?.type === "FAILED") {
            exec.status = targetState.type;
            exec.completedAt = nowIso;
        }
        this.recordHistory(executionId, transitionId, fromState, transition.toState, "user");
        return JSON.parse(JSON.stringify(exec));
    }
    async requestApproval(executionId, approvers, minApprovals = 1) {
        const approval = {
            approvalId: `appr_${Date.now()}`,
            executionId,
            requiredApprovers: approvers,
            approvedBy: [],
            status: "PENDING",
            minApprovals
        };
        this.approvals.set(approval.approvalId, approval);
        return JSON.parse(JSON.stringify(approval));
    }
    async submitApproval(approvalId, actorId, approve) {
        const appr = this.approvals.get(approvalId);
        if (!appr)
            throw new GeoSphereWorkflowError("APPROVAL_DENIED", `Approval ID ${approvalId} not found.`);
        if (!approve) {
            appr.status = "REJECTED";
        }
        else {
            if (!appr.approvedBy.includes(actorId))
                appr.approvedBy.push(actorId);
            if (appr.approvedBy.length >= appr.minApprovals)
                appr.status = "APPROVED";
        }
        return JSON.parse(JSON.stringify(appr));
    }
    async getExecutionHistory(executionId) {
        return this.history.get(executionId) || [];
    }
    recordHistory(executionId, transitionId, fromState, toState, actorId) {
        const list = this.history.get(executionId) || [];
        list.push({
            eventId: `evt_wf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            executionId,
            transitionId,
            fromState,
            toState,
            actorId,
            timestamp: new Date().toISOString()
        });
        this.history.set(executionId, list);
    }
}
export class GeoSphereWorkflowSDK {
    config;
    provider;
    listeners = new Map();
    constructor(config = {}, provider) {
        this.config = config;
        this.provider = provider || new GeoSphereMockWorkflowProvider();
    }
    async initialize() { }
    getProviderInfo() {
        return this.provider.getProviderInfo();
    }
    getCapabilities() {
        return this.provider.getCapabilities();
    }
    hasCapability(capability) {
        return this.getCapabilities().includes(capability);
    }
    async getWorkflowDefinition(workflowId) {
        return this.provider.getWorkflowDefinition(workflowId);
    }
    async startWorkflow(workflowId, initialContext) {
        const exec = await this.provider.startWorkflow(workflowId, initialContext);
        this.notifyListeners("workflows.started", { execution: exec });
        return exec;
    }
    async transitionWorkflow(executionId, transitionId, contextUpdates) {
        const exec = await this.provider.transitionWorkflow(executionId, transitionId, contextUpdates);
        this.notifyListeners("workflows.transitioned", { execution: exec });
        return exec;
    }
    async requestApproval(executionId, approvers, minApprovals) {
        const appr = await this.provider.requestApproval(executionId, approvers, minApprovals);
        this.notifyListeners("workflows.approvalRequested", { approval: appr });
        return appr;
    }
    async submitApproval(approvalId, actorId, approve) {
        const appr = await this.provider.submitApproval(approvalId, actorId, approve);
        this.notifyListeners("workflows.approvalSubmitted", { approval: appr });
        return appr;
    }
    async getExecutionHistory(executionId) {
        return this.provider.getExecutionHistory(executionId);
    }
    subscribe(onEvent) {
        const subId = `wf_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        this.listeners.set(subId, onEvent);
        return {
            id: subId,
            unsubscribe: () => {
                this.listeners.delete(subId);
            }
        };
    }
    destroy() {
        this.listeners.clear();
    }
    notifyListeners(type, payload) {
        this.listeners.forEach((listener) => {
            try {
                listener({ type, payload });
            }
            catch (err) {
                console.error("[WORKFLOW_LISTENER_ERROR] Listener error:", err);
            }
        });
    }
}
//# sourceMappingURL=workflow.contracts.js.map