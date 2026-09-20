/**
 * GeoSphere Core Notification & Alert Engine — Framework-Independent Domain Models
 *
 * Defines pure TypeScript models for notification alerts, severities, channels, alert rules,
 * templates, dispatch results, in-app alert status, and typed errors.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, Android/iOS UI, database ORMs, or vehicle PII.
 */

import { Coordinate } from "../../gis/types/geometry";

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL" | "EMERGENCY";

export type NotificationChannel = "PUSH" | "EMAIL" | "SMS" | "WEBHOOK" | "IN_APP";

export interface NotificationTemplate {
  titleTemplate: string; // e.g. "Geofence {{eventType}}: {{subjectId}}"
  bodyTemplate: string;  // e.g. "{{subjectId}} {{eventType}} geofence {{geofenceId}} at {{timestamp}}"
}

export interface AlertRule {
  id: string;
  name: string;
  eventType: string; // e.g. "GEOFENCE_ENTER", "GEOFENCE_EXIT", "SPEED_EXCEEDED", "TASK_OVERDUE"
  severity: AlertSeverity;
  channels: NotificationChannel[];
  template: NotificationTemplate;
  rateLimitSeconds?: number; // Deduplication window
  enabled: boolean;
  metadata?: Record<string, unknown>;
}

export interface NotificationAlert {
  id: string;
  ruleId?: string;
  eventType: string;
  severity: AlertSeverity;
  title: string;
  body: string;
  recipientId: string; // Generic user, agent, employee, or tenant ID
  channel: NotificationChannel;
  coordinate?: Coordinate;
  read?: boolean; // Used for IN_APP notifications
  readAt?: string; // ISO 8601 UTC
  createdAt: string; // ISO 8601 UTC
  metadata?: Record<string, unknown>;
}

export interface NotificationDispatchResult {
  alertId: string;
  channel: NotificationChannel;
  success: boolean;
  dispatchedAt: string; // ISO 8601 UTC
  error?: string;
}

export type NotificationErrorCode =
  | "INVALID_ALERT"
  | "RULE_NOT_FOUND"
  | "UNSUPPORTED_CHANNEL"
  | "RATE_LIMITED"
  | "TEMPLATE_ERROR"
  | "DISPATCH_FAILED";

export class NotificationError extends Error {
  constructor(
    public readonly code: NotificationErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(`[NOTIFICATION_ERROR:${code}] ${message}`);
    this.name = "NotificationError";
  }
}

export type NotificationAlertListener = (alert: NotificationAlert) => void;
