/**
 * GeoSphere Task & Assignment SDK Core Contracts
 * Framework-Neutral Versioned Templates, Lifecycle State Machine, Assignments, Scheduling, Location & Audit Engine
 */
export type GeoSphereTaskStatus = "DRAFT" | "PENDING" | "ASSIGNED" | "ACCEPTED" | "IN_PROGRESS" | "PAUSED" | "BLOCKED" | "COMPLETED" | "CANCELLED" | "FAILED";
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
    formReference?: {
        formId: string;
        version: string;
    };
    workflowReference?: {
        workflowId: string;
        version: string;
    };
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
    formReference?: {
        formId: string;
        version: string;
    };
    workflowReference?: {
        workflowId: string;
        version: string;
    };
    metadata?: Record<string, unknown>;
    versionNumber: number;
}
export type GeoSphereTaskCapability = "TASK_LIFECYCLE" | "ASSIGNMENT_MANAGEMENT" | "SCHEDULE_TRACKING" | "LOCATION_INTEGRATION" | "MAP_VISUALIZATION" | "FORM_INTEGRATION" | "WORKFLOW_INTEGRATION" | "PROGRESS_TRACKING" | "COMMENTS_ATTACHMENTS" | "AUDIT_ACTIVITY" | "OFFLINE_SYNC" | "REALTIME_NOTIFICATIONS";
export interface GeoSphereTaskProviderInfo {
    name: string;
    version: string;
}
export interface GeoSphereTaskProvider {
    getProviderInfo(): GeoSphereTaskProviderInfo;
    getCapabilities(): GeoSphereTaskCapability[];
    createTask(taskData: Partial<GeoSphereTaskInstance>): Promise<GeoSphereTaskInstance>;
    getTask(taskId: string): Promise<GeoSphereTaskInstance>;
    listTasks(filter?: {
        status?: GeoSphereTaskStatus;
        assigneeId?: string;
    }): Promise<GeoSphereTaskInstance[]>;
    updateTaskStatus(taskId: string, status: GeoSphereTaskStatus): Promise<GeoSphereTaskInstance>;
    assignTask(taskId: string, assigneeId: string, assigneeType: GeoSphereTaskAssigneeType): Promise<GeoSphereTaskInstance>;
    addComment(taskId: string, content: string, authorId: string): Promise<GeoSphereTaskComment>;
    getTaskActivity(taskId: string): Promise<GeoSphereTaskActivity[]>;
}
export declare class GeoSphereTaskError extends Error {
    readonly code: "TEMPLATE_INVALID" | "TASK_NOT_FOUND" | "STATUS_TRANSITION_INVALID" | "ASSIGNMENT_FAILED" | "PERMISSION_DENIED" | "CONCURRENCY_CONFLICT" | "DEPENDENCY_FAILED" | "UNKNOWN_ERROR";
    readonly details?: unknown | undefined;
    constructor(code: "TEMPLATE_INVALID" | "TASK_NOT_FOUND" | "STATUS_TRANSITION_INVALID" | "ASSIGNMENT_FAILED" | "PERMISSION_DENIED" | "CONCURRENCY_CONFLICT" | "DEPENDENCY_FAILED" | "UNKNOWN_ERROR", message: string, details?: unknown | undefined);
}
export declare class GeoSphereMockTaskProvider implements GeoSphereTaskProvider {
    private tasks;
    private comments;
    private activities;
    constructor();
    getProviderInfo(): GeoSphereTaskProviderInfo;
    getCapabilities(): GeoSphereTaskCapability[];
    createTask(taskData: Partial<GeoSphereTaskInstance>): Promise<GeoSphereTaskInstance>;
    getTask(taskId: string): Promise<GeoSphereTaskInstance>;
    listTasks(filter?: {
        status?: GeoSphereTaskStatus;
        assigneeId?: string;
    }): Promise<GeoSphereTaskInstance[]>;
    updateTaskStatus(taskId: string, status: GeoSphereTaskStatus): Promise<GeoSphereTaskInstance>;
    assignTask(taskId: string, assigneeId: string, assigneeType: GeoSphereTaskAssigneeType): Promise<GeoSphereTaskInstance>;
    addComment(taskId: string, content: string, authorId: string): Promise<GeoSphereTaskComment>;
    getTaskActivity(taskId: string): Promise<GeoSphereTaskActivity[]>;
    private recordActivity;
}
export interface GeoSphereTaskConfig {
    embeddedMode?: boolean;
}
export declare class GeoSphereTaskSDK {
    private config;
    private provider;
    private listeners;
    constructor(config?: GeoSphereTaskConfig, provider?: GeoSphereTaskProvider);
    initialize(): Promise<void>;
    getProviderInfo(): GeoSphereTaskProviderInfo;
    getCapabilities(): GeoSphereTaskCapability[];
    hasCapability(capability: GeoSphereTaskCapability): boolean;
    createTask(taskData: Partial<GeoSphereTaskInstance>): Promise<GeoSphereTaskInstance>;
    getTask(taskId: string): Promise<GeoSphereTaskInstance>;
    listTasks(filter?: {
        status?: GeoSphereTaskStatus;
        assigneeId?: string;
    }): Promise<GeoSphereTaskInstance[]>;
    updateTaskStatus(taskId: string, status: GeoSphereTaskStatus): Promise<GeoSphereTaskInstance>;
    assignTask(taskId: string, assigneeId: string, assigneeType: GeoSphereTaskAssigneeType): Promise<GeoSphereTaskInstance>;
    addComment(taskId: string, content: string, authorId: string): Promise<GeoSphereTaskComment>;
    getTaskActivity(taskId: string): Promise<GeoSphereTaskActivity[]>;
    presentTask(taskId: string): {
        componentId: string;
        props: {
            taskId: string;
        };
    };
    presentTaskList(): {
        componentId: string;
        props: {};
    };
    presentTaskMap(): {
        componentId: string;
        props: {};
    };
    subscribe(onEvent: (event: {
        type: string;
        payload: unknown;
    }) => void): {
        id: string;
        unsubscribe: () => void;
    };
    destroy(): void;
    private notifyListeners;
}
//# sourceMappingURL=task.contracts.d.ts.map