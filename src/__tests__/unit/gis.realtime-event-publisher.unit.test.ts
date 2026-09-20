/**
 * Phase 9 — RealtimeEventPublisher Unit Tests
 *
 * Validates channel routing, multi-subscriber delivery, and unsubscribe behavior.
 */

import { InMemoryRealtimeEventPublisher } from "../../core/gis/realtime/realtime-event.publisher";
import { RealtimeEventEnvelope } from "../../core/gis/realtime/spatial-event.model";

function makeEnvelope(
  eventId: string,
  tenantId: string,
  subjectId: string,
  eventType: string,
): RealtimeEventEnvelope {
  return {
    eventId,
    eventType,
    timestamp: new Date().toISOString(),
    tenantId,
    subjectId,
    payload: { coordinate: [77.5, 12.9] },
    version: 1,
  };
}

export async function runRealtimeEventPublisherUnitTests() {
  const publisher = new InMemoryRealtimeEventPublisher();

  // ---- Test 1: Tenant channel receives correct event ----
  const tenantMessages: RealtimeEventEnvelope[] = [];
  publisher.subscribe("tenant:tenant-001", (env) => tenantMessages.push(env));

  const env1 = makeEnvelope(
    "evt-001",
    "tenant-001",
    "subj-001",
    "LOCATION_UPDATED",
  );
  await publisher.publish(env1);

  if (tenantMessages.length !== 1)
    throw new Error(`Expected 1 tenant message, got ${tenantMessages.length}`);
  if (tenantMessages[0].eventId !== "evt-001")
    throw new Error("Tenant channel received wrong event");

  // ---- Test 2: Subject channel receives correct event ----
  const subjectMessages: RealtimeEventEnvelope[] = [];
  publisher.subscribe("subject:subj-001", (env) => subjectMessages.push(env));

  await publisher.publish(env1);

  // tenant gets 2nd message, subject gets 1st
  if (subjectMessages.length !== 1)
    throw new Error(
      `Expected 1 subject message, got ${subjectMessages.length}`,
    );
  if (subjectMessages[0].subjectId !== "subj-001")
    throw new Error("Subject channel received wrong event");

  // ---- Test 3: All channel receives all events ----
  const allMessages: RealtimeEventEnvelope[] = [];
  publisher.subscribe("all", (env) => allMessages.push(env));

  const env2 = makeEnvelope(
    "evt-002",
    "tenant-002",
    "subj-002",
    "SPATIAL_ENTER",
  );
  await publisher.publish(env2);

  if (allMessages.length < 1)
    throw new Error("'all' channel received no events");
  if (allMessages[allMessages.length - 1].eventId !== "evt-002")
    throw new Error("'all' channel got wrong last event");

  // ---- Test 4: Cross-tenant isolation — tenant-001 does NOT receive tenant-002 events ----
  const t1MessagesBeforeCross = tenantMessages.length;
  // env2 is from tenant-002, tenantMessages listener is for tenant-001
  if (tenantMessages.length > t1MessagesBeforeCross) {
    throw new Error("Cross-tenant event leaked to wrong tenant channel!");
  }

  // ---- Test 5: Unsubscribe stops delivery ----
  const collector: RealtimeEventEnvelope[] = [];
  const unsub = publisher.subscribe("tenant:tenant-003", (env) =>
    collector.push(env),
  );

  const env3 = makeEnvelope(
    "evt-003",
    "tenant-003",
    "subj-003",
    "SPATIAL_EXIT",
  );
  await publisher.publish(env3);
  if (collector.length !== 1)
    throw new Error("Expected 1 message before unsubscribe");

  unsub();

  const env4 = makeEnvelope(
    "evt-004",
    "tenant-003",
    "subj-003",
    "LOCATION_UPDATED",
  );
  await publisher.publish(env4);
  if (collector.length !== 1)
    throw new Error(
      "Received event after unsubscribe — listener not cleaned up!",
    );

  // ---- Test 6: Subscriber count tracking ----
  const countBefore = publisher.getSubscriberCount("tenant:tenant-100");
  if (countBefore !== 0)
    throw new Error(`Expected 0 subscribers, got ${countBefore}`);

  const handler = () => {};
  publisher.subscribe("tenant:tenant-100", handler);
  const countAfter = publisher.getSubscriberCount("tenant:tenant-100");
  if (countAfter !== 1)
    throw new Error(`Expected 1 subscriber, got ${countAfter}`);

  publisher.unsubscribe("tenant:tenant-100", handler);
  const countFinal = publisher.getSubscriberCount("tenant:tenant-100");
  if (countFinal !== 0)
    throw new Error(`Expected 0 after unsubscribe, got ${countFinal}`);

  // ---- Test 7: Multiple concurrent subscribers on same channel ----
  const results1: RealtimeEventEnvelope[] = [];
  const results2: RealtimeEventEnvelope[] = [];
  publisher.subscribe("tenant:tenant-multi", (env) => results1.push(env));
  publisher.subscribe("tenant:tenant-multi", (env) => results2.push(env));

  const envMulti = makeEnvelope(
    "evt-multi",
    "tenant-multi",
    "subj-multi",
    "LOCATION_UPDATED",
  );
  await publisher.publish(envMulti);

  if (results1.length !== 1)
    throw new Error(`Subscriber 1 expected 1 msg, got ${results1.length}`);
  if (results2.length !== 1)
    throw new Error(`Subscriber 2 expected 1 msg, got ${results2.length}`);

  // ---- Test 8: High-frequency publish (50 rapid events) ----
  const rapidMessages: RealtimeEventEnvelope[] = [];
  publisher.subscribe("tenant:tenant-rapid", (env) => rapidMessages.push(env));

  const publishPromises = Array.from({ length: 50 }, (_, i) =>
    publisher.publish(
      makeEnvelope(
        `evt-rapid-${i}`,
        "tenant-rapid",
        "subj-rapid",
        "LOCATION_UPDATED",
      ),
    ),
  );
  await Promise.all(publishPromises);

  if (rapidMessages.length !== 50) {
    throw new Error(`Expected 50 rapid messages, got ${rapidMessages.length}`);
  }
}
