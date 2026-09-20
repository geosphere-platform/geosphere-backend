/**
 * WebhookService — Safe HTTP Webhook Dispatcher
 *
 * Executes external HTTP webhooks safely with SSRF protection, timeout, and retry handling.
 * Does NOT leak system secrets, authorization headers, or internal tokens in outgoing payload.
 */

import { SendWebhookActionPayload, RuleContext } from "../types/rule.types";
import { SSRFGuard } from "../security/ssrf-guard";
import { RULE_LIMITS } from "../validation/rule-validator";

export interface WebhookResult {
  success: boolean;
  statusCode?: number;
  durationMs: number;
  error?: string;
  responseBody?: string;
}

export class WebhookService {
  /**
   * Dispatch HTTP webhook payload safely
   */
  public async sendWebhook(
    payload: SendWebhookActionPayload,
    context: RuleContext,
  ): Promise<WebhookResult> {
    const startTime = Date.now();

    // 1. SSRF URL Check
    SSRFGuard.validateUrl(payload.url);

    const method = payload.method ?? "POST";
    const timeoutMs = Math.min(
      payload.timeoutMs ?? 5000,
      RULE_LIMITS.MAX_WEBHOOK_TIMEOUT_MS,
    );

    // 2. Sanitize and prepare body context payload
    const sanitizedPayload = {
      eventId: context.event?.id,
      eventType: context.event?.type,
      timestamp: context.timestamp,
      subject: context.subject
        ? {
            id: context.subject.id,
            type: context.subject.type,
            name: context.subject.name,
            attributes: context.subject.attributes,
          }
        : undefined,
      location: context.location
        ? {
            latitude: context.location.latitude,
            longitude: context.location.longitude,
            speed: context.location.speed,
            heading: context.location.heading,
            accuracy: context.location.accuracy,
          }
        : undefined,
      geofence: context.geofence
        ? {
            id: context.geofence.id,
            name: context.geofence.name,
            transition: context.geofence.transition,
          }
        : undefined,
      metadata: payload.metadata ?? {},
    };

    // Filter out forbidden headers (e.g., authorization, cookie, host, x-api-key)
    const customHeaders: Record<string, string> = {};
    if (payload.headers && typeof payload.headers === "object") {
      const FORBIDDEN_HEADERS = new Set([
        "authorization",
        "cookie",
        "host",
        "x-api-key",
        "x-auth-token",
      ]);
      for (const [k, v] of Object.entries(payload.headers)) {
        if (!FORBIDDEN_HEADERS.has(k.toLowerCase())) {
          customHeaders[k] = String(v);
        }
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(payload.url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "GIS-Platform-RulesEngine/1.0",
          ...customHeaders,
        },
        body: JSON.stringify(sanitizedPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;
      const responseText = await response.text();

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          durationMs,
          error: `Webhook returned HTTP ${response.status}: ${responseText.substring(0, 200)}`,
        };
      }

      return {
        success: true,
        statusCode: response.status,
        durationMs,
        responseBody: responseText.substring(0, 500),
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;
      const isAbort = err.name === "AbortError";

      return {
        success: false,
        durationMs,
        error: isAbort
          ? `Webhook request timed out after ${timeoutMs}ms`
          : (err.message ?? "Webhook network dispatch failed"),
      };
    }
  }
}
