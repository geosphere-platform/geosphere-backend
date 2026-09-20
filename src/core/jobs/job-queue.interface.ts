export type JobStatus =
  "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface CreateJobOptions {
  tenantId: string;
  organizationId: string;
  workspaceId?: string;
  userId?: string;
  type: string; // e.g., "GIS_EXPORT", "BULK_IMPORT", "SPATIAL_ANALYTICS"
  payload: Record<string, any>;
  maxAttempts?: number;
}

export interface JobRecord {
  id: string;
  tenantId: string;
  organizationId: string;
  workspaceId?: string | null;
  userId?: string | null;
  type: string;
  status: JobStatus;
  payload: Record<string, any>;
  result?: Record<string, any> | null;
  errorMessage?: string | null;
  attempts: number;
  maxAttempts: number;
  scheduledAt: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobQueueProvider {
  /**
   * Enqueue a new background job
   */
  enqueueJob(options: CreateJobOptions): Promise<JobRecord>;

  /**
   * Fetch a job by ID with tenant boundary validation
   */
  getJob(jobId: string, tenantId: string): Promise<JobRecord | null>;

  /**
   * Reserve the next available pending job for worker processing
   */
  dequeueNextJob(workerId: string): Promise<JobRecord | null>;

  /**
   * Update job status, progress, result or failure error
   */
  updateJobStatus(
    jobId: string,
    status: JobStatus,
    result?: Record<string, any>,
    errorMessage?: string,
  ): Promise<JobRecord>;

  /**
   * Cancel a pending or running job
   */
  cancelJob(jobId: string, tenantId: string): Promise<boolean>;
}
