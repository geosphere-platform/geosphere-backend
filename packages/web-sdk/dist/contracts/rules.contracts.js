/**
 * GeoSphere Rules & Policy Engine SDK Core Contracts
 * Framework-Neutral Rule Definitions, Declarative Condition Groups, Typed Operators, Policy Engine, Simulation & Security Controls
 */
export class GeoSphereRulesError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(`[RULES_ERROR:${code}] ${message}`);
        this.code = code;
        this.details = details;
        this.name = "GeoSphereRulesError";
    }
}
export class GeoSphereMockRulesProvider {
    rules = new Map();
    policies = new Map();
    audits = new Map();
    constructor() {
        const seedRule = {
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
        const seedPolicy = {
            policyId: "policy_seed_001",
            name: "Default Tenant Resource Allocation Policy",
            description: "Master policy for generic resource rules.",
            ruleSetIds: ["ruleset_01"],
            scope: "TENANT",
            enforcementMode: "ENFORCE"
        };
        this.policies.set(seedPolicy.policyId, seedPolicy);
    }
    getProviderInfo() {
        return { name: "GeoSphereMockRulesProvider", version: "1.0.0" };
    }
    getCapabilities() {
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
    async createRule(ruleData) {
        const rule = {
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
    async getRule(ruleId) {
        const rule = this.rules.get(ruleId);
        if (!rule)
            throw new GeoSphereRulesError("RULE_NOT_FOUND", `Rule ID ${ruleId} not found.`);
        return JSON.parse(JSON.stringify(rule));
    }
    async listRules(filter) {
        let list = Array.from(this.rules.values());
        if (filter?.status)
            list = list.filter((r) => r.status === filter.status);
        if (filter?.scope)
            list = list.filter((r) => r.scope === filter.scope);
        return JSON.parse(JSON.stringify(list));
    }
    async updateRuleStatus(ruleId, status) {
        const rule = this.rules.get(ruleId);
        if (!rule)
            throw new GeoSphereRulesError("RULE_NOT_FOUND", `Rule ID ${ruleId} not found.`);
        rule.status = status;
        rule.versionNumber += 1;
        this.recordAudit(ruleId, "STATUS_CHANGED", "user", { status });
        return JSON.parse(JSON.stringify(rule));
    }
    async createPolicy(policyData) {
        const policy = {
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
    async getPolicy(policyId) {
        const policy = this.policies.get(policyId);
        if (!policy)
            throw new GeoSphereRulesError("POLICY_NOT_FOUND", `Policy ID ${policyId} not found.`);
        return JSON.parse(JSON.stringify(policy));
    }
    async evaluate(context, trigger) {
        const startMs = Date.now();
        const matchedRuleIds = [];
        const violations = [];
        const executedActions = [];
        for (const rule of this.rules.values()) {
            if (rule.status !== "ACTIVE")
                continue;
            if (trigger && !rule.triggers.includes(trigger))
                continue;
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
    async simulate(ruleId, testContext) {
        const rule = this.rules.get(ruleId);
        if (!rule)
            throw new GeoSphereRulesError("RULE_NOT_FOUND", `Rule ID ${ruleId} not found.`);
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
    async getAuditHistory(ruleId) {
        return this.audits.get(ruleId) || [];
    }
    evaluateGroup(group, context) {
        const condResults = (group.conditions || []).map((c) => this.evaluateCondition(c, context));
        const groupResults = (group.groups || []).map((g) => this.evaluateGroup(g, context));
        const allResults = [...condResults, ...groupResults];
        if (allResults.length === 0)
            return true;
        if (group.combinator === "ALL")
            return allResults.every(Boolean);
        if (group.combinator === "ANY")
            return allResults.some(Boolean);
        if (group.combinator === "NONE")
            return !allResults.some(Boolean);
        return false;
    }
    evaluateCondition(cond, context) {
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
    extractFieldValue(field, context) {
        const parts = field.split(".");
        let curr = context;
        for (const part of parts) {
            if (curr && typeof curr === "object" && part in curr) {
                curr = curr[part];
            }
            else {
                return undefined;
            }
        }
        return curr;
    }
    recordAudit(ruleId, action, actorId, details) {
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
export class GeoSphereRulesSDK {
    config;
    provider;
    listeners = new Map();
    constructor(config = {}, provider) {
        this.config = config;
        this.provider = provider || new GeoSphereMockRulesProvider();
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
    async createRule(rule) {
        const newRule = await this.provider.createRule(rule);
        this.notifyListeners("rules.ruleCreated", { rule: newRule });
        return newRule;
    }
    async getRule(ruleId) {
        return this.provider.getRule(ruleId);
    }
    async listRules(filter) {
        return this.provider.listRules(filter);
    }
    async updateRuleStatus(ruleId, status) {
        const rule = await this.provider.updateRuleStatus(ruleId, status);
        this.notifyListeners("rules.statusChanged", { rule });
        return rule;
    }
    async createPolicy(policy) {
        return this.provider.createPolicy(policy);
    }
    async getPolicy(policyId) {
        return this.provider.getPolicy(policyId);
    }
    async evaluate(context, trigger) {
        return this.provider.evaluate(context, trigger);
    }
    async simulate(ruleId, testContext) {
        return this.provider.simulate(ruleId, testContext);
    }
    async getAuditHistory(ruleId) {
        return this.provider.getAuditHistory(ruleId);
    }
    // Embedded Mode Presentation Methods
    presentRule(ruleId) {
        return { componentId: "rules.detail-screen", props: { ruleId } };
    }
    presentRuleList() {
        return { componentId: "rules.list-screen", props: {} };
    }
    presentRuleBuilder() {
        return { componentId: "rules.creation-screen", props: {} };
    }
    presentRuleSimulation(ruleId) {
        return { componentId: "rules.simulation-screen", props: { ruleId } };
    }
    presentPolicy(policyId) {
        return { componentId: "rules.policy-detail-screen", props: { policyId } };
    }
    presentPolicyList() {
        return { componentId: "rules.policy-list-screen", props: {} };
    }
    subscribe(onEvent) {
        const subId = `rule_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
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
                console.error("[RULES_LISTENER_ERROR] Listener error:", err);
            }
        });
    }
}
//# sourceMappingURL=rules.contracts.js.map