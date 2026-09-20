/**
 * Framework-Independent TasksEngine Class
 *
 * Provides task lifecycle management, deterministic state transitions, SLA tracking,
 * spatial proximity arrival verification, form submission binding, and transition event broadcasting.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, Android/iOS UI, or vehicle PII.
 */

import { Coordinate } from "../../gis/types/geometry";
import { calculateDistance } from "../../gis/utils/spatial-utils";
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskSpatialConstraint,
  TaskWorkflowStep,
  TaskSLAStatus,
  TaskTransitionEvent,
  TaskTransitionListener,
} from "../types/task.types";
import { ITaskRepository, InMemoryTaskRepository, TaskFilterOptions } from "../repository/task-repository.interface";
import { TaskStateMachine } from "../statemachine/task-state-machine";

export interface CreateTaskOptions {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  spatialConstraint?: TaskSpatialConstraint;
  dueAt?: string; // ISO 8601 UTC
  workflowSteps?: TaskWorkflowStep[];
  formSchemaId?: string;
  metadata?: Record<string, unknown>;
}

export class TasksEngine {
  private readonly repository: ITaskRepository;
  private readonly listeners = new Set<TaskTransitionListener>();

  constructor(repository?: ITaskRepository) {
    this.repository = repository ?? new InMemoryTaskRepository();
  }

  public getRepository(): ITaskRepository {
    return this.repository;
  }

  public subscribeTransitions(listener: TaskTransitionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public unsubscribeTransitions(listener: TaskTransitionListener): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(event: TaskTransitionEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error("[TASKS-ENGINE:ERR] Transition listener error:", err);
      }
    }
  }

  /**
   * Create a new Task
   */
  public async createTask(options: CreateTaskOptions): Promise<Task> {
    if (!options || !options.title) {
      throw new Error("[TASKS_ENGINE] Task title is required");
    }

    const nowIso = new Date().toISOString();
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: options.title,
      description: options.description,
      status: "ASSIGNED",
      priority: options.priority ?? "MEDIUM",
      assignment: options.assigneeId ? { assigneeId: options.assigneeId, assignedAt: nowIso } : undefined,
      spatialConstraint: options.spatialConstraint,
      workflowSteps: options.workflowSteps,
      formSchemaId: options.formSchemaId,
      sla: options.dueAt ? this.computeSLA(options.dueAt, "ASSIGNED", undefined) : undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
      metadata: options.metadata,
    };

    await this.repository.saveTask(task);
    return task;
  }

  /**
   * Transition Task to a new TaskStatus
   */
  public async transitionTask(
    taskId: string,
    targetStatus: TaskStatus,
    actorId: string,
    coordinate?: Coordinate,
    notes?: string,
  ): Promise<Task> {
    const task = await this.repository.getTask(taskId);
    if (!task) {
      throw new Error(`[TASKS_ENGINE] Task '${taskId}' not found`);
    }

    TaskStateMachine.validateTransition(task.status, targetStatus);

    // If spatial arrival check is required before starting or completing task
    if (targetStatus === "IN_PROGRESS" || targetStatus === "COMPLETED") {
      this.verifySpatialProximity(task, coordinate);
    }

    const previousStatus = task.status;
    const nowIso = new Date().toISOString();

    task.status = targetStatus;
    task.updatedAt = nowIso;
    if (targetStatus === "COMPLETED") {
      task.completedAt = nowIso;
    }

    // Update SLA status
    if (task.sla?.dueAt) {
      task.sla = this.computeSLA(task.sla.dueAt, targetStatus, task.completedAt);
    }

    await this.repository.saveTask(task);

    const event: TaskTransitionEvent = {
      taskId: task.id,
      previousStatus,
      newStatus: targetStatus,
      actorId,
      timestamp: nowIso,
      coordinate,
      notes,
    };

    await this.repository.saveTransitionEvent(event);
    this.notifyListeners(event);

    return task;
  }

  /**
   * Spatial proximity arrival verification math
   */
  public verifySpatialProximity(task: Task, currentCoordinate?: Coordinate): boolean {
    const constraint = task.spatialConstraint;
    if (!constraint || !constraint.requireProximityArrival || !constraint.destinationCoordinate) {
      return true; // No spatial arrival restriction
    }

    if (!currentCoordinate || !Array.isArray(currentCoordinate) || currentCoordinate.length < 2) {
      throw new Error(`[TASKS_ENGINE:SPATIAL_VERIFICATION_FAILED] Task requires spatial proximity arrival verification, but no coordinate was provided`);
    }

    const distMeters = calculateDistance(currentCoordinate, constraint.destinationCoordinate);
    const radiusMeters = constraint.proximityRadiusMeters ?? 100; // Default 100m

    if (distMeters > radiusMeters) {
      throw new Error(`[TASKS_ENGINE:SPATIAL_VERIFICATION_FAILED] Assignee is ${Math.round(distMeters)}m away from task destination (allowed radius: ${radiusMeters}m)`);
    }

    return true;
  }

  /**
   * Bind dynamic FormSubmission ID to Task
   */
  public async bindFormSubmission(taskId: string, submissionId: string): Promise<Task> {
    const task = await this.repository.getTask(taskId);
    if (!task) {
      throw new Error(`[TASKS_ENGINE] Task '${taskId}' not found`);
    }
    task.formSubmissionId = submissionId;
    task.updatedAt = new Date().toISOString();
    await this.repository.saveTask(task);
    return task;
  }

  /**
   * Calculate SLA status for a task
   */
  public computeSLA(dueAtIso: string, status: TaskStatus, completedAtIso?: string): TaskSLAStatus {
    const dueTime = new Date(dueAtIso).getTime();
    const referenceTime = completedAtIso ? new Date(completedAtIso).getTime() : Date.now();
    const isOverdue = referenceTime > dueTime && status !== "COMPLETED";
    const completedOnTime = status === "COMPLETED" ? referenceTime <= dueTime : undefined;
    const timeRemainingSeconds = Math.round((dueTime - referenceTime) / 1000);

    return {
      dueAt: dueAtIso,
      isOverdue,
      completedOnTime,
      timeRemainingSeconds,
    };
  }

  public async listTasks(filter?: TaskFilterOptions): Promise<Task[]> {
    const tasks = await this.repository.listTasks(filter);
    // Refresh SLA status on read
    return tasks.map((t) => {
      if (t.sla?.dueAt) {
        t.sla = this.computeSLA(t.sla.dueAt, t.status, t.completedAt);
      }
      return t;
    });
  }
}
