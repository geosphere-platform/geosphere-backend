/**
 * Phase 13 — PlanService
 *
 * Platform admin operations for managing commercial plans, features,
 * and their limits. Customer admins may only VIEW plans; they cannot
 * modify plan definitions.
 *
 * All changes should be audited via the audit_logs table.
 */

import { db } from "../../database";
import {
  plansTable,
  planFeaturesTable,
  planLimitsTable,
  subscriptionsTable,
  PLAN_STATUS,
  ACTIVE_SUBSCRIPTION_STATUSES,
} from "../../database/schema";
import { eq, and, inArray } from "drizzle-orm";
import { NotFoundError, ConflictError } from "../errors/errors";
import { PlanInUseError } from "./errors";
import type {
  CreatePlanInput,
  UpdatePlanInput,
  SetPlanLimitInput,
  PlanRow,
  PlanFeatureRow,
  PlanLimitRow,
} from "./types";
import {
  type PlanRow as SchPlanRow,
  type PlanFeatureRow as SchPlanFeatureRow,
  type PlanLimitRow as SchPlanLimitRow,
} from "../../database/schema/subscription";

export class PlanService {
  /** List all plans (with optional status filter) */
  async listPlans(statusFilter?: string): Promise<SchPlanRow[]> {
    const plans = await db.select().from(plansTable);
    if (statusFilter) {
      return plans.filter((p) => p.status === statusFilter);
    }
    return plans.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  /** List only ACTIVE plans visible to customers */
  async listPublicPlans(): Promise<SchPlanRow[]> {
    return db
      .select()
      .from(plansTable)
      .where(eq(plansTable.status, PLAN_STATUS.ACTIVE));
  }

  /** Get a plan by ID */
  async getPlan(id: string): Promise<SchPlanRow> {
    const [plan] = await db
      .select()
      .from(plansTable)
      .where(eq(plansTable.id, id))
      .limit(1);

    if (!plan) throw new NotFoundError(`Plan '${id}' not found`);
    return plan;
  }

  /** Get a plan by code (FREE, STARTER, PRO, ENTERPRISE) */
  async getPlanByCode(code: string): Promise<SchPlanRow> {
    const [plan] = await db
      .select()
      .from(plansTable)
      .where(eq(plansTable.code, code.toUpperCase()))
      .limit(1);

    if (!plan) throw new NotFoundError(`Plan with code '${code}' not found`);
    return plan;
  }

  /** Create a new plan. Status defaults to DRAFT. */
  async createPlan(input: CreatePlanInput): Promise<SchPlanRow> {
    const [created] = await db
      .insert(plansTable)
      .values({
        code: input.code.toUpperCase(),
        name: input.name,
        description: input.description ?? null,
        status: input.status ?? PLAN_STATUS.DRAFT,
        isPublic: input.isPublic ?? true,
        displayOrder: input.displayOrder ?? 0,
        monthlyPriceCents: input.monthlyPriceCents ?? null,
        yearlyPriceCents: input.yearlyPriceCents ?? null,
        currency: input.currency ?? "USD",
        metadata: input.metadata ?? {},
      })
      .returning();

    return created;
  }

  /** Update plan metadata. Does not change limits or features. */
  async updatePlan(id: string, input: UpdatePlanInput): Promise<SchPlanRow> {
    await this.getPlan(id); // ensure it exists

    const [updated] = await db
      .update(plansTable)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(plansTable.id, id))
      .returning();

    return updated;
  }

  /**
   * Archive a plan (soft delete).
   * Cannot archive a plan that has active/trialing subscriptions.
   * Historical subscriptions (CANCELLED/EXPIRED) are fine — we retain history.
   */
  async archivePlan(id: string): Promise<SchPlanRow> {
    const plan = await this.getPlan(id);

    // Check for active subscriptions referencing this plan
    const [activeSubscription] = await db
      .select({ id: subscriptionsTable.id })
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.planId, id),
          inArray(subscriptionsTable.status, ACTIVE_SUBSCRIPTION_STATUSES),
        ),
      )
      .limit(1);

    if (activeSubscription) {
      throw new PlanInUseError(id);
    }

    const [archived] = await db
      .update(plansTable)
      .set({ status: PLAN_STATUS.ARCHIVED, updatedAt: new Date() })
      .where(eq(plansTable.id, id))
      .returning();

    return archived;
  }

  // ─── Feature Management ─────────────────────────────────────────────────────

  /** Get all features configured for a plan */
  async getPlanFeatures(planId: string): Promise<SchPlanFeatureRow[]> {
    await this.getPlan(planId); // ensure plan exists
    return db
      .select()
      .from(planFeaturesTable)
      .where(eq(planFeaturesTable.planId, planId));
  }

  /** Add or enable a feature for a plan */
  async addFeatureToPlan(
    planId: string,
    featureCode: string,
    isEnabled = true,
  ): Promise<SchPlanFeatureRow> {
    await this.getPlan(planId);

    const [result] = await db
      .insert(planFeaturesTable)
      .values({
        planId,
        featureCode: featureCode.toUpperCase(),
        isEnabled,
        metadata: {},
      })
      .onConflictDoUpdate({
        target: [planFeaturesTable.planId, planFeaturesTable.featureCode],
        set: { isEnabled },
      })
      .returning();

    return result;
  }

  /** Disable a feature for a plan (does not delete the record) */
  async disableFeatureForPlan(
    planId: string,
    featureCode: string,
  ): Promise<void> {
    await this.addFeatureToPlan(planId, featureCode, false);
  }

  /** Remove a feature assignment from a plan */
  async removeFeatureFromPlan(
    planId: string,
    featureCode: string,
  ): Promise<void> {
    await db
      .delete(planFeaturesTable)
      .where(
        and(
          eq(planFeaturesTable.planId, planId),
          eq(planFeaturesTable.featureCode, featureCode.toUpperCase()),
        ),
      );
  }

  // ─── Limit Management ───────────────────────────────────────────────────────

  /** Get all limits configured for a plan */
  async getPlanLimits(planId: string): Promise<SchPlanLimitRow[]> {
    await this.getPlan(planId);
    return db
      .select()
      .from(planLimitsTable)
      .where(eq(planLimitsTable.planId, planId));
  }

  /**
   * Set or update a limit for a plan.
   *
   * isUnlimited=true: no ceiling applies — do NOT use 999999999.
   * isUnlimited=false: numericValue is the ceiling.
   */
  async setPlanLimit(
    planId: string,
    input: SetPlanLimitInput,
  ): Promise<SchPlanLimitRow> {
    await this.getPlan(planId);

    const [result] = await db
      .insert(planLimitsTable)
      .values({
        planId,
        metricCode: input.metricCode.toUpperCase(),
        numericValue: input.isUnlimited ? null : (input.numericValue ?? null),
        isUnlimited: input.isUnlimited ?? false,
        metadata: {},
      })
      .onConflictDoUpdate({
        target: [planLimitsTable.planId, planLimitsTable.metricCode],
        set: {
          numericValue: input.isUnlimited ? null : (input.numericValue ?? null),
          isUnlimited: input.isUnlimited ?? false,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result;
  }

  /** Remove a limit configuration from a plan */
  async removePlanLimit(planId: string, metricCode: string): Promise<void> {
    await db
      .delete(planLimitsTable)
      .where(
        and(
          eq(planLimitsTable.planId, planId),
          eq(planLimitsTable.metricCode, metricCode.toUpperCase()),
        ),
      );
  }
}

export const planService = new PlanService();
