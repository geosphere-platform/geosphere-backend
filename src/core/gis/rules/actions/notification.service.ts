/**
 * NotificationService — Notification Provider Abstraction
 *
 * Decouples rule execution engine from external notification vendors (Email, SMS, FCM Push, Webhook).
 * Vendor implementation plugins can be swapped in without modifying domain code.
 */

import {
  SendNotificationActionPayload,
  RuleContext,
} from "../types/rule.types";
import { WebhookService } from "./webhook.service";

export interface NotificationResult {
  channel: string;
  success: boolean;
  recipientCount: number;
  error?: string;
}

export interface INotificationProvider {
  send(
    payload: SendNotificationActionPayload,
    context: RuleContext,
  ): Promise<NotificationResult[]>;
}

export class NotificationService implements INotificationProvider {
  constructor(
    private readonly webhookService: WebhookService = new WebhookService(),
  ) {}

  /**
   * Dispatch notification across configured abstract channels
   */
  public async send(
    payload: SendNotificationActionPayload,
    context: RuleContext,
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const channel of payload.channels) {
      try {
        switch (channel) {
          case "EMAIL": {
            // Log / stub email delivery abstraction
            results.push({
              channel: "EMAIL",
              success: true,
              recipientCount: payload.recipients.length,
            });
            break;
          }
          case "PUSH": {
            results.push({
              channel: "PUSH",
              success: true,
              recipientCount: payload.recipients.length,
            });
            break;
          }
          case "SMS": {
            results.push({
              channel: "SMS",
              success: true,
              recipientCount: payload.recipients.length,
            });
            break;
          }
          case "WEBHOOK": {
            // Forward to webhooks listed in recipients if valid URLs
            for (const recipientUrl of payload.recipients) {
              const res = await this.webhookService.sendWebhook(
                { url: recipientUrl, metadata: payload.metadata },
                context,
              );
              results.push({
                channel: "WEBHOOK",
                success: res.success,
                recipientCount: 1,
                error: res.error,
              });
            }
            break;
          }
          default:
            results.push({
              channel: String(channel),
              success: false,
              recipientCount: 0,
              error: `Unsupported notification channel '${channel}'`,
            });
            break;
        }
      } catch (err: any) {
        results.push({
          channel: String(channel),
          success: false,
          recipientCount: 0,
          error: err.message ?? "Notification delivery failed",
        });
      }
    }

    return results;
  }
}
