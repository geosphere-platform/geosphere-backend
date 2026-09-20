import { JobQueueProvider, JobRecord } from "./job-queue.interface";
import { DatabaseJobQueueProvider } from "./database-job-queue";

export type JobHandler = (job: JobRecord) => Promise<Record<string, any>>;

export class JobWorkerProcessor {
  private queue: JobQueueProvider;
  private handlers = new Map<string, JobHandler>();
  private workerId: string;
  private isRunning = false;

  constructor(queue?: JobQueueProvider) {
    this.queue = queue ?? new DatabaseJobQueueProvider();
    this.workerId = `worker_${Math.floor(Math.random() * 100000)}`;
  }

  /**
   * Register a job type handler callback
   */
  registerHandler(type: string, handler: JobHandler) {
    this.handlers.set(type, handler);
  }

  /**
   * Process a single queued job item safely with error masking
   */
  async processNextJob(): Promise<boolean> {
    const job = await this.queue.dequeueNextJob(this.workerId);
    if (!job) {
      return false; // No work available
    }

    const handler = this.handlers.get(job.type);
    if (!handler) {
      await this.queue.updateJobStatus(
        job.id,
        "FAILED",
        undefined,
        `No job handler registered for job type: ${job.type}`,
      );
      return true;
    }

    try {
      const result = await handler(job);
      await this.queue.updateJobStatus(job.id, "COMPLETED", result);
      return true;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Internal job execution error";
      const isFinalAttempt = job.attempts >= job.maxAttempts;

      await this.queue.updateJobStatus(
        job.id,
        isFinalAttempt ? "FAILED" : "PENDING",
        undefined,
        errorMsg,
      );
      return true;
    }
  }

  getWorkerId(): string {
    return this.workerId;
  }
}
