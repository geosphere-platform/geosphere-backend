/**
 * GeoSphere Workflow & Process Automation SDK Core Contracts
 * Framework-Neutral Versioned Definition, Deterministic State Machine, Approvals, Timers & Audit Trail Engine
 */

export type GeoSphereWorkflowStateType =
  | "INITIAL"
  | "ACTIVE"
  | "WAITING"
  | "APPROVAL"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED";

export type GeoSphereWorkflowActionType =
  | "SET_VALUE"
  | "CLEAR_VALUE"
  | "CREATE_EVENT"
  | "SEND_NOTIFICATION"
  | "ASSIGN"
  | "UNASSIGN"
  | "START_TIMER"
  | "CANCEL_TIMER"
  | "REQUEST_APPROVAL"
  | "COMPLETE_APPROVAL"
  | "REQUEST_FORM"
  | "CREATE_TASK_REFERENCE";

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

export type GeoSphereWorkflowCapability =
  | "WORKFLOW_EXECUTION"
  | "STATE_TRANSITIONS"
  | "APPROVALS"
  | "ASSIGNMENTS"
  | "TIMERS"
  | "ESCALATIONS"
  | "FORM_INTEGRATION"
  | "OFFLINE_QUEUEING"
  | "AUDIT_HISTORY"
  | "REALTIME_NOTIFICATIONS";

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

export class GeoSphereWorkflowError extends Error {
  constructor(
    public readonly code:
      | "DEFINITION_INVALID"
      | "STATE_INVALID"
      | "TRANSITION_INVALID"
      | "CONDITION_FAILED"
      | "PERMISSION_DENIED"
      | "APPROVAL_DENIED"
      | "CONCURRENCY_CONFLICT"
      | "EXECUTION_FAILED"
      | "TIMEOUT"
      | "DEPENDENCY_FAILED"
      | "UNKNOWN_ERROR",
    message: string,
    public readonly details?: unknown
  ) {
    super(`[WORKFLOW_ERROR:${code}] ${message}`);
    this.name = "GeoSphereWorkflowError";
  }
}

export class GeoSphereMockWorkflowProvider implements GeoSphereWorkflowProvider {
  private definitions = new Map<string, GeoSphereWorkflowDefinition>();
  private executions = new Map<string, GeoSphereWorkflowExecution>();
  private approvals = new Map<string, GeoSphereWorkflowApproval>();
  private history = new Map<string, GeoSphereWorkflowHistory[]>();

  constructor() {
    const seedDef: GeoSphereWorkflowDefinition = {
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

  public getProviderInfo(): GeoSphereWorkflowProviderInfo {
    return { name: "GeoSphereMockWorkflowProvider", version: "1.0.0" };
  }

  public getCapabilities(): GeoSphereWorkflowCapability[] {
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

  public async getWorkflowDefinition(workflowId: string): Promise<GeoSphereWorkflowDefinition> {
    const def = this.definitions.get(workflowId);
    if (!def) throw new GeoSphereWorkflowError("DEFINITION_INVALID", `Workflow definition ID ${workflowId} not found.`);
    return JSON.parse(JSON.stringify(def));
  }

  public async startWorkflow(workflowId: string, initialContext: Record<string, unknown> = {}): Promise<GeoSphereWorkflowExecution> {
    const def = await this.getWorkflowDefinition(workflowId);
    const nowIso = new Date().toISOString();

    const execution: GeoSphereWorkflowExecution = {
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

  public async transitionWorkflow(
    executionId: string,
    transitionId: string,
    contextUpdates: Record<string, unknown> = {}
  ): Promise<GeoSphereWorkflowExecution> {
    const exec = this.executions.get(executionId);
    if (!exec) throw new GeoSphereWorkflowError("EXECUTION_FAILED", `Execution ID ${executionId} not found.`);

    const def = await this.getWorkflowDefinition(exec.workflowId);
    const transition = def.transitions.find((t) => t.transitionId === transitionId);
    if (!transition || transition.fromState !== exec.currentState) {
      throw new GeoSphereWorkflowError(
        "TRANSITION_INVALID",
        `Transition ID ${transitionId} is invalid for current state ${exec.currentState}.`
      );
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

  public async requestApproval(executionId: string, approvers: string[], minApprovals: number = 1): Promise<GeoSphereWorkflowApproval> {
    const approval: GeoSphereWorkflowApproval = {
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

  public async submitApproval(approvalId: string, actorId: string, approve: boolean): Promise<GeoSphereWorkflowApproval> {
    const appr = this.approvals.get(approvalId);
    if (!appr) throw new GeoSphereWorkflowError("APPROVAL_DENIED", `Approval ID ${approvalId} not found.`);

    if (!approve) {
      appr.status = "REJECTED";
    } else {
      if (!appr.approvedBy.includes(actorId)) appr.approvedBy.push(actorId);
      if (appr.approvedBy.length >= appr.minApprovals) appr.status = "APPROVED";
    }

    return JSON.parse(JSON.stringify(appr));
  }

  public async getExecutionHistory(executionId: string): Promise<GeoSphereWorkflowHistory[]> {
    return this.history.get(executionId) || [];
  }

  private recordHistory(executionId: string, transitionId: string | undefined, fromState: string, toState: string, actorId: string): void {
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

export interface GeoSphereWorkflowConfig {
  embeddedMode?: boolean;
}

export class GeoSphereWorkflowSDK {
  private provider: GeoSphereWorkflowProvider;
  private listeners: Map<string, (event: { type: string; payload: unknown }) => void> = new Map();

  constructor(
    private config: GeoSphereWorkflowConfig = {},
    provider?: GeoSphereWorkflowProvider
  ) {
    this.provider = provider || new GeoSphereMockWorkflowProvider();
  }

  public async initialize(): Promise<void> {}

  public getProviderInfo(): GeoSphereWorkflowProviderInfo {
    return this.provider.getProviderInfo();
  }

  public getCapabilities(): GeoSphereWorkflowCapability[] {
    return this.provider.getCapabilities();
  }

  public hasCapability(capability: GeoSphereWorkflowCapability): boolean {
    return this.getCapabilities().includes(capability);
  }

  public async getWorkflowDefinition(workflowId: string): Promise<GeoSphereWorkflowDefinition> {
    return this.provider.getWorkflowDefinition(workflowId);
  }

  public async startWorkflow(workflowId: string, initialContext?: Record<string, unknown>): Promise<GeoSphereWorkflowExecution> {
    const exec = await this.provider.startWorkflow(workflowId, initialContext);
    this.notifyListeners("workflows.started", { execution: exec });
    return exec;
  }

  public async transitionWorkflow(
    executionId: string,
    transitionId: string,
    contextUpdates?: Record<string, unknown>
  ): Promise<GeoSphereWorkflowExecution> {
    const exec = await this.provider.transitionWorkflow(executionId, transitionId, contextUpdates);
    this.notifyListeners("workflows.transitioned", { execution: exec });
    return exec;
  }

  public async requestApproval(executionId: string, approvers: string[], minApprovals?: number): Promise<GeoSphereWorkflowApproval> {
    const appr = await this.provider.requestApproval(executionId, approvers, minApprovals);
    this.notifyListeners("workflows.approvalRequested", { approval: appr });
    return appr;
  }

  public async submitApproval(approvalId: string, actorId: string, approve: boolean): Promise<GeoSphereWorkflowApproval> {
    const appr = await this.provider.submitApproval(approvalId, actorId, approve);
    this.notifyListeners("workflows.approvalSubmitted", { approval: appr });
    return appr;
  }

  public async getExecutionHistory(executionId: string): Promise<GeoSphereWorkflowHistory[]> {
    return this.provider.getExecutionHistory(executionId);
  }

  public subscribe(onEvent: (event: { type: string; payload: unknown }) => void): { id: string; unsubscribe: () => void } {
    const subId = `wf_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.listeners.set(subId, onEvent);
    return {
      id: subId,
      unsubscribe: () => {
        this.listeners.delete(subId);
      }
    };
  }

  public destroy(): void {
    this.listeners.clear();
  }

  private notifyListeners(type: string, payload: unknown): void {
    this.listeners.forEach((listener) => {
      try {
        listener({ type, payload });
      } catch (err) {
        console.error("[WORKFLOW_LISTENER_ERROR] Listener error:", err);
      }
    });
  }
}
