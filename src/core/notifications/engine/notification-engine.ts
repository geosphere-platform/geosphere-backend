/**
 * Framework-Independent NotificationEngine Class
 *
 * Provides alert rule evaluation, rate limiting & deduplication, multi-channel dispatching,
 * in-app notification queues, template variable interpolation, and real-time alert broadcasting.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, Android/iOS UI, or vehicle PII.
 */

import { Coordinate } from "../../gis/types/geometry";
import {
  NotificationAlert,
  AlertRule,
  NotificationChannel,
  NotificationDispatchResult,
  NotificationAlertListener,
  NotificationError,
} from "../types/notification.types";
import { INotificationChannelAdapter, MockNotificationChannelAdapter } from "../channel/notification-channel.interface";

export class NotificationEngine {
  private readonly rules = new Map<string, AlertRule>();
  private readonly channelAdapters = new Map<NotificationChannel, INotificationChannelAdapter>();
  private readonly inAppAlerts: NotificationAlert[] = [];
  private readonly rateLimitCache = new Map<string, number>(); // Key -> timestamp ms
  private readonly alertListeners = new Set<NotificationAlertListener>();

  constructor() {
    // Default register mock adapters for all 5 channels
    const channels: NotificationChannel[] = ["PUSH", "EMAIL", "SMS", "WEBHOOK", "IN_APP"];
    channels.forEach((ch) => this.registerChannelAdapter(new MockNotificationChannelAdapter(ch)));
  }

  public registerChannelAdapter(adapter: INotificationChannelAdapter): void {
    this.channelAdapters.set(adapter.channel, adapter);
  }

  public getChannelAdapter(channel: NotificationChannel): INotificationChannelAdapter | undefined {
    return this.channelAdapters.get(channel);
  }

  public registerRule(rule: AlertRule): void {
    if (!rule || !rule.id || !rule.eventType || !Array.isArray(rule.channels)) {
      throw new Error("[NOTIFICATION_ENGINE] Invalid AlertRule definition");
    }
    this.rules.set(rule.id, { ...rule });
  }

  public getRule(id: string): AlertRule | undefined {
    return this.rules.get(id);
  }

  public subscribeAlerts(listener: NotificationAlertListener): () => void {
    this.alertListeners.add(listener);
    return () => this.alertListeners.delete(listener);
  }

  private notifyAlertListeners(alert: NotificationAlert): void {
    for (const listener of this.alertListeners) {
      try {
        listener(alert);
      } catch (err) {
        console.error("[NOTIFICATION-ENGINE:ERR] Alert listener error:", err);
      }
    }
  }

  /**
   * String interpolation for templates: {{variable}} -> value
   */
  public interpolateTemplate(templateStr: string, variables: Record<string, unknown>): string {
    if (!templateStr) return "";
    return templateStr.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, key) => {
      const val = variables[key];
      return val !== undefined && val !== null ? String(val) : `{{${key}}}`;
    });
  }

  /**
   * Rate limiting and deduplication check
   */
  public isRateLimited(dedupKey: string, rateLimitSeconds: number): boolean {
    const now = Date.now();
    const lastTimestamp = this.rateLimitCache.get(dedupKey);

    if (lastTimestamp && now - lastTimestamp < rateLimitSeconds * 1000) {
      return true; // Rate limited
    }

    this.rateLimitCache.set(dedupKey, now);
    return false;
  }

  /**
   * Dispatch alert directly to recipient over configured channel
   */
  public async dispatchAlert(
    eventType: string,
    recipientId: string,
    channel: NotificationChannel,
    title: string,
    body: string,
    severity: "INFO" | "WARNING" | "CRITICAL" | "EMERGENCY" = "INFO",
    coordinate?: Coordinate,
    ruleId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<NotificationDispatchResult> {
    const alertId = `alt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const alert: NotificationAlert = {
      id: alertId,
      ruleId,
      eventType,
      severity,
      title,
      body,
      recipientId,
      channel,
      coordinate,
      read: false,
      createdAt: nowIso,
      metadata,
    };

    if (channel === "IN_APP") {
      this.inAppAlerts.push(alert);
    }

    const adapter = this.channelAdapters.get(channel);
    if (!adapter) {
      throw new NotificationError("UNSUPPORTED_CHANNEL", `No channel adapter registered for channel '${channel}'`);
    }

    const result = await adapter.sendAlert(alert);
    this.notifyAlertListeners(alert);
    return result;
  }

  /**
   * Evaluate Geofence event against registered rules and dispatch alerts
   */
  public async evaluateGeofenceEvent(
    eventType: "GEOFENCE_ENTER" | "GEOFENCE_EXIT" | "GEOFENCE_DWELL",
    subjectId: string,
    geofenceId: string,
    coordinate?: Coordinate,
    extraVariables?: Record<string, unknown>,
  ): Promise<NotificationDispatchResult[]> {
    const results: NotificationDispatchResult[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled || rule.eventType !== eventType) continue;

      const dedupKey = `geo:${rule.id}:${subjectId}:${geofenceId}:${eventType}`;
      if (rule.rateLimitSeconds && this.isRateLimited(dedupKey, rule.rateLimitSeconds)) {
        continue; // Skip deduplicated event
      }

      const vars = { subjectId, geofenceId, eventType, timestamp: new Date().toISOString(), ...(extraVariables ?? {}) };
      const title = this.interpolateTemplate(rule.template.titleTemplate, vars);
      const body = this.interpolateTemplate(rule.template.bodyTemplate, vars);

      for (const channel of rule.channels) {
        const res = await this.dispatchAlert(eventType, subjectId, channel, title, body, rule.severity, coordinate, rule.id, vars);
        results.push(res);
      }
    }

    return results;
  }

  /**
   * In-App notification list and read tracking
   */
  public listInAppAlerts(recipientId?: string, unreadOnly: boolean = false): NotificationAlert[] {
    let list = this.inAppAlerts;
    if (recipientId) {
      list = list.filter((a) => a.recipientId === recipientId);
    }
    if (unreadOnly) {
      list = list.filter((a) => !a.read);
    }
    return list.map((a) => ({ ...a }));
  }

  public markAsRead(alertId: string): boolean {
    const alert = this.inAppAlerts.find((a) => a.id === alertId);
    if (alert) {
      alert.read = true;
      alert.readAt = new Date().toISOString();
      return true;
    }
    return false;
  }
}
