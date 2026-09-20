/**
 * Framework-Independent Notification Channel Adapter Abstraction
 *
 * Defines the contract for sending NotificationAlerts over various channels (PUSH, EMAIL, SMS, WEBHOOK, IN_APP).
 * Includes a MockNotificationChannelAdapter for deterministic multi-channel testing and headless execution.
 */

import { NotificationAlert, NotificationChannel, NotificationDispatchResult } from "../types/notification.types";

export interface INotificationChannelAdapter {
  readonly channel: NotificationChannel;
  sendAlert(alert: NotificationAlert): Promise<NotificationDispatchResult>;
}

export class MockNotificationChannelAdapter implements INotificationChannelAdapter {
  public readonly dispatchedAlerts: NotificationAlert[] = [];

  constructor(public readonly channel: NotificationChannel) {}

  public async sendAlert(alert: NotificationAlert): Promise<NotificationDispatchResult> {
    this.dispatchedAlerts.push({ ...alert });
    return {
      alertId: alert.id,
      channel: this.channel,
      success: true,
      dispatchedAt: new Date().toISOString(),
    };
  }

  public clear(): void {
    this.dispatchedAlerts.length = 0;
  }
}
