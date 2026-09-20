/**
 * GeoSphere Task & Assignment SDK Core Contracts
 * Framework-Neutral Versioned Templates, Lifecycle State Machine, Assignments, Scheduling, Location & Audit Engine
 */
export class GeoSphereTaskError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(`[TASK_ERROR:${code}] ${message}`);
        this.code = code;
        this.details = details;
        this.name = "GeoSphereTaskError";
    }
}
export class GeoSphereMockTaskProvider {
    tasks = new Map();
    comments = new Map();
    activities = new Map();
    constructor() {
        const seedTask = {
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
    getProviderInfo() {
        return { name: "GeoSphereMockTaskProvider", version: "1.0.0" };
    }
    getCapabilities() {
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
    async createTask(taskData) {
        const nowIso = new Date().toISOString();
        const task = {
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
    async getTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task)
            throw new GeoSphereTaskError("TASK_NOT_FOUND", `Task ID ${taskId} not found.`);
        return JSON.parse(JSON.stringify(task));
    }
    async listTasks(filter) {
        let list = Array.from(this.tasks.values());
        if (filter?.status)
            list = list.filter((t) => t.status === filter.status);
        if (filter?.assigneeId)
            list = list.filter((t) => t.assignment?.assigneeId === filter.assigneeId);
        return JSON.parse(JSON.stringify(list));
    }
    async updateTaskStatus(taskId, status) {
        const task = this.tasks.get(taskId);
        if (!task)
            throw new GeoSphereTaskError("TASK_NOT_FOUND", `Task ID ${taskId} not found.`);
        const prevStatus = task.status;
        const nowIso = new Date().toISOString();
        task.status = status;
        task.updatedAt = nowIso;
        task.versionNumber += 1;
        if (status === "IN_PROGRESS" && !task.startedAt)
            task.startedAt = nowIso;
        if (status === "COMPLETED") {
            task.completedAt = nowIso;
            if (task.progress)
                task.progress.percentage = 100;
        }
        this.recordActivity(taskId, "STATUS_CHANGED", "user", { fromStatus: prevStatus, toStatus: status });
        return JSON.parse(JSON.stringify(task));
    }
    async assignTask(taskId, assigneeId, assigneeType) {
        const task = this.tasks.get(taskId);
        if (!task)
            throw new GeoSphereTaskError("TASK_NOT_FOUND", `Task ID ${taskId} not found.`);
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
    async addComment(taskId, content, authorId) {
        const comment = {
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
    async getTaskActivity(taskId) {
        return this.activities.get(taskId) || [];
    }
    recordActivity(taskId, type, actorId, details) {
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
export class GeoSphereTaskSDK {
    config;
    provider;
    listeners = new Map();
    constructor(config = {}, provider) {
        this.config = config;
        this.provider = provider || new GeoSphereMockTaskProvider();
    }
    async initialize() { }
    getProviderInfo() {
        return this.provider.getProviderInfo();
    }
    getCapabilities() {
        return this.provider.getCapabilities();
    }
    hasCapability(capability) {
        return this.getCapabilities().includes(capability);
    }
    async createTask(taskData) {
        const task = await this.provider.createTask(taskData);
        this.notifyListeners("tasks.created", { task });
        return task;
    }
    async getTask(taskId) {
        return this.provider.getTask(taskId);
    }
    async listTasks(filter) {
        return this.provider.listTasks(filter);
    }
    async updateTaskStatus(taskId, status) {
        const task = await this.provider.updateTaskStatus(taskId, status);
        this.notifyListeners("tasks.statusChanged", { task });
        return task;
    }
    async assignTask(taskId, assigneeId, assigneeType) {
        const task = await this.provider.assignTask(taskId, assigneeId, assigneeType);
        this.notifyListeners("tasks.assigned", { task });
        return task;
    }
    async addComment(taskId, content, authorId) {
        const cmt = await this.provider.addComment(taskId, content, authorId);
        this.notifyListeners("tasks.commentAdded", { comment: cmt });
        return cmt;
    }
    async getTaskActivity(taskId) {
        return this.provider.getTaskActivity(taskId);
    }
    // Embedded Mode Presentation Methods
    presentTask(taskId) {
        return { componentId: "tasks.detail-screen", props: { taskId } };
    }
    presentTaskList() {
        return { componentId: "tasks.list-screen", props: {} };
    }
    presentTaskMap() {
        return { componentId: "tasks.map-screen", props: {} };
    }
    subscribe(onEvent) {
        const subId = `task_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        this.listeners.set(subId, onEvent);
        return {
            id: subId,
            unsubscribe: () => {
                this.listeners.delete(subId);
            }
        };
    }
    destroy() {
        this.listeners.clear();
    }
    notifyListeners(type, payload) {
        this.listeners.forEach((listener) => {
            try {
                listener({ type, payload });
            }
            catch (err) {
                console.error("[TASK_LISTENER_ERROR] Listener error:", err);
            }
        });
    }
}
//# sourceMappingURL=task.contracts.js.map