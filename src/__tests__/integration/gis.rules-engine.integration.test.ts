import { PostGisRulesRepository } from "../../core/gis/rules/repositories/postgis-rules.repository";
import { ActionExecutionService } from "../../core/gis/rules/actions/action-execution.service";
import { RuleExecutionService } from "../../core/gis/rules/engine/rule-execution.service";
import { InMemoryRealtimeEventPublisher } from "../../core/gis/realtime/realtime-event.publisher";
import { RuleContext } from "../../core/gis/rules/types/rule.types";
import assert from "assert";

export async function runRulesEngineIntegrationTests() {
  const repo = new PostGisRulesRepository();
  const publisher = new InMemoryRealtimeEventPublisher();
  const actionExecutionService = new ActionExecutionService(
    repo,
    undefined,
    undefined,
    publisher,
  );
  const ruleExecutionService = new RuleExecutionService(
    repo,
    actionExecutionService,
  );

  const testTenantId = `tenant-test-${Date.now()}`;
  const ctx = { tenantId: testTenantId, role: "TENANT_ADMIN" as const };

  // 1. Create Spatial Rule (DRAFT status)
  const { rule, version } = await ruleExecutionService.createRule(ctx, {
    name: "Boundary Violation Rule Test",
    description: "Integration test rule for spatial boundary entry alert",
    priority: 1,
    triggerType: "SPATIAL_ENTER",
    scope: { subjectType: "drone" },
    configuration: {
      trigger: { type: "SPATIAL_ENTER" },
      scope: { subjectType: "drone" },
      conditions: {
        type: "group",
        logical: "AND",
        conditions: [
          {
            type: "atomic",
            field: "location.speed",
            operator: "GREATER_THAN",
            value: 50,
          },
        ],
      },
      actions: [
        {
          id: "act-alert-1",
          type: "CREATE_ALERT",
          order: 1,
          payload: {
            severity: "HIGH",
            title: "High Speed Boundary Entry Detected",
            message:
              "Drone {{subject.id}} entered zone at {{location.speed}} km/h",
          },
        },
      ],
      executionPolicy: "ALLOW_CONCURRENT",
      cooldownSeconds: 0,
      actionFailurePolicy: "STOP_ON_FAILURE",
    },
  });

  assert.strictEqual(rule.status, "DRAFT");
  assert.strictEqual(rule.currentVersion, 1);
  assert.strictEqual(version.version, 1);

  // 2. Activate Rule
  const activeRule = await ruleExecutionService.activateRule(ctx, rule.id);
  assert.strictEqual(activeRule.status, "ACTIVE");

  // 3. Evaluate Event (Trigger SPATIAL_ENTER with speed = 75 > 50)
  const triggerEventId = `evt-enter-${Date.now()}`;
  const sampleContext: RuleContext = {
    event: {
      id: triggerEventId,
      type: "SPATIAL_ENTER",
      timestamp: new Date().toISOString(),
    },
    subject: { id: "subj-drone-99", type: "drone", name: "Drone 99" },
    location: { latitude: 18.52, longitude: 73.85, speed: 75 },
    geofence: {
      id: "gf-zone-1",
      name: "Zone 1",
      state: "INSIDE",
      transition: "ENTER",
    },
    timestamp: new Date().toISOString(),
  };

  const evalRes = await ruleExecutionService.evaluateEvent(
    ctx,
    {
      id: triggerEventId,
      type: "SPATIAL_ENTER",
      timestamp: sampleContext.timestamp,
      subjectId: "subj-drone-99",
    },
    sampleContext,
  );

  assert.strictEqual(
    evalRes.evaluated,
    1,
    "Expected 1 candidate active rule to be evaluated",
  );
  assert.strictEqual(evalRes.matched, 1, "Expected 1 rule to match conditions");
  assert.strictEqual(evalRes.executed.length, 1, "Expected 1 execution record");
  assert.strictEqual(evalRes.executed[0].status, "SUCCESS");

  // 4. Assert Alert Record Created in Database
  const alertsResult = await ruleExecutionService.listAlerts(ctx, {
    limit: 10,
  });
  assert.strictEqual(
    alertsResult.total,
    1,
    "Expected exactly 1 alert created in database",
  );
  const alert = alertsResult.items[0];
  assert.strictEqual(alert.severity, "HIGH");
  assert.strictEqual(alert.title, "High Speed Boundary Entry Detected");
  assert.strictEqual(alert.status, "OPEN");

  // 5. Test Idempotency: Re-submitting the exact same event trigger ID
  const duplicateRes = await ruleExecutionService.evaluateEvent(
    ctx,
    {
      id: triggerEventId,
      type: "SPATIAL_ENTER",
      timestamp: sampleContext.timestamp,
      subjectId: "subj-drone-99",
    },
    sampleContext,
  );

  assert.strictEqual(
    duplicateRes.executed.length,
    0,
    "Idempotency check must suppress duplicate event processing",
  );

  const alertsAfterDup = await ruleExecutionService.listAlerts(ctx, {
    limit: 10,
  });
  assert.strictEqual(
    alertsAfterDup.total,
    1,
    "Alert count must remain 1 (no duplicates)",
  );

  // 6. Test Alert Acknowledgment Lifecycle
  const ackAlert = await ruleExecutionService.updateAlertStatus(
    ctx,
    alert.id,
    "ACKNOWLEDGED",
  );
  assert.strictEqual(ackAlert.status, "ACKNOWLEDGED");
}
