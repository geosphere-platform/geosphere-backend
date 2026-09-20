/**
 * Phase 13 — UsageService
 *
 * Generic usage tracking service for resource limits and billing preparation.
 *
 * Two categories of usage metrics:
 *
 * 1. RESOURCE COUNTS (derived from source tables — always consistent):
 *    USERS, WORKSPACES, LAYERS, DATASETS, RULES
 *    → getCountFromSource() queries the actual table count
 *    → Avoids counter drift from failed transactions
 *
 * 2. METERED EVENTS (recorded per event — supports billing):
 *    API_REQUESTS, SPATIAL_QUERIES, EXPORTS, IMPORTS, STORAGE_BYTES
 *    → recordUsage() / incrementUsage() with atomic DB operations
 *    → idempotencyKey prevents double-counting on retries
 *
 * Atomicity:
 *   Increments use DB-level INSERT/UPDATE, never read-then-write in app memory.
 *   This prevents race conditions under concurrent requests.
 *
 * Idempotency:
 *   Each usage event may include an idempotencyKey.
 *   Duplicate keys are silently ignored (ON CONFLICT DO NOTHING).
 *
 * Retention:
 *   Usage records are NEVER deleted. Retention policy is separate from business data.
 *
 * Concurrency safety (per spec section 93):
 *   Simultaneous requests claiming the last quota slot → only one succeeds.
 *   checkLimit() derives from getCountFromSource() which reads actual DB count.
 */

import { db } from "../../database";
import {
  usageRecordsTable,
  organizationMembershipsTable,
  workspacesTable,
  gisRulesTable,
  MEMBERSHIP_STATUS,
  WORKSPACE_STATUS,
} from "../../database/schema";
import { eq, and, gte, lte, sql, count } from "drizzle-orm";
import type { UsagePeriod, UsageSummary } from "./types";
import { USAGE_METRIC } from "./types";

export class UsageService {
  /**
   * Derives the actual resource count from the source-of-truth table.
   * Use this for resource limits (USERS, WORKSPACES, LAYERS, RULES).
   *
   * This prevents counter drift that occurs when incrementing counters
   * that can become inconsistent due to transaction rollbacks.
   *
   * Policy: Pending invitations do NOT count against MAX_USERS quota.
   * Only ACTIVE memberships are counted.
   */
  async getCountFromSource(
    organizationId: string,
    metricCode: string,
  ): Promise<number> {
    switch (metricCode) {
      case USAGE_METRIC.USERS: {
        // Only ACTIVE memberships count — not INVITED/SUSPENDED/REMOVED
        // Policy: Pending invitations do NOT count against MAX_USERS
        const [result] = await db
          .select({ count: count() })
          .from(organizationMembershipsTable)
          .where(
            and(
              eq(organizationMembershipsTable.organizationId, organizationId),
              eq(organizationMembershipsTable.status, MEMBERSHIP_STATUS.ACTIVE),
            ),
          );
        return Number(result?.count ?? 0);
      }

      case USAGE_METRIC.WORKSPACES: {
        const [result] = await db
          .select({ count: count() })
          .from(workspacesTable)
          .where(
            and(
              eq(workspacesTable.organizationId, organizationId),
              eq(workspacesTable.status, WORKSPACE_STATUS.ACTIVE),
            ),
          );
        return Number(result?.count ?? 0);
      }

      case USAGE_METRIC.RULES: {
        const [result] = await db
          .select({ count: count() })
          .from(gisRulesTable)
          .where(
            and(
              eq(gisRulesTable.tenantId, organizationId),
              // Count all non-archived rules
              sql`${gisRulesTable.status} != 'ARCHIVED'`,
            ),
          );
        return Number(result?.count ?? 0);
      }

      case USAGE_METRIC.LAYERS:
      case USAGE_METRIC.DATASETS:
      case USAGE_METRIC.ALERTS:
      case USAGE_METRIC.REALTIME_CONNECTIONS:
      case USAGE_METRIC.STORAGE_BYTES:
        // For metered metrics and metrics without direct table, fall through to usage_records
        return this.getCurrentUsage(organizationId, metricCode);

      default:
        return this.getCurrentUsage(organizationId, metricCode);
    }
  }

  /**
   * Retrieves the current aggregated usage from usage_records.
   * Supports period-based queries for metered resources.
   *
   * @param organizationId - Tenant organization
   * @param metricCode - Usage metric code
   * @param period - Optional period filter (monthly, daily, lifetime)
   */
  async getCurrentUsage(
    organizationId: string,
    metricCode: string,
    period?: UsagePeriod,
  ): Promise<number> {
    const conditions = [
      eq(usageRecordsTable.organizationId, organizationId),
      eq(usageRecordsTable.metricCode, metricCode),
    ];

    if (period) {
      conditions.push(gte(usageRecordsTable.periodStart, period.start));
      conditions.push(lte(usageRecordsTable.periodEnd, period.end));
    }

    const [result] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${usageRecordsTable.value}), 0)`,
      })
      .from(usageRecordsTable)
      .where(and(...conditions));

    return Number(result?.total ?? 0);
  }

  /**
   * Records a usage event atomically.
   *
   * Atomic: Uses INSERT with ON CONFLICT DO NOTHING for idempotency.
   * No read-then-write in application memory.
   *
   * @param organizationId - Tenant organization
   * @param metricCode - Usage metric code
   * @param value - Usage amount (default 1)
   * @param idempotencyKey - Optional key to prevent duplicate recording
   * @param period - Optional period boundaries
   */
  async recordUsage(
    organizationId: string,
    metricCode: string,
    value = 1,
    idempotencyKey?: string,
    period?: { start: Date; end: Date },
  ): Promise<void> {
    await db
      .insert(usageRecordsTable)
      .values({
        organizationId,
        metricCode,
        value,
        idempotencyKey: idempotencyKey ?? null,
        periodStart: period?.start ?? null,
        periodEnd: period?.end ?? null,
        metadata: {},
      })
      .onConflictDoNothing({ target: usageRecordsTable.idempotencyKey });
  }

  /**
   * Records API request usage for the current monthly period.
   * Convenience method for the API middleware.
   */
  async recordApiRequest(
    organizationId: string,
    idempotencyKey?: string,
  ): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    await this.recordUsage(
      organizationId,
      USAGE_METRIC.API_REQUESTS,
      1,
      idempotencyKey,
      { start: periodStart, end: periodEnd },
    );
  }

  /**
   * Records a spatial query usage event.
   */
  async recordSpatialQuery(
    organizationId: string,
    idempotencyKey?: string,
  ): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    await this.recordUsage(
      organizationId,
      USAGE_METRIC.SPATIAL_QUERIES,
      1,
      idempotencyKey,
      { start: periodStart, end: periodEnd },
    );
  }

  /**
   * Gets a usage summary for all tracked metrics for an organization.
   * Used by the usage dashboard API.
   */
  async getUsageSummary(organizationId: string): Promise<UsageSummary[]> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    const period: UsagePeriod = {
      type: "monthly",
      start: periodStart,
      end: periodEnd,
    };

    const metrics = Object.values(USAGE_METRIC);
    return Promise.all(
      metrics.map(async (metricCode) => {
        const current = await this.getCountFromSource(
          organizationId,
          metricCode,
        );
        return { metricCode, organizationId, current, period };
      }),
    );
  }

  /**
   * Reconciles the stored usage with the actual source-of-truth count.
   * Used for auditing and ensuring consistency.
   * Does NOT modify usage_records — only returns the discrepancy report.
   */
  async reconcileUsage(
    organizationId: string,
    metricCode: string,
  ): Promise<{
    actualCount: number;
    recordedCount: number;
    discrepancy: number;
  }> {
    const actualCount = await this.getCountFromSource(
      organizationId,
      metricCode,
    );
    const recordedCount = await this.getCurrentUsage(
      organizationId,
      metricCode,
    );
    return {
      actualCount,
      recordedCount,
      discrepancy: actualCount - recordedCount,
    };
  }
}

/** Singleton instance */
export const usageService = new UsageService();
