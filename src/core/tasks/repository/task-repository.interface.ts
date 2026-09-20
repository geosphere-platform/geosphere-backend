/**
 * Framework-Independent Task Repository Abstraction
 *
 * Defines the interface for querying and persisting Tasks and TaskTransitionEvents.
 * Provides a pure in-memory repository implementation for headless execution and unit tests.
 */

import { Task, TaskStatus, TaskPriority, TaskTransitionEvent } from "../types/task.types";

export interface TaskFilterOptions {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  isOverdue?: boolean;
}

export interface ITaskRepository {
  saveTask(task: Task): Promise<void>;
  getTask(id: string): Promise<Task | null>;
  listTasks(filter?: TaskFilterOptions): Promise<Task[]>;
  saveTransitionEvent(event: TaskTransitionEvent): Promise<void>;
  listTransitionEvents(taskId: string): Promise<TaskTransitionEvent[]>;
  clear(): Promise<void>;
}

export class InMemoryTaskRepository implements ITaskRepository {
  private readonly tasks = new Map<string, Task>();
  private readonly events: TaskTransitionEvent[] = [];

  async saveTask(task: Task): Promise<void> {
    this.tasks.set(task.id, { ...task });
  }

  async getTask(id: string): Promise<Task | null> {
    const t = this.tasks.get(id);
    return t ? { ...t } : null;
  }

  async listTasks(filter?: TaskFilterOptions): Promise<Task[]> {
    let result = Array.from(this.tasks.values());

    if (filter?.status) {
      result = result.filter((t) => t.status === filter.status);
    }
    if (filter?.priority) {
      result = result.filter((t) => t.priority === filter.priority);
    }
    if (filter?.assigneeId) {
      result = result.filter((t) => t.assignment?.assigneeId === filter.assigneeId);
    }
    if (filter?.isOverdue !== undefined) {
      result = result.filter((t) => t.sla?.isOverdue === filter.isOverdue);
    }

    return result.map((t) => ({ ...t }));
  }

  async saveTransitionEvent(event: TaskTransitionEvent): Promise<void> {
    this.events.push({ ...event });
  }

  async listTransitionEvents(taskId: string): Promise<TaskTransitionEvent[]> {
    return this.events
      .filter((e) => e.taskId === taskId)
      .map((e) => ({ ...e }));
  }

  async clear(): Promise<void> {
    this.tasks.clear();
    this.events.length = 0;
  }
}
