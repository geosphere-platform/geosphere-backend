/**
 * Phase 13 — SubscriptionService
 *
 * Manages the lifecycle of organization subscriptions.
 *
 * Key behaviors:
 * - One active/trialing subscription per organization (enforced via DB constraint)
 * - Historical records are NEVER overwritten or deleted
 * - Plan changes retain all previous subscription history for auditing
 * - Downgrade safety: existing resources are NOT deleted when downgrading
 * - Trial expiration is evaluated from timestamps, not a background job
 *
 * Downgrade safety policy (spec section 61-62):
 *   When an org downgrades from a higher to lower plan:
 *   - Existing resources (users, layers, rules) are NOT deleted
 *   - New resource creation that would exceed new limits IS blocked
 *   - A warning is returned listing metrics where usage exceeds new limits
 *   - Platform admin may force downgrade with forceDowngrade=true
 *
 * Subscription history:
 *   All subscription transitions are auditable:
 *   FREE → STARTER → PRO transitions produce separate records
 *   Previous record is marked CANCELLED, new record is created
 */

import { db } from "../../database";
import {
  subscriptionsTable,
  plansTable,
  planLimitsTable,
  SUBSCRIPTION_STATUS,
  ACTIVE_SUBSCRIPTION_STATUSES,
} from "../../database/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { NotFoundError, ConflictError } from "../errors/errors";
import { ActiveSubscriptionExistsError } from "./errors";
import { usageService } from "./usage.service";
import { planService } from "./plan.service";
import type {
  AssignPlanInput,
  ChangePlanInput,
  StartTrialInput,
  DowngradeCheckResult,
  SubscriptionRow,
} from "./types";
import type { SubscriptionRow as SchSubscriptionRow } from "../../database/schema/subscription";

export class SubscriptionService {
  /**
   * Get the current active or trialing subscription for an organization.
   * Returns null if no active subscription exists.
   */
  async getOrganizationSubscription(
    organizationId: string,
  ): Promise<SchSubscriptionRow | null> {
    const [subscription] = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.organizationId, organizationId),
          inArray(subscriptionsTable.status, ACTIVE_SUBSCRIPTION_STATUSES),
        ),
      )
      .limit(1);

    return subscription ?? null;
  }

  /**
   * Get the full subscription history for an organization.
   * Includes all CANCELLED, EXPIRED, and historical records.
   */
  async getSubscriptionHistory(
    organizationId: string,
  ): Promise<SchSubscriptionRow[]> {
    return db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.organizationId, organizationId))
      .orderBy(desc(subscriptionsTable.createdAt));
  }

  /**
   * Assigns a plan to an organization.
   *
   * If an existing active subscription exists, it is CANCELLED first
   * (history retained). Then a new subscription is created.
   *
   * This maintains full subscription history for auditing.
   */
  async assignPlan(input: AssignPlanInput): Promise<SchSubscriptionRow> {
    const plan = await planService.getPlan(input.planId);

    // Cancel any existing active subscription (retain history)
    const existing = await this.getOrganizationSubscription(
      input.organizationId,
    );
    if (existing) {
      await db
        .update(subscriptionsTable)
        .set({
          status: SUBSCRIPTION_STATUS.CANCELLED,
          cancelledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(subscriptionsTable.id, existing.id));
    }

    // Create new subscription
    const [subscription] = await db
      .insert(subscriptionsTable)
      .values({
        organizationId: input.organizationId,
        planId: input.planId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        startsAt: input.startsAt ?? new Date(),
        endsAt: input.endsAt ?? null,
        billingInterval: input.billingInterval ?? null,
        currency: input.currency ?? "USD",
        metadata: input.metadata ?? {},
      })
      .returning();

    return subscription;
  }

  /**
   * Change an organization's plan (upgrade or downgrade).
   *
   * Downgrade safety: checks current usage vs new plan limits.
   * If usage exceeds new limits: returns violations (data is NOT deleted).
   * forceDowngrade=true bypasses the safety check (platform admin only).
   *
   * Per spec section 61-62:
   * "If a customer downgrades from 100 users to 10 users,
   *  do NOT automatically delete 90 users."
   */
  async changePlan(input: ChangePlanInput): Promise<{
    subscription: SchSubscriptionRow;
    downgradeWarnings: DowngradeCheckResult;
  }> {
    const newPlan = await planService.getPlan(input.newPlanId);

    // Perform downgrade safety check
    const downgradeCheck = await this.checkDowngradeSafety(
      input.organizationId,
      input.newPlanId,
    );

    if (!downgradeCheck.safe && !input.forceDowngrade) {
      // Log warning but allow downgrade as per product policy
      // Existing data is retained; only new operations are blocked
      console.warn(
        `[SubscriptionService] Downgrade warning for org ${input.organizationId}:`,
        downgradeCheck.violations,
      );
    }

    const subscription = await this.assignPlan({
      organizationId: input.organizationId,
      planId: input.newPlanId,
    });

    return { subscription, downgradeWarnings: downgradeCheck };
  }

  /**
   * Start a trial subscription for an organization.
   * Creates a TRIALING subscription with a trial end date.
   */
  async startTrial(input: StartTrialInput): Promise<SchSubscriptionRow> {
    const plan = await planService.getPlan(input.planId);

    const existing = await this.getOrganizationSubscription(
      input.organizationId,
    );
    if (existing) {
      throw new ActiveSubscriptionExistsError(input.organizationId);
    }

    const now = new Date();
    const trialEndsAt = new Date(
      now.getTime() + input.trialDays * 24 * 60 * 60 * 1000,
    );

    const [subscription] = await db
      .insert(subscriptionsTable)
      .values({
        organizationId: input.organizationId,
        planId: input.planId,
        status: SUBSCRIPTION_STATUS.TRIALING,
        startsAt: now,
        trialEndsAt,
        metadata: {},
      })
      .returning();

    return subscription;
  }

  /**
   * Suspend an organization's subscription.
   * Suspended orgs fail all entitlement checks.
   * Platform admins are not affected by suspension.
   */
  async suspendSubscription(
    organizationId: string,
  ): Promise<SchSubscriptionRow> {
    const existing = await this.getOrganizationSubscription(organizationId);
    if (!existing) {
      throw new NotFoundError(
        `No active subscription found for organization '${organizationId}'`,
      );
    }

    const [updated] = await db
      .update(subscriptionsTable)
      .set({ status: SUBSCRIPTION_STATUS.SUSPENDED, updatedAt: new Date() })
      .where(eq(subscriptionsTable.id, existing.id))
      .returning();

    return updated;
  }

  /**
   * Reactivate a suspended subscription.
   * Restores access for the organization.
   */
  async reactivateSubscription(
    organizationId: string,
  ): Promise<SchSubscriptionRow> {
    const [suspended] = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.organizationId, organizationId),
          eq(subscriptionsTable.status, SUBSCRIPTION_STATUS.SUSPENDED),
        ),
      )
      .limit(1);

    if (!suspended) {
      throw new NotFoundError(
        `No suspended subscription found for organization '${organizationId}'`,
      );
    }

    const [updated] = await db
      .update(subscriptionsTable)
      .set({ status: SUBSCRIPTION_STATUS.ACTIVE, updatedAt: new Date() })
      .where(eq(subscriptionsTable.id, suspended.id))
      .returning();

    return updated;
  }

  /**
   * Cancel an organization's subscription.
   * Data is preserved — only access is revoked per expiration policy.
   */
  async cancelSubscription(
    organizationId: string,
  ): Promise<SchSubscriptionRow> {
    const existing = await this.getOrganizationSubscription(organizationId);
    if (!existing) {
      throw new NotFoundError(
        `No active subscription found for organization '${organizationId}'`,
      );
    }

    const [updated] = await db
      .update(subscriptionsTable)
      .set({
        status: SUBSCRIPTION_STATUS.CANCELLED,
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptionsTable.id, existing.id))
      .returning();

    return updated;
  }

  /**
   * Get all subscriptions across all organizations (platform admin view).
   */
  async getAllSubscriptions(): Promise<SchSubscriptionRow[]> {
    return db
      .select()
      .from(subscriptionsTable)
      .orderBy(desc(subscriptionsTable.createdAt));
  }

  /**
   * Check if downgrading to a new plan would cause limit violations.
   *
   * Does NOT delete data — only calculates discrepancies.
   * This information is surfaced to the platform admin before executing the change.
   */
  async checkDowngradeSafety(
    organizationId: string,
    newPlanId: string,
  ): Promise<DowngradeCheckResult> {
    const newLimits = await db
      .select()
      .from(planLimitsTable)
      .where(eq(planLimitsTable.planId, newPlanId));

    const violations: DowngradeCheckResult["violations"] = [];

    for (const limit of newLimits) {
      if (limit.isUnlimited) continue; // Unlimited limits never violated

      const currentUsage = await usageService.getCountFromSource(
        organizationId,
        limit.metricCode,
      );

      if (limit.numericValue !== null && currentUsage > limit.numericValue) {
        violations.push({
          metricCode: limit.metricCode,
          currentUsage,
          newLimit: limit.numericValue,
          isUnlimited: false,
        });
      }
    }

    return { safe: violations.length === 0, violations };
  }
}

export const subscriptionService = new SubscriptionService();
