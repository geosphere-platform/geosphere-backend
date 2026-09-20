/**
 * RuleExecutionService — High-Level Facilitator & Orchestration Engine
 *
 * Orchestrates rule lifecycle (CRUD, versioning, activation), candidate lookup,
 * condition evaluation, idempotency checking, cooldown/debounce enforcement,
 * loop/depth recursion guard, action dispatch, dry-run simulation, and audit logging.
 */

import { PostGisRulesRepository } from "../repositories/postgis-rules.repository";
import { RuleValidator, RULE_LIMITS } from "../validation/rule-validator";
import { RuleEvaluator } from "../evaluator/rule-evaluator";
import { RuleMatcher } from "../evaluator/rule-matcher";
import { ActionExecutionService } from "../actions/action-execution.service";
import {
  SpatialRule,
  RuleVersion,
  RuleConfiguration,
  RuleContext,
  RuleExecution,
  DryRunInput,
  DryRunResult,
  RuleStatus,
  TriggerType,
  AlertRecord,
  AlertStatus,
  AlertSeverity,
  TaskRecord,
  TaskStatus,
  TaskPriority,
  RuleOperationalMetrics,
} from "../types/rule.types";
import { ServiceContext } from "../../services/spatial-data.service";
import { UserRole, PERMISSIONS } from "../../../constants";
import { hasPermission } from "../../../auth/permissions";
import {
  UnauthorizedSpatialAccessError,
  TenantAccessDeniedError,
  RuleNotFoundError,
  RuleActivationError,
  AutomationDepthExceededError,
} from "../../../errors/spatial-errors";

export class RuleExecutionService {
  private readonly evaluator: RuleEvaluator;

  constructor(
    private readonly repo: PostGisRulesRepository,
    private readonly actionExecutionService: ActionExecutionService,
  ) {
    this.evaluator = new RuleEvaluator();
  }

  private enforceTenantContext(context: ServiceContext): string {
    if (
      !context ||
      !context.tenantId ||
      typeof context.tenantId !== "string" ||
      context.tenantId.trim() === ""
    ) {
      throw new TenantAccessDeniedError("Valid tenant context is required");
    }
    return context.tenantId;
  }

  private checkPermission(
    role: UserRole | undefined,
    permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS],
  ): void {
    if (role && !hasPermission(role, permission)) {
      throw new UnauthorizedSpatialAccessError(
        `Insufficient role permissions. Required: '${permission}'`,
      );
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EVENT EVALUATION & RULE PIPELINE
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Process incoming event through Rule Engine pipeline:
   * Event -> Active Rules -> Scope Match -> Conditions -> Idempotency/Cooldown -> Actions -> Audit Record
   */
  async evaluateEvent(
    context: ServiceContext,
    triggerEvent: {
      id: string;
      type: TriggerType;
      timestamp: string;
      subjectId?: string;
      source?: string;
      metadata?: Record<string, unknown>;
    },
    ruleContext: RuleContext,
  ): Promise<{
    evaluated: number;
    matched: number;
    executed: RuleExecution[];
  }> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_RULES_EXECUTE);

    // Automation depth check to prevent infinite loops (e.g. Rule A -> Event -> Rule A -> Event)
    const currentDepth = ruleContext.automationDepth ?? 0;
    if (currentDepth > RULE_LIMITS.MAX_AUTOMATION_DEPTH) {
      throw new AutomationDepthExceededError(currentDepth);
    }

    // 1. Candidate selection by tenant & trigger type
    const candidateRules = await this.repo.findActiveRulesByTrigger(
      tenantId,
      triggerEvent.type,
    );

    // 2. Filter candidates by scope
    const matchedScopeRules = RuleMatcher.filterCandidates(
      candidateRules,
      ruleContext,
    );

    const executedList: RuleExecution[] = [];
    let matchedCount = 0;

    for (const rule of matchedScopeRules) {
      try {
        // Fetch active rule version configuration
        const versionRecord = await this.repo.getRuleVersion(
          rule.id,
          rule.currentVersion,
          tenantId,
        );
        if (!versionRecord) continue;

        const config = versionRecord.configuration;

        // 3. Idempotency Check — Check if event already executed this rule version
        const idempotencyExec = await this.repo.createExecution({
          tenantId,
          ruleId: rule.id,
          ruleVersion: rule.currentVersion,
          triggerType: triggerEvent.type,
          triggerEventId: triggerEvent.id,
          subjectId: triggerEvent.subjectId,
          parentExecutionId: ruleContext.parentExecutionId,
          automationDepth: currentDepth,
          status: "RUNNING",
        });

        if (!idempotencyExec) {
          // Idempotency constraint suppressed duplicate execution
          continue;
        }

        // 4. Cooldown Check
        if (rule.cooldownSeconds > 0) {
          const lastExecTime = await this.repo.getLastExecutionTime(
            rule.id,
            tenantId,
            triggerEvent.subjectId,
          );
          if (lastExecTime) {
            const elapsedSec = (Date.now() - lastExecTime.getTime()) / 1000;
            if (elapsedSec < rule.cooldownSeconds) {
              await this.repo.updateExecutionStatus(
                idempotencyExec.id,
                tenantId,
                "SKIPPED",
                undefined,
                {
                  reason: `Skipped due to cooldown period (${rule.cooldownSeconds}s)`,
                },
              );
              continue;
            }
          }
        }

        // 5. Condition Evaluation
        const evalRes = this.evaluator.evaluateGroup(
          config.conditions,
          ruleContext,
        );

        if (!evalRes.matched) {
          await this.repo.updateExecutionStatus(
            idempotencyExec.id,
            tenantId,
            "SKIPPED",
            undefined,
            {
              conditionResults: evalRes.results,
            },
          );
          continue;
        }

        matchedCount++;

        // 6. Action Execution Chain
        const actionContext: RuleContext = {
          ...ruleContext,
          automationDepth: currentDepth + 1,
          parentExecutionId: idempotencyExec.id,
        };

        const actionResults =
          await this.actionExecutionService.executeActionChain(
            tenantId,
            rule.id,
            rule.currentVersion,
            idempotencyExec.id,
            config.actions,
            rule.actionFailurePolicy,
            actionContext,
          );

        const hasActionFailure = actionResults.some((a) => !a.success);
        const finalStatus =
          hasActionFailure && rule.actionFailurePolicy === "STOP_ON_FAILURE"
            ? "FAILED"
            : "SUCCESS";

        const completedExec = await this.repo.updateExecutionStatus(
          idempotencyExec.id,
          tenantId,
          finalStatus,
          hasActionFailure
            ? actionResults.find((a) => !a.success)?.error
            : undefined,
          {
            conditionResults: evalRes.results,
            actionResults,
          },
        );

        executedList.push(completedExec);
      } catch (err: any) {
        // Log unexpected rule evaluation failure
      }
    }

    return {
      evaluated: candidateRules.length,
      matched: matchedCount,
      executed: executedList,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // DRY RUN FEATURE
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Dry Run simulation feature:
   * Validates configuration and tests conditions against sample context WITHOUT executing real actions or DB writes.
   */
  async dryRun(
    context: ServiceContext,
    input: DryRunInput,
  ): Promise<DryRunResult> {
    const startTime = Date.now();
    this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_RULES_READ);

    // 1. Validate configuration
    RuleValidator.validateConfiguration(input.configuration);

    // 2. Trigger check
    const triggerType = input.configuration.trigger.type;
    const sampleEventType = input.context.event?.type;
    const triggerMatched = sampleEventType
      ? sampleEventType === triggerType || triggerType === "SPATIAL_EVENT"
      : true;

    // 3. Scope check
    let scopeMatched = true;
    if (input.configuration.scope) {
      const scope = input.configuration.scope;
      if (
        scope.subjectType &&
        input.context.subject?.type &&
        scope.subjectType !== input.context.subject.type
      ) {
        scopeMatched = false;
      }
      if (
        scope.geofenceId &&
        input.context.geofence?.id &&
        scope.geofenceId !== input.context.geofence.id
      ) {
        scopeMatched = false;
      }
    }

    // 4. Condition Evaluation
    const evalRes = this.evaluator.evaluateGroup(
      input.configuration.conditions,
      input.context,
    );

    const ruleMatched = triggerMatched && scopeMatched && evalRes.matched;

    return {
      ruleMatched,
      triggerMatched,
      scopeMatched,
      conditionResults: evalRes.results,
      actionsWouldExecute: ruleMatched ? input.configuration.actions : [],
      executionTimeMs: Date.now() - startTime,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RULE LIFECYCLE OPERATIONS
  // ───────────────────────────────────────────────────────────────────────────

  async createRule(
    context: ServiceContext,
    input: {
      name: string;
      description?: string;
      priority?: number;
      triggerType: TriggerType;
      scope?: Record<string, unknown>;
      configuration: RuleConfiguration;
    },
  ): Promise<{ rule: SpatialRule; version: RuleVersion }> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_RULES_CREATE);

    RuleValidator.validateConfiguration(input.configuration);

    return this.repo.createRule(tenantId, {
      ...input,
      createdBy: context.userId,
    });
  }

  async getRule(context: ServiceContext, ruleId: string): Promise<SpatialRule> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_RULES_READ);

    const rule = await this.repo.getRule(ruleId, tenantId);
    if (!rule) throw new RuleNotFoundError(ruleId);
    return rule;
  }

  async listRules(
    context: ServiceContext,
    options?: {
      triggerType?: TriggerType;
      status?: RuleStatus;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ items: SpatialRule[]; total: number }> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_RULES_READ);
    return this.repo.listRules(tenantId, options);
  }

  async updateRule(
    context: ServiceContext,
    ruleId: string,
    input: {
      name?: string;
      description?: string;
      priority?: number;
      scope?: Record<string, unknown>;
      configuration?: RuleConfiguration;
    },
  ): Promise<{
    rule: SpatialRule;
    newVersionCreated: boolean;
    version?: RuleVersion;
  }> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_RULES_UPDATE);

    if (input.configuration) {
      RuleValidator.validateConfiguration(input.configuration);
    }

    return this.repo.updateRule(ruleId, tenantId, {
      ...input,
      updatedBy: context.userId,
    });
  }

  async activateRule(
    context: ServiceContext,
    ruleId: string,
  ): Promise<SpatialRule> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_RULES_ACTIVATE);

    const rule = await this.repo.getRule(ruleId, tenantId);
    if (!rule) throw new RuleNotFoundError(ruleId);

    const currentVer = await this.repo.getRuleVersion(
      ruleId,
      rule.currentVersion,
      tenantId,
    );
    if (!currentVer) {
      throw new RuleActivationError(
        "Cannot activate rule: missing configuration version snapshot",
      );
    }

    // Validate before activation
    try {
      RuleValidator.validateConfiguration(currentVer.configuration);
    } catch (err: any) {
      throw new RuleActivationError(`Rule activation failed: ${err.message}`);
    }

    return this.repo.setRuleStatus(ruleId, tenantId, "ACTIVE", context.userId);
  }

  async deactivateRule(
    context: ServiceContext,
    ruleId: string,
  ): Promise<SpatialRule> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_RULES_UPDATE);
    return this.repo.setRuleStatus(
      ruleId,
      tenantId,
      "INACTIVE",
      context.userId,
    );
  }

  async listRuleVersions(
    context: ServiceContext,
    ruleId: string,
  ): Promise<RuleVersion[]> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_RULES_READ);
    return this.repo.listRuleVersions(ruleId, tenantId);
  }

  async listExecutions(
    context: ServiceContext,
    options?: {
      ruleId?: string;
      status?: any;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ items: RuleExecution[]; total: number }> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_RULES_READ);
    return this.repo.listExecutions(tenantId, options);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ALERTS & TASKS MANAGEMENT
  // ───────────────────────────────────────────────────────────────────────────

  async listAlerts(
    context: ServiceContext,
    options?: {
      status?: AlertStatus;
      severity?: AlertSeverity;
      subjectId?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ items: AlertRecord[]; total: number }> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_ALERTS_READ);
    return this.repo.listAlerts(tenantId, options);
  }

  async updateAlertStatus(
    context: ServiceContext,
    alertId: string,
    status: AlertStatus,
  ): Promise<AlertRecord> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_ALERTS_UPDATE);
    return this.repo.updateAlertStatus(
      alertId,
      tenantId,
      status,
      context.userId,
    );
  }

  async listTasks(
    context: ServiceContext,
    options?: {
      status?: TaskStatus;
      priority?: TaskPriority;
      assignedTo?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ items: TaskRecord[]; total: number }> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_TASKS_READ);
    return this.repo.listTasks(tenantId, options);
  }

  async updateTask(
    context: ServiceContext,
    taskId: string,
    input: {
      status?: TaskStatus;
      priority?: TaskPriority;
      assignedTo?: string;
      dueAt?: Date;
    },
  ): Promise<TaskRecord> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_TASKS_UPDATE);
    return this.repo.updateTask(taskId, tenantId, input);
  }

  async getOperationalMetrics(
    context: ServiceContext,
  ): Promise<RuleOperationalMetrics> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_RULES_READ);
    return this.repo.getOperationalMetrics(tenantId);
  }
}
