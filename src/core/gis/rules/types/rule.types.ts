/**
 * Types & Interfaces — Generic GIS Rules, Automation & Workflow Engine
 * Strictly business-agnostic domain interfaces.
 */

import { Geometry, PointGeometry } from "../../types/geometry";

export type RuleStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type ExecutionPolicy =
  "ALLOW_CONCURRENT" | "DISALLOW_CONCURRENT" | "COALESCE" | "SKIP_IF_RUNNING";

export type ActionFailurePolicy = "STOP_ON_FAILURE" | "CONTINUE_ON_FAILURE";

export type TriggerType =
  | "LOCATION_UPDATED"
  | "SPATIAL_ENTER"
  | "SPATIAL_EXIT"
  | "SPATIAL_PROXIMITY_ENTER"
  | "SPATIAL_PROXIMITY_EXIT"
  | "SPATIAL_EVENT"
  | "SCHEDULED"
  | "MANUAL";

export type StandardOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "GREATER_THAN"
  | "GREATER_THAN_OR_EQUAL"
  | "LESS_THAN"
  | "LESS_THAN_OR_EQUAL"
  | "CONTAINS"
  | "NOT_CONTAINS"
  | "STARTS_WITH"
  | "ENDS_WITH"
  | "IN"
  | "NOT_IN"
  | "IS_NULL"
  | "IS_NOT_NULL";

export type SpatialOperator =
  | "WITHIN"
  | "CONTAINS"
  | "INTERSECTS"
  | "TOUCHES"
  | "OVERLAPS"
  | "CROSSES"
  | "DISJOINT"
  | "WITHIN_DISTANCE"
  | "NEAREST";

export type TemporalOperator =
  | "BEFORE"
  | "AFTER"
  | "BETWEEN"
  | "DURATION_GREATER_THAN"
  | "DURATION_LESS_THAN";

export type RuleOperator =
  StandardOperator | SpatialOperator | TemporalOperator;

export type LogicalOperator = "AND" | "OR" | "NOT";

export interface AtomicCondition {
  type: "atomic";
  field: string; // e.g. "subject.type", "location.speed", "geofence.id", "attributes.category"
  operator: RuleOperator;
  value?: unknown; // Target value or threshold
  unit?: string; // Optional unit e.g. "meters", "seconds", "km/h"
  spatialTarget?: Geometry; // Geometry object for spatial comparison if field uses inline geometry
}

export interface ConditionGroup {
  type: "group";
  logical: LogicalOperator;
  conditions: Array<AtomicCondition | ConditionGroup>;
}

export type RuleCondition = AtomicCondition | ConditionGroup;

export type ActionType =
  | "CREATE_ALERT"
  | "CREATE_TASK"
  | "SEND_NOTIFICATION"
  | "SEND_WEBHOOK"
  | "CREATE_EVENT"
  | "LOG_EVENT"
  | "UPDATE_STATE";

export type AlertSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type NotificationChannel = "EMAIL" | "PUSH" | "SMS" | "WEBHOOK";

export interface CreateAlertActionPayload {
  severity: AlertSeverity;
  title: string;
  message: string;
  subjectId?: string;
  subjectType?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateTaskActionPayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignedTo?: string;
  dueInSeconds?: number;
  metadata?: Record<string, unknown>;
}

export interface SendNotificationActionPayload {
  channels: NotificationChannel[];
  recipients: string[];
  subject: string;
  body: string;
  templateId?: string;
  metadata?: Record<string, unknown>;
}

export interface SendWebhookActionPayload {
  url: string;
  method?: "POST" | "PUT" | "PATCH";
  headers?: Record<string, string>;
  timeoutMs?: number;
  maxAttempts?: number;
  metadata?: Record<string, unknown>;
}

export interface CreateEventActionPayload {
  type: string;
  metadata?: Record<string, unknown>;
}

export interface LogEventActionPayload {
  level: "info" | "warn" | "error";
  message: string;
}

export interface UpdateStateActionPayload {
  key: string;
  value: unknown;
}

export interface RuleAction {
  id: string;
  type: ActionType;
  order: number;
  payload:
    | CreateAlertActionPayload
    | CreateTaskActionPayload
    | SendNotificationActionPayload
    | SendWebhookActionPayload
    | CreateEventActionPayload
    | LogEventActionPayload
    | UpdateStateActionPayload
    | Record<string, unknown>;
}

export interface RuleScope {
  layerId?: string;
  geofenceId?: string;
  subjectType?: string;
  subjectId?: string;
}

export interface RuleConfiguration {
  trigger: {
    type: TriggerType;
    eventTypes?: string[];
  };
  scope?: RuleScope;
  conditions: ConditionGroup;
  actions: RuleAction[];
  executionPolicy?: ExecutionPolicy;
  cooldownSeconds?: number;
  debounceSeconds?: number;
  actionFailurePolicy?: ActionFailurePolicy;
  maxRetries?: number;
}

export interface SpatialRule {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  status: RuleStatus;
  priority: number;
  triggerType: TriggerType;
  scope: RuleScope;
  currentVersion: number;
  executionPolicy: ExecutionPolicy;
  cooldownSeconds: number;
  debounceSeconds: number;
  actionFailurePolicy: ActionFailurePolicy;
  maxRetries: number;
  scheduleCron?: string | null;
  nextScheduledAt?: string | null;
  lastExecutedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RuleVersion {
  id: string;
  ruleId: string;
  tenantId: string;
  version: number;
  configuration: RuleConfiguration;
  createdBy?: string | null;
  createdAt: string;
}

export type ExecutionStatus =
  "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "SKIPPED";

export interface RuleExecution {
  id: string;
  tenantId: string;
  ruleId: string;
  ruleVersion: number;
  triggerType: TriggerType;
  triggerEventId: string;
  subjectId?: string | null;
  status: ExecutionStatus;
  parentExecutionId?: string | null;
  automationDepth: number;
  startedAt: string;
  completedAt?: string | null;
  error?: string | null;
  metadata: Record<string, unknown>;
}

export type ActionJobStatus =
  "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "DEAD_LETTER";

export interface ActionJob {
  id: string;
  tenantId: string;
  executionId: string;
  actionType: ActionType;
  actionPayload: Record<string, unknown>;
  status: ActionJobStatus;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string | null;
  nextAttemptAt: string;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlertRecord {
  id: string;
  tenantId: string;
  ruleId?: string | null;
  ruleVersion?: number | null;
  severity: AlertSeverity;
  title: string;
  message: string;
  subjectId?: string | null;
  subjectType?: string | null;
  geometry?: Geometry | null;
  status: AlertStatus;
  acknowledgedBy?: string | null;
  acknowledgedAt?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TaskRecord {
  id: string;
  tenantId: string;
  sourceRuleId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string | null;
  dueAt?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RuleContext {
  event?: {
    id?: string;
    type: string;
    timestamp: string;
    source?: string;
    metadata?: Record<string, unknown>;
  };
  subject?: {
    id: string;
    type: string;
    externalId?: string;
    name?: string;
    active?: boolean;
    attributes?: Record<string, unknown>;
  };
  location?: {
    latitude: number;
    longitude: number;
    coordinate?: [number, number];
    speed?: number | null;
    heading?: number | null;
    accuracy?: number | null;
    geometry?: PointGeometry;
    timestamp?: string;
  };
  geofence?: {
    id: string;
    name: string;
    geometry?: Geometry;
    state?: string; // INSIDE, OUTSIDE, BOUNDARY
    previousState?: string;
    transition?: string; // ENTER, EXIT
  };
  distance?: number;
  timestamp: string;
  attributes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  automationDepth?: number;
  parentExecutionId?: string;
}

export interface DryRunInput {
  ruleId?: string;
  configuration: RuleConfiguration;
  context: RuleContext;
}

export interface ConditionEvaluationResult {
  conditionIndex: number;
  field: string;
  operator: RuleOperator;
  expectedValue?: unknown;
  actualValue?: unknown;
  matched: boolean;
  reason?: string;
}

export interface DryRunResult {
  ruleMatched: boolean;
  triggerMatched: boolean;
  scopeMatched: boolean;
  conditionResults: ConditionEvaluationResult[];
  actionsWouldExecute: RuleAction[];
  executionTimeMs: number;
}

export interface RuleOperationalMetrics {
  totalEvaluated: number;
  totalMatched: number;
  totalSuccess: number;
  totalFailed: number;
  totalSkipped: number;
  averageDurationMs: number;
  pendingJobs: number;
  failedJobs: number;
}
