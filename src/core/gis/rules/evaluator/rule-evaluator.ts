/**
 * RuleEvaluator — Core Condition & Operator Evaluation Engine
 *
 * Evaluates standard, temporal, and spatial conditions against a RuleContext object.
 * Strictly deterministic and safe.
 */

import {
  ConditionGroup,
  AtomicCondition,
  RuleCondition,
  RuleContext,
  ConditionEvaluationResult,
} from "../types/rule.types";
import { SafeAttributeResolver } from "./safe-attribute-resolver";
import { calculateDistance } from "../../utils/spatial-utils";
import { PointGeometry, Geometry, Coordinate } from "../../types/geometry";

export class RuleEvaluator {
  /**
   * Evaluate a full ConditionGroup against a context object.
   * Returns overall boolean result and detailed itemized results.
   */
  public evaluateGroup(
    group: ConditionGroup,
    context: RuleContext,
  ): { matched: boolean; results: ConditionEvaluationResult[] } {
    const itemResults: ConditionEvaluationResult[] = [];
    if (!group || group.type !== "group" || !Array.isArray(group.conditions)) {
      return { matched: true, results: [] };
    }

    if (group.conditions.length === 0) {
      return { matched: true, results: [] };
    }

    const subResults: boolean[] = [];

    group.conditions.forEach((cond, idx) => {
      if (cond.type === "atomic") {
        const evalRes = this.evaluateAtomic(cond, context, idx);
        itemResults.push(evalRes);
        subResults.push(evalRes.matched);
      } else if (cond.type === "group") {
        const nestedRes = this.evaluateGroup(cond, context);
        itemResults.push(...nestedRes.results);
        subResults.push(nestedRes.matched);
      }
    });

    let overallMatched = false;
    if (group.logical === "AND") {
      overallMatched = subResults.every(Boolean);
    } else if (group.logical === "OR") {
      overallMatched = subResults.some(Boolean);
    } else if (group.logical === "NOT") {
      overallMatched = !subResults.every(Boolean);
    }

    return { matched: overallMatched, results: itemResults };
  }

  /**
   * Evaluate a single atomic condition against context
   */
  public evaluateAtomic(
    cond: AtomicCondition,
    context: RuleContext,
    index: number = 0,
  ): ConditionEvaluationResult {
    const actualValue = SafeAttributeResolver.resolve(cond.field, context);
    const expectedValue = cond.value;
    let matched = false;
    let reason: string | undefined;

    switch (cond.operator) {
      // ── Standard Operators ──────────────────────────────────────────────────
      case "EQUALS":
        matched = actualValue === expectedValue;
        break;

      case "NOT_EQUALS":
        matched = actualValue !== expectedValue;
        break;

      case "GREATER_THAN":
        matched =
          typeof actualValue === "number" &&
          typeof expectedValue === "number" &&
          actualValue > expectedValue;
        break;

      case "GREATER_THAN_OR_EQUAL":
        matched =
          typeof actualValue === "number" &&
          typeof expectedValue === "number" &&
          actualValue >= expectedValue;
        break;

      case "LESS_THAN":
        matched =
          typeof actualValue === "number" &&
          typeof expectedValue === "number" &&
          actualValue < expectedValue;
        break;

      case "LESS_THAN_OR_EQUAL":
        matched =
          typeof actualValue === "number" &&
          typeof expectedValue === "number" &&
          actualValue <= expectedValue;
        break;

      case "CONTAINS":
        if (
          typeof actualValue === "string" &&
          typeof expectedValue === "string"
        ) {
          matched = actualValue
            .toLowerCase()
            .includes(expectedValue.toLowerCase());
        } else if (Array.isArray(actualValue)) {
          matched = actualValue.includes(expectedValue);
        }
        break;

      case "NOT_CONTAINS":
        if (
          typeof actualValue === "string" &&
          typeof expectedValue === "string"
        ) {
          matched = !actualValue
            .toLowerCase()
            .includes(expectedValue.toLowerCase());
        } else if (Array.isArray(actualValue)) {
          matched = !actualValue.includes(expectedValue);
        }
        break;

      case "STARTS_WITH":
        if (
          typeof actualValue === "string" &&
          typeof expectedValue === "string"
        ) {
          matched = actualValue
            .toLowerCase()
            .startsWith(expectedValue.toLowerCase());
        }
        break;

      case "ENDS_WITH":
        if (
          typeof actualValue === "string" &&
          typeof expectedValue === "string"
        ) {
          matched = actualValue
            .toLowerCase()
            .endsWith(expectedValue.toLowerCase());
        }
        break;

      case "IN":
        if (Array.isArray(expectedValue)) {
          matched = expectedValue.includes(actualValue);
        }
        break;

      case "NOT_IN":
        if (Array.isArray(expectedValue)) {
          matched = !expectedValue.includes(actualValue);
        }
        break;

      case "IS_NULL":
        matched = actualValue === null || actualValue === undefined;
        break;

      case "IS_NOT_NULL":
        matched = actualValue !== null && actualValue !== undefined;
        break;

      // ── Temporal Operators ──────────────────────────────────────────────────
      case "BEFORE":
        matched = this.evaluateBefore(actualValue, expectedValue);
        break;

      case "AFTER":
        matched = this.evaluateAfter(actualValue, expectedValue);
        break;

      case "BETWEEN":
        matched = this.evaluateBetween(actualValue, expectedValue);
        break;

      case "DURATION_GREATER_THAN":
        matched =
          typeof actualValue === "number" &&
          typeof expectedValue === "number" &&
          actualValue > expectedValue;
        break;

      case "DURATION_LESS_THAN":
        matched =
          typeof actualValue === "number" &&
          typeof expectedValue === "number" &&
          actualValue <= expectedValue;
        break;

      // ── Spatial Operators ───────────────────────────────────────────────────
      case "WITHIN_DISTANCE":
        matched = this.evaluateWithinDistance(context, cond);
        break;

      case "WITHIN":
      case "CONTAINS":
      case "INTERSECTS":
      case "TOUCHES":
      case "OVERLAPS":
      case "CROSSES":
      case "DISJOINT":
      case "NEAREST":
        matched = this.evaluateSpatialRelationship(context, cond);
        break;

      default:
        matched = false;
        reason = `Unknown or unsupported operator '${cond.operator}'`;
        break;
    }

    return {
      conditionIndex: index,
      field: cond.field,
      operator: cond.operator,
      expectedValue: cond.value,
      actualValue,
      matched,
      reason,
    };
  }

  /**
   * Temporal BEFORE evaluation
   */
  private evaluateBefore(actual: unknown, expected: unknown): boolean {
    const actMs = this.toTimestampMs(actual);
    const expMs = this.toTimestampMs(expected);
    if (actMs === null || expMs === null) return false;
    return actMs < expMs;
  }

  /**
   * Temporal AFTER evaluation
   */
  private evaluateAfter(actual: unknown, expected: unknown): boolean {
    const actMs = this.toTimestampMs(actual);
    const expMs = this.toTimestampMs(expected);
    if (actMs === null || expMs === null) return false;
    return actMs > expMs;
  }

  /**
   * Temporal BETWEEN evaluation (expected: [start, end])
   */
  private evaluateBetween(actual: unknown, expected: unknown): boolean {
    const actMs = this.toTimestampMs(actual);
    if (actMs === null || !Array.isArray(expected) || expected.length < 2)
      return false;
    const startMs = this.toTimestampMs(expected[0]);
    const endMs = this.toTimestampMs(expected[1]);
    if (startMs === null || endMs === null) return false;
    return actMs >= startMs && actMs <= endMs;
  }

  private toTimestampMs(val: unknown): number | null {
    if (typeof val === "number" && !isNaN(val)) return val;
    if (typeof val === "string") {
      const ms = new Date(val).getTime();
      return isNaN(ms) ? null : ms;
    }
    return null;
  }

  /**
   * Spatial WITHIN_DISTANCE evaluation
   */
  private evaluateWithinDistance(
    context: RuleContext,
    cond: AtomicCondition,
  ): boolean {
    const maxDistanceMeters = typeof cond.value === "number" ? cond.value : 0;

    let pointCoord: Coordinate | null = null;
    if (context.location?.coordinate) {
      pointCoord = [
        context.location.coordinate[0],
        context.location.coordinate[1],
      ];
    } else if (
      context.location?.longitude !== undefined &&
      context.location?.latitude !== undefined
    ) {
      pointCoord = [context.location.longitude, context.location.latitude];
    } else if (context.distance !== undefined) {
      return context.distance <= maxDistanceMeters;
    }

    if (!pointCoord) return false;

    let targetCoord: Coordinate | null = null;
    if (cond.spatialTarget && cond.spatialTarget.type === "Point") {
      const pt = cond.spatialTarget as PointGeometry;
      targetCoord = [pt.coordinates[0], pt.coordinates[1]];
    }

    if (targetCoord) {
      const distMeters = calculateDistance(pointCoord, targetCoord);
      return distMeters <= maxDistanceMeters;
    }

    return false;
  }

  /**
   * Spatial Relationship evaluation (WITHIN, INTERSECTS, etc.)
   */
  private evaluateSpatialRelationship(
    context: RuleContext,
    cond: AtomicCondition,
  ): boolean {
    if (cond.operator === "WITHIN" || cond.operator === "INTERSECTS") {
      if (context.geofence?.state === "INSIDE") return true;
    }
    if (cond.operator === "DISJOINT") {
      if (context.geofence?.state === "OUTSIDE") return true;
    }
    return false;
  }
}
