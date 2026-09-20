/**
 * GeoSphere Rules & Policy Engine SDK Core Contracts
 * Framework-Neutral Rule Definitions, Declarative Condition Groups, Typed Operators, Policy Engine, Simulation & Security Controls
 */

export type GeoSphereRuleStatus =
  | "DRAFT"
  | "ACTIVE"
  | "INACTIVE"
  | "SCHEDULED"
  | "EXPIRED"
  | "ARCHIVED";

export type GeoSphereRulePriority = "CRITICAL" | "HIGH" | "NORMAL" | "LOW";

export type GeoSphereRuleOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "GREATER_THAN"
  | "GREATER_THAN_OR_EQUAL"
  | "LESS_THAN"
  | "LESS_THAN_OR_EQUAL"
  | "IN"
  | "NOT_IN"
  | "CONTAINS"
  | "NOT_CONTAINS"
  | "STARTS_WITH"
  | "ENDS_WITH"
  | "IS_NULL"
  | "IS_NOT_NULL"
  | "BETWEEN"
  | "DATE_BEFORE"
  | "DATE_AFTER"
  | "DATE_BETWEEN";

export type GeoSphereRuleActionType =
  | "SET_VALUE"
  | "SET_STATUS"
  | "ADD_TAG"
  | "REMOVE_TAG"
  | "CREATE_EVENT"
  | "CREATE_TASK_REFERENCE"
  | "UPDATE_TASK_REFERENCE"
  | "CREATE_NOTIFICATION_REQUEST"
  | "BLOCK_OPERATION"
  | "ALLOW_OPERATION"
  | "REQUIRE_APPROVAL"
  | "LOG_AUDIT_EVENT";

export type GeoSphereRuleTrigger =
  | "ON_CREATE"
  | "ON_UPDATE"
  | "ON_DELETE"
  | "ON_STATUS_CHANGE"
  | "ON_ASSIGNMENT_CHANGE"
  | "ON_SCHEDULE_CHANGE"
  | "ON_LOCATION_EVENT"
  | "ON_FORM_SUBMISSION"
  | "ON_WORKFLOW_EVENT"
  | "ON_TASK_EVENT"
  | "ON_ASSET_EVENT"
  | "ON_TIMER"
  | "ON_DEMAND";

export type GeoSpherePolicyScope =
  | "GLOBAL"
  | "TENANT"
  | "APPLICATION"
  | "RESOURCE_TYPE"
  | "RESOURCE"
  | "ROLE"
  | "USER"
  | "CONTEXT";

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
  location?: { latitude: number; longitude: number };
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

export type GeoSphereRulesCapability =
  | "RULE_EVALUATION"
  | "POLICY_ENFORCEMENT"
  | "SIMULATION_ENGINE"
  | "CONFLICT_DETECTION"
  | "VERSIONING_AUDIT"
  | "OFFLINE_SAFE_EVALUATION"
  | "TRIGGER_SUBSCRIPTION"
  | "WORKFLOW_INTEGRATION"
  | "TASK_INTEGRATION"
  | "ASSET_INTEGRATION"
  | "SCHEDULING_INTEGRATION"
  | "FORMS_INTEGRATION"
  | "REALTIME_NOTIFICATIONS";

export interface GeoSphereRulesProviderInfo {
  name: string;
  version: string;
}

export interface GeoSphereRulesProvider {
  getProviderInfo(): GeoSphereRulesProviderInfo;
  getCapabilities(): GeoSphereRulesCapability[];
  createRule(rule: Partial<GeoSphereRule>): Promise<GeoSphereRule>;
  getRule(ruleId: string): Promise<GeoSphereRule>;
  listRules(filter?: { status?: GeoSphereRuleStatus; scope?: GeoSpherePolicyScope }): Promise<GeoSphereRule[]>;
  updateRuleStatus(ruleId: string, status: GeoSphereRuleStatus): Promise<GeoSphereRule>;
  createPolicy(policy: Partial<GeoSpherePolicy>): Promise<GeoSpherePolicy>;
  getPolicy(policyId: string): Promise<GeoSpherePolicy>;
  evaluate(context: GeoSphereRuleContext, trigger?: GeoSphereRuleTrigger): Promise<GeoSphereRuleResult>;
  simulate(ruleId: string, testContext: GeoSphereRuleContext): Promise<GeoSphereRuleResult>;
  getAuditHistory(ruleId: string): Promise<GeoSphereRuleAudit[]>;
}

export class GeoSphereRulesError extends Error {
  constructor(
    public readonly code:
      | "RULE_NOT_FOUND"
      | "POLICY_NOT_FOUND"
      | "OPERATOR_INVALID"
      | "NESTING_EXCEEDED"
      | "CIRCULAR_DEPENDENCY"
      | "SIMULATION_MUTATION_DENIED"
      | "PERMISSION_DENIED"
      | "CONCURRENCY_CONFLICT"
      | "UNKNOWN_ERROR",
    message: string,
    public readonly details?: unknown
  ) {
    super(`[RULES_ERROR:${code}] ${message}`);
    this.name = "GeoSphereRulesError";
  }
}

export class GeoSphereMockRulesProvider implements GeoSphereRulesProvider {
  private rules = new Map<string, GeoSphereRule>();
  private policies = new Map<string, GeoSpherePolicy>();
  private audits = new Map<string, GeoSphereRuleAudit[]>();

  constructor() {
    const seedRule: GeoSphereRule = {
      ruleId: "rule_seed_001",
      name: "High Priority Asset Allocation Constraint Rule",
      description: "Generic policy blocking unauthorized asset allocations during blackout periods.",
      version: "1.0.0",
      status: "ACTIVE",
      priority: "HIGH",
      triggers: ["ON_UPDATE", "ON_STATUS_CHANGE"],
      rootGroup: {
        combinator: "ALL",
        conditions: [
          { field: "attributes.priority", operator: "EQUALS", value: "HIGH" },
          { field: "attributes.status", operator: "NOT_EQUALS", value: "RETIRED" }
        ]
      },
      actions: [
        { type: "LOG_AUDIT_EVENT", metadata: { reason: "High priority rule evaluated." } }
      ],
      scope: "TENANT",
      offlineSafe: true,
      versionNumber: 1
    };
    this.rules.set(seedRule.ruleId, seedRule);

    const seedPolicy: GeoSpherePolicy = {
      policyId: "policy_seed_001",
      name: "Default Tenant Resource Allocation Policy",
      description: "Master policy for generic resource rules.",
      ruleSetIds: ["ruleset_01"],
      scope: "TENANT",
      enforcementMode: "ENFORCE"
    };
    this.policies.set(seedPolicy.policyId, seedPolicy);
  }

  public getProviderInfo(): GeoSphereRulesProviderInfo {
    return { name: "GeoSphereMockRulesProvider", version: "1.0.0" };
  }

  public getCapabilities(): GeoSphereRulesCapability[] {
    return [
      "RULE_EVALUATION",
      "POLICY_ENFORCEMENT",
      "SIMULATION_ENGINE",
      "CONFLICT_DETECTION",
      "VERSIONING_AUDIT",
      "OFFLINE_SAFE_EVALUATION",
      "TRIGGER_SUBSCRIPTION",
      "WORKFLOW_INTEGRATION",
      "TASK_INTEGRATION",
      "ASSET_INTEGRATION",
      "SCHEDULING_INTEGRATION",
      "FORMS_INTEGRATION",
      "REALTIME_NOTIFICATIONS"
    ];
  }

  public async createRule(ruleData: Partial<GeoSphereRule>): Promise<GeoSphereRule> {
    const rule: GeoSphereRule = {
      ruleId: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: ruleData.name || "Untitled Rule",
      description: ruleData.description,
      version: ruleData.version || "1.0.0",
      status: ruleData.status || "ACTIVE",
      priority: ruleData.priority || "NORMAL",
      triggers: ruleData.triggers || ["ON_DEMAND"],
      rootGroup: ruleData.rootGroup || { combinator: "ALL", conditions: [] },
      actions: ruleData.actions || [{ type: "LOG_AUDIT_EVENT" }],
      scope: ruleData.scope || "TENANT",
      offlineSafe: ruleData.offlineSafe ?? true,
      versionNumber: 1
    };
    this.rules.set(rule.ruleId, rule);
    this.recordAudit(rule.ruleId, "RULE_CREATED", "system", { status: rule.status });
    return JSON.parse(JSON.stringify(rule));
  }

  public async getRule(ruleId: string): Promise<GeoSphereRule> {
    const rule = this.rules.get(ruleId);
    if (!rule) throw new GeoSphereRulesError("RULE_NOT_FOUND", `Rule ID ${ruleId} not found.`);
    return JSON.parse(JSON.stringify(rule));
  }

  public async listRules(filter?: { status?: GeoSphereRuleStatus; scope?: GeoSpherePolicyScope }): Promise<GeoSphereRule[]> {
    let list = Array.from(this.rules.values());
    if (filter?.status) list = list.filter((r) => r.status === filter.status);
    if (filter?.scope) list = list.filter((r) => r.scope === filter.scope);
    return JSON.parse(JSON.stringify(list));
  }

  public async updateRuleStatus(ruleId: string, status: GeoSphereRuleStatus): Promise<GeoSphereRule> {
    const rule = this.rules.get(ruleId);
    if (!rule) throw new GeoSphereRulesError("RULE_NOT_FOUND", `Rule ID ${ruleId} not found.`);
    rule.status = status;
    rule.versionNumber += 1;
    this.recordAudit(ruleId, "STATUS_CHANGED", "user", { status });
    return JSON.parse(JSON.stringify(rule));
  }

  public async createPolicy(policyData: Partial<GeoSpherePolicy>): Promise<GeoSpherePolicy> {
    const policy: GeoSpherePolicy = {
      policyId: `policy_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: policyData.name || "Untitled Policy",
      description: policyData.description,
      ruleSetIds: policyData.ruleSetIds || [],
      scope: policyData.scope || "TENANT",
      enforcementMode: policyData.enforcementMode || "ENFORCE"
    };
    this.policies.set(policy.policyId, policy);
    return JSON.parse(JSON.stringify(policy));
  }

  public async getPolicy(policyId: string): Promise<GeoSpherePolicy> {
    const policy = this.policies.get(policyId);
    if (!policy) throw new GeoSphereRulesError("POLICY_NOT_FOUND", `Policy ID ${policyId} not found.`);
    return JSON.parse(JSON.stringify(policy));
  }

  public async evaluate(context: GeoSphereRuleContext, trigger?: GeoSphereRuleTrigger): Promise<GeoSphereRuleResult> {
    const startMs = Date.now();
    const matchedRuleIds: string[] = [];
    const violations: GeoSphereRuleViolation[] = [];
    const executedActions: GeoSphereRuleAction[] = [];

    for (const rule of this.rules.values()) {
      if (rule.status !== "ACTIVE") continue;
      if (trigger && !rule.triggers.includes(trigger)) continue;

      const isMatched = this.evaluateGroup(rule.rootGroup, context);
      if (isMatched) {
        matchedRuleIds.push(rule.ruleId);
        executedActions.push(...rule.actions);
        for (const action of rule.actions) {
          if (action.type === "BLOCK_OPERATION") {
            violations.push({
              ruleId: rule.ruleId,
              ruleName: rule.name,
              message: "Operation blocked by policy rule.",
              severity: "BLOCK"
            });
          }
        }
      }
    }

    return {
      matched: matchedRuleIds.length > 0,
      matchedRuleIds,
      violations,
      executedActions,
      evaluationDurationMs: Date.now() - startMs,
      correlationId: `corr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    };
  }

  public async simulate(ruleId: string, testContext: GeoSphereRuleContext): Promise<GeoSphereRuleResult> {
    const rule = this.rules.get(ruleId);
    if (!rule) throw new GeoSphereRulesError("RULE_NOT_FOUND", `Rule ID ${ruleId} not found.`);

    const isMatched = this.evaluateGroup(rule.rootGroup, testContext);
    return {
      matched: isMatched,
      matchedRuleIds: isMatched ? [rule.ruleId] : [],
      violations: [],
      executedActions: isMatched ? rule.actions : [],
      evaluationDurationMs: 1,
      correlationId: `sim_${Date.now()}`
    };
  }

  public async getAuditHistory(ruleId: string): Promise<GeoSphereRuleAudit[]> {
    return this.audits.get(ruleId) || [];
  }

  private evaluateGroup(group: GeoSphereRuleGroup, context: GeoSphereRuleContext): boolean {
    const condResults = (group.conditions || []).map((c) => this.evaluateCondition(c, context));
    const groupResults = (group.groups || []).map((g) => this.evaluateGroup(g, context));
    const allResults = [...condResults, ...groupResults];

    if (allResults.length === 0) return true;

    if (group.combinator === "ALL") return allResults.every(Boolean);
    if (group.combinator === "ANY") return allResults.some(Boolean);
    if (group.combinator === "NONE") return !allResults.some(Boolean);
    return false;
  }

  private evaluateCondition(cond: GeoSphereRuleCondition, context: GeoSphereRuleContext): boolean {
    const val = this.extractFieldValue(cond.field, context);

    switch (cond.operator) {
      case "EQUALS":
        return val === cond.value;
      case "NOT_EQUALS":
        return val !== cond.value;
      case "GREATER_THAN":
        return typeof val === "number" && typeof cond.value === "number" && val > cond.value;
      case "LESS_THAN":
        return typeof val === "number" && typeof cond.value === "number" && val < cond.value;
      case "IN":
        return Array.isArray(cond.value) && cond.value.includes(val);
      case "CONTAINS":
        return typeof val === "string" && typeof cond.value === "string" && val.includes(cond.value);
      case "IS_NULL":
        return val === null || val === undefined;
      case "IS_NOT_NULL":
        return val !== null && val !== undefined;
      default:
        return false;
    }
  }

  private extractFieldValue(field: string, context: GeoSphereRuleContext): unknown {
    const parts = field.split(".");
    let curr: any = context;
    for (const part of parts) {
      if (curr && typeof curr === "object" && part in curr) {
        curr = curr[part];
      } else {
        return undefined;
      }
    }
    return curr;
  }

  private recordAudit(ruleId: string, action: string, actorId: string, details?: Record<string, unknown>): void {
    const list = this.audits.get(ruleId) || [];
    list.push({
      auditId: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ruleId,
      action,
      actorId,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      details
    });
    this.audits.set(ruleId, list);
  }
}

export interface GeoSphereRulesConfig {
  embeddedMode?: boolean;
  maxGroupDepth?: number;
  maxRuleCount?: number;
}

export class GeoSphereRulesSDK {
  private provider: GeoSphereRulesProvider;
  private listeners: Map<string, (event: { type: string; payload: unknown }) => void> = new Map();

  constructor(
    private config: GeoSphereRulesConfig = {},
    provider?: GeoSphereRulesProvider
  ) {
    this.provider = provider || new GeoSphereMockRulesProvider();
  }

  public async initialize(): Promise<void> {}

  public getProviderInfo(): GeoSphereRulesProviderInfo {
    return this.provider.getProviderInfo();
  }

  public getCapabilities(): GeoSphereRulesCapability[] {
    return this.provider.getCapabilities();
  }

  public hasCapability(capability: GeoSphereRulesCapability): boolean {
    return this.getCapabilities().includes(capability);
  }

  public async createRule(rule: Partial<GeoSphereRule>): Promise<GeoSphereRule> {
    const newRule = await this.provider.createRule(rule);
    this.notifyListeners("rules.ruleCreated", { rule: newRule });
    return newRule;
  }

  public async getRule(ruleId: string): Promise<GeoSphereRule> {
    return this.provider.getRule(ruleId);
  }

  public async listRules(filter?: { status?: GeoSphereRuleStatus; scope?: GeoSpherePolicyScope }): Promise<GeoSphereRule[]> {
    return this.provider.listRules(filter);
  }

  public async updateRuleStatus(ruleId: string, status: GeoSphereRuleStatus): Promise<GeoSphereRule> {
    const rule = await this.provider.updateRuleStatus(ruleId, status);
    this.notifyListeners("rules.statusChanged", { rule });
    return rule;
  }

  public async createPolicy(policy: Partial<GeoSpherePolicy>): Promise<GeoSpherePolicy> {
    return this.provider.createPolicy(policy);
  }

  public async getPolicy(policyId: string): Promise<GeoSpherePolicy> {
    return this.provider.getPolicy(policyId);
  }

  public async evaluate(context: GeoSphereRuleContext, trigger?: GeoSphereRuleTrigger): Promise<GeoSphereRuleResult> {
    return this.provider.evaluate(context, trigger);
  }

  public async simulate(ruleId: string, testContext: GeoSphereRuleContext): Promise<GeoSphereRuleResult> {
    return this.provider.simulate(ruleId, testContext);
  }

  public async getAuditHistory(ruleId: string): Promise<GeoSphereRuleAudit[]> {
    return this.provider.getAuditHistory(ruleId);
  }

  // Embedded Mode Presentation Methods
  public presentRule(ruleId: string): { componentId: string; props: { ruleId: string } } {
    return { componentId: "rules.detail-screen", props: { ruleId } };
  }

  public presentRuleList(): { componentId: string; props: {} } {
    return { componentId: "rules.list-screen", props: {} };
  }

  public presentRuleBuilder(): { componentId: string; props: {} } {
    return { componentId: "rules.creation-screen", props: {} };
  }

  public presentRuleSimulation(ruleId: string): { componentId: string; props: { ruleId: string } } {
    return { componentId: "rules.simulation-screen", props: { ruleId } };
  }

  public presentPolicy(policyId: string): { componentId: string; props: { policyId: string } } {
    return { componentId: "rules.policy-detail-screen", props: { policyId } };
  }

  public presentPolicyList(): { componentId: string; props: {} } {
    return { componentId: "rules.policy-list-screen", props: {} };
  }

  public subscribe(onEvent: (event: { type: string; payload: unknown }) => void): { id: string; unsubscribe: () => void } {
    const subId = `rule_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
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
        console.error("[RULES_LISTENER_ERROR] Listener error:", err);
      }
    });
  }
}
