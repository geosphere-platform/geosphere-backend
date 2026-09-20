/**
 * GeoSphere Rules & Policy Engine SDK Core Contracts
 * Framework-Neutral Rule Definitions, Declarative Condition Groups, Typed Operators, Policy Engine, Simulation & Security Controls
 */
export type GeoSphereRuleStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "SCHEDULED" | "EXPIRED" | "ARCHIVED";
export type GeoSphereRulePriority = "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
export type GeoSphereRuleOperator = "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "GREATER_THAN_OR_EQUAL" | "LESS_THAN" | "LESS_THAN_OR_EQUAL" | "IN" | "NOT_IN" | "CONTAINS" | "NOT_CONTAINS" | "STARTS_WITH" | "ENDS_WITH" | "IS_NULL" | "IS_NOT_NULL" | "BETWEEN" | "DATE_BEFORE" | "DATE_AFTER" | "DATE_BETWEEN";
export type GeoSphereRuleActionType = "SET_VALUE" | "SET_STATUS" | "ADD_TAG" | "REMOVE_TAG" | "CREATE_EVENT" | "CREATE_TASK_REFERENCE" | "UPDATE_TASK_REFERENCE" | "CREATE_NOTIFICATION_REQUEST" | "BLOCK_OPERATION" | "ALLOW_OPERATION" | "REQUIRE_APPROVAL" | "LOG_AUDIT_EVENT";
export type GeoSphereRuleTrigger = "ON_CREATE" | "ON_UPDATE" | "ON_DELETE" | "ON_STATUS_CHANGE" | "ON_ASSIGNMENT_CHANGE" | "ON_SCHEDULE_CHANGE" | "ON_LOCATION_EVENT" | "ON_FORM_SUBMISSION" | "ON_WORKFLOW_EVENT" | "ON_TASK_EVENT" | "ON_ASSET_EVENT" | "ON_TIMER" | "ON_DEMAND";
export type GeoSpherePolicyScope = "GLOBAL" | "TENANT" | "APPLICATION" | "RESOURCE_TYPE" | "RESOURCE" | "ROLE" | "USER" | "CONTEXT";
export type GeoSpherePolicyMode = "ENFORCE" | "WARN" | "AUDIT_ONLY";
export interface GeoSphereRuleCondition {
    field: string;
    operator: GeoSphereRuleOperator;
    value?: unknown;
}
export interface GeoSphereRuleGroup {
    combinator: "ALL" | "ANY" | "NONE";
    conditions?: GeoSphereRuleCondition[];
    groups?: GeoSphereRuleGroup[];
}
export interface GeoSphereRuleAction {
    type: GeoSphereRuleActionType;
    targetField?: string;
    value?: unknown;
    metadata?: Record<string, unknown>;
}
export interface GeoSphereRule {
    ruleId: string;
    name: string;
    description?: string;
    version: string;
    status: GeoSphereRuleStatus;
    priority: GeoSphereRulePriority;
    triggers: GeoSphereRuleTrigger[];
    rootGroup: GeoSphereRuleGroup;
    actions: GeoSphereRuleAction[];
    scope: GeoSpherePolicyScope;
    effectiveFrom?: string;
    effectiveUntil?: string;
    offlineSafe?: boolean;
    metadata?: Record<string, unknown>;
    versionNumber: number;
}
export interface GeoSphereRuleSet {
    ruleSetId: string;
    name: string;
    description?: string;
    ruleIds: string[];
    priority: GeoSphereRulePriority;
}
export interface GeoSpherePolicy {
    policyId: string;
    name: string;
    description?: string;
    ruleSetIds: string[];
    scope: GeoSpherePolicyScope;
    enforcementMode: GeoSpherePolicyMode;
    effectiveFrom?: string;
    effectiveUntil?: string;
}
export interface GeoSphereRuleContext {
    tenantId?: string;
    actorId?: string;
    resourceId?: string;
    resourceType?: string;
    taskId?: string;
    assetId?: string;
    scheduleId?: string;
    formId?: string;
    workflowId?: string;
    location?: {
        latitude: number;
        longitude: number;
    };
    attributes?: Record<string, unknown>;
}
export interface GeoSphereRuleViolation {
    ruleId: string;
    ruleName: string;
    message: string;
    severity: "WARNING" | "BLOCK";
}
export interface GeoSphereRuleResult {
    matched: boolean;
    matchedRuleIds: string[];
    violations: GeoSphereRuleViolation[];
    executedActions: GeoSphereRuleAction[];
    evaluationDurationMs: number;
    correlationId: string;
}
export interface GeoSphereRuleConflict {
    conflictId: string;
    conflictingRuleIds: string[];
    description: string;
    resolutionState: "UNRESOLVED" | "PRIORITY_PRECEDENCE" | "POLICY_PRECEDENCE" | "MANUAL_OVERRIDE";
}
export interface GeoSphereRuleAudit {
    auditId: string;
    ruleId: string;
    action: string;
    actorId: string;
    timestamp: string;
    version: string;
    details?: Record<string, unknown>;
}
export type GeoSphereRulesCapability = "RULE_EVALUATION" | "POLICY_ENFORCEMENT" | "SIMULATION_ENGINE" | "CONFLICT_DETECTION" | "VERSIONING_AUDIT" | "OFFLINE_SAFE_EVALUATION" | "TRIGGER_SUBSCRIPTION" | "WORKFLOW_INTEGRATION" | "TASK_INTEGRATION" | "ASSET_INTEGRATION" | "SCHEDULING_INTEGRATION" | "FORMS_INTEGRATION" | "REALTIME_NOTIFICATIONS";
export interface GeoSphereRulesProviderInfo {
    name: string;
    version: string;
}
export interface GeoSphereRulesProvider {
    getProviderInfo(): GeoSphereRulesProviderInfo;
    getCapabilities(): GeoSphereRulesCapability[];
    createRule(rule: Partial<GeoSphereRule>): Promise<GeoSphereRule>;
    getRule(ruleId: string): Promise<GeoSphereRule>;
    listRules(filter?: {
        status?: GeoSphereRuleStatus;
        scope?: GeoSpherePolicyScope;
    }): Promise<GeoSphereRule[]>;
    updateRuleStatus(ruleId: string, status: GeoSphereRuleStatus): Promise<GeoSphereRule>;
    createPolicy(policy: Partial<GeoSpherePolicy>): Promise<GeoSpherePolicy>;
    getPolicy(policyId: string): Promise<GeoSpherePolicy>;
    evaluate(context: GeoSphereRuleContext, trigger?: GeoSphereRuleTrigger): Promise<GeoSphereRuleResult>;
    simulate(ruleId: string, testContext: GeoSphereRuleContext): Promise<GeoSphereRuleResult>;
    getAuditHistory(ruleId: string): Promise<GeoSphereRuleAudit[]>;
}
export declare class GeoSphereRulesError extends Error {
    readonly code: "RULE_NOT_FOUND" | "POLICY_NOT_FOUND" | "OPERATOR_INVALID" | "NESTING_EXCEEDED" | "CIRCULAR_DEPENDENCY" | "SIMULATION_MUTATION_DENIED" | "PERMISSION_DENIED" | "CONCURRENCY_CONFLICT" | "UNKNOWN_ERROR";
    readonly details?: unknown | undefined;
    constructor(code: "RULE_NOT_FOUND" | "POLICY_NOT_FOUND" | "OPERATOR_INVALID" | "NESTING_EXCEEDED" | "CIRCULAR_DEPENDENCY" | "SIMULATION_MUTATION_DENIED" | "PERMISSION_DENIED" | "CONCURRENCY_CONFLICT" | "UNKNOWN_ERROR", message: string, details?: unknown | undefined);
}
export declare class GeoSphereMockRulesProvider implements GeoSphereRulesProvider {
    private rules;
    private policies;
    private audits;
    constructor();
    getProviderInfo(): GeoSphereRulesProviderInfo;
    getCapabilities(): GeoSphereRulesCapability[];
    createRule(ruleData: Partial<GeoSphereRule>): Promise<GeoSphereRule>;
    getRule(ruleId: string): Promise<GeoSphereRule>;
    listRules(filter?: {
        status?: GeoSphereRuleStatus;
        scope?: GeoSpherePolicyScope;
    }): Promise<GeoSphereRule[]>;
    updateRuleStatus(ruleId: string, status: GeoSphereRuleStatus): Promise<GeoSphereRule>;
    createPolicy(policyData: Partial<GeoSpherePolicy>): Promise<GeoSpherePolicy>;
    getPolicy(policyId: string): Promise<GeoSpherePolicy>;
    evaluate(context: GeoSphereRuleContext, trigger?: GeoSphereRuleTrigger): Promise<GeoSphereRuleResult>;
    simulate(ruleId: string, testContext: GeoSphereRuleContext): Promise<GeoSphereRuleResult>;
    getAuditHistory(ruleId: string): Promise<GeoSphereRuleAudit[]>;
    private evaluateGroup;
    private evaluateCondition;
    private extractFieldValue;
    private recordAudit;
}
export interface GeoSphereRulesConfig {
    embeddedMode?: boolean;
    maxGroupDepth?: number;
    maxRuleCount?: number;
}
export declare class GeoSphereRulesSDK {
    private config;
    private provider;
    private listeners;
    constructor(config?: GeoSphereRulesConfig, provider?: GeoSphereRulesProvider);
    initialize(): Promise<void>;
    getProviderInfo(): GeoSphereRulesProviderInfo;
    getCapabilities(): GeoSphereRulesCapability[];
    hasCapability(capability: GeoSphereRulesCapability): boolean;
    createRule(rule: Partial<GeoSphereRule>): Promise<GeoSphereRule>;
    getRule(ruleId: string): Promise<GeoSphereRule>;
    listRules(filter?: {
        status?: GeoSphereRuleStatus;
        scope?: GeoSpherePolicyScope;
    }): Promise<GeoSphereRule[]>;
    updateRuleStatus(ruleId: string, status: GeoSphereRuleStatus): Promise<GeoSphereRule>;
    createPolicy(policy: Partial<GeoSpherePolicy>): Promise<GeoSpherePolicy>;
    getPolicy(policyId: string): Promise<GeoSpherePolicy>;
    evaluate(context: GeoSphereRuleContext, trigger?: GeoSphereRuleTrigger): Promise<GeoSphereRuleResult>;
    simulate(ruleId: string, testContext: GeoSphereRuleContext): Promise<GeoSphereRuleResult>;
    getAuditHistory(ruleId: string): Promise<GeoSphereRuleAudit[]>;
    presentRule(ruleId: string): {
        componentId: string;
        props: {
            ruleId: string;
        };
    };
    presentRuleList(): {
        componentId: string;
        props: {};
    };
    presentRuleBuilder(): {
        componentId: string;
        props: {};
    };
    presentRuleSimulation(ruleId: string): {
        componentId: string;
        props: {
            ruleId: string;
        };
    };
    presentPolicy(policyId: string): {
        componentId: string;
        props: {
            policyId: string;
        };
    };
    presentPolicyList(): {
        componentId: string;
        props: {};
    };
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
//# sourceMappingURL=rules.contracts.d.ts.map