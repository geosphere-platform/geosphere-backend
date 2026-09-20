/**
 * RuleMatcher — Candidate Rule Lookup & Scope Matching Pipeline
 *
 * Filters rules by tenant, status (ACTIVE), trigger type, and scope
 * to minimize unnecessary condition evaluations for real-time events.
 */

import { SpatialRule, RuleContext } from "../types/rule.types";

export class RuleMatcher {
  /**
   * Filter a list of candidate active rules against an incoming event context
   */
  public static filterCandidates(
    rules: SpatialRule[],
    context: RuleContext,
  ): SpatialRule[] {
    if (!Array.isArray(rules) || rules.length === 0) {
      return [];
    }

    return rules.filter((rule) => {
      // 1. Status check — only ACTIVE rules can execute
      if (rule.status !== "ACTIVE") {
        return false;
      }

      // 2. Trigger Type check
      if (
        context.event?.type &&
        rule.triggerType !== context.event.type &&
        rule.triggerType !== "SPATIAL_EVENT"
      ) {
        // If event type does not match trigger type
        return false;
      }

      // 3. Scope matching
      if (rule.scope) {
        // Subject Type scope
        if (rule.scope.subjectType && context.subject?.type) {
          if (rule.scope.subjectType !== context.subject.type) {
            return false;
          }
        }

        // Subject ID scope
        if (rule.scope.subjectId && context.subject?.id) {
          if (rule.scope.subjectId !== context.subject.id) {
            return false;
          }
        }

        // Geofence ID scope
        if (rule.scope.geofenceId && context.geofence?.id) {
          if (rule.scope.geofenceId !== context.geofence.id) {
            return false;
          }
        }
      }

      return true;
    });
  }
}
