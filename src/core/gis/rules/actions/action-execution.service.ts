/**
 * ActionExecutionService — Action Dispatch & Execution Pipeline
 *
 * Executes defined rule action chains in sequence (1. Alert, 2. Task, 3. Webhook, etc.).
 * Enforces configured `actionFailurePolicy` (STOP_ON_FAILURE vs CONTINUE_ON_FAILURE).
 * Emits real-time WebSocket notifications (`ALERT_CREATED`, `TASK_CREATED`) via IRealtimeEventPublisher.
 */

import {
  RuleAction,
  RuleContext,
  ActionFailurePolicy,
  AlertRecord,
  TaskRecord,
  CreateAlertActionPayload,
  CreateTaskActionPayload,
  SendNotificationActionPayload,
  SendWebhookActionPayload,
  CreateEventActionPayload,
} from "../types/rule.types";
import { PostGisRulesRepository } from "../repositories/postgis-rules.repository";
import { WebhookService } from "./webhook.service";
import { NotificationService } from "./notification.service";
import { IRealtimeEventPublisher } from "../../realtime/realtime-event.publisher";
import { RealtimeEventEnvelope } from "../../realtime/spatial-event.model";

export interface ActionResult {
  actionId: string;
  actionType: string;
  order: number;
  success: boolean;
  error?: string;
  output?: Record<string, unknown>;
}

export class ActionExecutionService {
  constructor(
    private readonly repo: PostGisRulesRepository,
    private readonly webhookService: WebhookService = new WebhookService(),
    private readonly notificationService: NotificationService = new NotificationService(),
    private readonly publisher?: IRealtimeEventPublisher,
  ) {}

  /**
   * Execute array of RuleAction items in ordered sequence
   */
  public async executeActionChain(
    tenantId: string,
    ruleId: string,
    ruleVersion: number,
    executionId: string,
    actions: RuleAction[],
    failurePolicy: ActionFailurePolicy,
    context: RuleContext,
  ): Promise<ActionResult[]> {
    const results: ActionResult[] = [];
    if (!Array.isArray(actions) || actions.length === 0) {
      return results;
    }

    // Sort actions by defined execution order (1, 2, 3...)
    const sortedActions = [...actions].sort((a, b) => a.order - b.order);

    for (const action of sortedActions) {
      try {
        const res = await this.executeSingleAction(
          tenantId,
          ruleId,
          ruleVersion,
          executionId,
          action,
          context,
        );
        results.push(res);

        if (!res.success && failurePolicy === "STOP_ON_FAILURE") {
          // Halted action chain execution due to STOP_ON_FAILURE
          break;
        }
      } catch (err: any) {
        const failureResult: ActionResult = {
          actionId: action.id,
          actionType: action.type,
          order: action.order,
          success: false,
          error: err.message ?? "Action execution failed unexpectedly",
        };
        results.push(failureResult);

        if (failurePolicy === "STOP_ON_FAILURE") {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Execute single action step
   */
  private async executeSingleAction(
    tenantId: string,
    ruleId: string,
    ruleVersion: number,
    executionId: string,
    action: RuleAction,
    context: RuleContext,
  ): Promise<ActionResult> {
    switch (action.type) {
      case "CREATE_ALERT": {
        const payload = action.payload as CreateAlertActionPayload;
        const alertRecord = await this.repo.createAlert({
          tenantId,
          ruleId,
          ruleVersion,
          severity: payload.severity,
          title: this.interpolateTemplate(payload.title, context),
          message: this.interpolateTemplate(payload.message, context),
          subjectId: payload.subjectId ?? context.subject?.id,
          subjectType: payload.subjectType ?? context.subject?.type,
          geometry: context.location?.geometry,
          metadata: {
            executionId,
            ...(payload.metadata ?? {}),
          },
        });

        // Publish Real-Time WebSocket Event ALERT_CREATED
        if (this.publisher) {
          const envelope: RealtimeEventEnvelope = {
            eventId: alertRecord.id,
            eventType: "ALERT_CREATED",
            timestamp: new Date().toISOString(),
            tenantId,
            subjectId: alertRecord.subjectId ?? "system",
            payload: {
              alertId: alertRecord.id,
              severity: alertRecord.severity,
              title: alertRecord.title,
              message: alertRecord.message,
              status: alertRecord.status,
            },
            version: 1,
          };
          await this.publisher.publish(envelope);
        }

        return {
          actionId: action.id,
          actionType: action.type,
          order: action.order,
          success: true,
          output: { alertId: alertRecord.id, status: alertRecord.status },
        };
      }

      case "CREATE_TASK": {
        const payload = action.payload as CreateTaskActionPayload;
        let dueAt: Date | undefined;
        if (payload.dueInSeconds) {
          dueAt = new Date(Date.now() + payload.dueInSeconds * 1000);
        }

        const taskRecord = await this.repo.createTask({
          tenantId,
          sourceRuleId: ruleId,
          title: this.interpolateTemplate(payload.title, context),
          description: payload.description
            ? this.interpolateTemplate(payload.description, context)
            : undefined,
          priority: payload.priority,
          assignedTo: payload.assignedTo,
          dueAt,
          metadata: {
            executionId,
            ...(payload.metadata ?? {}),
          },
        });

        // Publish Real-Time WebSocket Event TASK_CREATED
        if (this.publisher) {
          const envelope: RealtimeEventEnvelope = {
            eventId: taskRecord.id,
            eventType: "TASK_CREATED",
            timestamp: new Date().toISOString(),
            tenantId,
            subjectId: taskRecord.assignedTo ?? "system",
            payload: {
              taskId: taskRecord.id,
              title: taskRecord.title,
              priority: taskRecord.priority,
              status: taskRecord.status,
            },
            version: 1,
          };
          await this.publisher.publish(envelope);
        }

        return {
          actionId: action.id,
          actionType: action.type,
          order: action.order,
          success: true,
          output: { taskId: taskRecord.id, status: taskRecord.status },
        };
      }

      case "SEND_WEBHOOK": {
        const payload = action.payload as SendWebhookActionPayload;
        // Asynchronously register in job queue for retry tracking
        const job = await this.repo.createActionJob({
          tenantId,
          executionId,
          actionType: "SEND_WEBHOOK",
          actionPayload: payload as any,
          maxAttempts: payload.maxAttempts ?? 3,
        });

        // Direct attempt
        const res = await this.webhookService.sendWebhook(payload, context);
        await this.repo.updateActionJobResult(job.id, res.success, res.error);

        return {
          actionId: action.id,
          actionType: action.type,
          order: action.order,
          success: res.success,
          error: res.error,
          output: { jobId: job.id, statusCode: res.statusCode },
        };
      }

      case "SEND_NOTIFICATION": {
        const payload = action.payload as SendNotificationActionPayload;
        const res = await this.notificationService.send(payload, context);
        const allSuccess = res.every((r) => r.success);

        return {
          actionId: action.id,
          actionType: action.type,
          order: action.order,
          success: allSuccess,
          output: { deliveryResults: res },
        };
      }

      case "CREATE_EVENT": {
        const payload = action.payload as CreateEventActionPayload;
        return {
          actionId: action.id,
          actionType: action.type,
          order: action.order,
          success: true,
          output: { eventType: payload.type },
        };
      }

      case "LOG_EVENT":
      case "UPDATE_STATE":
        return {
          actionId: action.id,
          actionType: action.type,
          order: action.order,
          success: true,
        };

      default:
        return {
          actionId: action.id,
          actionType: action.type,
          order: action.order,
          success: false,
          error: `Unsupported action type '${action.type}'`,
        };
    }
  }

  /**
   * Template interpolation e.g. "Alert for subject {{subject.id}}"
   */
  private interpolateTemplate(template: string, context: RuleContext): string {
    if (!template || typeof template !== "string") return template;
    return template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, path) => {
      const parts = path.split(".");
      let val: any = context;
      for (const p of parts) {
        if (val === null || val === undefined) return "";
        val = val[p];
      }
      return val !== undefined && val !== null ? String(val) : "";
    });
  }
}
