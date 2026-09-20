/**
 * Visualization Engine — Filter Engine
 *
 * Client-side feature filtering supporting logical AND/OR combinations,
 * typed comparison operators, and metadata generation for automated UI filter generation.
 */

import { MapFeature } from "../types";
import {
  FilterDefinition,
  FilterOperator,
  FilterRule,
  FilterRuleGroup,
} from "./types";

export class FilterEngine {
  /**
   * Filter an array of MapFeatures according to a FilterRuleGroup.
   */
  public filterFeatures(
    features: MapFeature[],
    group?: FilterRuleGroup,
  ): MapFeature[] {
    if (
      !group ||
      (!group.rules.length && (!group.groups || !group.groups.length))
    ) {
      return features;
    }

    return features.filter((feat) => this.evaluateRuleGroup(feat, group));
  }

  /**
   * Evaluate whether a single feature satisfies a FilterRuleGroup (AND/OR).
   */
  public evaluateRuleGroup(
    feature: MapFeature,
    group: FilterRuleGroup,
  ): boolean {
    const isAnd = group.logicalOperator === "AND";

    // Evaluate individual rules
    let rulesResult = isAnd;
    if (group.rules && group.rules.length > 0) {
      if (isAnd) {
        rulesResult = group.rules.every((rule) =>
          this.evaluateRule(feature, rule),
        );
      } else {
        rulesResult = group.rules.some((rule) =>
          this.evaluateRule(feature, rule),
        );
      }
    }

    // Evaluate nested groups
    let groupsResult = isAnd;
    if (group.groups && group.groups.length > 0) {
      if (isAnd) {
        groupsResult = group.groups.every((nested) =>
          this.evaluateRuleGroup(feature, nested),
        );
      } else {
        groupsResult = group.groups.some((nested) =>
          this.evaluateRuleGroup(feature, nested),
        );
      }
    }

    return isAnd ? rulesResult && groupsResult : rulesResult || groupsResult;
  }

  /**
   * Evaluate a single FilterRule against feature properties.
   */
  public evaluateRule(feature: MapFeature, rule: FilterRule): boolean {
    const props = feature.properties || {};
    const val = props[rule.field];

    return this.evaluateOperator(val, rule.operator, rule.value);
  }

  /**
   * Operator logic execution.
   */
  private evaluateOperator(
    featureVal: unknown,
    operator: FilterOperator,
    targetVal: unknown,
  ): boolean {
    if (featureVal === undefined || featureVal === null) {
      return operator === "not_equals" || operator === "not_in";
    }

    switch (operator) {
      case "equals":
        return String(featureVal) === String(targetVal);

      case "not_equals":
        return String(featureVal) !== String(targetVal);

      case "greater_than":
        return Number(featureVal) > Number(targetVal);

      case "less_than":
        return Number(featureVal) < Number(targetVal);

      case "greater_or_equal":
        return Number(featureVal) >= Number(targetVal);

      case "less_or_equal":
        return Number(featureVal) <= Number(targetVal);

      case "contains":
        return String(featureVal)
          .toLowerCase()
          .includes(String(targetVal).toLowerCase());

      case "in":
        if (Array.isArray(targetVal)) {
          return targetVal.map(String).includes(String(featureVal));
        }
        return false;

      case "not_in":
        if (Array.isArray(targetVal)) {
          return !targetVal.map(String).includes(String(featureVal));
        }
        return true;

      case "between":
        if (Array.isArray(targetVal) && targetVal.length === 2) {
          const num = Number(featureVal);
          return num >= Number(targetVal[0]) && num <= Number(targetVal[1]);
        }
        return false;

      default:
        return true;
    }
  }

  /**
   * Helper to inspect features and generate generic FilterDefinitions for UI generation.
   */
  public generateFilterDefinitions(features: MapFeature[]): FilterDefinition[] {
    if (!features || features.length === 0) return [];

    const fieldMap: Map<string, Set<unknown>> = new Map();
    const fieldTypeMap: Map<string, string> = new Map();

    for (const feat of features) {
      const props = feat.properties || {};
      for (const [key, val] of Object.entries(props)) {
        if (!fieldMap.has(key)) {
          fieldMap.set(key, new Set());
          fieldTypeMap.set(key, typeof val);
        }
        if (val !== undefined && val !== null) {
          fieldMap.get(key)!.add(val);
        }
      }
    }

    const definitions: FilterDefinition[] = [];

    for (const [field, valuesSet] of fieldMap.entries()) {
      const JSDataType = fieldTypeMap.get(field) || "string";
      const values = Array.from(valuesSet);

      let type: FilterDefinition["type"] = "string";
      let operators: FilterOperator[] = [
        "equals",
        "not_equals",
        "contains",
        "in",
        "not_in",
      ];

      if (JSDataType === "number") {
        type = "number";
        operators = [
          "equals",
          "not_equals",
          "greater_than",
          "less_than",
          "greater_or_equal",
          "less_or_equal",
          "between",
        ];
      } else if (JSDataType === "boolean") {
        type = "boolean";
        operators = ["equals", "not_equals"];
      } else if (values.length <= 10 && values.length > 0) {
        type = "enum";
        operators = ["equals", "not_equals", "in", "not_in"];
      }

      definitions.push({
        field,
        label:
          field.charAt(0).toUpperCase() +
          field.slice(1).replace(/([A-Z])/g, " $1"),
        type,
        operators,
        options:
          type === "enum" || type === "boolean"
            ? values.map((v) => ({ label: String(v), value: v }))
            : undefined,
      });
    }

    return definitions;
  }
}
