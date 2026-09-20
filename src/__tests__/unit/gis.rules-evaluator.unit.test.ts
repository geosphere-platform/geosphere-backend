import { RuleEvaluator } from "../../core/gis/rules/evaluator/rule-evaluator";
import { SafeAttributeResolver } from "../../core/gis/rules/evaluator/safe-attribute-resolver";
import { RuleValidator } from "../../core/gis/rules/validation/rule-validator";
import {
  RuleContext,
  ConditionGroup,
} from "../../core/gis/rules/types/rule.types";
import assert from "assert";

export function runRulesEvaluatorUnitTests() {
  const evaluator = new RuleEvaluator();

  // Test 1: Safe Attribute Resolver Property Extraction & Security
  const sampleContext: RuleContext = {
    event: { type: "LOCATION_UPDATED", timestamp: "2026-08-11T12:00:00Z" },
    subject: {
      id: "subj-001",
      type: "drone",
      attributes: { model: "X-200", payloadCapacity: 50 },
    },
    location: {
      latitude: 18.5204,
      longitude: 73.8567,
      speed: 85.5,
      heading: 180,
    },
    geofence: {
      id: "gf-101",
      name: "Restricted Zone A",
      state: "INSIDE",
      transition: "ENTER",
    },
    timestamp: "2026-08-11T12:00:00Z",
  };

  assert.strictEqual(
    SafeAttributeResolver.resolve("subject.id", sampleContext),
    "subj-001",
  );
  assert.strictEqual(
    SafeAttributeResolver.resolve("location.speed", sampleContext),
    85.5,
  );
  assert.strictEqual(
    SafeAttributeResolver.resolve("subject.attributes.model", sampleContext),
    "X-200",
  );

  // Security check: Prototype pollution / unpermitted root traversal blocked
  assert.strictEqual(
    SafeAttributeResolver.resolve("__proto__", sampleContext),
    undefined,
  );
  assert.strictEqual(
    SafeAttributeResolver.resolve("constructor", sampleContext),
    undefined,
  );
  assert.strictEqual(
    SafeAttributeResolver.resolve("process.env", sampleContext),
    undefined,
  );

  // Test 2: Standard Condition Operators (EQUALS, GREATER_THAN, CONTAINS)
  const condGroup: ConditionGroup = {
    type: "group",
    logical: "AND",
    conditions: [
      {
        type: "atomic",
        field: "subject.type",
        operator: "EQUALS",
        value: "drone",
      },
      {
        type: "atomic",
        field: "location.speed",
        operator: "GREATER_THAN",
        value: 80,
      },
      {
        type: "atomic",
        field: "geofence.name",
        operator: "CONTAINS",
        value: "Restricted",
      },
    ],
  };

  const res1 = evaluator.evaluateGroup(condGroup, sampleContext);
  assert.strictEqual(
    res1.matched,
    true,
    "Expected rule to match all AND conditions",
  );

  // Test 3: Compound OR Conditions with Failures
  const condGroupOr: ConditionGroup = {
    type: "group",
    logical: "OR",
    conditions: [
      {
        type: "atomic",
        field: "location.speed",
        operator: "GREATER_THAN",
        value: 200,
      }, // Fails
      {
        type: "atomic",
        field: "geofence.state",
        operator: "EQUALS",
        value: "INSIDE",
      }, // Matches
    ],
  };

  const res2 = evaluator.evaluateGroup(condGroupOr, sampleContext);
  assert.strictEqual(
    res2.matched,
    true,
    "Expected OR group to match when at least one condition passes",
  );

  // Test 4: Temporal Operators (BEFORE, AFTER, BETWEEN)
  const temporalBefore = evaluator.evaluateAtomic(
    {
      type: "atomic",
      field: "timestamp",
      operator: "BEFORE",
      value: "2026-08-11T13:00:00Z",
    },
    sampleContext,
  );
  assert.strictEqual(
    temporalBefore.matched,
    true,
    "Expected 12:00 to be BEFORE 13:00",
  );

  const temporalBetween = evaluator.evaluateAtomic(
    {
      type: "atomic",
      field: "timestamp",
      operator: "BETWEEN",
      value: ["2026-08-11T11:00:00Z", "2026-08-11T13:00:00Z"],
    },
    sampleContext,
  );
  assert.strictEqual(
    temporalBetween.matched,
    true,
    "Expected 12:00 to be BETWEEN 11:00 and 13:00",
  );

  // Test 5: Rule Validator Limits Enforcement
  assert.throws(
    () => {
      RuleValidator.validateConfiguration({
        trigger: { type: "INVALID_TRIGGER" as any },
        conditions: { type: "group", logical: "AND", conditions: [] },
        actions: [{ id: "1", type: "CREATE_ALERT", order: 1, payload: {} }],
      });
    },
    /Unsupported trigger type/,
    "Expected validator to reject unsupported trigger type",
  );
}
