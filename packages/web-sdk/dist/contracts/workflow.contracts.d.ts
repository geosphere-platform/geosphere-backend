/**
 * GeoSphere Workflow & Process Automation SDK Core Contracts
 * Framework-Neutral Versioned Definition, Deterministic State Machine, Approvals, Timers & Audit Trail Engine
 */
export type GeoSphereWorkflowStateType = "INITIAL" | "ACTIVE" | "WAITING" | "APPROVAL" | "COMPLETED" | "CANCELLED" | "FAILED";
export type GeoSphereWorkflowActionType = "SET_VALUE" | "CLEAR_VALUE" | "CREATE_EVENT" | "SEND_NOTIFICATION" | "ASSIGN" | "UNASSIGN" | "START_TIMER" | "CANCEL_TIMER" | "REQUEST_APPROVAL" | "COMPLETE_APPROVAL" | "REQUEST_FORM" | "CREATE_TASK_REFERENCE";
export interface GeoSphereWorkflowState {
    id: string;
    name: string;
    type: GeoSphereWorkflowStateType;
    description?: string;
    metadata?: Record<string, unknown>;
}
export interface GeoSphereWorkflowCondition {
    fieldId: string;
    operator: "equals" | "notEquals" | "contains" | "notContains" | "greaterThan" | "lessThan" | "greaterThanOrEqual" | "lessThanOrEqual" | "isEmpty" | "isNotEmpty";
    value?: unknown;
}
export interface GeoSphereWorkflowAction {
    id: string;
    type: GeoSphereWorkflowActionType;
    target?: string;
    payload?: Record<string, unknown>;
}
export interface GeoSphereWorkflowTransition {
    transitionId: string;
    fromState: string;
    toState: string;
    conditions?: GeoSphereWorkflowCondition[];
    logicalOperator?: "AND" | "OR";
    actions?: GeoSphereWorkflowAction[];
    requiredPermissions?: string[];
    metadata?: Record<string, unknown>;
}
export interface GeoSphereWorkflowDefinition {
    workflowId: string;
    version: string;
    name: string;
    description?: string;
    initialState: string;
    states: GeoSphereWorkflowState[];
    transitions: GeoSphereWorkflowTransition[];
    metadata?: Record<string, unknown>;
}
export interface GeoSphereWorkflowAssignment {
    assignmentId: string;
    assigneeId: string;
    assigneeType: "USER" | "ROLE" | "TEAM" | "GROUP";
    assignedAt: string;
}
export interface GeoSphereWorkflowApproval {
    approvalId: string;
    executionId: string;
    requiredApprovers: string[];
    approvedBy: string[];
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    minApprovals: number;
}
export interface GeoSphereWorkflowTimer {
    timerId: string;
    executionId: string;
    durationMs: number;
    expiresAt: string;
    status: "RUNNING" | "EXPIRED" | "CANCELLED";
}
export interface GeoSphereWorkflowEscalation {
    escalationId: string;
    afterDurationMs: number;
    escalateToRole: string;
    triggerNotification?: boolean;
}
export interface GeoSphereWorkflowExecution {
    executionId: string;
    workflowId: string;
    workflowVersion: string;
    currentState: string;
    startedAt: string;
    updatedAt: string;
    completedAt?: string;
    context: Record<string, unknown>;
    status: GeoSphereWorkflowStateType;
    versionNumber: number;
}
export interface GeoSphereWorkflowHistory {
    eventId: string;
    executionId: string;
    transitionId?: string;
    fromState: string;
    toState: string;
    actorId?: string;
    timestamp: string;
    correlationId?: string;
}
export type GeoSphereWorkflowCapability = "WORKFLOW_EXECUTION" | "STATE_TRANSITIONS" | "APPROVALS" | "ASSIGNMENTS" | "TIMERS" | "ESCALATIONS" | "FORM_INTEGRATION" | "OFFLINE_QUEUEING" | "AUDIT_HISTORY" | "REALTIME_NOTIFICATIONS";
export interface GeoSphereWorkflowProviderInfo {
    name: string;
    version: string;
}
export interface GeoSphereWorkflowProvider {
    getProviderInfo(): GeoSphereWorkflowProviderInfo;
    getCapabilities(): GeoSphereWorkflowCapability[];
    getWorkflowDefinition(workflowId: string): Promise<GeoSphereWorkflowDefinition>;
    startWorkflow(workflowId: string, initialContext?: Record<string, unknown>): Promise<GeoSphereWorkflowExecution>;
    transitionWorkflow(executionId: string, transitionId: string, contextUpdates?: Record<string, unknown>): Promise<GeoSphereWorkflowExecution>;
    requestApproval(executionId: string, approvers: string[], minApprovals?: number): Promise<GeoSphereWorkflowApproval>;
    submitApproval(approvalId: string, actorId: string, approve: boolean): Promise<GeoSphereWorkflowApproval>;
    getExecutionHistory(executionId: string): Promise<GeoSphereWorkflowHistory[]>;
}
export declare class GeoSphereWorkflowError extends Error {
    readonly code: "DEFINITION_INVALID" | "STATE_INVALID" | "TRANSITION_INVALID" | "CONDITION_FAILED" | "PERMISSION_DENIED" | "APPROVAL_DENIED" | "CONCURRENCY_CONFLICT" | "EXECUTION_FAILED" | "TIMEOUT" | "DEPENDENCY_FAILED" | "UNKNOWN_ERROR";
    readonly details?: unknown | undefined;
    constructor(code: "DEFINITION_INVALID" | "STATE_INVALID" | "TRANSITION_INVALID" | "CONDITION_FAILED" | "PERMISSION_DENIED" | "APPROVAL_DENIED" | "CONCURRENCY_CONFLICT" | "EXECUTION_FAILED" | "TIMEOUT" | "DEPENDENCY_FAILED" | "UNKNOWN_ERROR", message: string, details?: unknown | undefined);
}
export declare class GeoSphereMockWorkflowProvider implements GeoSphereWorkflowProvider {
    private definitions;
    private executions;
    private approvals;
    private history;
    constructor();
    getProviderInfo(): GeoSphereWorkflowProviderInfo;
    getCapabilities(): GeoSphereWorkflowCapability[];
    getWorkflowDefinition(workflowId: string): Promise<GeoSphereWorkflowDefinition>;
    startWorkflow(workflowId: string, initialContext?: Record<string, unknown>): Promise<GeoSphereWorkflowExecution>;
    transitionWorkflow(executionId: string, transitionId: string, contextUpdates?: Record<string, unknown>): Promise<GeoSphereWorkflowExecution>;
    requestApproval(executionId: string, approvers: string[], minApprovals?: number): Promise<GeoSphereWorkflowApproval>;
    submitApproval(approvalId: string, actorId: string, approve: boolean): Promise<GeoSphereWorkflowApproval>;
    getExecutionHistory(executionId: string): Promise<GeoSphereWorkflowHistory[]>;
    private recordHistory;
}
export interface GeoSphereWorkflowConfig {
    embeddedMode?: boolean;
}
export declare class GeoSphereWorkflowSDK {
    private config;
    private provider;
    private listeners;
    constructor(config?: GeoSphereWorkflowConfig, provider?: GeoSphereWorkflowProvider);
    initialize(): Promise<void>;
    getProviderInfo(): GeoSphereWorkflowProviderInfo;
    getCapabilities(): GeoSphereWorkflowCapability[];
    hasCapability(capability: GeoSphereWorkflowCapability): boolean;
    getWorkflowDefinition(workflowId: string): Promise<GeoSphereWorkflowDefinition>;
    startWorkflow(workflowId: string, initialContext?: Record<string, unknown>): Promise<GeoSphereWorkflowExecution>;
    transitionWorkflow(executionId: string, transitionId: string, contextUpdates?: Record<string, unknown>): Promise<GeoSphereWorkflowExecution>;
    requestApproval(executionId: string, approvers: string[], minApprovals?: number): Promise<GeoSphereWorkflowApproval>;
    submitApproval(approvalId: string, actorId: string, approve: boolean): Promise<GeoSphereWorkflowApproval>;
    getExecutionHistory(executionId: string): Promise<GeoSphereWorkflowHistory[]>;
    subscribe(onEvent: (event: {
        type: string;
        payload: unknown;
    }) => void): {
        id: string;
        unsubscribe: () => void;
    };
    destroy(): void;
    private notifyListeners;
}
//# sourceMappingURL=workflow.contracts.d.ts.map