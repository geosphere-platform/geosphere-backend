/**
 * GeoSphere Core Tasks & Workflow Engine — Framework-Independent Domain Models
 *
 * Defines pure TypeScript models for task status, priority, workflow steps, assignments,
 * spatial verification constraints, SLA tracking, task payloads, and transition events.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, Android/iOS UI, database ORMs, or vehicle PII.
 */

import { Coordinate } from "../../gis/types/geometry";

export type TaskStatus =
  | "ASSIGNED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TaskAssignment {
  assigneeId: string; // Generic user, agent, driver, employee, or field worker ID
  assigneeName?: string;
  assignedAt: string; // ISO 8601 UTC
}

export interface TaskWorkflowStep {
  id: string;
  title: string;
  description?: string;
  required: boolean;
  completed: boolean;
  completedAt?: string;
}

export interface TaskSpatialConstraint {
  destinationCoordinate?: Coordinate;
  geofenceId?: string;
  proximityRadiusMeters?: number; // e.g. 50 meters arrival verification
  requireProximityArrival?: boolean;
}

export interface TaskSLAStatus {
  dueAt?: string; // ISO 8601 UTC
  isOverdue: boolean;
  completedOnTime?: boolean;
  timeRemainingSeconds?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignment?: TaskAssignment;
  spatialConstraint?: TaskSpatialConstraint;
  workflowSteps?: TaskWorkflowStep[];
  formSchemaId?: string; // Optional dynamic form binding
  formSubmissionId?: string; // Optional completed form binding
  sla?: TaskSLAStatus;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface TaskTransitionEvent {
  taskId: string;
  previousStatus: TaskStatus;
  newStatus: TaskStatus;
  actorId: string;
  timestamp: string; // ISO 8601 UTC
  coordinate?: Coordinate;
  notes?: string;
}

export type TaskTransitionListener = (event: TaskTransitionEvent) => void;
