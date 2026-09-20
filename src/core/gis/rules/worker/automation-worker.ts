/**
 * AutomationWorker — Lock-Free PostgreSQL Action Job Queue Worker
 *
 * Claims pending asynchronous jobs from `gis_action_jobs` using `FOR UPDATE SKIP LOCKED`.
 * Handles retries with exponential backoff and dead-letter queueing.
 * Completely standalone without requiring Redis or Kafka.
 */

import { PostGisRulesRepository } from "../repositories/postgis-rules.repository";
import { WebhookService } from "../actions/webhook.service";
import {
  ActionJob,
  SendWebhookActionPayload,
  RuleContext,
} from "../types/rule.types";

export class AutomationWorker {
  private isRunning: boolean = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly repo: PostGisRulesRepository,
    private readonly webhookService: WebhookService = new WebhookService(),
    private readonly pollIntervalMs: number = 3000,
  ) {}

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleNextTick();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleNextTick(): void {
    if (!this.isRunning) return;
    this.timer = setTimeout(async () => {
      await this.processPendingBatch();
      this.scheduleNextTick();
    }, this.pollIntervalMs);
  }

  /**
   * Process a single batch of claimed action jobs
   */
  public async processPendingBatch(
    batchSize: number = 10,
  ): Promise<{ processed: number; succeeded: number }> {
    let claimedJobs: ActionJob[] = [];
    try {
      claimedJobs = await this.repo.claimPendingActionJobs(batchSize);
    } catch (err) {
      return { processed: 0, succeeded: 0 };
    }

    if (claimedJobs.length === 0) {
      return { processed: 0, succeeded: 0 };
    }

    let succeededCount = 0;

    for (const job of claimedJobs) {
      try {
        const success = await this.executeJob(job);
        if (success) {
          succeededCount++;
          await this.repo.updateActionJobResult(job.id, true);
        } else {
          // Calculate exponential backoff next attempt (2^attempts * 10 seconds)
          const delaySec = Math.pow(2, job.attempts) * 10;
          const nextAttemptAt = new Date(Date.now() + delaySec * 1000);
          await this.repo.updateActionJobResult(
            job.id,
            false,
            job.lastError ?? "Action execution failed",
            nextAttemptAt,
          );
        }
      } catch (err: any) {
        const delaySec = Math.pow(2, job.attempts) * 10;
        const nextAttemptAt = new Date(Date.now() + delaySec * 1000);
        await this.repo.updateActionJobResult(
          job.id,
          false,
          err.message ?? "Worker execution error",
          nextAttemptAt,
        );
      }
    }

    return {
      processed: claimedJobs.length,
      succeeded: succeededCount,
    };
  }

  private async executeJob(job: ActionJob): Promise<boolean> {
    if (job.actionType === "SEND_WEBHOOK") {
      const payload = job.actionPayload as unknown as SendWebhookActionPayload;
      const dummyContext: RuleContext = {
        timestamp: new Date().toISOString(),
      };
      const res = await this.webhookService.sendWebhook(payload, dummyContext);
      if (!res.success) {
        job.lastError = res.error;
      }
      return res.success;
    }
    return true;
  }
}
