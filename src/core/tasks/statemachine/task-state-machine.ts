/**
 * Framework-Independent Task State Machine
 *
 * Enforces valid task lifecycle state transitions and terminal state locking.
 *
 * Valid Transitions:
 * ASSIGNED   -> ACCEPTED, CANCELLED
 * ACCEPTED   -> IN_PROGRESS, CANCELLED
 * IN_PROGRESS -> COMPLETED, FAILED, CANCELLED
 *
 * Terminal States (Locked): COMPLETED, CANCELLED, FAILED
 */

import { TaskStatus } from "../types/task.types";

export class TaskStateMachine {
  private static readonly VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
    ASSIGNED: ["ACCEPTED", "CANCELLED"],
    ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["COMPLETED", "FAILED", "CANCELLED"],
    COMPLETED: [], // Terminal
    CANCELLED: [], // Terminal
    FAILED: [],    // Terminal
  };

  public static isTransitionAllowed(currentStatus: TaskStatus, targetStatus: TaskStatus): boolean {
    if (currentStatus === targetStatus) return true; // No-op transition
    const allowed = TaskStateMachine.VALID_TRANSITIONS[currentStatus] ?? [];
    return allowed.includes(targetStatus);
  }

  public static isTerminal(status: TaskStatus): boolean {
    return status === "COMPLETED" || status === "CANCELLED" || status === "FAILED";
  }

  public static validateTransition(currentStatus: TaskStatus, targetStatus: TaskStatus): void {
    if (this.isTerminal(currentStatus) && currentStatus !== targetStatus) {
      throw new Error(`[TASK_STATE_MACHINE] Cannot transition out of terminal state '${currentStatus}' to '${targetStatus}'`);
    }

    if (!this.isTransitionAllowed(currentStatus, targetStatus)) {
      throw new Error(`[TASK_STATE_MACHINE] Invalid transition from '${currentStatus}' to '${targetStatus}'`);
    }
  }
}
