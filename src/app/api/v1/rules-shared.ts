/**
 * Shared API Singleton Dependencies for Generic GIS Rules, Automation & Workflow Engine
 */

import { db } from "@/database";
import { PostGisRulesRepository } from "@/core/gis/rules/repositories/postgis-rules.repository";
import { WebhookService } from "@/core/gis/rules/actions/webhook.service";
import { NotificationService } from "@/core/gis/rules/actions/notification.service";
import { ActionExecutionService } from "@/core/gis/rules/actions/action-execution.service";
import { RuleExecutionService } from "@/core/gis/rules/engine/rule-execution.service";
import { AutomationWorker } from "@/core/gis/rules/worker/automation-worker";
import { eventPublisher } from "./spatial/realtime-shared";

export const rulesRepo = new PostGisRulesRepository();
export const webhookService = new WebhookService();
export const notificationService = new NotificationService(webhookService);
export const actionExecutionService = new ActionExecutionService(
  rulesRepo,
  webhookService,
  notificationService,
  eventPublisher,
);
export const ruleExecutionService = new RuleExecutionService(
  rulesRepo,
  actionExecutionService,
);
export const automationWorker = new AutomationWorker(rulesRepo, webhookService);
