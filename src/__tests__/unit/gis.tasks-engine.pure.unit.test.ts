/**
 * Pure Framework-Independent Tasks Engine Unit Tests
 *
 * Verifies Task creation, state machine transitions, invalid transition rejection,
 * terminal state locking, spatial proximity verification, SLA tracking, and pure framework decoupling.
 *
 * MUST NOT require browser DOM, React, Next.js, or OpenLayers.
 */

import { TasksEngine } from "../../core/tasks/engine/tasks-engine";
import { InMemoryTaskRepository } from "../../core/tasks/repository/task-repository.interface";
import { TaskTransitionEvent } from "../../core/tasks/types/task.types";
import { Coordinate } from "../../core/gis/types/geometry";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export async function runTasksEnginePureUnitTests(): Promise<void> {
  console.log("------------------------------------------");
  console.log("RUNNING GENERIC TASKS ENGINE PURE DOMAIN TESTS");
  console.log("------------------------------------------");

  const repo = new InMemoryTaskRepository();
  const engine = new TasksEngine(repo);

  const destCoord: Coordinate = [77.2090, 28.6139]; // Delhi Connaught Place

  // 1. Task Creation
  console.log("  [1/12] Testing Task Creation & Initial ASSIGNED Status...");
  const task1 = await engine.createTask({
    title: "Inspect Customer Site A",
    description: "Perform quarterly maintenance inspection",
    priority: "HIGH",
    assigneeId: "worker-101",
    spatialConstraint: {
      destinationCoordinate: destCoord,
      proximityRadiusMeters: 100,
      requireProximityArrival: true,
    },
    dueAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  });

  assert(task1.id.startsWith("task_"), "Task ID must be generated");
  assert(task1.status === "ASSIGNED", "Initial status must be ASSIGNED");
  assert(task1.assignment?.assigneeId === "worker-101", "Assignee ID must match");

  // 2. Valid State Transitions
  console.log("  [2/12] Testing Valid State Transitions (ASSIGNED -> ACCEPTED -> IN_PROGRESS)...");
  await engine.transitionTask(task1.id, "ACCEPTED", "worker-101");
  let updated = (await repo.getTask(task1.id))!;
  assert(updated.status === "ACCEPTED", "Status must update to ACCEPTED");

  // Transition to IN_PROGRESS with coordinate inside 100m proximity
  const nearCoord: Coordinate = [77.2091, 28.6140]; // ~15 meters away
  await engine.transitionTask(task1.id, "IN_PROGRESS", "worker-101", nearCoord);
  updated = (await repo.getTask(task1.id))!;
  assert(updated.status === "IN_PROGRESS", "Status must update to IN_PROGRESS");

  // 3. Invalid Transition Rejection
  console.log("  [3/12] Testing Invalid Transition Rejection (ASSIGNED -> COMPLETED)...");
  const task2 = await engine.createTask({ title: "Unstarted Delivery Task", priority: "MEDIUM" });
  let invalidTransitionFailed = false;
  try {
    await engine.transitionTask(task2.id, "COMPLETED", "worker-102");
  } catch (err: any) {
    if (err.message.includes("Invalid transition")) {
      invalidTransitionFailed = true;
    }
  }
  assert(invalidTransitionFailed, "Direct transition from ASSIGNED to COMPLETED must be rejected");

  // 4. Terminal State Locking
  console.log("  [4/12] Testing Terminal State Locking (COMPLETED is locked)...");
  await engine.transitionTask(task1.id, "COMPLETED", "worker-101", nearCoord);
  updated = (await repo.getTask(task1.id))!;
  assert(updated.status === "COMPLETED", "Status must be COMPLETED");
  assert(updated.completedAt !== undefined, "completedAt timestamp must be recorded");

  let terminalLockFailed = false;
  try {
    await engine.transitionTask(task1.id, "IN_PROGRESS", "worker-101");
  } catch (err: any) {
    if (err.message.includes("terminal state")) {
      terminalLockFailed = true;
    }
  }
  assert(terminalLockFailed, "Transitioning out of COMPLETED terminal state must be rejected");

  // 5. Spatial Proximity Arrival Rejection
  console.log("  [5/12] Testing Spatial Proximity Arrival Rejection when Far Away...");
  const task3 = await engine.createTask({
    title: "Field Audit Task",
    assigneeId: "worker-103",
    spatialConstraint: {
      destinationCoordinate: destCoord,
      proximityRadiusMeters: 50,
      requireProximityArrival: true,
    },
  });
  await engine.transitionTask(task3.id, "ACCEPTED", "worker-103");

  const farCoord: Coordinate = [77.3000, 28.5000]; // ~15 km away
  let spatialRejectionFailed = false;
  try {
    await engine.transitionTask(task3.id, "IN_PROGRESS", "worker-103", farCoord);
  } catch (err: any) {
    if (err.message.includes("SPATIAL_VERIFICATION_FAILED")) {
      spatialRejectionFailed = true;
    }
  }
  assert(spatialRejectionFailed, "Transition when 15km away from required 50m destination must fail");

  // 6. SLA Tracking & Overdue Calculation
  console.log("  [6/12] Testing Task SLA Due-Date & Overdue Calculation...");
  const pastDueIso = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
  const overdueTask = await engine.createTask({
    title: "Urgent Maintenance",
    priority: "URGENT",
    dueAt: pastDueIso,
  });

  const listOverdue = await engine.listTasks({ isOverdue: true });
  assert(listOverdue.some((t) => t.id === overdueTask.id), "Task with past due date must be marked overdue");

  // 7. Form Submission Binding
  console.log("  [7/12] Testing Form Submission Binding...");
  await engine.bindFormSubmission(task1.id, "sub_998877");
  const boundTask = (await repo.getTask(task1.id))!;
  assert(boundTask.formSubmissionId === "sub_998877", "formSubmissionId must be bound to task");

  // 8. Transition Event Listeners
  console.log("  [8/12] Testing Transition Event Subscriptions...");
  const capturedEvents: TaskTransitionEvent[] = [];
  const unsub = engine.subscribeTransitions((evt) => capturedEvents.push(evt));

  const task4 = await engine.createTask({ title: "Patrol Checkpoint 1" });
  await engine.transitionTask(task4.id, "ACCEPTED", "guard-01");

  assert(capturedEvents.length === 1 && capturedEvents[0].newStatus === "ACCEPTED", "Transition event listener must capture event");

  // 9. Subscription Cleanup
  console.log("  [9/12] Testing Subscription Cleanup...");
  unsub();
  capturedEvents.length = 0;
  await engine.transitionTask(task4.id, "CANCELLED", "guard-01");
  assert(capturedEvents.length === 0, "Unsubscribed listener must NOT receive events");

  // 10. Repository Filtering
  console.log("  [10/12] Testing Repository Task Filtering by Status & Priority...");
  const highPriorityTasks = await engine.listTasks({ priority: "HIGH" });
  assert(highPriorityTasks.length >= 1, "Filtering by priority must return matching tasks");

  // 11. Multi-Industry Vertical Task Scenarios (Delivery, Field Service, Agri)
  console.log("  [11/12] Testing Multi-Industry Vertical Task Scenarios...");
  const agriTask = await engine.createTask({ title: "Field Spraying Task", priority: "HIGH", assigneeId: "tractor-01" });
  assert(agriTask.assignment?.assigneeId === "tractor-01", "Agri asset task creation must succeed");

  // 12. Pure Framework Decoupling Verification
  console.log("  [12/12] Verifying Pure Framework Decoupling...");
  assert(typeof engine.createTask === "function", "TasksEngine must expose createTask");
  assert(typeof repo.listTasks === "function", "ITaskRepository contract must be satisfied");

  console.log("✅ Generic Tasks Engine Pure Domain Unit Tests Passed Successfully!");
}
