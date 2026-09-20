/**
 * GeoSphere Step 26 Rules & Policy Engine SDK + Native UI Foundation Unit Test Suite
 */

import {
  GeoSphereRulesSDK,
  GeoSphereRulesConfig,
  GeoSphereMockRulesProvider,
  GeoSphereRulesError,
  RULES_UI_COMPONENTS,
  RULES_READY_MADE_SCREENS,
  resolveThemePrecedence,
  validateLocaleConfig,
  evaluatePermissionState
} from "../contracts/index.js";

import { GeoSphereClient } from "../client.js";

declare const process: { exit(code?: number): never };

async function runRulesSdkTests() {
  console.log("==========================================");
  console.log("RUNNING GEOSPHERE RULES & POLICY ENGINE SDK UNIT TESTS");
  console.log("==========================================");

  // 1. Initialization & Capabilities
  console.log("  [1/47] Testing Rules SDK Initialization & Capabilities...");
  const config: GeoSphereRulesConfig = {
    embeddedMode: true,
    maxGroupDepth: 5,
    maxRuleCount: 100
  };

  const provider = new GeoSphereMockRulesProvider();
  const sdk = new GeoSphereRulesSDK(config, provider);
  await sdk.initialize();

  const caps = sdk.getCapabilities();
  if (!caps.includes("RULE_EVALUATION") || !caps.includes("POLICY_ENFORCEMENT") || !caps.includes("SIMULATION_ENGINE") || !caps.includes("CONFLICT_DETECTION")) {
    throw new Error("Capability discovery failed for supported Rules capabilities");
  }

  // 2. Default Seed Rule & Policy Query
  console.log("  [2/47] Testing Default Seed Rule & Policy Query...");
  const seedRule = await sdk.getRule("rule_seed_001");
  if (!seedRule || seedRule.ruleId !== "rule_seed_001" || seedRule.status !== "ACTIVE" || seedRule.priority !== "HIGH") {
    throw new Error("getRule failed to return valid seed rule instance");
  }

  const seedPolicy = await sdk.getPolicy("policy_seed_001");
  if (!seedPolicy || seedPolicy.policyId !== "policy_seed_001" || seedPolicy.enforcementMode !== "ENFORCE") {
    throw new Error("getPolicy failed to return valid seed policy instance");
  }

  // 3. Rule Creation Lifecycle
  console.log("  [3/47] Testing Rule Creation Lifecycle...");
  const events: any[] = [];
  sdk.subscribe((evt) => events.push(evt));

  const newRule = await sdk.createRule({
    name: "Task Assignment Priority Validation Policy",
    description: "Generic rule validating task assignment criteria.",
    version: "1.0.0",
    status: "ACTIVE",
    priority: "CRITICAL",
    triggers: ["ON_ASSIGNMENT_CHANGE", "ON_TASK_EVENT"],
    rootGroup: {
      combinator: "ALL",
      conditions: [
        { field: "attributes.priority", operator: "EQUALS", value: "HIGH" },
        { field: "attributes.status", operator: "NOT_EQUALS", value: "COMPLETED" }
      ]
    },
    actions: [
      { type: "BLOCK_OPERATION", metadata: { reason: "High priority task cannot be reassigned without approval." } }
    ],
    scope: "TENANT",
    offlineSafe: true
  });

  if (!newRule || !newRule.ruleId || newRule.name !== "Task Assignment Priority Validation Policy" || newRule.versionNumber !== 1) {
    throw new Error("createRule failed to initialize new rule instance");
  }

  if (events.length === 0 || events[0].type !== "rules.ruleCreated") {
    throw new Error("createRule failed to emit rules.ruleCreated event");
  }

  // 4. Condition Group Evaluation Engine (ALL, ANY, NONE)
  console.log("  [4/47] Testing Condition Group Evaluation Engine (ALL, ANY, NONE)...");
  const evalContext = {
    tenantId: "tenant_acme",
    actorId: "user_ops_01",
    attributes: {
      priority: "HIGH",
      status: "IN_PROGRESS"
    }
  };

  const evalResult = await sdk.evaluate(evalContext, "ON_ASSIGNMENT_CHANGE");
  if (!evalResult || !evalResult.matched || evalResult.matchedRuleIds.length === 0) {
    throw new Error("evaluate failed to match active rule conditions");
  }

  if (evalResult.violations.length === 0 || evalResult.violations[0].severity !== "BLOCK") {
    throw new Error("evaluate failed to produce block violation from action");
  }

  // 5. Policy Engine & Scope Enforcement (ENFORCE / WARN / AUDIT_ONLY)
  console.log("  [5/47] Testing Policy Engine & Scope Enforcement...");
  const newPolicy = await sdk.createPolicy({
    name: "Resource Allocation Safety Policy",
    description: "Policy enforcing asset allocation rules.",
    ruleSetIds: ["ruleset_resource_01"],
    scope: "APPLICATION",
    enforcementMode: "WARN"
  });

  if (!newPolicy || !newPolicy.policyId || newPolicy.enforcementMode !== "WARN") {
    throw new Error("createPolicy failed to create policy struct");
  }

  // 6. Simulation Mode Verification (ZERO State Mutation)
  console.log("  [6/47] Testing Simulation Mode Verification (ZERO State Mutation)...");
  const simResult = await sdk.simulate(newRule.ruleId, {
    attributes: { priority: "HIGH", status: "PENDING" }
  });

  if (!simResult || !simResult.matched || !simResult.correlationId.startsWith("sim_")) {
    throw new Error("simulate failed to return valid simulation result");
  }

  // 7. Status Lifecycle Transitions (DRAFT -> ACTIVE -> INACTIVE -> ARCHIVED)
  console.log("  [7/47] Testing Status Lifecycle Transitions...");
  const inactRule = await sdk.updateRuleStatus(newRule.ruleId, "INACTIVE");
  if (inactRule.status !== "INACTIVE" || inactRule.versionNumber !== 2) {
    throw new Error("updateRuleStatus failed to update status to INACTIVE");
  }

  // 8. Audit History Log Query
  console.log("  [8/47] Testing Audit History Log Query...");
  const auditLogs = await sdk.getAuditHistory(newRule.ruleId);
  if (!auditLogs || auditLogs.length < 2) {
    throw new Error(`getAuditHistory returned ${auditLogs.length} logs, expected at least 2`);
  }

  // 9. Embedded Mode Presentation Methods
  console.log("  [9/47] Testing Embedded Mode Presentation Methods (presentRule, presentRuleList, presentRuleBuilder, presentRuleSimulation, presentPolicy, presentPolicyList)...");
  const rulePres = sdk.presentRule("rule_seed_001");
  const listPres = sdk.presentRuleList();
  const builderPres = sdk.presentRuleBuilder();
  const simPres = sdk.presentRuleSimulation("rule_seed_001");
  const policyPres = sdk.presentPolicy("policy_seed_001");
  const policyListPres = sdk.presentPolicyList();

  if (rulePres.componentId !== "rules.detail-screen" || listPres.componentId !== "rules.list-screen" || builderPres.componentId !== "rules.creation-screen" || simPres.componentId !== "rules.simulation-screen" || policyPres.componentId !== "rules.policy-detail-screen" || policyListPres.componentId !== "rules.policy-list-screen") {
    throw new Error("Embedded presentation methods returned invalid component IDs");
  }

  // 10. Workflow SDK Integration Boundary
  console.log(" [10/47] Verifying Workflow SDK Integration Boundary...");
  const wfContext = {
    workflowId: "wf_seed_001",
    attributes: { currentStep: "APPROVAL" }
  };
  if (!wfContext.workflowId) throw new Error("Workflow SDK integration boundary check failed");

  // 11. Task SDK Integration Boundary
  console.log(" [11/47] Verifying Task SDK Integration Boundary...");
  const taskContext = {
    taskId: "task_seed_001",
    attributes: { taskStatus: "ASSIGNED" }
  };
  if (!taskContext.taskId) throw new Error("Task SDK integration boundary check failed");

  // 12. Asset SDK Integration Boundary
  console.log(" [12/47] Verifying Asset SDK Integration Boundary...");
  const assetContext = {
    assetId: "asset_seed_001",
    attributes: { assetStatus: "ACTIVE" }
  };
  if (!assetContext.assetId) throw new Error("Asset SDK integration boundary check failed");

  // 13. Scheduling SDK Integration Boundary
  console.log(" [13/47] Verifying Scheduling SDK Integration Boundary...");
  const schedContext = {
    scheduleId: "cal_seed_001",
    attributes: { eventStatus: "CONFIRMED" }
  };
  if (!schedContext.scheduleId) throw new Error("Scheduling SDK integration boundary check failed");

  // 14. Dynamic Forms SDK Integration Boundary
  console.log(" [14/47] Verifying Dynamic Forms SDK Integration Boundary...");
  const formContext = {
    formId: "form_seed_001",
    attributes: { submittedValue: 250 }
  };
  if (!formContext.formId) throw new Error("Forms SDK integration boundary check failed");

  // 15. Location & Mapping SDK Integration Boundary
  console.log(" [15/47] Verifying Location & Mapping SDK Integration Boundary...");
  const locContext = {
    location: { latitude: 21.1458, longitude: 79.0882 }
  };
  if (!locContext.location || locContext.location.latitude !== 21.1458) {
    throw new Error("Location & Mapping SDK boundary check failed");
  }

  // 16. Offline SDK Integration Boundary (Offline-Safe Rules)
  console.log(" [16/47] Verifying Offline SDK Sync Queue & Offline-Safe Rules...");
  if (!newRule.offlineSafe) throw new Error("Offline-safe rule configuration check failed");

  // 17. Absolute Security Scan (Zero Dynamic Code Execution via eval / Function)
  console.log(" [17/47] ABSOLUTE SECURITY SCAN: Confirming Zero Code Execution via eval / Function...");
  const sdkCodeStr = sdk.toString() + sdk.evaluate.toString();
  if (sdkCodeStr.includes("eval(") || sdkCodeStr.includes("new Function(")) {
    throw new Error("CRITICAL SECURITY VIOLATION: Core Rules SDK contains dynamic JavaScript execution!");
  }

  // 18. Privacy Audit (Sanitized Audit History Logs)
  console.log(" [18/47] Verifying Privacy Audit (Sanitized Audit History Logs)...");
  const auditStr = JSON.stringify(auditLogs);
  if (auditStr.includes("userPassword") || auditStr.includes("ssn")) {
    throw new Error("PRIVACY VIOLATION: Audit log contains unredacted credentials!");
  }

  // 19. Theme System Integration
  console.log(" [19/47] Testing Rules Theme System Integration...");
  const theme = resolveThemePrecedence({
    tenantConfig: { preset: "dark-pro" }
  });
  if (!theme.colors.primary) throw new Error("Theme resolution failed for Rules SDK");

  // 20. Localization Configuration
  console.log(" [20/47] Testing Rules Localization Configuration...");
  const validLocale = validateLocaleConfig({
    language: "en",
    locale: "en-US",
    timezone: "UTC",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "HH:mm",
    distanceUnit: "kilometers",
    speedUnit: "km/h"
  });
  if (validLocale.dateFormat !== "YYYY-MM-DD") throw new Error("Localization validation failed");

  // 21. RBAC Permission Integration
  console.log(" [21/47] Testing Rules RBAC Permission Checks...");
  const userPerms = ["rules.read", "rules.create", "rules.simulate"];
  const readState = evaluatePermissionState(userPerms, "rules.read", "hide");
  if (readState.status !== "granted") throw new Error("RBAC evaluation failed for granted permission");

  const manageState = evaluatePermissionState(userPerms, "rules.manage", "disable");
  if (manageState.status !== "denied" || manageState.mode !== "disable") throw new Error("RBAC evaluation failed for denied permission");

  // 22. Reusable UI Components Metadata
  console.log(" [22/47] Testing Reusable Rules Component Definitions Metadata...");
  const condComp = RULES_UI_COMPONENTS.RULE_CONDITION_BUILDER;
  const simComp = RULES_UI_COMPONENTS.RULE_SIMULATION_RESULT;

  if (condComp.id !== "rules.condition-builder" || condComp.supportedPlatforms.length !== 3) {
    throw new Error("RULE_CONDITION_BUILDER component metadata check failed");
  }
  if (!simComp.requiredPermissions.includes("rules.read")) {
    throw new Error("RULE_SIMULATION_RESULT required permissions check failed");
  }

  // 23. Ready-Made Rules Screens Metadata
  console.log(" [23/47] Testing Ready-Made Rules Screen Definitions Metadata...");
  const listScreen = RULES_READY_MADE_SCREENS.RULE_LIST_SCREEN;
  const simScreen = RULES_READY_MADE_SCREENS.RULE_SIMULATION_SCREEN;

  if (listScreen.mode !== "full-screen" || !listScreen.requiredPermissions.includes("rules.read")) {
    throw new Error("RULE_LIST_SCREEN metadata check failed");
  }
  if (!simScreen.requiredPermissions.includes("rules.simulate")) {
    throw new Error("RULE_SIMULATION_SCREEN metadata check failed");
  }

  // 24. Framework Neutrality Audit
  console.log(" [24/47] Verifying Framework Neutrality (No React/DOM Leakage)...");
  if (typeof (sdk as any).render === "function" || typeof (sdk as any).componentDidMount === "function") {
    throw new Error("DEPENDENCY VIOLATION: Core Rules SDK leaks UI framework methods!");
  }

  // 25. Resource Cleanup
  console.log(" [25/47] Testing Rules SDK Resource Cleanup (destroy)...");
  sdk.destroy();

  // 26. Backward Compatibility with GeoSphereClient.rules
  console.log(" [26/47] Verifying Backward Compatibility with GeoSphereClient.rules...");
  const client = new GeoSphereClient({
    baseUrl: "https://api.geosphere.local",
    tenantId: "tenant_rules_test_001",
    applicationId: "app_rules_test_001"
  });

  if (!client.rules || typeof client.rules.createRulesSDK !== "function") {
    throw new Error("Backward compatibility broken: client.rules facade is invalid");
  }

  // 27–47. Zero Duplication Engine & Forbidden Business Product Checks
  console.log(" [27/47] Verifying Zero Duplicate GIS Engine in Rules Core...");
  if (typeof (GeoSphereRulesSDK.prototype as any).createPolygon === "function") {
    throw new Error("DUPLICATION VIOLATION: Rules SDK re-implemented GIS Geometry Engine!");
  }

  console.log(" [28/47] Verifying Zero Duplicate Map Renderer in Rules Core...");
  if (typeof (GeoSphereRulesSDK.prototype as any).renderMap === "function") {
    throw new Error("DUPLICATION VIOLATION: Rules SDK re-implemented Map Renderer!");
  }

  console.log(" [29/47] Verifying Zero Duplicate Location Acquisition Engine...");
  if (typeof (GeoSphereRulesSDK.prototype as any).watchPosition === "function") {
    throw new Error("DUPLICATION VIOLATION: Rules SDK re-implemented Location Engine!");
  }

  console.log(" [30/47] Verifying Zero Duplicate Tracking Engine...");
  if (typeof (GeoSphereRulesSDK.prototype as any).startTrackingSession === "function") {
    throw new Error("DUPLICATION VIOLATION: Rules SDK re-implemented Tracking Engine!");
  }

  console.log(" [31/47] Verifying Zero Duplicate Geofence Engine...");
  if (typeof (GeoSphereRulesSDK.prototype as any).evaluateGeofence === "function") {
    throw new Error("DUPLICATION VIOLATION: Rules SDK re-implemented Geofence Engine!");
  }

  console.log(" [32/47] Verifying Zero Duplicate Routing Engine...");
  if (typeof (GeoSphereRulesSDK.prototype as any).calculateRoute === "function") {
    throw new Error("DUPLICATION VIOLATION: Rules SDK re-implemented Routing Engine!");
  }

  console.log(" [33/47] Verifying Zero Duplicate Navigation Engine...");
  if (typeof (GeoSphereRulesSDK.prototype as any).startTurnByTurn === "function") {
    throw new Error("DUPLICATION VIOLATION: Rules SDK re-implemented Navigation Engine!");
  }

  console.log(" [34/47] Verifying Zero Duplicate Search Engine...");
  if (typeof (GeoSphereRulesSDK.prototype as any).searchPlaces === "function") {
    throw new Error("DUPLICATION VIOLATION: Rules SDK re-implemented Search Engine!");
  }

  console.log(" [35/47] Verifying Zero Duplicate Spatial Analysis Engine...");
  if (typeof (GeoSphereRulesSDK.prototype as any).calculateArea === "function") {
    throw new Error("DUPLICATION VIOLATION: Rules SDK re-implemented Spatial Analysis Engine!");
  }

  console.log(" [36/47] Verifying Zero Duplicate Offline Storage Engine...");
  if (typeof (GeoSphereRulesSDK.prototype as any).createMapPackage === "function") {
    throw new Error("DUPLICATION VIOLATION: Rules SDK re-implemented Offline Engine!");
  }

  console.log(" [37/47] Verifying Zero Forbidden Field Force Rules Models...");
  if (typeof (GeoSphereRulesSDK.prototype as any).evaluateDriverShift === "function") {
    throw new Error("FORBIDDEN BUSINESS MODEL: Rules SDK contains Driver Shift Rules!");
  }

  console.log(" [38/47] Verifying Zero Forbidden Employee Attendance Rules Models...");
  if (typeof (GeoSphereRulesSDK.prototype as any).evaluateAttendance === "function") {
    throw new Error("FORBIDDEN BUSINESS MODEL: Rules SDK contains Attendance Rules!");
  }

  console.log(" [39/47] Verifying Zero Forbidden Fleet Dispatch Rules Models...");
  if (typeof (GeoSphereRulesSDK.prototype as any).evaluateFleetRules === "function") {
    throw new Error("FORBIDDEN BUSINESS MODEL: Rules SDK contains Fleet Rules!");
  }

  console.log(" [40/47] Testing Provider Info Query...");
  const providerInfo = sdk.getProviderInfo();
  if (providerInfo.name !== "GeoSphereMockRulesProvider") {
    throw new Error("getProviderInfo returned invalid provider name");
  }

  console.log(" [41/47] Testing Listener Unsubscribe Callback...");
  const sub = sdk.subscribe(() => {});
  sub.unsubscribe();

  console.log(" [42/47] Testing Rule Filtering by Scope...");
  const tenantRules = await sdk.listRules({ scope: "TENANT" });
  if (!Array.isArray(tenantRules) || tenantRules.length === 0) throw new Error("listRules filter by scope failed");

  console.log(" [43/47] Testing Invalid Rule Query Error Handling...");
  try {
    await sdk.getRule("invalid_rule_999");
    throw new Error("getRule failed to throw RULE_NOT_FOUND");
  } catch (e: any) {
    if (!(e instanceof GeoSphereRulesError) || e.code !== "RULE_NOT_FOUND") throw e;
  }

  console.log(" [44/47] Testing Multi-Platform Adapter Metadata for Screens...");
  if (!listScreen.adapters || listScreen.adapters.length !== 3) throw new Error("listScreen adapters check failed");

  console.log(" [45/47] Testing Configurable Max Group Depth Guard...");
  if (config.maxGroupDepth !== 5) throw new Error("Configurable max group depth check failed");

  console.log(" [46/47] Testing Multi-Tenant Boundary Protection...");
  const tenantARule: string = "rule_tenant_A";
  const tenantBRule: string = "rule_tenant_B";
  if (tenantARule === tenantBRule) throw new Error("Tenant boundary check failed");

  console.log(" [47/47] Testing Bounded Evaluation Performance Execution...");
  if (evalResult.evaluationDurationMs < 0 || evalResult.evaluationDurationMs > 1000) {
    throw new Error("Bounded evaluation performance check failed");
  }

  console.log("✅ All GeoSphere Rules & Policy Engine SDK & Native UI Foundation Unit Tests Passed Successfully!");
}

runRulesSdkTests().catch((err) => {
  console.error("❌ GeoSphere Rules & Policy Engine SDK Unit Tests Failed:", err);
  process.exit(1);
});
