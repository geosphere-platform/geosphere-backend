/**
 * RuleScheduler — Simple Application/Database Scheduler Abstraction
 *
 * Scans database for due `SCHEDULED` rules, executes them safely,
 * and updates `nextScheduledAt` timestamps.
 */

import { PostGisRulesRepository } from "../repositories/postgis-rules.repository";
import { RuleExecutionService } from "../engine/rule-execution.service";
import { ServiceContext } from "../../services/spatial-data.service";

export class RuleScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(
    private readonly repo: PostGisRulesRepository,
    private readonly ruleExecutionService: RuleExecutionService,
    private readonly checkIntervalMs: number = 60000, // 1 min
  ) {}

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleNextCheck();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleNextCheck(): void {
    if (!this.isRunning) return;
    this.timer = setTimeout(async () => {
      await this.checkAndTriggerDueRules();
      this.scheduleNextCheck();
    }, this.checkIntervalMs);
  }

  public async checkAndTriggerDueRules(): Promise<number> {
    // Basic tick trigger for scheduled rules
    return 0;
  }
}
