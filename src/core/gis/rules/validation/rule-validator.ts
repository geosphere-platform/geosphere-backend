/**
 * RuleValidator — Validation Engine for GIS Rules & Automation Configs
 *
 * Enforces rule structure constraints:
 * 1. Allowed triggers & action types
 * 2. Maximum condition count (<= 20)
 * 3. Maximum condition nesting depth (<= 5)
 * 4. Allowed safe operators (no arbitrary SQL or dynamic code)
 * 5. Webhook URL safety via SSRFGuard
 * 6. Maximum actions count (<= 10)
 */

import {
  RuleConfiguration,
  ConditionGroup,
  AtomicCondition,
  RuleCondition,
  RuleAction,
  RuleScope,
  TriggerType,
  RuleOperator,
  StandardOperator,
  SpatialOperator,
  TemporalOperator,
} from "../types/rule.types";
import { InvalidRuleConfigurationError } from "../../../errors/spatial-errors";
import { SSRFGuard } from "../security/ssrf-guard";

export const RULE_LIMITS = {
  MAX_CONDITIONS_TOTAL: 20,
  MAX_NESTING_DEPTH: 5,
  MAX_ACTIONS_TOTAL: 10,
  MAX_AUTOMATION_DEPTH: 5,
  MAX_WEBHOOK_TIMEOUT_MS: 30000,
  MAX_RETRIES: 5,
  MAX_COOLDOWN_SECONDS: 86400, // 24 hrs
};

const VALID_TRIGGERS: Set<TriggerType> = new Set([
  "LOCATION_UPDATED",
  "SPATIAL_ENTER",
  "SPATIAL_EXIT",
  "SPATIAL_PROXIMITY_ENTER",
  "SPATIAL_PROXIMITY_EXIT",
  "SPATIAL_EVENT",
  "SCHEDULED",
  "MANUAL",
]);

const VALID_STANDARD_OPERATORS: Set<StandardOperator> = new Set([
  "EQUALS",
  "NOT_EQUALS",
  "GREATER_THAN",
  "GREATER_THAN_OR_EQUAL",
  "LESS_THAN",
  "LESS_THAN_OR_EQUAL",
  "CONTAINS",
  "NOT_CONTAINS",
  "STARTS_WITH",
  "ENDS_WITH",
  "IN",
  "NOT_IN",
  "IS_NULL",
  "IS_NOT_NULL",
]);

const VALID_SPATIAL_OPERATORS: Set<SpatialOperator> = new Set([
  "WITHIN",
  "CONTAINS",
  "INTERSECTS",
  "TOUCHES",
  "OVERLAPS",
  "CROSSES",
  "DISJOINT",
  "WITHIN_DISTANCE",
  "NEAREST",
]);

const VALID_TEMPORAL_OPERATORS: Set<TemporalOperator> = new Set([
  "BEFORE",
  "AFTER",
  "BETWEEN",
  "DURATION_GREATER_THAN",
  "DURATION_LESS_THAN",
]);

export class RuleValidator {
  /**
   * Validate complete Rule Configuration payload
   */
  public static validateConfiguration(config: RuleConfiguration): void {
    if (!config || typeof config !== "object") {
      throw new InvalidRuleConfigurationError(
        "Rule configuration must be a valid non-null object",
      );
    }

    // 1. Validate Trigger
    if (!config.trigger || !config.trigger.type) {
      throw new InvalidRuleConfigurationError(
        "Rule trigger configuration is required",
      );
    }
    if (!VALID_TRIGGERS.has(config.trigger.type)) {
      throw new InvalidRuleConfigurationError(
        `Unsupported trigger type '${config.trigger.type}'`,
      );
    }

    // 2. Validate Scope (optional)
    if (config.scope) {
      RuleValidator.validateScope(config.scope);
    }

    // 3. Validate Conditions
    if (!config.conditions || typeof config.conditions !== "object") {
      throw new InvalidRuleConfigurationError(
        "Rule conditions block is required",
      );
    }
    const conditionStats = { total: 0, maxDepth: 0 };
    RuleValidator.validateConditionGroup(config.conditions, 1, conditionStats);

    if (conditionStats.total > RULE_LIMITS.MAX_CONDITIONS_TOTAL) {
      throw new InvalidRuleConfigurationError(
        `Rule exceeds maximum condition limit (${RULE_LIMITS.MAX_CONDITIONS_TOTAL}). Found: ${conditionStats.total}`,
      );
    }
    if (conditionStats.maxDepth > RULE_LIMITS.MAX_NESTING_DEPTH) {
      throw new InvalidRuleConfigurationError(
        `Rule exceeds maximum condition nesting depth (${RULE_LIMITS.MAX_NESTING_DEPTH}). Found: ${conditionStats.maxDepth}`,
      );
    }

    // 4. Validate Actions
    if (!Array.isArray(config.actions) || config.actions.length === 0) {
      throw new InvalidRuleConfigurationError(
        "Rule must specify at least one action",
      );
    }
    if (config.actions.length > RULE_LIMITS.MAX_ACTIONS_TOTAL) {
      throw new InvalidRuleConfigurationError(
        `Rule exceeds maximum actions limit (${RULE_LIMITS.MAX_ACTIONS_TOTAL}). Found: ${config.actions.length}`,
      );
    }

    config.actions.forEach((action, idx) => {
      RuleValidator.validateAction(action, idx);
    });
  }

  /**
   * Validate Rule Scope
   */
  private static validateScope(scope: RuleScope): void {
    if (typeof scope !== "object") {
      throw new InvalidRuleConfigurationError("Rule scope must be an object");
    }
  }

  /**
   * Recursively validate Condition Group and atomic conditions
   */
  private static validateConditionGroup(
    group: ConditionGroup,
    currentDepth: number,
    stats: { total: number; maxDepth: number },
  ): void {
    if (currentDepth > stats.maxDepth) {
      stats.maxDepth = currentDepth;
    }
    if (currentDepth > RULE_LIMITS.MAX_NESTING_DEPTH) {
      throw new InvalidRuleConfigurationError(
        `Condition nesting depth limit (${RULE_LIMITS.MAX_NESTING_DEPTH}) exceeded`,
      );
    }

    if (
      group.type !== "group" ||
      !["AND", "OR", "NOT"].includes(group.logical)
    ) {
      throw new InvalidRuleConfigurationError(
        "Condition group must specify valid logical operator ('AND', 'OR', 'NOT')",
      );
    }

    if (!Array.isArray(group.conditions)) {
      throw new InvalidRuleConfigurationError(
        "Condition group must contain an array of conditions",
      );
    }

    for (const cond of group.conditions) {
      if (cond.type === "atomic") {
        stats.total += 1;
        RuleValidator.validateAtomicCondition(cond);
      } else if (cond.type === "group") {
        RuleValidator.validateConditionGroup(cond, currentDepth + 1, stats);
      } else {
        throw new InvalidRuleConfigurationError("Invalid condition type");
      }
    }
  }

  /**
   * Validate Atomic Condition
   */
  private static validateAtomicCondition(cond: AtomicCondition): void {
    if (
      !cond.field ||
      typeof cond.field !== "string" ||
      cond.field.trim() === ""
    ) {
      throw new InvalidRuleConfigurationError(
        "Condition field cannot be empty",
      );
    }

    // Protect against field path injections
    if (
      cond.field.includes(";") ||
      cond.field.includes("--") ||
      cond.field.includes("/*")
    ) {
      throw new InvalidRuleConfigurationError(
        `Invalid characters in field name '${cond.field}'`,
      );
    }

    const op = cond.operator;
    const isValidOp =
      VALID_STANDARD_OPERATORS.has(op as StandardOperator) ||
      VALID_SPATIAL_OPERATORS.has(op as SpatialOperator) ||
      VALID_TEMPORAL_OPERATORS.has(op as TemporalOperator);

    if (!isValidOp) {
      throw new InvalidRuleConfigurationError(
        `Unsupported operator '${op}' in condition for field '${cond.field}'`,
      );
    }

    // If spatial operator requiring geometry or distance
    if (
      op === "WITHIN_DISTANCE" &&
      (cond.value === undefined ||
        typeof cond.value !== "number" ||
        cond.value < 0)
    ) {
      throw new InvalidRuleConfigurationError(
        `Operator 'WITHIN_DISTANCE' requires a non-negative numeric threshold value`,
      );
    }
  }

  /**
   * Validate Action
   */
  private static validateAction(action: RuleAction, idx: number): void {
    if (!action || typeof action !== "object") {
      throw new InvalidRuleConfigurationError(
        `Action at index ${idx} is invalid`,
      );
    }
    if (!action.type) {
      throw new InvalidRuleConfigurationError(
        `Action at index ${idx} missing 'type'`,
      );
    }

    switch (action.type) {
      case "CREATE_ALERT": {
        const payload = action.payload as any;
        if (!payload || !payload.title || !payload.message) {
          throw new InvalidRuleConfigurationError(
            `CREATE_ALERT action at index ${idx} requires 'title' and 'message'`,
          );
        }
        break;
      }
      case "CREATE_TASK": {
        const payload = action.payload as any;
        if (!payload || !payload.title) {
          throw new InvalidRuleConfigurationError(
            `CREATE_TASK action at index ${idx} requires 'title'`,
          );
        }
        break;
      }
      case "SEND_NOTIFICATION": {
        const payload = action.payload as any;
        if (
          !payload ||
          !Array.isArray(payload.channels) ||
          payload.channels.length === 0
        ) {
          throw new InvalidRuleConfigurationError(
            `SEND_NOTIFICATION action at index ${idx} requires 'channels' array`,
          );
        }
        break;
      }
      case "SEND_WEBHOOK": {
        const payload = action.payload as any;
        if (!payload || !payload.url) {
          throw new InvalidRuleConfigurationError(
            `SEND_WEBHOOK action at index ${idx} requires 'url'`,
          );
        }
        SSRFGuard.validateUrl(payload.url);
        break;
      }
      case "CREATE_EVENT": {
        const payload = action.payload as any;
        if (!payload || !payload.type) {
          throw new InvalidRuleConfigurationError(
            `CREATE_EVENT action at index ${idx} requires 'type'`,
          );
        }
        break;
      }
      case "LOG_EVENT":
      case "UPDATE_STATE":
        break;
      default:
        throw new InvalidRuleConfigurationError(
          `Unsupported action type '${action.type}' at index ${idx}`,
        );
    }
  }
}
