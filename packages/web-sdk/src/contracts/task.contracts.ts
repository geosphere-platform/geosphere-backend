/**
 * GeoSphere Task & Assignment SDK Core Contracts
 * Framework-Neutral Versioned Templates, Lifecycle State Machine, Assignments, Scheduling, Location & Audit Engine
 */

export type GeoSphereTaskStatus =
  | "DRAFT"
  | "PENDING"
  | "ASSIGNED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "PAUSED"
  | "BLOCKED"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED";

export type GeoSphereTaskPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type GeoSphereTaskAssigneeType = "USER" | "ROLE" | "TEAM" | "GROUP" | "EXTERNAL";

export type GeoSphereTaskDependencyType = "TASK_DEPENDENCY" | "WORKFLOW_DEPENDENCY" | "EXTERNAL_DEPENDENCY";

export interface GeoSphereTaskTemplate {
  taskTemplateId: string;
  version: string;
  name: string;
  description?: string;
  defaultPriority?: GeoSphereTaskPriority;
  defaultDuration?: number;
  formReference?: { formId: string; version: string };
  workflowReference?: { workflowId: string; version: string };
  metadata?: Record<string, unknown>;
}

export interface GeoSphereTaskAssignment {
  assignmentId: string;
  assigneeId: string;
  assigneeType: GeoSphereTaskAssigneeType;
  assignedAt: string;
  assignedBy?: string;
}

export interface GeoSphereTaskSchedule {
  scheduledAt?: string;
  dueAt?: string;
  estimatedDuration?: number;
  startWindow?: string;
  endWindow?: string;
}

export interface GeoSphereTaskLocation {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  radiusMeters?: number;
  addressReference?: string;
  geofenceReference?: string;
}

export interface GeoSphereTaskProgress {
  percentage: number;
  completedSteps: number;
  totalSteps: number;
  estimatedRemainingDuration?: number;
}

export interface GeoSphereTaskDependency {
  dependencyId: string;
  type: GeoSphereTaskDependencyType;
  targetId: string;
  requiredStatus?: string;
  optional?: boolean;
}

export interface GeoSphereTaskComment {
  commentId: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GeoSphereTaskAttachment {
  attachmentId: string;
  taskId: string;
  fileName: string;
  mimeType: string;
  size: number;
  url?: string;
  createdAt: string;
}

export interface GeoSphereTaskActivity {
  activityId: string;
  taskId: string;
  type: string;
  actorId: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface GeoSphereTaskInstance {
  taskId: string;
  templateId?: string;
  templateVersion?: string;
  title: string;
  description?: string;
  status: GeoSphereTaskStatus;
  priority: GeoSphereTaskPriority;
  createdAt: string;
  updatedAt: string;
  dueAt?: string;
  startedAt?: string;
  completedAt?: string;
  assignment?: GeoSphereTaskAssignment;
  schedule?: GeoSphereTaskSchedule;
  location?: GeoSphereTaskLocation;
  progress?: GeoSphereTaskProgress;
  formReference?: { formId: string; version: string };
  workflowReference?: { workflowId: string; version: string };
  metadata?: Record<string, unknown>;
  versionNumber: number;
}

export type GeoSphereTaskCapability =
  | "TASK_LIFECYCLE"
  | "ASSIGNMENT_MANAGEMENT"
  | "SCHEDULE_TRACKING"
  | "LOCATION_INTEGRATION"
  | "MAP_VISUALIZATION"
  | "FORM_INTEGRATION"
  | "WORKFLOW_INTEGRATION"
  | "PROGRESS_TRACKING"
  | "COMMENTS_ATTACHMENTS"
  | "AUDIT_ACTIVITY"
  | "OFFLINE_SYNC"
  | "REALTIME_NOTIFICATIONS";

export interface GeoSphereTaskProviderInfo {
  name: string;
  version: string;
}

export interface GeoSphereTaskProvider {
  getProviderInfo(): GeoSphereTaskProviderInfo;
  getCapabilities(): GeoSphereTaskCapability[];
  createTask(taskData: Partial<GeoSphereTaskInstance>): Promise<GeoSphereTaskInstance>;
  getTask(taskId: string): Promise<GeoSphereTaskInstance>;
  listTasks(filter?: { status?: GeoSphereTaskStatus; assigneeId?: string }): Promise<GeoSphereTaskInstance[]>;
  updateTaskStatus(taskId: string, status: GeoSphereTaskStatus): Promise<GeoSphereTaskInstance>;
  assignTask(taskId: string, assigneeId: string, assigneeType: GeoSphereTaskAssigneeType): Promise<GeoSphereTaskInstance>;
  addComment(taskId: string, content: string, authorId: string): Promise<GeoSphereTaskComment>;
  getTaskActivity(taskId: string): Promise<GeoSphereTaskActivity[]>;
}

export class GeoSphereTaskError extends Error {
  constructor(
    public readonly code:
      | "TEMPLATE_INVALID"
      | "TASK_NOT_FOUND"
      | "STATUS_TRANSITION_INVALID"
      | "ASSIGNMENT_FAILED"
      | "PERMISSION_DENIED"
      | "CONCURRENCY_CONFLICT"
      | "DEPENDENCY_FAILED"
      | "UNKNOWN_ERROR",
    message: string,
    public readonly details?: unknown
  ) {
    super(`[TASK_ERROR:${code}] ${message}`);
    this.name = "GeoSphereTaskError";
  }
}

export class GeoSphereMockTaskProvider implements GeoSphereTaskProvider {
  private tasks = new Map<string, GeoSphereTaskInstance>();
  private comments = new Map<string, GeoSphereTaskComment[]>();
  private activities = new Map<string, GeoSphereTaskActivity[]>();

  constructor() {
    const seedTask: GeoSphereTaskInstance = {
      taskId: "task_seed_001",
      title: "Generic Asset Maintenance Task",
      description: "Standard data collection & maintenance assignment.",
      status: "ASSIGNED",
      priority: "HIGH",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 86400000).toISOString(),
      assignment: {
        assignmentId: "asgn_seed_01",
        assigneeId: "user_field_01",
        assigneeType: "USER",
        assignedAt: new Date().toISOString()
      },
      location: {
        latitude: 21.1458,
        longitude: 79.0882,
        addressReference: "Nagpur, Maharashtra, India"
      },
      progress: {
        percentage: 25,
        completedSteps: 1,
        totalSteps: 4
      },
      versionNumber: 1
    };
    this.tasks.set(seedTask.taskId, seedTask);
  }

  public getProviderInfo(): GeoSphereTaskProviderInfo {
    return { name: "GeoSphereMockTaskProvider", version: "1.0.0" };
  }

  public getCapabilities(): GeoSphereTaskCapability[] {
    return [
      "TASK_LIFECYCLE",
      "ASSIGNMENT_MANAGEMENT",
      "SCHEDULE_TRACKING",
      "LOCATION_INTEGRATION",
      "MAP_VISUALIZATION",
      "FORM_INTEGRATION",
      "WORKFLOW_INTEGRATION",
      "PROGRESS_TRACKING",
      "COMMENTS_ATTACHMENTS",
      "AUDIT_ACTIVITY",
      "OFFLINE_SYNC",
      "REALTIME_NOTIFICATIONS"
    ];
  }

  public async createTask(taskData: Partial<GeoSphereTaskInstance>): Promise<GeoSphereTaskInstance> {
    const nowIso = new Date().toISOString();
    const task: GeoSphereTaskInstance = {
      taskId: `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: taskData.title || "Untitled Task",
      description: taskData.description,
      status: taskData.status || "PENDING",
      priority: taskData.priority || "NORMAL",
      createdAt: nowIso,
      updatedAt: nowIso,
      dueAt: taskData.dueAt,
      assignment: taskData.assignment,
      location: taskData.location,
      progress: taskData.progress || { percentage: 0, completedSteps: 0, totalSteps: 1 },
      versionNumber: 1
    };
    this.tasks.set(task.taskId, task);
    this.recordActivity(task.taskId, "TASK_CREATED", "system", { status: task.status });
    return JSON.parse(JSON.stringify(task));
  }

  public async getTask(taskId: string): Promise<GeoSphereTaskInstance> {
    const task = this.tasks.get(taskId);
    if (!task) throw new GeoSphereTaskError("TASK_NOT_FOUND", `Task ID ${taskId} not found.`);
    return JSON.parse(JSON.stringify(task));
  }

  public async listTasks(filter?: { status?: GeoSphereTaskStatus; assigneeId?: string }): Promise<GeoSphereTaskInstance[]> {
    let list = Array.from(this.tasks.values());
    if (filter?.status) list = list.filter((t) => t.status === filter.status);
    if (filter?.assigneeId) list = list.filter((t) => t.assignment?.assigneeId === filter.assigneeId);
    return JSON.parse(JSON.stringify(list));
  }

  public async updateTaskStatus(taskId: string, status: GeoSphereTaskStatus): Promise<GeoSphereTaskInstance> {
    const task = this.tasks.get(taskId);
    if (!task) throw new GeoSphereTaskError("TASK_NOT_FOUND", `Task ID ${taskId} not found.`);

    const prevStatus = task.status;
    const nowIso = new Date().toISOString();
    task.status = status;
    task.updatedAt = nowIso;
    task.versionNumber += 1;

    if (status === "IN_PROGRESS" && !task.startedAt) task.startedAt = nowIso;
    if (status === "COMPLETED") {
      task.completedAt = nowIso;
      if (task.progress) task.progress.percentage = 100;
    }

    this.recordActivity(taskId, "STATUS_CHANGED", "user", { fromStatus: prevStatus, toStatus: status });
    return JSON.parse(JSON.stringify(task));
  }

  public async assignTask(taskId: string, assigneeId: string, assigneeType: GeoSphereTaskAssigneeType): Promise<GeoSphereTaskInstance> {
    const task = this.tasks.get(taskId);
    if (!task) throw new GeoSphereTaskError("TASK_NOT_FOUND", `Task ID ${taskId} not found.`);

    const prevAssignee = task.assignment?.assigneeId;
    const nowIso = new Date().toISOString();

    task.assignment = {
      assignmentId: `asgn_${Date.now()}`,
      assigneeId,
      assigneeType,
      assignedAt: nowIso
    };
    if (task.status === "PENDING" || task.status === "DRAFT") {
      task.status = "ASSIGNED";
    }
    task.updatedAt = nowIso;
    task.versionNumber += 1;

    this.recordActivity(taskId, "ASSIGNMENT_CHANGED", "user", { prevAssignee, newAssignee: assigneeId });
    return JSON.parse(JSON.stringify(task));
  }

  public async addComment(taskId: string, content: string, authorId: string): Promise<GeoSphereTaskComment> {
    const comment: GeoSphereTaskComment = {
      commentId: `cmt_${Date.now()}`,
      taskId,
      authorId,
      content,
      createdAt: new Date().toISOString()
    };
    const list = this.comments.get(taskId) || [];
    list.push(comment);
    this.comments.set(taskId, list);

    this.recordActivity(taskId, "COMMENT_ADDED", authorId, { commentId: comment.commentId });
    return JSON.parse(JSON.stringify(comment));
  }

  public async getTaskActivity(taskId: string): Promise<GeoSphereTaskActivity[]> {
    return this.activities.get(taskId) || [];
  }

  private recordActivity(taskId: string, type: string, actorId: string, details?: Record<string, unknown>): void {
    const list = this.activities.get(taskId) || [];
    list.push({
      activityId: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      taskId,
      type,
      actorId,
      timestamp: new Date().toISOString(),
      details
    });
    this.activities.set(taskId, list);
  }
}

export interface GeoSphereTaskConfig {
  embeddedMode?: boolean;
}

export class GeoSphereTaskSDK {
  private provider: GeoSphereTaskProvider;
  private listeners: Map<string, (event: { type: string; payload: unknown }) => void> = new Map();

  constructor(
    private config: GeoSphereTaskConfig = {},
    provider?: GeoSphereTaskProvider
  ) {
    this.provider = provider || new GeoSphereMockTaskProvider();
  }

  public async initialize(): Promise<void> {}

  public getProviderInfo(): GeoSphereTaskProviderInfo {
    return this.provider.getProviderInfo();
  }

  public getCapabilities(): GeoSphereTaskCapability[] {
    return this.provider.getCapabilities();
  }

  public hasCapability(capability: GeoSphereTaskCapability): boolean {
    return this.getCapabilities().includes(capability);
  }

  public async createTask(taskData: Partial<GeoSphereTaskInstance>): Promise<GeoSphereTaskInstance> {
    const task = await this.provider.createTask(taskData);
    this.notifyListeners("tasks.created", { task });
    return task;
  }

  public async getTask(taskId: string): Promise<GeoSphereTaskInstance> {
    return this.provider.getTask(taskId);
  }

  public async listTasks(filter?: { status?: GeoSphereTaskStatus; assigneeId?: string }): Promise<GeoSphereTaskInstance[]> {
    return this.provider.listTasks(filter);
  }

  public async updateTaskStatus(taskId: string, status: GeoSphereTaskStatus): Promise<GeoSphereTaskInstance> {
    const task = await this.provider.updateTaskStatus(taskId, status);
    this.notifyListeners("tasks.statusChanged", { task });
    return task;
  }

  public async assignTask(taskId: string, assigneeId: string, assigneeType: GeoSphereTaskAssigneeType): Promise<GeoSphereTaskInstance> {
    const task = await this.provider.assignTask(taskId, assigneeId, assigneeType);
    this.notifyListeners("tasks.assigned", { task });
    return task;
  }

  public async addComment(taskId: string, content: string, authorId: string): Promise<GeoSphereTaskComment> {
    const cmt = await this.provider.addComment(taskId, content, authorId);
    this.notifyListeners("tasks.commentAdded", { comment: cmt });
    return cmt;
  }

  public async getTaskActivity(taskId: string): Promise<GeoSphereTaskActivity[]> {
    return this.provider.getTaskActivity(taskId);
  }

  // Embedded Mode Presentation Methods
  public presentTask(taskId: string): { componentId: string; props: { taskId: string } } {
    return { componentId: "tasks.detail-screen", props: { taskId } };
  }

  public presentTaskList(): { componentId: string; props: {} } {
    return { componentId: "tasks.list-screen", props: {} };
  }

  public presentTaskMap(): { componentId: string; props: {} } {
    return { componentId: "tasks.map-screen", props: {} };
  }

  public subscribe(onEvent: (event: { type: string; payload: unknown }) => void): { id: string; unsubscribe: () => void } {
    const subId = `task_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.listeners.set(subId, onEvent);
    return {
      id: subId,
      unsubscribe: () => {
        this.listeners.delete(subId);
      }
    };
  }

  public destroy(): void {
    this.listeners.clear();
  }

  private notifyListeners(type: string, payload: unknown): void {
    this.listeners.forEach((listener) => {
      try {
        listener({ type, payload });
      } catch (err) {
        console.error("[TASK_LISTENER_ERROR] Listener error:", err);
      }
    });
  }
}
